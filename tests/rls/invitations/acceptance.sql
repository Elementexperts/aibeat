-- Real SQL assertions, NOT EXECUTED. Full Supabase-compatible migration chain required.
\ir identity.sql
begin isolation level read committed;
set local statement_timeout='20s';
set local lock_timeout='5s';
create function pg_temp.ok(value boolean,label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERTION_FAILED: %',label; end if; end $$;
create function pg_temp.reject(statement text,state text,message text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if SQLSTATE=state and position(message in SQLERRM)>0 then return; end if;
    raise exception 'WRONG_ERROR: expected % / %, got %',state,message,SQLSTATE;
  end;
  raise exception 'EXPECTED_ERROR_MISSING: %',message;
end $$;
-- Privileged synthetic auth fixture seeding ONLY in disposable DB, never membership bypass.
insert into auth.users(id,email,email_confirmed_at)
 select ('91000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'c01-inv-'||i||'@example.invalid',case when i=4 then null else clock_timestamp() end
 from generate_series(1,6) i;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.create_business_organization('Invitation A',1,'CONSULTING','{}') as org_a \gset
select id as owner_member from public.organization_members where organization_id=:'org_a' and user_id=auth.uid() \gset
select (public.invite_business_member(:'org_a','c01-inv-2@example.invalid','MEMBER')).id as valid_inv \gset
select (public.invite_business_member(:'org_a','c01-inv-4@example.invalid','ADMIN')).id as unconfirmed_inv \gset
select (public.invite_business_member(:'org_a','c01-inv-6@example.invalid','MANAGER')).id as rollback_inv \gset
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000005","role":"authenticated"}',true);
select public.create_business_organization('Invitation B',1,'CONSULTING','{}') as org_b \gset
reset role;

-- 00 actual catalog privileges/search_path; receipt is private, not a second membership API.
select pg_temp.ok(not has_function_privilege('anon','public.accept_business_invitation(uuid)','EXECUTE'),'anon denied');
select pg_temp.ok(has_function_privilege('authenticated','public.accept_business_invitation(uuid)','EXECUTE'),'authenticated RPC');
select pg_temp.ok(not has_table_privilege('authenticated','public.organization_members','INSERT'),'no broad insert');
select pg_temp.ok(not has_table_privilege('authenticated','public.business_invitation_acceptances','SELECT,INSERT,UPDATE,DELETE'),'private receipt');
select pg_temp.ok((select relrowsecurity from pg_class where oid='public.business_invitation_acceptances'::regclass),'receipt RLS');
select pg_temp.ok((select count(*)=3 from pg_proc where oid in ('public.accept_business_invitation(uuid)'::regprocedure,'public.revoke_business_invitation(uuid)'::regprocedure,'public.invite_business_member(uuid,text,public.business_role)'::regprocedure)
  and prosecdef and 'search_path=""'=any(proconfig)),'definer fixed search paths');

-- 01 positive acceptance + role provenance: caller metadata must not grant OWNER.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"OWNER"}}',true);
select (public.accept_business_invitation(:'valid_inv')).id as active_member \gset
select pg_temp.ok((select role='MEMBER' and status='ACTIVE' and permissions='{}' and id<>:'valid_inv'::uuid from public.organization_members where id=:'active_member'),'01 legitimate new MEMBER');
reset role;
select pg_temp.ok((select user_id is null and status='INVITED' and invitation_accepted_at is not null from public.organization_members where id=:'valid_inv'),'01 original identity retained');

-- 02 wrong identity, even with forged matching JWT email.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000003","email":"c01-inv-2@example.invalid","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'valid_inv'),'42501','INVITATION_UNAVAILABLE');
-- 03 unconfirmed auth.users email cannot be overridden by JWT claims.
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000004","email_confirmed_at":"2026-01-01","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'unconfirmed_inv'),'42501','VERIFIED_EMAIL_REQUIRED');
reset role;

-- 04 expiry boundary fixtures INSERTED expired; immutable expiry is never disabled/updated.
insert into public.organization_members(id,organization_id,user_id,role,status,invited_email,invited_by,invitation_expires_at)
 values('92000000-0000-4000-8000-000000000001',:'org_a',null,'MEMBER','INVITED','c01-inv-3@example.invalid','91000000-0000-4000-8000-000000000001',clock_timestamp()-interval '1 minute');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select pg_temp.reject($q$select public.accept_business_invitation('92000000-0000-4000-8000-000000000001')$q$,'23514','INVITATION_EXPIRED');
-- 05 ordinary owner issuance and revocation.
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select (public.invite_business_member(:'org_a','c01-inv-3@example.invalid','MEMBER')).id as revoked_inv \gset
select public.revoke_business_invitation(:'revoked_inv');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'revoked_inv'),'23514','INVITATION_REVOKED');
-- 06 duplicate acceptance yields same ID; 07 is separate real-session isolation spec.
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.ok((public.accept_business_invitation(:'valid_inv')).id=:'active_member'::uuid,'06 duplicate stable');
-- 11 populated tenant B is invisible; direct membership writes and arbitrary tenant writes denied.
select pg_temp.ok((select count(*)=0 from public.organizations where id=:'org_b'),'11 foreign tenant read');
select pg_temp.reject(format('select public.invite_business_member(%L,''attack@example.invalid'',''OWNER'')',:'org_b'),'42501','OWNER_REQUIRED');
select pg_temp.reject(format('insert into public.organization_members(organization_id,user_id,role,status) values(%L,auth.uid(),''OWNER'',''ACTIVE'')',:'org_b'),'42501','permission denied');
reset role;
select pg_temp.ok((select count(*)=1 from public.organizations where id=:'org_b'),'11 positive foreign sentinel');

-- 10 immutable IDs/user/tenant and invitation identity even for privileged DML.
select pg_temp.reject(format('update public.organization_members set user_id=%L where id=%L','91000000-0000-4000-8000-000000000003',:'valid_inv'),'23514','MEMBERSHIP_IDENTITY_IMMUTABLE');
select pg_temp.reject(format('update public.organization_members set organization_id=%L where id=%L',:'org_b',:'active_member'),'23514','MEMBERSHIP_IDENTITY_IMMUTABLE');
select pg_temp.reject(format('update public.organization_members set invited_email=''other@example.invalid'' where id=%L',:'valid_inv'),'23514','INVITATION_IDENTITY_IMMUTABLE');
-- 13 recipient audit exactly once, receipt linked to actual new membership.
select pg_temp.ok((select count(*)=1 from public.audit_events where organization_id=:'org_a' and actor_user_id='91000000-0000-4000-8000-000000000002' and event_type='MEMBER_INVITATION_ACCEPTED' and entity_id=:'active_member' and position(:'valid_inv' in summary)>0),'13 audit once');
select pg_temp.ok((select member_id=:'active_member'::uuid and recipient_user_id='91000000-0000-4000-8000-000000000002' and granted_role='MEMBER' from public.business_invitation_acceptances where invitation_id=:'valid_inv'),'13 receipt attribution');
-- 14 receipt protected by privileges AND privileged DML/truncate triggers.
select pg_temp.reject($q$update public.business_invitation_acceptances set granted_role='OWNER'$q$,'42501','AUDIT_APPEND_ONLY');
select pg_temp.reject($q$delete from public.business_invitation_acceptances$q$,'42501','AUDIT_APPEND_ONLY');
select pg_temp.reject($q$truncate public.business_invitation_acceptances$q$,'42501','AUDIT_APPEND_ONLY');
set local role authenticated;
select pg_temp.reject($q$select * from public.business_invitation_acceptances$q$,'42501','permission denied');
-- 08 suspension then retry cannot restore access; owner restores explicitly for removal test.
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.change_business_member(:'org_a',:'active_member','MEMBER','SUSPENDED');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'valid_inv'),'23514','MEMBERSHIP_CHANGED');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.change_business_member(:'org_a',:'active_member','MEMBER','ACTIVE');
-- 09 normal removal then retry does not insert again.
select public.remove_business_member(:'org_a',:'active_member');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'valid_inv'),'23514','MEMBERSHIP_CHANGED');
reset role;
select pg_temp.ok((select count(*)=0 from public.organization_members where id=:'active_member'),'09 no resurrection');

-- 12 fault injection after membership/marker/receipt writes, before final audit insert.
create function pg_temp.fail_acceptance_audit() returns trigger language plpgsql as $$
begin if new.event_type='MEMBER_INVITATION_ACCEPTED' then raise exception 'TEST_ACCEPTANCE_AUDIT_FAILURE' using errcode='P0001'; end if; return new; end $$;
create trigger c01_inv_test_audit_failure before insert on public.audit_events for each row execute function pg_temp.fail_acceptance_audit();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000006","role":"authenticated"}',true);
select pg_temp.reject(format('select public.accept_business_invitation(%L)',:'rollback_inv'),'P0001','TEST_ACCEPTANCE_AUDIT_FAILURE');
reset role;
select pg_temp.ok((select count(*)=0 from public.organization_members where organization_id=:'org_a' and user_id='91000000-0000-4000-8000-000000000006'),'12 membership rollback');
select pg_temp.ok((select count(*)=0 from public.business_invitation_acceptances where invitation_id=:'rollback_inv'),'12 receipt rollback');
select pg_temp.ok((select invitation_accepted_at is null from public.organization_members where id=:'rollback_inv'),'12 marker rollback');
select pg_temp.ok((select count(*)=0 from public.audit_events where event_type='MEMBER_INVITATION_ACCEPTED' and actor_user_id='91000000-0000-4000-8000-000000000006'),'12 no partial audit');
drop trigger c01_inv_test_audit_failure on public.audit_events;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000006","role":"authenticated"}',true);
select pg_temp.ok((public.accept_business_invitation(:'rollback_inv')).role='MANAGER','12 safe retry after rollback');
-- 15 sole owner cannot demote/remove self; no trigger bypass.
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.reject(format('select public.change_business_member(%L,%L,''MEMBER'')',:'org_a',:'owner_member'),'23514','LAST_ACTIVE_OWNER');
select pg_temp.reject(format('select public.remove_business_member(%L,%L)',:'org_a',:'owner_member'),'23514','LAST_ACTIVE_OWNER');
reset role;
rollback;
\echo 'Invitation SQL 01-06 and 08-15 passed; fixtures rolled back. 07 and 16 require separate commands.'
-- 16: execute ../business-isolation.sql on the SAME reviewed post-migration disposable environment.
