-- Prepared only. Apply to the public submissions project, NOT the Business database.
-- Existing rows and submissions are retained. No recipient addresses are embedded.
begin;
create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  source text,
  suppressed_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.email_suppressions enable row level security;
alter table public.email_suppressions force row level security;
revoke all on public.email_suppressions from public, anon, authenticated, service_role;
grant select on public.email_suppressions to service_role;
-- Remove any pre-existing public policies, including permissive authenticated policies.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='email_suppressions' loop
    execute format('drop policy %I on public.email_suppressions', p.policyname);
  end loop;
end $$;
create index if not exists email_suppressions_normalized_idx on public.email_suppressions (lower(btrim(email)));

create or replace function public.capture_email_unsubscribe() returns trigger
language plpgsql security definer set search_path = '' as $$
declare normalized text; detail text;
begin
  if new.kind <> 'unsubscribe' then return new; end if;
  normalized := lower(btrim(new.email));
  if normalized is null or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid unsubscribe address';
  end if;
  detail := nullif(left(btrim(new.payload->>'reason'),600),'');
  insert into public.email_suppressions(email,reason,source,suppressed_at,created_at)
  values(normalized,detail,'unsubscribe',now(),now())
  on conflict(email) do update set reason=coalesce(email_suppressions.reason,excluded.reason),
    source=coalesce(email_suppressions.source,excluded.source);
  return new;
end $$;
revoke all on function public.capture_email_unsubscribe() from public, anon, authenticated, service_role;
drop trigger if exists capture_email_unsubscribe on public.public_form_submissions;
create trigger capture_email_unsubscribe after insert or update of kind,email,payload
on public.public_form_submissions for each row execute function public.capture_email_unsubscribe();

-- Backfill all historical opt-outs regardless of staff processing status.
-- Keep original records, existing reasons and suppression timestamps.
insert into public.email_suppressions(email,reason,source,suppressed_at,created_at)
select distinct on (lower(btrim(email))) lower(btrim(email)),nullif(left(btrim(payload->>'reason'),600),''),
  'unsubscribe-backfill',created_at,now()
from public.public_form_submissions
where (kind='unsubscribe' or (kind='newsletter' and status='SUPPRESSED'))
  and email is not null and btrim(email) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
order by lower(btrim(email)),created_at,id
on conflict(email) do nothing;

create or replace function public.record_email_unsubscribe(submission_email text, submission_payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid; normalized text := lower(btrim(submission_email));
begin
  if normalized is null or length(normalized)>254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or submission_payload is null or jsonb_typeof(submission_payload)<>'object' or pg_column_size(submission_payload)>32768 then
    raise exception 'Invalid unsubscribe request';
  end if;
  insert into public.public_form_submissions(kind,email,payload)
  values('unsubscribe',normalized,submission_payload || jsonb_build_object('email',normalized)) returning id into new_id;
  -- The trigger persists suppression in this same transaction. Any failure rolls back both.
  return new_id;
end $$;
revoke all on function public.record_email_unsubscribe(text,jsonb) from public,anon,authenticated;
grant execute on function public.record_email_unsubscribe(text,jsonb) to service_role;

create or replace function public.check_marketing_recipients(recipient_emails text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if recipient_emails is null or cardinality(recipient_emails)>200 then raise exception 'Invalid recipient batch'; end if;
  return (select coalesce(jsonb_agg(email),'[]'::jsonb) from (
    select distinct lower(btrim(r)) as email from unnest(recipient_emails) r
    where exists(select 1 from public.email_suppressions s where lower(btrim(s.email))=lower(btrim(r)))
       or exists(select 1 from public.public_form_submissions s where lower(btrim(s.email))=lower(btrim(r))
         and (s.kind='unsubscribe' or (s.kind='newsletter' and s.status='SUPPRESSED')))
  ) blocked);
end $$;
revoke all on function public.check_marketing_recipients(text[]) from public,anon,authenticated;
grant execute on function public.check_marketing_recipients(text[]) to service_role;

create or replace function public.list_marketing_suppressions(page_offset integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if page_offset is null or page_offset<0 then raise exception 'Invalid offset'; end if;
  return (select coalesce(jsonb_agg(email),'[]'::jsonb) from (
    select email from (
      select lower(btrim(email)) email from public.email_suppressions
      union select lower(btrim(email)) from public.public_form_submissions
      where email is not null and (kind='unsubscribe' or (kind='newsletter' and status='SUPPRESSED'))
    ) s where email is not null order by email limit 500 offset page_offset
  ) page);
end $$;
revoke all on function public.list_marketing_suppressions(integer) from public,anon,authenticated;
grant execute on function public.list_marketing_suppressions(integer) to service_role;
commit;
