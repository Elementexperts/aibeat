-- AIBeat Business persistent multi-tenant foundation.
-- Safe forward migration: creates new tables, indexes, triggers, and RLS policies.
-- Ordering fixed: membership helper functions are created after organization_members.
-- Re-run safe for the schema objects defined here (policies/triggers are replaced; FK is guarded).
-- Do not run against production until reviewed and backed up.

create extension if not exists pgcrypto;

do $$ begin
  create type business_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_status as enum ('ACTIVE', 'SUSPENDED', 'INVITED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workflow_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workflow_run_status as enum ('QUEUED', 'RUNNING', 'WAITING_FOR_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workflow_step_status as enum ('PENDING', 'RUNNING', 'WAITING_FOR_APPROVAL', 'COMPLETED', 'FAILED', 'SKIPPED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'EDITED', 'EXPIRED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type finding_status as enum ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'EXPIRED', 'REJECTED');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_count integer not null default 0,
  primary_profile text not null,
  secondary_profiles text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role business_role not null,
  permissions text[] not null default '{}',
  status membership_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Membership helpers must be defined only after organization_members exists.
create or replace function is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'ACTIVE'
  );
$$;

create or replace function has_org_role(target_organization_id uuid, allowed_roles business_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = auth.uid()
      and om.status = 'ACTIVE'
      and om.role = any(allowed_roles)
  );
$$;

create table if not exists industry_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  primary_profile text not null,
  secondary_profiles text[] not null default '{}',
  profile_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_context_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  category text not null,
  entity_type text,
  entity_id text,
  title text not null,
  content text not null,
  structured_data jsonb not null default '{}'::jsonb,
  source text not null,
  source_type text,
  source_url text,
  source_date date,
  confidence numeric,
  fresh_until timestamptz,
  human_verified boolean not null default false,
  provenance text not null,
  status text not null default 'ACTIVE',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  document_type text not null,
  source text not null,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_templates (
  id text primary key,
  name text not null,
  description text not null,
  agent_type text not null,
  trigger text not null,
  schedule text,
  inputs jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  required_integrations text[] not null default '{}',
  approval_policy jsonb not null default '{}'::jsonb,
  output_definition jsonb not null default '{}'::jsonb,
  status workflow_status not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id text references workflow_templates(id),
  name text not null,
  description text not null,
  agent_type text not null,
  trigger text not null,
  schedule text,
  inputs jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  required_integrations text[] not null default '{}',
  approval_policy jsonb not null default '{}'::jsonb,
  output_definition jsonb not null default '{}'::jsonb,
  status workflow_status not null default 'DRAFT',
  version integer not null default 1,
  idempotency_key text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  status workflow_run_status not null,
  idempotency_key text not null,
  current_step_id uuid,
  retry_count integer not null default 0,
  result_summary text,
  result_metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workflow_id, idempotency_key)
);

create table if not exists workflow_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  step_definition_id text not null,
  name text not null,
  risk text not null,
  status workflow_step_status not null,
  output_summary text,
  error text,
  retry_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table workflow_runs
    add constraint workflow_runs_current_step_fk
    foreign key (current_step_id) references workflow_steps(id) deferrable initially deferred;
exception when duplicate_object then null;
end $$;

create table if not exists agent_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  agent_type text not null,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  finding_type text not null,
  title text not null,
  content text not null,
  structured_data jsonb not null default '{}'::jsonb,
  source text not null,
  source_url text,
  source_date date,
  confidence numeric not null,
  fresh_until timestamptz,
  related_entity_type text,
  related_entity_id text,
  human_verified boolean not null default false,
  status finding_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete cascade,
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  workflow_step_id uuid not null references workflow_steps(id) on delete cascade,
  agent_type text not null,
  action_type text not null,
  action_risk text not null,
  status approval_status not null default 'PENDING',
  proposed_action text not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  target_system text not null,
  target_entity text not null,
  reason text not null,
  requested_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  decision text,
  edited_payload jsonb,
  execution_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integrations (
  id text primary key,
  name text not null,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  integration_id text not null references integrations(id),
  status text not null,
  encrypted_secret_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  entity_type text,
  entity_id text,
  workflow_id uuid,
  workflow_run_id uuid,
  agent_type text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  model_provider text,
  model_name text,
  tokens_in integer,
  tokens_out integer,
  estimated_cost_usd numeric,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists ai_tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  vendor text not null,
  product text not null,
  category text not null,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_tool_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ai_tool_id uuid references ai_tools(id) on delete set null,
  vendor text not null,
  product text not null,
  category text not null,
  department text not null,
  owner text not null,
  monthly_cost numeric not null default 0,
  billing_cycle text not null,
  seat_count integer not null default 0,
  active_seat_count integer not null default 0,
  renewal_date date,
  approval_status text not null,
  utilization text not null,
  capabilities text[] not null default '{}',
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_tool_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ai_tool_subscription_id uuid not null references ai_tool_subscriptions(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  active_seat_count integer not null default 0,
  workflow_count integer not null default 0,
  estimated_business_outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null,
  title text not null,
  rationale text not null,
  estimated_monthly_savings numeric,
  confidence numeric not null,
  related_tool_ids uuid[] not null default '{}',
  related_agent_type text,
  related_workflow_template_id text references workflow_templates(id),
  status text not null default 'ACTIVE',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roi_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  metric_type text not null,
  estimated_minutes_saved integer not null default 0,
  estimated_cost_saved numeric not null default 0,
  ai_cost numeric not null default 0,
  tool_cost numeric not null default 0,
  success boolean,
  approval_required boolean not null default false,
  approval_result text,
  created_at timestamptz not null default now()
);

create index if not exists organization_members_user_idx on organization_members(user_id, status);
create index if not exists organization_members_org_idx on organization_members(organization_id, status);
create index if not exists business_context_items_org_domain_idx on business_context_items(organization_id, domain);
create index if not exists business_context_items_org_status_idx on business_context_items(organization_id, status, updated_at desc);
create index if not exists documents_org_idx on documents(organization_id, updated_at desc);
create index if not exists entities_org_type_idx on entities(organization_id, entity_type);
create index if not exists workflows_org_idx on workflows(organization_id, status);
create index if not exists workflow_runs_org_time_idx on workflow_runs(organization_id, created_at desc);
create index if not exists workflow_runs_workflow_idx on workflow_runs(workflow_id, created_at desc);
create index if not exists workflow_steps_run_idx on workflow_steps(workflow_run_id, created_at);
create index if not exists agent_findings_org_agent_idx on agent_findings(organization_id, agent_type, created_at desc);
create index if not exists approvals_org_status_idx on approvals(organization_id, status, requested_at desc);
create index if not exists integration_connections_org_idx on integration_connections(organization_id);
create index if not exists audit_events_org_time_idx on audit_events(organization_id, created_at desc);
create index if not exists usage_events_org_time_idx on usage_events(organization_id, created_at desc);
create index if not exists ai_tool_subscriptions_org_idx on ai_tool_subscriptions(organization_id, archived_at);
create index if not exists ai_tool_usage_org_period_idx on ai_tool_usage(organization_id, period_start desc);
create index if not exists ai_recommendations_org_status_idx on ai_recommendations(organization_id, status, created_at desc);
create index if not exists roi_metrics_org_time_idx on roi_metrics(organization_id, created_at desc);

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations', 'organization_members', 'industry_profiles', 'business_context_items',
    'documents', 'entities', 'workflows', 'workflow_runs', 'workflow_steps', 'agent_findings',
    'approvals', 'integration_connections', 'audit_events', 'usage_events', 'ai_tools',
    'ai_tool_subscriptions', 'ai_tool_usage', 'ai_recommendations', 'roi_metrics'
  ]
  loop
    execute format('alter table %I enable row level security', tbl);
  end loop;
end $$;

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'industry_profiles', 'business_context_items', 'documents', 'entities', 'workflows',
    'workflow_runs', 'workflow_steps', 'agent_findings', 'approvals', 'integration_connections',
    'audit_events', 'usage_events', 'ai_tool_subscriptions', 'ai_tool_usage',
    'ai_recommendations', 'roi_metrics'
  ]
  loop
    execute format('drop policy if exists "%1$s member read" on %1$I', tbl);
    execute format('create policy "%1$s member read" on %1$I for select using (is_org_member(organization_id))', tbl);
    execute format('drop policy if exists "%1$s admin write" on %1$I', tbl);
    execute format('create policy "%1$s admin write" on %1$I for all using (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[])) with check (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[]))', tbl);
  end loop;
end $$;

drop policy if exists "organizations member read" on organizations;
create policy "organizations member read" on organizations
  for select using (is_org_member(id));

drop policy if exists "organizations owner update" on organizations;
create policy "organizations owner update" on organizations
  for update using (has_org_role(id, array['OWNER']::business_role[]))
  with check (has_org_role(id, array['OWNER']::business_role[]));

drop policy if exists "organization_members member read same org" on organization_members;
create policy "organization_members member read same org" on organization_members
  for select using (is_org_member(organization_id));

drop policy if exists "organization_members owner manage" on organization_members;
create policy "organization_members owner manage" on organization_members
  for all using (has_org_role(organization_id, array['OWNER']::business_role[]))
  with check (has_org_role(organization_id, array['OWNER']::business_role[]));

drop policy if exists "workflow_templates authenticated read" on workflow_templates;
alter table workflow_templates enable row level security;
create policy "workflow_templates authenticated read" on workflow_templates
  for select using (auth.uid() is not null);

drop policy if exists "integrations authenticated read" on integrations;
alter table integrations enable row level security;
create policy "integrations authenticated read" on integrations
  for select using (auth.uid() is not null);

drop policy if exists "ai_tools member read" on ai_tools;
create policy "ai_tools member read" on ai_tools
  for select using (organization_id is null or is_org_member(organization_id));

drop policy if exists "ai_tools admin write" on ai_tools;
create policy "ai_tools admin write" on ai_tools
  for all using (organization_id is not null and has_org_role(organization_id, array['OWNER','ADMIN']::business_role[]))
  with check (organization_id is not null and has_org_role(organization_id, array['OWNER','ADMIN']::business_role[]));

drop policy if exists "approvals manager resolve" on approvals;
create policy "approvals manager resolve" on approvals
  for update using (has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::business_role[]))
  with check (has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']::business_role[]));

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations', 'organization_members', 'industry_profiles', 'business_context_items',
    'documents', 'entities', 'workflow_templates', 'workflows', 'workflow_runs',
    'workflow_steps', 'agent_findings', 'approvals', 'integrations', 'integration_connections',
    'ai_tools', 'ai_tool_subscriptions', 'ai_recommendations'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on %I', tbl, tbl);
    execute format('create trigger set_%I_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;
