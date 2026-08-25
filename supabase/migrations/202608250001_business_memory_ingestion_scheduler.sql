-- Adds real document ingestion/indexing and durable scheduled workflow state.
-- Safe forward migration: additive columns/tables/indexes/policies only.

create extension if not exists vector;

alter table organizations
  add column if not exists timezone text not null default 'UTC';

alter table documents
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists byte_size bigint,
  add column if not exists checksum text,
  add column if not exists extraction_status text not null default 'UPLOADED',
  add column if not exists extracted_text text;

create table if not exists document_chunks (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  title text not null,
  content text not null,
  token_estimate integer not null default 0,
  embedding vector(384) not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, document_id, chunk_index)
);

alter table workflows
  add column if not exists timezone text,
  add column if not exists next_run_at timestamptz;

alter table workflow_runs
  add column if not exists scheduled_trigger_id text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists dead_letter_reason text;

create table if not exists workflow_schedule_triggers (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  timezone text not null default 'UTC',
  schedule text not null,
  next_run_at timestamptz not null,
  status text not null default 'ACTIVE',
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  dead_letter_reason text,
  last_run_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workflow_id)
);

create table if not exists workflow_schedule_attempts (
  id text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  trigger_id text not null references workflow_schedule_triggers(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  status text not null,
  attempt integer not null,
  scheduled_for timestamptz not null,
  leased_until timestamptz,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists documents_org_checksum_idx on documents(organization_id, checksum);
create index if not exists document_chunks_org_doc_idx on document_chunks(organization_id, document_id, chunk_index);
create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists workflow_schedule_triggers_due_idx on workflow_schedule_triggers(status, next_run_at);
create index if not exists workflow_schedule_attempts_trigger_idx on workflow_schedule_attempts(trigger_id, created_at desc);

alter table document_chunks enable row level security;
alter table workflow_schedule_triggers enable row level security;
alter table workflow_schedule_attempts enable row level security;

do $$ declare
  tbl text;
begin
  foreach tbl in array array['document_chunks', 'workflow_schedule_triggers', 'workflow_schedule_attempts']
  loop
    execute format('drop policy if exists "%1$s member read" on %1$I', tbl);
    execute format('create policy "%1$s member read" on %1$I for select using (is_org_member(organization_id))', tbl);
    execute format('drop policy if exists "%1$s admin write" on %1$I', tbl);
    execute format('create policy "%1$s admin write" on %1$I for all using (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[])) with check (has_org_role(organization_id, array[''OWNER'',''ADMIN'']::business_role[]))', tbl);
  end loop;
end $$;

do $$ begin
  insert into storage.buckets (id, name, public)
  values ('business-documents', 'business-documents', false)
  on conflict (id) do nothing;
exception when undefined_table then
  null;
end $$;

do $$ begin
  create policy "business document members read storage"
    on storage.objects for select
    using (
      bucket_id = 'business-documents'
      and is_org_member((storage.foldername(name))[1]::uuid)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "business document admins write storage"
    on storage.objects for all
    using (
      bucket_id = 'business-documents'
      and has_org_role((storage.foldername(name))[1]::uuid, array['OWNER','ADMIN']::business_role[])
    )
    with check (
      bucket_id = 'business-documents'
      and has_org_role((storage.foldername(name))[1]::uuid, array['OWNER','ADMIN']::business_role[])
    );
exception when duplicate_object then null;
end $$;

do $$ declare
  tbl text;
begin
  foreach tbl in array array['document_chunks', 'workflow_schedule_triggers']
  loop
    execute format('drop trigger if exists set_%I_updated_at on %I', tbl, tbl);
    execute format('create trigger set_%I_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;
