-- Requires 202611200001_email_suppression.sql. Public submissions project only.
begin;
create table public.unsubscribe_automation_contacts (
 email text primary key check(email=lower(btrim(email))),
 draft_status text not null default 'pending' check(draft_status in ('pending','creating','created','skipped','review')),
 gmail_draft_id text,
 claim_token uuid,
 lease_until timestamptz,
 next_attempt_at timestamptz not null default now(),
 retry_count integer not null default 0,
 updated_at timestamptz not null default now()
);
create table public.unsubscribe_automation_jobs (
 submission_id uuid primary key references public.public_form_submissions(id),
 email text not null references public.unsubscribe_automation_contacts(email),
 labeling_status text not null default 'pending' check(labeling_status in ('pending','done','skipped')),
 draft_status text not null default 'pending' check(draft_status in ('pending','creating','created','skipped','review')),
 gmail_draft_id text,
 processed_at timestamptz,
 retry_count integer not null default 0,
 error_code text check(error_code in ('gmail_unavailable','database_unavailable','suppression_missing','draft_uncertain','complaint_review','processing_failed')),
 claim_token uuid
);
alter table public.unsubscribe_automation_contacts enable row level security;
alter table public.unsubscribe_automation_contacts force row level security;
alter table public.unsubscribe_automation_jobs enable row level security;
alter table public.unsubscribe_automation_jobs force row level security;
revoke all on public.unsubscribe_automation_contacts, public.unsubscribe_automation_jobs from public,anon,authenticated,service_role;
create index unsubscribe_jobs_pending on public.unsubscribe_automation_jobs(email) where processed_at is null;

-- Conservative complaint gate; includes reason, feedback and any other payload text.
create function public.unsubscribe_has_complaint(contact_email text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.public_form_submissions where kind='unsubscribe'
 and lower(btrim(email))=contact_email and
 (payload::text ~* '(spam|unsolicited|unwanted|didn.t.{0,30}(subscrib|sign|request|consent|opt)|don.t.{0,30}(consent|want.{0,10}email)|no.{0,10}(consent|permission)|without.{0,30}(consent|permission)|never.{0,30}(subscrib|sign|request|consent|opt)|not.{0,30}(subscrib|sign.?up|request.{0,10}email|consent|opt.?in)|stop.{0,20}(contact|email)|do not contact|don.t contact)'));
$$;
revoke all on function public.unsubscribe_has_complaint(text) from public,anon,authenticated,service_role;

-- One recipient lease serializes duplicate submissions across all workflow instances.
create function public.claim_unsubscribe_automation(worker_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.unsubscribe_automation_contacts;
begin
 if worker_token is null then raise exception 'Worker token required'; end if;
 insert into public.unsubscribe_automation_contacts(email)
 select distinct lower(btrim(email)) from public.public_form_submissions
 where kind='unsubscribe' and email is not null and btrim(email) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 order by 1 on conflict do nothing;
 insert into public.unsubscribe_automation_jobs(submission_id,email)
 select s.id,lower(btrim(s.email)) from public.public_form_submissions s
 join public.unsubscribe_automation_contacts contact_row on contact_row.email=lower(btrim(s.email)) where s.kind='unsubscribe'
 order by s.id on conflict do nothing;
 select * into c from public.unsubscribe_automation_contacts x
 where (x.lease_until is null or x.lease_until<now()) and x.next_attempt_at<=now()
 and exists(select 1 from public.unsubscribe_automation_jobs j where j.email=x.email and j.processed_at is null)
 order by x.next_attempt_at,x.email for update skip locked limit 1;
 if not found then return null; end if;
 update public.unsubscribe_automation_contacts set claim_token=worker_token,lease_until=now()+interval '15 minutes',
 retry_count=retry_count+1,updated_at=now() where email=c.email;
 update public.unsubscribe_automation_jobs set claim_token=worker_token,retry_count=retry_count+1
 where email=c.email and processed_at is null;
 return jsonb_build_object('email',c.email,'draft_status',c.draft_status,'gmail_draft_id',c.gmail_draft_id,
 'complaint',public.unsubscribe_has_complaint(c.email));
end $$;
revoke all on function public.claim_unsubscribe_automation(uuid) from public,anon,authenticated;
grant execute on function public.claim_unsubscribe_automation(uuid) to service_role;

create function public.step_unsubscribe_automation(worker_token uuid,contact_email text,operation text,details jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.unsubscribe_automation_contacts; complaint boolean; label_state text; code text;
begin
 select * into c from public.unsubscribe_automation_contacts where email=contact_email for update;
 if not found or worker_token is null or c.claim_token is distinct from worker_token or (c.lease_until is null or c.lease_until<=now()) then raise exception 'Lease unavailable'; end if;
 complaint:=public.unsubscribe_has_complaint(c.email);
 if operation='verify' then
   if not exists(select 1 from public.email_suppressions where lower(btrim(email))=c.email) then
     if details->>'repair' is distinct from 'true' then raise exception 'Suppression missing'; end if;
     insert into public.email_suppressions(email,reason,source,suppressed_at,created_at)
     select c.email,nullif(left(btrim(s.payload->>'reason'),600),''),'unsubscribe-reconciliation',s.created_at,now()
     from public.public_form_submissions s where s.kind='unsubscribe' and lower(btrim(s.email))=c.email
     order by s.created_at,s.id limit 1 on conflict(email) do nothing;
   end if;
   if not exists(select 1 from public.email_suppressions where lower(btrim(email))=c.email) then raise exception 'Suppression missing'; end if;
 elsif operation='label' then
   label_state:=details->>'status';
   if label_state not in ('done','skipped') or label_state is null then raise exception 'Invalid label result'; end if;
   update public.unsubscribe_automation_jobs set labeling_status=label_state where claim_token=worker_token and email=c.email and processed_at is null;
 elsif operation='reserve' then
   if complaint then
     if c.draft_status in ('creating','created','review') then c.draft_status:='review'; else c.draft_status:='skipped'; end if;
   elsif c.draft_status='pending' then c.draft_status:='creating';
   else raise exception 'Draft already reserved'; end if;
   update public.unsubscribe_automation_contacts set draft_status=c.draft_status where email=c.email;
   update public.unsubscribe_automation_jobs set draft_status=c.draft_status where email=c.email and claim_token=worker_token and processed_at is null;
 elsif operation='draft' then
   if details->>'status' not in ('created','skipped','review') or details->>'status' is null then raise exception 'Invalid draft result'; end if;
   if details->>'status'='created' and (c.draft_status not in ('creating','created','review') or coalesce(details->>'id','') !~ '^[a-zA-Z0-9_-]{1,200}$') then raise exception 'Invalid draft identity'; end if;
   c.draft_status:=details->>'status';
   update public.unsubscribe_automation_contacts set draft_status=c.draft_status,gmail_draft_id=coalesce(details->>'id',gmail_draft_id) where email=c.email;
    update public.unsubscribe_automation_jobs set draft_status=c.draft_status,gmail_draft_id=coalesce(details->>'id',gmail_draft_id) where email=c.email and claim_token=worker_token and processed_at is null;
 elsif operation='finish' then
   if c.draft_status in ('pending','creating') or exists(select 1 from public.unsubscribe_automation_jobs where email=c.email and claim_token=worker_token and labeling_status='pending') then raise exception 'Incomplete job'; end if;
   update public.unsubscribe_automation_jobs set processed_at=now(),draft_status=c.draft_status,gmail_draft_id=c.gmail_draft_id,
     error_code=case when c.draft_status='review' then case when complaint then 'complaint_review' else 'draft_uncertain' end else null end
   where email=c.email and claim_token=worker_token and processed_at is null;
   update public.unsubscribe_automation_contacts set claim_token=null,lease_until=null,updated_at=now() where email=c.email;
 elsif operation='fail' then
   code:=details->>'code';
   if code not in ('gmail_unavailable','database_unavailable','suppression_missing','processing_failed') or code is null then code:='processing_failed'; end if;
   update public.unsubscribe_automation_jobs set error_code=code where email=c.email and claim_token=worker_token and processed_at is null;
   update public.unsubscribe_automation_contacts set claim_token=null,lease_until=null,next_attempt_at=now()+interval '1 hour',updated_at=now() where email=c.email;
 elsif operation<>'heartbeat' then raise exception 'Unknown operation';
 end if;
 return jsonb_build_object('complaint',complaint,'draft_status',c.draft_status);
end $$;
revoke all on function public.step_unsubscribe_automation(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.step_unsubscribe_automation(uuid,text,text,jsonb) to service_role;
commit;
