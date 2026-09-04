create table if not exists public_form_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('newsletter', 'tool_submission', 'business_early_access', 'unsubscribe')),
  email text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'NEW' check (status in ('NEW', 'IN_REVIEW', 'COMPLETED', 'SUPPRESSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_form_submissions_kind_created_idx
  on public_form_submissions (kind, created_at desc);
create index if not exists public_form_submissions_email_idx
  on public_form_submissions (lower(email)) where email is not null;

alter table public_form_submissions enable row level security;
revoke all on table public_form_submissions from anon, authenticated;

create or replace function record_public_form_submission(
  submission_kind text,
  submission_email text,
  submission_payload jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if submission_kind not in ('newsletter', 'tool_submission', 'business_early_access', 'unsubscribe') then
    raise exception 'Unsupported submission kind';
  end if;
  if submission_payload is null or pg_column_size(submission_payload) > 32768 then
    raise exception 'Invalid submission payload';
  end if;

  insert into public_form_submissions (kind, email, payload)
  values (submission_kind, nullif(lower(trim(submission_email)), ''), submission_payload)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function record_public_form_submission(text, text, jsonb) from public;
grant execute on function record_public_form_submission(text, text, jsonb) to anon, authenticated;
