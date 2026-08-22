-- AIBeat Business MVP schema draft.
-- This repo does not currently include an ORM or database migration runner.
-- Apply through the selected production database migration system after review.

create table organizations (
  id text primary key,
  name text not null,
  employee_count integer not null,
  primary_profile text not null,
  secondary_profiles text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table users (
  id text primary key,
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table organization_members (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null check (role in ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table industry_profiles (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  primary_profile text not null,
  secondary_profiles text[] not null default '{}',
  profile_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table business_context_items (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  domain text not null,
  category text not null,
  title text not null,
  content text not null,
  source text not null,
  source_url text,
  source_date date,
  confidence numeric,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  related_entity_type text,
  related_entity_id text,
  human_verified boolean not null default false,
  provenance text not null
);

create index business_context_items_org_idx on business_context_items(organization_id);
create index business_context_items_domain_idx on business_context_items(organization_id, domain, category);

create table documents (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  title text not null,
  document_type text not null,
  source text not null,
  source_url text,
  created_at timestamptz not null default now()
);

create table entities (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  entity_type text not null,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table workflow_templates (
  id text primary key,
  name text not null,
  description text not null,
  ideal_use_case text not null,
  agent_type text not null,
  industry_behavior jsonb not null default '{}'::jsonb,
  required_inputs jsonb not null default '[]'::jsonb,
  recommended_schedule text,
  required_integrations text[] not null default '{}',
  output_definition jsonb not null default '{}'::jsonb,
  approval_boundary text not null
);

create table workflows (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
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
  status text not null check (status in ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED')),
  version integer not null default 1,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create index workflows_org_idx on workflows(organization_id);

create table workflow_runs (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  workflow_id text not null references workflows(id) on delete cascade,
  status text not null,
  idempotency_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result_summary text,
  unique (organization_id, workflow_id, idempotency_key)
);

create table workflow_steps (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  workflow_run_id text not null references workflow_runs(id) on delete cascade,
  step_definition_id text not null,
  name text not null,
  risk text not null,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  output_summary text,
  error text
);

create table agent_findings (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  agent_type text not null,
  finding_type text not null,
  title text not null,
  content text not null,
  source text not null,
  source_url text,
  source_date date,
  confidence numeric not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  related_entity_type text,
  related_entity_id text,
  workflow_run_id text references workflow_runs(id),
  human_verified boolean not null default false,
  status text not null
);

create table approvals (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  workflow_run_id text not null references workflow_runs(id) on delete cascade,
  workflow_step_id text not null references workflow_steps(id) on delete cascade,
  agent_type text not null,
  proposed_action text not null,
  target_system text not null,
  affected_entity text not null,
  generated_content text not null,
  reason text not null,
  risk text not null,
  status text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  approver_id text references users(id),
  edited_content text,
  execution_result text
);

create table integrations (
  id text primary key,
  name text not null,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table integration_connections (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  integration_id text not null references integrations(id),
  status text not null,
  encrypted_secret_ref text,
  created_at timestamptz not null default now()
);

create table audit_events (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  user_id text references users(id),
  agent_type text,
  workflow_id text,
  workflow_run_id text,
  step_id text,
  tool text,
  action text not null,
  input_summary text not null,
  output_summary text not null,
  approval_id text,
  result text not null,
  timestamp timestamptz not null default now(),
  error text
);

create index audit_events_org_time_idx on audit_events(organization_id, timestamp desc);

create table usage_events (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  workflow_run_id text,
  model_provider text,
  model_name text,
  tokens_in integer,
  tokens_out integer,
  estimated_cost_usd numeric,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table ai_tools (
  id text primary key,
  name text not null,
  vendor text not null,
  category text not null,
  capability text not null
);

create table ai_tool_subscriptions (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  ai_tool_id text references ai_tools(id),
  tool_name text not null,
  vendor text not null,
  category text not null,
  capability text not null,
  department text not null,
  owner text not null,
  monthly_cost numeric not null,
  billing_cycle text not null,
  seats_purchased integer not null,
  active_seats integer not null,
  renewal_date date,
  status text not null,
  usage_level text not null,
  notes text
);

create table ai_tool_usage (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  ai_tool_subscription_id text not null references ai_tool_subscriptions(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  active_seats integer not null,
  workflow_count integer not null default 0,
  estimated_business_outcome text
);

create table ai_recommendations (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  type text not null,
  title text not null,
  rationale text not null,
  estimated_monthly_savings numeric,
  confidence numeric not null,
  related_tool_ids text[] not null default '{}',
  related_agent_type text,
  related_workflow_template_id text references workflow_templates(id),
  created_at timestamptz not null default now()
);

create table roi_metrics (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  workflow_runs integer not null,
  successful_runs integer not null,
  failed_runs integer not null,
  approval_rate numeric not null,
  ai_tool_cost numeric not null,
  estimated_human_minutes_saved integer not null,
  estimated_savings numeric not null,
  active_workflows integer not null,
  active_agents integer not null,
  potential_savings numeric not null
);
