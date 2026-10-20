-- Corrected F1 regression contract; NOT EXECUTED. Fresh disposable database.
\ir identity.sql
begin isolation level read committed;
insert into auth.users(id,email,email_confirmed_at) select ('94000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'reissue-'||i||'@example.invalid',clock_timestamp() from generate_series(1,3) i;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"94000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.create_business_organization('Reissue regression',1,'CONSULTING','{}') as org \gset
select id as first_owner from public.organization_members where organization_id=:'org' and user_id=auth.uid() \gset
select (public.invite_business_member(:'org','reissue-2@example.invalid','OWNER')).id as second_owner_inv \gset
select (public.invite_business_member(:'org','reissue-3@example.invalid','MEMBER')).id as stale_inv \gset
select set_config('request.jwt.claims','{"sub":"94000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.accept_business_invitation(:'second_owner_inv');
select public.change_business_member(:'org',:'first_owner','ADMIN','ACTIVE');
select (public.invite_business_member(:'org','reissue-3@example.invalid','MEMBER')).id as replacement \gset
select (:'replacement'::uuid<>:'stale_inv'::uuid) as reissue_ok \gset
\if :reissue_ok
\else
  \echo 'F1: reissue returned invitation whose original inviter is no longer OWNER'
  \quit 4
\endif
select (public.invite_business_member(:'org','reissue-3@example.invalid','MEMBER')).id=:'replacement'::uuid as retry_ok \gset
\if :retry_ok
\else
  \quit 5
\endif
reset role;
select (select invitation_revoked_at is not null and invited_by='94000000-0000-4000-8000-000000000001' from public.organization_members where id=:'stale_inv')
 and (select invited_by='94000000-0000-4000-8000-000000000002' from public.organization_members where id=:'replacement')
 and (select count(*)=1 from public.audit_events where event_type='MEMBER_INVITATION_REVOKED' and entity_id=:'stale_inv' and actor_user_id='94000000-0000-4000-8000-000000000002')
 and (select count(*)=0 from public.organization_members where organization_id=:'org' and user_id='94000000-0000-4000-8000-000000000003') as audit_ok \gset
\if :audit_ok
\else
  \quit 6
\endif
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"94000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select public.accept_business_invitation(:'replacement');
rollback;
-- Expected on future real execution: success and rollback. No DB pass claimed offline.
