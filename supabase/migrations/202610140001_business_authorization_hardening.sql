-- C01: development/isolated staging only until separately approved for production.
-- Apply with a migration owner in ONE transaction after schema/grant preflight.
-- Existing inconsistent tenant references fail validation; no data is repaired silently.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';
-- Do not normalize an already ownerless live tenant silently.
do $$ begin
  if exists(select 1 from public.organization_members m where m.status='ACTIVE'
    and not exists(select 1 from public.organization_members owner where owner.organization_id=m.organization_id and owner.role='OWNER' and owner.status='ACTIVE')) then
    raise exception 'EXISTING_ACTIVE_TENANT_WITHOUT_OWNER';
  end if;
end $$;
alter table public.organizations enable row level security;
alter table public.ai_tools enable row level security;

-- Fixed search paths; authorization is always based on database membership, never metadata.
create or replace function public.is_org_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = auth.uid() and status = 'ACTIVE');
$$;
create or replace function public.has_org_role(target_organization_id uuid, allowed_roles public.business_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members where organization_id = target_organization_id
    and user_id = auth.uid() and status = 'ACTIVE' and role = any(allowed_roles));
$$;
revoke all on function public.is_org_member(uuid), public.has_org_role(uuid,public.business_role[]) from public;
grant execute on function public.is_org_member(uuid), public.has_org_role(uuid,public.business_role[]) to anon, authenticated;

-- Remove every permissive policy for these sensitive mutation surfaces, including
-- unexpected legacy names, then restore only explicit reads / validated insert below.
do $$ declare p record; begin
  for p in select tablename, policyname from pg_policies where schemaname='public'
    and tablename in ('organizations','organization_members','approvals','audit_events')
  loop execute format('drop policy %I on public.%I',p.policyname,p.tablename); end loop;
end $$;
revoke insert, update, delete, truncate, references, trigger on public.organization_members, public.approvals, public.audit_events from anon, authenticated;
revoke insert, delete, truncate, references, trigger on public.organizations from anon, authenticated;
revoke all on public.organizations,public.organization_members,public.approvals,public.audit_events from public;
-- Column grants survive table-level REVOKE. Remove historical column mutation grants too.
do $$ declare r record; begin
  for r in select table_name,column_name,grantee,privilege_type from information_schema.column_privileges
    where table_schema='public' and table_name in ('organizations','organization_members','approvals','audit_events')
      and grantee in ('PUBLIC','anon','authenticated') and privilege_type in ('INSERT','UPDATE','REFERENCES')
  loop execute format('revoke %s (%I) on public.%I from %s',r.privilege_type,r.column_name,r.table_name,case when r.grantee='PUBLIC' then 'PUBLIC' else quote_ident(r.grantee) end); end loop;
end $$;
revoke update on public.organizations from anon,authenticated;
grant select on public.organizations,public.organization_members,public.approvals,public.audit_events to authenticated;
grant update(name,employee_count,primary_profile,secondary_profiles,timezone) on public.organizations to authenticated;
create policy "organizations member read" on public.organizations for select to authenticated using(public.is_org_member(id));
create policy "organizations owner update" on public.organizations for update to authenticated
  using(public.has_org_role(id,array['OWNER']::public.business_role[]))
  with check(public.has_org_role(id,array['OWNER']::public.business_role[]));
create policy "organization_members member read same org" on public.organization_members for select to authenticated using(public.is_org_member(organization_id));
create policy "approvals member read" on public.approvals for select to authenticated using(public.is_org_member(organization_id));
create policy "audit_events member read" on public.audit_events for select to authenticated using(public.is_org_member(organization_id));
revoke all on function public.organization_has_no_members(uuid) from public, anon, authenticated;

-- Updating the lock row also forces serialization failure for stale REPEATABLE READ
-- snapshots. Call before reading memberships in every membership/provisioning RPC.
create function public.business_lock_owner(p_organization_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  update public.organizations set updated_at=updated_at where id=p_organization_id;
  if not found or not public.has_org_role(p_organization_id,array['OWNER']::public.business_role[]) then
    raise exception 'OWNER_REQUIRED' using errcode='42501';
  end if;
end $$;
revoke all on function public.business_lock_owner(uuid) from public,anon,authenticated;

create function public.business_membership_invariant()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_creator uuid;
begin
  if TG_OP='UPDATE' and (new.id is distinct from old.id or new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id) then
    raise exception 'MEMBERSHIP_IDENTITY_IMMUTABLE' using errcode='23514';
  end if;
  v_org := case when TG_OP='DELETE' then old.organization_id else new.organization_id end;
  update public.organizations set updated_at=updated_at where id=v_org returning created_by into v_creator;
  if not found then
    if TG_OP='DELETE' then return old; end if;
    raise exception 'ORGANIZATION_NOT_FOUND' using errcode='23503';
  end if;
  if TG_OP='INSERT' and not exists(select 1 from public.organization_members where organization_id=v_org) then
    if new.user_id is distinct from v_creator or new.role <> 'OWNER' or new.status <> 'ACTIVE' then
      raise exception 'FIRST_OWNER_MUST_BE_CREATOR' using errcode='23514';
    end if;
  end if;
  if TG_OP in ('UPDATE','DELETE') and old.role='OWNER' and old.status='ACTIVE'
    and (TG_OP='DELETE' or new.role <> 'OWNER' or new.status <> 'ACTIVE')
    and not exists(select 1 from public.organization_members where organization_id=v_org
      and id<>old.id and role='OWNER' and status='ACTIVE') then
    raise exception 'LAST_ACTIVE_OWNER' using errcode='23514';
  end if;
  if TG_OP<>'DELETE' and new.status='ACTIVE' and new.user_id is null then
    raise exception 'ACTIVE_MEMBER_REQUIRES_USER' using errcode='23514';
  end if;
  if TG_OP='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.business_membership_invariant() from public,anon,authenticated;
create trigger business_membership_invariant before insert or update or delete on public.organization_members
for each row execute function public.business_membership_invariant();

create function public.business_immutable_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id then raise exception 'IDENTITY_IMMUTABLE' using errcode='23514'; end if;
  if TG_TABLE_NAME='organizations' then
    if new.created_by is distinct from old.created_by then raise exception 'CREATOR_IMMUTABLE' using errcode='23514'; end if;
  elsif new.organization_id is distinct from old.organization_id then
    raise exception 'TENANT_IMMUTABLE' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.business_immutable_identity() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['industry_profiles','business_context_items','documents','entities','workflows','workflow_runs','workflow_steps','agent_findings','approvals','integration_connections','usage_events','ai_tools','ai_tool_subscriptions','ai_tool_usage','ai_recommendations','roi_metrics','document_chunks','workflow_schedule_triggers','workflow_schedule_attempts','business_notifications','agent_evaluations']
  loop execute format('create trigger business_immutable_identity before update on public.%I for each row execute function public.business_immutable_identity()',t); end loop;
end $$;
create trigger business_immutable_identity before update on public.organizations for each row execute function public.business_immutable_identity();

-- Immutable audit trail, even for service-role DML. Migration owner can deliberately
-- disable a trigger for approved retention work; ordinary application callers cannot.
create function public.business_audit_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'AUDIT_APPEND_ONLY' using errcode='42501'; end $$;
revoke all on function public.business_audit_immutable() from public,anon,authenticated;
create trigger business_audit_immutable before update or delete on public.audit_events for each row execute function public.business_audit_immutable();
create trigger business_audit_no_truncate before truncate on public.audit_events for each statement execute function public.business_audit_immutable();
-- Avoid cascading organization deletion erasing security history.
alter table public.audit_events drop constraint audit_events_organization_id_fkey;
alter table public.audit_events add constraint audit_events_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete restrict;

create function public.record_business_runtime_audit(p_organization_id uuid,p_event_type text,p_entity_id text default null,
  p_workflow_run_id uuid default null,p_agent_type text default null,p_summary text default '')
returns public.audit_events language plpgsql security definer set search_path = '' as $$
declare v_result public.audit_events;
begin
  if not public.has_org_role(p_organization_id,array['OWNER','ADMIN']::public.business_role[]) then
    raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
  -- Security decisions have dedicated RPCs; application telemetry cannot forge them.
  if p_event_type not in ('WORKFLOW_STARTED','WORKFLOW_STEP_STARTED','WORKFLOW_FAILED','AGENT_EXECUTION_FAILED',
    'APPROVAL_REQUESTED','PROSPECT_RESEARCH_COMPLETED','WORKFLOW_STEP_COMPLETED','AGENT_EXECUTION_STARTED',
    'WORKFLOW_COMPLETED','AGENT_EXECUTION_COMPLETED','AI_CONNECTION_TESTED','DOCUMENT_INGESTED',
    'INTEGRATION_CONNECTION_UPDATED','AGENT_EVALUATION_HARNESS_RUN','WORKFLOW_UPDATED','WORKFLOW_CREATED','CONTEXT_CREATED','CONTEXT_UPDATED','ASSISTANT_FAILED',
    'AI_TOOL_SUBSCRIPTION_CREATED','AI_TOOL_SUBSCRIPTION_UPDATED','AI_TOOL_SUBSCRIPTION_ARCHIVED') or p_event_type is null then
    raise exception 'INVALID_RUNTIME_EVENT' using errcode='22023'; end if;
  if length(coalesce(p_summary,''))>600 or length(coalesce(p_entity_id,''))>200 or length(coalesce(p_agent_type,''))>100 then
    raise exception 'AUDIT_PAYLOAD_TOO_LARGE' using errcode='22023'; end if;
  if p_workflow_run_id is not null and not exists(select 1 from public.workflow_runs where id=p_workflow_run_id and organization_id=p_organization_id) then
    raise exception 'RUN_NOT_FOUND' using errcode='42501'; end if;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,workflow_run_id,agent_type,summary)
    values(p_organization_id,auth.uid(),p_event_type,p_entity_id,p_workflow_run_id,p_agent_type,coalesce(p_summary,'')) returning * into v_result;
  return v_result;
end $$;
revoke all on function public.record_business_runtime_audit(uuid,text,text,uuid,text,text) from public,anon;
grant execute on function public.record_business_runtime_audit(uuid,text,text,uuid,text,text) to authenticated;

create or replace function public.create_business_organization(p_name text,p_employee_count integer,p_primary_profile text,p_secondary_profiles text[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_org uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'PROVISIONING_REQUIRES_READ_COMMITTED' using errcode='0A000';
  end if;
  -- User row serializes two first-workspace requests without relying on client retries.
  perform 1 from auth.users where id=v_user for update;
  if not found then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if length(trim(coalesce(p_name,''))) not between 1 and 200 or p_employee_count is null or p_employee_count<0
    or length(trim(coalesce(p_primary_profile,''))) not between 1 and 100
    or coalesce(cardinality(p_secondary_profiles),0)>20 then raise exception 'INVALID_ORGANIZATION' using errcode='22023'; end if;
  select o.id into v_org from public.organizations o join public.organization_members m on m.organization_id=o.id
    where m.user_id=v_user and m.status='ACTIVE' and m.role='OWNER' and o.created_by=v_user order by o.created_at limit 1;
  if v_org is not null then return v_org; end if; -- Idempotent retry; never claim a memberless legacy org.
  if exists(select 1 from public.organization_members where user_id=v_user and status='ACTIVE') then
    raise exception 'ACTIVE_MEMBERSHIP_EXISTS' using errcode='23514'; end if;
  insert into public.organizations(name,employee_count,primary_profile,secondary_profiles,created_by)
    values(trim(p_name),p_employee_count,trim(p_primary_profile),coalesce(p_secondary_profiles,'{}'),v_user) returning id into v_org;
  insert into public.organization_members(organization_id,user_id,role,status,permissions) values(v_org,v_user,'OWNER','ACTIVE','{}');
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(v_org,v_user,'ORGANIZATION_PROVISIONED',v_org::text,'Organization and creator ownership provisioned atomically.');
  return v_org;
end $$;
revoke all on function public.create_business_organization(text,integer,text,text[]) from public,anon;
grant execute on function public.create_business_organization(text,integer,text,text[]) to authenticated;

alter table public.organizations add column business_onboarded_at timestamptz;
create function public.complete_business_onboarding(p_name text,p_employee_count integer,p_primary_profile text,
  p_first_workflow text,p_context text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_done timestamptz;
begin
  if length(coalesce(p_context,'')) not between 1 and 4000 or p_first_workflow is null
    or not exists(select 1 from public.workflow_templates where name=p_first_workflow and status='ACTIVE') then
    raise exception 'INVALID_ONBOARDING' using errcode='22023'; end if;
  v_org:=public.create_business_organization(p_name,p_employee_count,p_primary_profile,'{}');
  perform public.business_lock_owner(v_org);
  select business_onboarded_at into v_done from public.organizations where id=v_org and created_by=auth.uid();
  if not found then raise exception 'CREATOR_REQUIRED' using errcode='42501'; end if;
  if v_done is not null then return v_org; end if;
  insert into public.workflows(organization_id,template_id,name,description,agent_type,trigger,schedule,inputs,steps,required_integrations,
    approval_policy,output_definition,status,version,created_by)
  select v_org,t.id,t.name,t.description,t.agent_type,t.trigger,t.schedule,t.inputs,t.steps,t.required_integrations,
    t.approval_policy,t.output_definition,case when t.name=p_first_workflow then 'ACTIVE'::public.workflow_status else 'DRAFT'::public.workflow_status end,t.version,auth.uid()
    from public.workflow_templates t where t.status='ACTIVE'
    and not exists(select 1 from public.workflows w where w.organization_id=v_org and w.template_id=t.id);
  if not exists(select 1 from public.business_context_items where organization_id=v_org and category='ONBOARDING' and source='Onboarding') then
    insert into public.business_context_items(organization_id,domain,category,title,content,source,provenance,human_verified,created_by)
      values(v_org,'COMPANY_KNOWLEDGE','ONBOARDING','Onboarding setup',p_context,'Onboarding','Entered by organization owner during onboarding',true,auth.uid());
  end if;
  update public.organizations set business_onboarded_at=now() where id=v_org;
  insert into public.audit_events(organization_id,actor_user_id,event_type,summary) values(v_org,auth.uid(),'BUSINESS_ONBOARDED','Business onboarding completed atomically.');
  return v_org;
end $$;
revoke all on function public.complete_business_onboarding(text,integer,text,text,text) from public,anon;
grant execute on function public.complete_business_onboarding(text,integer,text,text,text) to authenticated;

create function public.invite_business_member(p_organization_id uuid,p_email text,p_role public.business_role)
returns public.organization_members language plpgsql security definer set search_path = '' as $$
declare v_result public.organization_members; v_email text:=lower(trim(p_email));
begin
  perform public.business_lock_owner(p_organization_id);
  if p_role is null or v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVALID_INVITATION' using errcode='22023'; end if;
  select * into v_result from public.organization_members where organization_id=p_organization_id and lower(invited_email)=v_email and status='INVITED';
  if found then return v_result; end if;
  insert into public.organization_members(organization_id,user_id,role,permissions,status,invited_email,invited_by)
    values(p_organization_id,null,p_role,'{}','INVITED',v_email,auth.uid()) returning * into v_result;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(p_organization_id,auth.uid(),'MEMBER_INVITED',v_result.id::text,'Invited Business member.');
  return v_result;
end $$;
create function public.change_business_member(p_organization_id uuid,p_member_id uuid,p_role public.business_role,p_status public.membership_status default null)
returns public.organization_members language plpgsql security definer set search_path = '' as $$
declare v_result public.organization_members;
begin
  perform public.business_lock_owner(p_organization_id);
  if p_role is null then raise exception 'ROLE_REQUIRED' using errcode='22023'; end if;
  select * into v_result from public.organization_members where id=p_member_id and organization_id=p_organization_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND' using errcode='42501'; end if;
  -- Invitation acceptance needs a separate verified-email operation; never bind a client-supplied user ID.
  if v_result.status='INVITED' and p_status is not null and p_status<>'INVITED' then raise exception 'INVITATION_NOT_ACCEPTED' using errcode='23514'; end if;
  if v_result.status<>'INVITED' and p_status='INVITED' then raise exception 'INVALID_MEMBER_STATUS' using errcode='22023'; end if;
  update public.organization_members set role=p_role,status=coalesce(p_status,status),permissions='{}' where id=p_member_id returning * into v_result;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(p_organization_id,auth.uid(),'MEMBER_ROLE_UPDATED',p_member_id::text,'Business member role/status updated.');
  return v_result;
end $$;
create function public.remove_business_member(p_organization_id uuid,p_member_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.business_lock_owner(p_organization_id);
  delete from public.organization_members where organization_id=p_organization_id and id=p_member_id;
  if not found then raise exception 'MEMBER_NOT_FOUND' using errcode='42501'; end if;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(p_organization_id,auth.uid(),'MEMBER_REMOVED',p_member_id::text,'Business member removed.');
end $$;
revoke all on function public.invite_business_member(uuid,text,public.business_role),public.change_business_member(uuid,uuid,public.business_role,public.membership_status),public.remove_business_member(uuid,uuid) from public,anon;
grant execute on function public.invite_business_member(uuid,text,public.business_role),public.change_business_member(uuid,uuid,public.business_role,public.membership_status),public.remove_business_member(uuid,uuid) to authenticated;

-- Preserve pending approval creation by admin-run workflows, but prevent direct
-- resolution or forged resolved fields. All resolution uses decide_business_approval.
grant insert on public.approvals to authenticated;
create policy "approvals admin request" on public.approvals for insert to authenticated with check(
  public.has_org_role(organization_id,array['OWNER','ADMIN']::public.business_role[])
  and requested_by=auth.uid() and status='PENDING' and resolved_by is null and resolved_at is null
  and decision is null and edited_payload is null and execution_result is null);

-- Immutable server-derived definition at request time: later workflow edits cannot
-- widen what an already-requested approval authorizes.
alter table public.approvals add column workflow_snapshot jsonb;
create function public.business_approval_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
declare w public.workflows;
begin
  select wf.* into w from public.workflows wf join public.workflow_runs r on r.workflow_id=wf.id and r.organization_id=wf.organization_id
    join public.workflow_steps s on s.workflow_run_id=r.id and s.organization_id=r.organization_id
    where r.id=new.workflow_run_id and s.id=new.workflow_step_id and r.organization_id=new.organization_id
    and (new.workflow_id is null or wf.id=new.workflow_id);
  if not found then raise exception 'APPROVAL_TENANT_MISMATCH' using errcode='23503'; end if;
  new.workflow_id:=w.id;
  new.workflow_snapshot:=jsonb_build_object('steps',w.steps,'approvalPolicy',w.approval_policy,'version',w.version);
  return new;
end $$;
revoke all on function public.business_approval_snapshot() from public,anon,authenticated;
create trigger business_approval_snapshot before insert on public.approvals for each row execute function public.business_approval_snapshot();
-- Existing pending requests have no immutable historical snapshot. Do not invent one:
-- decide RPC fails closed with APPROVAL_SNAPSHOT_REQUIRED until explicitly re-requested.

create function public.decide_business_approval(p_organization_id uuid,p_approval_id uuid,p_decision text,p_edited_content text default null)
returns public.approvals language plpgsql security definer set search_path = '' as $$
declare a public.approvals; r public.workflow_runs; s public.workflow_steps; v_role public.business_role;
  v_step jsonb; v_steps jsonb; v_policy jsonb; v_seen boolean:=false; v_failed boolean:=false;
  v_executions jsonb; v_connector text; v_name text; v_status text; v_summary text; v_error text; v_risk text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  -- Serialize with owner changes; an in-flight revocation cannot race authorization.
  update public.organizations set updated_at=updated_at where id=p_organization_id;
  select role into v_role from public.organization_members where organization_id=p_organization_id and user_id=auth.uid() and status='ACTIVE';
  if v_role is null or v_role not in ('OWNER','ADMIN','MANAGER') then raise exception 'APPROVER_REQUIRED' using errcode='42501'; end if;
  if p_decision is null or p_decision not in ('APPROVED','REJECTED','EDITED') or length(coalesce(p_edited_content,''))>20000
    or (p_decision='EDITED' and length(trim(coalesce(p_edited_content,'')))=0)
    or (p_decision<>'EDITED' and p_edited_content is not null) then raise exception 'INVALID_DECISION' using errcode='22023'; end if;
  select * into a from public.approvals where id=p_approval_id and organization_id=p_organization_id for update;
  if not found then raise exception 'APPROVAL_NOT_FOUND' using errcode='42501'; end if;
  if a.status<>'PENDING' then
    if a.resolved_by=auth.uid() and a.decision=p_decision and (a.edited_payload->>'content') is not distinct from p_edited_content then return a; end if;
    raise exception 'APPROVAL_ALREADY_RESOLVED' using errcode='23514';
  end if;
  select * into r from public.workflow_runs where id=a.workflow_run_id and organization_id=p_organization_id for update;
  select * into s from public.workflow_steps where id=a.workflow_step_id and workflow_run_id=r.id and organization_id=p_organization_id for update;
  if r.id is null or s.id is null or a.workflow_id is distinct from r.workflow_id or r.current_step_id is distinct from s.id
    or r.status<>'WAITING_FOR_APPROVAL' or s.status<>'WAITING_FOR_APPROVAL' then raise exception 'INVALID_APPROVAL_STATE' using errcode='23514'; end if;
  v_policy:=a.workflow_snapshot->'approvalPolicy';
  if a.workflow_snapshot is not null then
    if jsonb_typeof(v_policy->'approverRoles')='array' and jsonb_array_length(v_policy->'approverRoles')>0
      and not (v_policy->'approverRoles' ? v_role::text) then raise exception 'WORKFLOW_APPROVER_REQUIRED' using errcode='42501'; end if;
  end if;
  if p_decision<>'REJECTED' then
    if a.workflow_snapshot is null then raise exception 'APPROVAL_SNAPSHOT_REQUIRED' using errcode='23514'; end if;
    if a.action_risk='RESTRICTED' then raise exception 'RESTRICTED_ACTION' using errcode='42501'; end if;
    v_steps:=a.workflow_snapshot->'steps'; v_policy:=a.workflow_snapshot->'approvalPolicy';
    if jsonb_typeof(v_steps) is distinct from 'array' then raise exception 'INVALID_WORKFLOW_SNAPSHOT' using errcode='23514'; end if;

    if not exists(select 1 from jsonb_array_elements(v_steps) step where step->>'id'=s.step_definition_id
      and step->>'id'=a.proposed_payload->>'stepId' and step->>'action'=a.proposed_action and step->>'risk'=a.action_risk) then
      raise exception 'APPROVED_STEP_MISMATCH' using errcode='23514'; end if;
  end if;
  v_executions:=coalesce(r.result_metadata->'connectorExecutions','[]'::jsonb);
  if jsonb_typeof(v_executions)<>'array' then raise exception 'INVALID_EXECUTION_HISTORY' using errcode='23514'; end if;
  v_failed:=p_decision='REJECTED';
  update public.workflow_steps set status=case when v_failed then 'FAILED'::public.workflow_step_status else 'COMPLETED'::public.workflow_step_status end,
    error=case when v_failed then 'Approval rejected.' else null end,
    output_summary=case when v_failed then null else 'Approval resolved; pilot action simulated.' end,completed_at=now() where id=s.id;
  if not v_failed then
    v_executions:=v_executions || jsonb_build_array(jsonb_build_object('connectorId',a.target_system,'action',a.proposed_action,'ok',true,
      'risk',a.action_risk,'summary','Approved pilot action recorded as simulated; no external data was changed.'));
    for v_step in select value from jsonb_array_elements(v_steps) loop
      if not v_seen then v_seen:=v_step->>'id'=s.step_definition_id; continue; end if;
      v_risk:=v_step->>'risk'; v_connector:=v_step->>'connectorId'; v_error:=null;
      if v_risk is null or v_risk not in ('READ','DRAFT') or coalesce(v_policy->'requiredForRisks','[]'::jsonb) ? v_risk then
        v_failed:=true;
        v_executions:=v_executions || jsonb_build_array(jsonb_build_object('connectorId',coalesce(v_connector,'aibeat-runtime'),
          'action',v_step->>'action','ok',false,'risk',v_risk,'summary','A separate approval is required for this later step.','error','ADDITIONAL_APPROVAL_REQUIRED'));
        exit;
      end if;
      -- Current connectors are PilotConnector simulations (lib/business/connectors.ts).
      -- Never execute an external connector or accept client-reported execution results.
      v_name:=case v_connector when 'google-workspace' then 'Google Workspace' when 'crm' then 'CRM'
        when 'email-slack' then 'Email / Slack' when 'analytics' then 'Google Analytics'
        when 'search-console' then 'Google Search Console' when 'email' then 'Email'
        when 'documents' then 'Documents' when 'web-research' then 'Web Research' when 'notifications' then 'Slack / Teams' end;
      if v_connector is null then v_summary:='AIBeat runtime executed '||(v_step->>'action');
      elsif v_name is null then v_error:='CONNECTOR_NOT_REGISTERED'; v_summary:='Connector is not registered';
      else
        if v_connector not in ('documents','web-research') then
          select case when status='CONNECTED' and access_token_expires_at<=now() then 'TOKEN_EXPIRED' else status end into v_status
            from public.integration_connections where organization_id=p_organization_id and integration_id=v_connector;
          v_status:=coalesce(v_status,'NOT_CONNECTED');
          if v_status<>'CONNECTED' then v_error:=v_status; end if;
        end if;
        v_summary:=case when v_error is null then v_name||' simulated '||(v_step->>'action')||'; no external data was read or changed.'
          else v_name||' cannot execute: '||v_error end;
      end if;
      insert into public.workflow_steps(organization_id,workflow_run_id,step_definition_id,name,risk,status,started_at,completed_at,output_summary,error)
        values(p_organization_id,r.id,v_step->>'id',v_step->>'name',v_risk,
          case when v_error is null then 'COMPLETED'::public.workflow_step_status else 'FAILED'::public.workflow_step_status end,now(),now(),v_summary,v_error);
      v_executions:=v_executions || jsonb_build_array(jsonb_build_object('connectorId',coalesce(v_connector,'aibeat-runtime'),
        'action',v_step->>'action','ok',v_error is null,'risk',v_risk,'summary',v_summary,'error',v_error));
      if v_error is not null then v_failed:=true; exit; end if;
    end loop;
  end if;
  update public.workflow_runs set status=case when v_failed then 'FAILED'::public.workflow_run_status else 'COMPLETED'::public.workflow_run_status end,
    completed_at=now(),current_step_id=null,
    result_summary=case when p_decision='REJECTED' then 'Workflow stopped after rejection.' when v_failed then 'Workflow failed after approval while resuming remaining steps.'
      else 'Workflow completed after approval; pilot action was recorded as simulated.' end,
    result_metadata=jsonb_set(coalesce(result_metadata,'{}'),'{connectorExecutions}',v_executions) where id=r.id;
  update public.approvals set status=p_decision::public.approval_status,decision=p_decision,resolved_by=auth.uid(),resolved_at=now(),
    edited_payload=case when p_decision='EDITED' then jsonb_build_object('content',p_edited_content) else null end,
    execution_result=case when v_failed then 'Workflow ended after approval resolution.' else 'Workflow completed; pilot action simulated.' end where id=a.id returning * into a;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,workflow_run_id,agent_type,summary)
    values(p_organization_id,auth.uid(),case when p_decision='REJECTED' then 'APPROVAL_REJECTED' else 'APPROVAL_APPROVED' end,a.id::text,r.id,a.agent_type,'Approval '||lower(p_decision)||'; pilot action only.'),
      (p_organization_id,auth.uid(),case when v_failed then 'WORKFLOW_FAILED' else 'WORKFLOW_COMPLETED' end,r.id::text,r.id,a.agent_type,'Workflow ended after atomic approval resolution.');
  return a;
end $$;
revoke all on function public.decide_business_approval(uuid,uuid,text,text) from public,anon;
grant execute on function public.decide_business_approval(uuid,uuid,text,text) to authenticated;

-- Every existing relational FK between tenant tables must reference the same tenant.
-- Keep original FK delete behavior; additional composite checks are deferred so original
-- SET NULL/CASCADE actions can finish. Validate historical rows now or abort the migration.
do $$ declare r record; n text; begin
  for r in select c.conrelid::regclass child,c.confrelid::regclass parent,ca.attname child_col,pa.attname parent_col,
      c.conname,c.conrelid,c.confrelid from pg_constraint c
    join pg_class cl on cl.oid=c.conrelid join pg_namespace ns on ns.oid=cl.relnamespace
    join pg_class pl on pl.oid=c.confrelid join pg_namespace pn on pn.oid=pl.relnamespace
    join pg_attribute ca on ca.attrelid=c.conrelid and ca.attnum=c.conkey[1]
    join pg_attribute pa on pa.attrelid=c.confrelid and pa.attnum=c.confkey[1]
    where c.contype='f' and cardinality(c.conkey)=1 and ns.nspname='public' and pn.nspname='public'
      and cl.relname in ('industry_profiles','business_context_items','documents','entities','workflows','workflow_runs','workflow_steps','agent_findings','approvals','integration_connections','usage_events','ai_tools','ai_tool_subscriptions','ai_tool_usage','ai_recommendations','roi_metrics','document_chunks','workflow_schedule_triggers','workflow_schedule_attempts','business_notifications','agent_evaluations','audit_events') and pl.relname<>'ai_tools'
      and exists(select 1 from pg_attribute where attrelid=c.conrelid and attname='organization_id' and not attisdropped)
      and exists(select 1 from pg_attribute where attrelid=c.confrelid and attname='organization_id' and not attisdropped)
  loop
    n:='c01_parent_'||substr(md5(r.parent::text||r.parent_col),1,20);
    execute format('create unique index if not exists %I on %s (%I,organization_id)',n,r.parent,r.parent_col);
    n:='c01_tenant_'||substr(md5(r.child::text||r.conname),1,20);
    execute format('alter table %s add constraint %I foreign key(%I,organization_id) references %s(%I,organization_id) deferrable initially deferred not valid',r.child,n,r.child_col,r.parent,r.parent_col);
    execute format('alter table %s validate constraint %I',r.child,n);
  end loop;
end $$;
create unique index c01_step_run_org on public.workflow_steps(id,workflow_run_id,organization_id);
create unique index c01_run_workflow_org on public.workflow_runs(id,workflow_id,organization_id);
alter table public.workflow_runs add constraint c01_current_step_same_run foreign key(current_step_id,id,organization_id)
  references public.workflow_steps(id,workflow_run_id,organization_id) deferrable initially deferred;
alter table public.approvals add constraint c01_approval_step_same_run foreign key(workflow_step_id,workflow_run_id,organization_id)
  references public.workflow_steps(id,workflow_run_id,organization_id) deferrable initially deferred;
alter table public.approvals add constraint c01_approval_workflow_same_run foreign key(workflow_run_id,workflow_id,organization_id)
  references public.workflow_runs(id,workflow_id,organization_id) deferrable initially deferred;
alter table public.audit_events add constraint c01_audit_run_tenant foreign key(workflow_run_id,organization_id)
  references public.workflow_runs(id,organization_id) deferrable initially deferred;
alter table public.audit_events add constraint c01_audit_workflow_tenant foreign key(workflow_id,organization_id)
  references public.workflows(id,organization_id) deferrable initially deferred;

-- A subscription can reference a global tool OR a tool in its own organization.
create function public.business_subscription_tool_scope()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.ai_tool_id is not null then
    perform 1 from public.ai_tools where id=new.ai_tool_id and (organization_id is null or organization_id=new.organization_id) for share;
    if not found then raise exception 'TOOL_TENANT_MISMATCH' using errcode='23503'; end if;
  end if;
  return new;
end $$;
revoke all on function public.business_subscription_tool_scope() from public,anon,authenticated;
create trigger business_subscription_tool_scope before insert or update on public.ai_tool_subscriptions
for each row execute function public.business_subscription_tool_scope();
do $$ begin
  if exists(select 1 from public.ai_tool_subscriptions s join public.ai_tools t on t.id=s.ai_tool_id
    where t.organization_id is not null and t.organization_id<>s.organization_id) then raise exception 'EXISTING_TOOL_TENANT_MISMATCH'; end if;
end $$;

-- Malformed storage paths deny cleanly instead of throwing UUID parse errors.
create function public.business_storage_org(p_name text)
returns uuid language plpgsql immutable set search_path = '' as $$
declare v_prefix text:=split_part(p_name,'/',1);
begin
  if p_name not like '%/%' or v_prefix !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return null; end if;
  return v_prefix::uuid;
end $$;
revoke all on function public.business_storage_org(text) from public;
grant execute on function public.business_storage_org(text) to anon,authenticated;
drop policy if exists "business document members read storage" on storage.objects;
drop policy if exists "business document admins write storage" on storage.objects;
create policy "business document members read storage" on storage.objects for select to authenticated
  using(bucket_id='business-documents' and public.is_org_member(public.business_storage_org(name)));
create policy "business document admins write storage" on storage.objects for all to authenticated
  using(bucket_id='business-documents' and public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]))
  with check(bucket_id='business-documents' and public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]));

-- Restrictive tenant fences also constrain any extra permissive policies found in
-- staging. They do not grant new writes, and security-definer RPCs reauthorize above.
do $$ declare t text; begin
  foreach t in array array['organization_members','industry_profiles','business_context_items','documents','entities','workflows','workflow_runs',
    'workflow_steps','agent_findings','approvals','integration_connections','audit_events','usage_events','ai_tool_subscriptions','ai_tool_usage',
    'ai_recommendations','roi_metrics','document_chunks','workflow_schedule_triggers','workflow_schedule_attempts','business_notifications','agent_evaluations']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy c01_tenant_fence on public.%I as restrictive for all to anon,authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id))',t);
  end loop;
end $$;
create policy c01_organization_fence on public.organizations as restrictive for all to anon,authenticated
  using(public.is_org_member(id)) with check(public.is_org_member(id));
create policy c01_tool_fence on public.ai_tools as restrictive for all to anon,authenticated
  using(organization_id is null or public.is_org_member(organization_id))
  with check(organization_id is not null and public.has_org_role(organization_id,array['OWNER','ADMIN']::public.business_role[]));
create policy c01_storage_read_fence on storage.objects as restrictive for select to anon,authenticated
  using(bucket_id<>'business-documents' or public.is_org_member(public.business_storage_org(name)));
create policy c01_storage_insert_fence on storage.objects as restrictive for insert to anon,authenticated
  with check(bucket_id<>'business-documents' or public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]));
create policy c01_storage_update_fence on storage.objects as restrictive for update to anon,authenticated
  using(bucket_id<>'business-documents' or public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]))
  with check(bucket_id<>'business-documents' or public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]));
create policy c01_storage_delete_fence on storage.objects as restrictive for delete to anon,authenticated
  using(bucket_id<>'business-documents' or public.has_org_role(public.business_storage_org(name),array['OWNER','ADMIN']::public.business_role[]));

commit;
