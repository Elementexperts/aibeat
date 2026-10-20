# PREPARED ONLY: PostgreSQL isolationtester, independent backend sessions, no reference model.
# Requires reviewed C01 disposable marker and libpq options c01.expected_run_id.
setup
{
 DO $$ BEGIN
 IF current_database()<>'aibeat_c01_isolation' OR inet_server_addr() IS NULL OR inet_server_addr() NOT IN ('127.0.0.1'::inet,'::1'::inet)
 OR (select count(*) from c01_test_control.identity)<>1 OR NOT EXISTS(select 1 from c01_test_control.identity where run_id=current_setting('c01.expected_run_id')::uuid and purpose='C01_DISPOSABLE_INVITATION_ONLY')
 THEN RAISE EXCEPTION 'DISPOSABLE_IDENTITY_REQUIRED'; END IF; END $$;
 CREATE SCHEMA c01_inv_race;
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
 ('93000000-0000-4000-8000-000000000001','race-owner@example.invalid',clock_timestamp()),
 ('93000000-0000-4000-8000-000000000002','race-recipient@example.invalid',clock_timestamp());
 SET ROLE authenticated;
 SELECT set_config('request.jwt.claims','{"sub":"93000000-0000-4000-8000-000000000001","role":"authenticated"}',false);
 SELECT public.create_business_organization('Invitation concurrency',1,'CONSULTING','{}');
 SELECT public.invite_business_member((select id from public.organizations where created_by=auth.uid()),'race-recipient@example.invalid','MEMBER');
 RESET ROLE;
 CREATE TABLE c01_inv_race.result(backend integer primary key,member_id uuid not null);
 GRANT USAGE ON SCHEMA c01_inv_race TO authenticated;
 GRANT INSERT,SELECT ON c01_inv_race.result TO authenticated;
 CREATE FUNCTION c01_inv_race.invitation() RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT id FROM public.organization_members WHERE invited_email='race-recipient@example.invalid' AND status='INVITED'; $$;
 REVOKE ALL ON FUNCTION c01_inv_race.invitation() FROM public;
 GRANT EXECUTE ON FUNCTION c01_inv_race.invitation() TO authenticated;
}
session a
step a_begin { BEGIN ISOLATION LEVEL READ COMMITTED; SET LOCAL statement_timeout='15s'; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"93000000-0000-4000-8000-000000000002","role":"authenticated"}',true); }
step a_accept { INSERT INTO c01_inv_race.result SELECT pg_backend_pid(),(public.accept_business_invitation(c01_inv_race.invitation())).id; }
step a_commit { COMMIT; }
session b
step b_begin { BEGIN ISOLATION LEVEL READ COMMITTED; SET LOCAL statement_timeout='15s'; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"93000000-0000-4000-8000-000000000002","role":"authenticated"}',true); }
step b_accept { INSERT INTO c01_inv_race.result SELECT pg_backend_pid(),(public.accept_business_invitation(c01_inv_race.invitation())).id; }
step b_commit { COMMIT; }
session observer
step verify { DO $$ BEGIN
 IF (SELECT count(*) FROM c01_inv_race.result)<>2 OR (SELECT count(distinct member_id) FROM c01_inv_race.result)<>1
 OR (SELECT count(*) FROM public.organization_members WHERE user_id='93000000-0000-4000-8000-000000000002')<>1
 OR (SELECT count(*) FROM public.business_invitation_acceptances WHERE recipient_user_id='93000000-0000-4000-8000-000000000002')<>1
 OR (SELECT count(*) FROM public.audit_events WHERE actor_user_id='93000000-0000-4000-8000-000000000002' AND event_type='MEMBER_INVITATION_ACCEPTED')<>1
 THEN RAISE EXCEPTION 'CONCURRENT_ACCEPTANCE_FAILED'; END IF; END $$; }
# First accept holds the org lock. Second MUST wait, then return exactly the same member ID.
permutation a_begin b_begin b_accept a_accept b_commit a_commit verify

# Exactly ONE permutation per disposable database. Reverse order has a separate spec.
# No teardown deletes immutable history. Dispose the whole cluster after EACH permutation.
