-- Local implementation only. NOT APPLIED. Requires C01 and separate database validation.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';

-- NULL expiry deliberately makes legacy invitations non-acceptable; owners reissue.
alter table public.organization_members
  add column invitation_expires_at timestamptz,
  add column invitation_revoked_at timestamptz,
  add column invitation_accepted_at timestamptz;

-- Historical IDs intentionally have no FK: deleting a membership/invitation must not
-- destroy the receipt or prevent legitimate removal. Org deletion is restricted.
create table public.business_invitation_acceptances (
  invitation_id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  member_id uuid not null unique,
  recipient_user_id uuid not null,
  recipient_email text not null,
  invited_by uuid not null,
  granted_role public.business_role not null,
  accepted_at timestamptz not null default now()
);
alter table public.business_invitation_acceptances enable row level security;
revoke all on public.business_invitation_acceptances from public, anon, authenticated;
create trigger business_invitation_receipt_immutable before update or delete
  on public.business_invitation_acceptances for each row execute function public.business_audit_immutable();
create trigger business_invitation_receipt_no_truncate before truncate
  on public.business_invitation_acceptances for each statement execute function public.business_audit_immutable();

create function public.business_invitation_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.invited_email is distinct from old.invited_email
    or new.invited_by is distinct from old.invited_by
    or new.invitation_expires_at is distinct from old.invitation_expires_at then
    raise exception 'INVITATION_IDENTITY_IMMUTABLE' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.business_invitation_identity() from public,anon,authenticated;
create trigger business_invitation_identity before update on public.organization_members
  for each row execute function public.business_invitation_identity();

create or replace function public.invite_business_member(p_organization_id uuid,p_email text,p_role public.business_role)
returns public.organization_members language plpgsql security definer set search_path = '' as $$
declare v_result public.organization_members; v_email text:=lower(trim(p_email)); v_stale uuid;
begin
  perform public.business_lock_owner(p_organization_id);
  if p_role is null or v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVALID_INVITATION' using errcode='22023';
  end if;
  -- Owner authorization and the org lock above cover revocation, audit and reissue.
  -- Never reassign an old invitation's immutable inviter/email/expiry/identity.
  for v_stale in
    update public.organization_members i set invitation_revoked_at=clock_timestamp()
      where i.organization_id=p_organization_id and lower(i.invited_email)=v_email
        and i.status='INVITED' and i.user_id is null
        and i.invitation_accepted_at is null and i.invitation_revoked_at is null
        and not exists(select 1 from public.organization_members issuer
          where issuer.organization_id=p_organization_id and issuer.user_id=i.invited_by
            and issuer.role='OWNER' and issuer.status='ACTIVE')
      returning i.id
  loop
    insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
      values(p_organization_id,auth.uid(),'MEMBER_INVITATION_REVOKED',v_stale::text,
        'Revoked stale Business invitation before reissue.');
  end loop;
  select * into v_result from public.organization_members
    where organization_id=p_organization_id and lower(invited_email)=v_email and status='INVITED'
      and user_id is null and invitation_revoked_at is null and invitation_accepted_at is null
      and invitation_expires_at>clock_timestamp()
    order by created_at,id limit 1;
  if found then return v_result; end if;
  -- OWNER remains an explicit owner-authorized grant, matching the existing API.
  insert into public.organization_members(organization_id,user_id,role,permissions,status,invited_email,invited_by,invitation_expires_at)
    values(p_organization_id,null,p_role,'{}','INVITED',v_email,auth.uid(),clock_timestamp()+interval '7 days') returning * into v_result;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(p_organization_id,auth.uid(),'MEMBER_INVITED',v_result.id::text,'Invited Business member; valid for seven days.');
  return v_result;
end $$;
revoke all on function public.invite_business_member(uuid,text,public.business_role) from public,anon;
grant execute on function public.invite_business_member(uuid,text,public.business_role) to authenticated;

create function public.revoke_business_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_inv public.organization_members;
begin
  select organization_id into v_org from public.organization_members where id=p_invitation_id;
  perform public.business_lock_owner(v_org);
  select * into v_inv from public.organization_members where id=p_invitation_id and organization_id=v_org for update;
  if not found or v_inv.status<>'INVITED' or v_inv.user_id is not null then
    raise exception 'INVITATION_UNAVAILABLE' using errcode='42501';
  end if;
  if v_inv.invitation_accepted_at is not null then
    raise exception 'INVITATION_ALREADY_ACCEPTED' using errcode='23514';
  end if;
  if v_inv.invitation_revoked_at is not null then return; end if;
  update public.organization_members set invitation_revoked_at=clock_timestamp() where id=p_invitation_id;
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(v_org,auth.uid(),'MEMBER_INVITATION_REVOKED',p_invitation_id::text,'Business invitation revoked.');
end $$;
revoke all on function public.revoke_business_invitation(uuid) from public,anon;
grant execute on function public.revoke_business_invitation(uuid) to authenticated;

create function public.accept_business_invitation(p_invitation_id uuid)
returns public.organization_members language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid(); v_email text; v_confirmed timestamptz; v_org uuid;
  v_inv public.organization_members; v_receipt public.business_invitation_acceptances;
  v_member public.organization_members;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'ACCEPTANCE_REQUIRES_READ_COMMITTED' using errcode='0A000';
  end if;
  -- Trusted current identity, not JWT email, caller input or editable user metadata.
  -- Lock identity before org, matching creator provisioning's lock order.
  select lower(trim(email)),email_confirmed_at into v_email,v_confirmed
    from auth.users where id=v_user for share;
  if v_email is null or v_email='' or v_confirmed is null then
    raise exception 'VERIFIED_EMAIL_REQUIRED' using errcode='42501';
  end if;
  select organization_id into v_org from public.organization_members where id=p_invitation_id;
  if v_org is null then
    select organization_id into v_org from public.business_invitation_acceptances where invitation_id=p_invitation_id;
  end if;
  -- Org-first serialization with owner revoke/remove/change; stale snapshots rejected above.
  update public.organizations set updated_at=updated_at where id=v_org;
  if not found then raise exception 'INVITATION_UNAVAILABLE' using errcode='42501'; end if;
  select * into v_receipt from public.business_invitation_acceptances where invitation_id=p_invitation_id;
  if found then
    if v_receipt.recipient_user_id<>v_user or v_receipt.recipient_email<>v_email then
      raise exception 'INVITATION_UNAVAILABLE' using errcode='42501';
    end if;
    select * into v_member from public.organization_members
      where id=v_receipt.member_id and organization_id=v_org and user_id=v_user and status='ACTIVE';
    if not found then raise exception 'MEMBERSHIP_CHANGED' using errcode='23514'; end if;
    return v_member; -- no reinsertion, role reset, reactivation or second audit on retry
  end if;
  select * into v_inv from public.organization_members
    where id=p_invitation_id and organization_id=v_org for update;
  if not found or v_inv.status<>'INVITED' or v_inv.user_id is not null
    or lower(trim(v_inv.invited_email)) is distinct from v_email then
    raise exception 'INVITATION_UNAVAILABLE' using errcode='42501';
  end if;
  if v_inv.invitation_revoked_at is not null then raise exception 'INVITATION_REVOKED' using errcode='23514'; end if;
  if v_inv.invitation_expires_at is null or v_inv.invitation_expires_at<=clock_timestamp() then
    raise exception 'INVITATION_EXPIRED' using errcode='23514';
  end if;
  if v_inv.invitation_accepted_at is not null then raise exception 'INVITATION_UNAVAILABLE' using errcode='23514'; end if;
  if not exists(select 1 from public.organization_members where organization_id=v_org
    and user_id=v_inv.invited_by and role='OWNER' and status='ACTIVE') then
    raise exception 'INVITATION_REVOKED' using errcode='23514';
  end if;
  if exists(select 1 from public.organization_members where organization_id=v_org and user_id=v_user) then
    raise exception 'MEMBERSHIP_EXISTS' using errcode='23514';
  end if;
  insert into public.organization_members(organization_id,user_id,role,permissions,status)
    values(v_org,v_user,v_inv.role,'{}','ACTIVE') returning * into v_member;
  update public.organization_members set invitation_accepted_at=clock_timestamp() where id=p_invitation_id;
  insert into public.business_invitation_acceptances(invitation_id,organization_id,member_id,recipient_user_id,recipient_email,invited_by,granted_role)
    values(p_invitation_id,v_org,v_member.id,v_user,v_email,v_inv.invited_by,v_inv.role);
  insert into public.audit_events(organization_id,actor_user_id,event_type,entity_id,summary)
    values(v_org,v_user,'MEMBER_INVITATION_ACCEPTED',v_member.id::text,'Accepted Business invitation '||p_invitation_id::text||'.');
  return v_member;
end $$;
revoke all on function public.accept_business_invitation(uuid) from public,anon;
grant execute on function public.accept_business_invitation(uuid) to authenticated;
commit;
