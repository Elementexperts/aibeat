-- Private retry ledger. No contact information or workflow state is committed to Git.
create table if not exists public.tool_submission_automation (
  product_key text primary key,
  submission_ids uuid[] not null,
  fingerprint text not null,
  phase text not null check (phase in ('held', 'prepared', 'drafting', 'complete', 'existing')),
  tool jsonb,
  reason text,
  gmail_draft_id text,
  updated_at timestamptz not null default now()
);
alter table public.tool_submission_automation enable row level security;
revoke all on public.tool_submission_automation from anon, authenticated;
grant select, insert, update on public.tool_submission_automation to service_role;
