-- Allow a newly authenticated user to create their first AIBeat Business organization
-- without using service-role credentials. Existing member-scoped RLS remains intact.

drop policy if exists "organizations authenticated create own" on organizations;
create policy "organizations authenticated create own" on organizations
  for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create or replace function organization_has_no_members(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from organization_members existing
    where existing.organization_id = target_organization_id
  );
$$;

drop policy if exists "organization_members first owner insert" on organization_members;
create policy "organization_members first owner insert" on organization_members
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and role = 'OWNER'
    and status = 'ACTIVE'
    and organization_has_no_members(organization_id)
  );
