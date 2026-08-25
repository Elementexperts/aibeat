-- Adds operational notifications, member invites metadata, and agent evaluation results.

alter table organization_members
  alter column user_id drop not null,
  add column if not exists invited_email text,
  add column if not exists invited_by uuid references auth.users(id);

create table if not exists business_notifications (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  type text not null,
  status text not null default 'UNREAD',
  title text not null,
  body text not null,
  href text,
  workflow_id uuid references workflows(id) on delete set null,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  approval_id uuid references approvals(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_evaluations (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  agent_type text not null,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  finding_id uuid references agent_findings(id) on delete set null,
  factuality numeric not null,
  relevance numeric not null,
  duplicate_rate numeric not null,
  edit_rate numeric not null,
  estimated_cost_usd numeric not null default 0,
  latency_ms integer not null default 0,
  passed boolean not null default false,
  notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists business_notifications_org_status_idx on business_notifications(organization_id, status, created_at desc);
create index if not exists agent_evaluations_org_agent_idx on agent_evaluations(organization_id, agent_type, created_at desc);
create index if not exists organization_members_invited_email_idx on organization_members(organization_id, invited_email);

alter table business_notifications enable row level security;
alter table agent_evaluations enable row level security;

do $$ declare
  tbl text;
begin
  foreach tbl in array array['business_notifications', 'agent_evaluations']
  loop
    execute format('drop policy if exists "%1$s member read" on %1$I', tbl);
    execute format('create policy "%1$s member read" on %1$I for select using (is_org_member(organization_id))', tbl);
    execute format('drop policy if exists "%1$s admin write" on %1$I', tbl);
    execute format('create policy "%1$s admin write" on %1$I for all using (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[])) with check (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[]))', tbl);
  end loop;
end $$;
