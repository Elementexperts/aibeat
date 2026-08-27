create or replace function public.create_business_organization(
  p_name text,
  p_employee_count integer,
  p_primary_profile text,
  p_secondary_profiles text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'COMPANY_NAME_REQUIRED';
  end if;

  if exists (
    select 1
    from public.organization_members
    where user_id = v_user_id
      and status = 'ACTIVE'
  ) then
    raise exception 'ACTIVE_MEMBERSHIP_EXISTS';
  end if;

  insert into public.organizations (
    name,
    employee_count,
    primary_profile,
    secondary_profiles,
    created_by
  )
  values (
    trim(p_name),
    greatest(coalesce(p_employee_count, 0), 0),
    p_primary_profile,
    coalesce(p_secondary_profiles, '{}'),
    v_user_id
  )
  returning id into v_organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    permissions
  )
  values (
    v_organization_id,
    v_user_id,
    'OWNER',
    'ACTIVE',
    '{}'
  );

  return v_organization_id;
end;
$$;

revoke all on function public.create_business_organization(
  text,
  integer,
  text,
  text[]
) from public;

grant execute on function public.create_business_organization(
  text,
  integer,
  text,
  text[]
) to authenticated;