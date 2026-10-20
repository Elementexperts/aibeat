-- Run only in disposable aibeat_c01_isolation after all repository migrations.
-- psql -X -v ON_ERROR_STOP=1 -f tests/rls/business-isolation.sql
-- Connection credentials must be independently verified NONPRODUCTION. No env auto-load.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if current_database()<>'aibeat_c01_isolation' then raise exception 'ISOLATED_DATABASE_REQUIRED'; end if;
end $$;

create function pg_temp.check_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERTION_FAILED: %',label; end if; end $$;
create function pg_temp.expect_error(statement text, expected_state text, label text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if SQLSTATE=expected_state then return; end if;
    raise exception 'WRONG_ERROR [%]: expected %, got % (%)',label,expected_state,SQLSTATE,SQLERRM;
  end;
  raise exception 'EXPECTED_ERROR_MISSING: %',label;
end $$;
-- Identities: owner A 1, second owner A 2, admin A 3, manager A 4, member A 5,
-- owner B 6, authenticated nonmember 7, new onboarding creator 8.
insert into auth.users(id,email) select ('10000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'c01-'||i||'@example.invalid' from generate_series(1,9) i;
insert into public.organizations(id,name,primary_profile,created_by) values
 ('20000000-0000-0000-0000-000000000001','C01 A','CONSULTING','10000000-0000-0000-0000-000000000001'),
 ('20000000-0000-0000-0000-000000000002','C01 B','CONSULTING','10000000-0000-0000-0000-000000000006'),
 ('20000000-0000-0000-0000-000000000003','Legacy memberless','CONSULTING','10000000-0000-0000-0000-000000000006');
insert into public.organization_members(id,organization_id,user_id,role,status) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','OWNER','ACTIVE'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','OWNER','ACTIVE'),
 ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','ADMIN','ACTIVE'),
 ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','MANAGER','ACTIVE'),
 ('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','MEMBER','ACTIVE'),
 ('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','OWNER','ACTIVE');

-- Creator invariant applies even to privileged inserts; no adoption of foreign memberless org.
select pg_temp.expect_error($q$insert into public.organization_members(organization_id,user_id,role,status)
 values('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000007','OWNER','ACTIVE')$q$,'23514','creator invariant');

set local role anon;
select set_config('request.jwt.claims','{}',true);
select pg_temp.check_true(not public.is_org_member('20000000-0000-0000-0000-000000000001'),'anonymous is not member');
select pg_temp.expect_error($q$select public.create_business_organization('x',1,'CONSULTING','{}')$q$,'42501','anonymous provisioning denied');
select pg_temp.expect_error($q$select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED')$q$,'42501','anonymous approval denied');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000007","role":"authenticated","user_metadata":{"role":"OWNER"}}',true);
select pg_temp.check_true((select count(*)=0 from public.organizations),'nonmember cannot read organizations');
select pg_temp.check_true((select count(*)=0 from public.organization_members),'nonmember cannot read memberships');
select pg_temp.expect_error($q$insert into public.organization_members(organization_id,user_id,role,status) values
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000007','OWNER','ACTIVE')$q$,'42501','direct first-owner attack denied');
select pg_temp.expect_error($q$select public.invite_business_member('20000000-0000-0000-0000-000000000001','x@example.invalid','OWNER')$q$,'42501','nonmember invitation denied');
-- Every private tenant table denies authenticated nonmembers. Table absence is a test failure.
do $$ declare t text; n bigint; begin
  foreach t in array array['industry_profiles','business_context_items','documents','entities','workflows','workflow_runs','workflow_steps',
    'agent_findings','approvals','integration_connections','audit_events','usage_events','ai_tool_subscriptions','ai_tool_usage',
    'ai_recommendations','roi_metrics','document_chunks','workflow_schedule_triggers','workflow_schedule_attempts','business_notifications','agent_evaluations']
  loop execute format('select count(*) from public.%I',t) into n; perform pg_temp.check_true(n=0,'nonmember read '||t); end loop;
end $$;
reset role;

-- Atomic onboarding: server catalog, creator ownership, retry and context seeded together.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000008","role":"authenticated"}',true);
select public.complete_business_onboarding('C01 New',9,'CONSULTING','Lead Research & Qualification','Isolated test context') as new_org \gset
select pg_temp.check_true(public.complete_business_onboarding('C01 New',9,'CONSULTING','Lead Research & Qualification','Retry')=:'new_org'::uuid,'onboarding retry stable');
select pg_temp.check_true((select count(*)=1 from public.organization_members where organization_id=:'new_org' and user_id=auth.uid() and role='OWNER'),'creator owner');
select pg_temp.check_true((select count(*)=1 from public.business_context_items where organization_id=:'new_org' and category='ONBOARDING'),'context once');
select pg_temp.check_true((select count(*)=count(distinct template_id) from public.workflows where organization_id=:'new_org'),'templates once');
select pg_temp.check_true((select business_onboarded_at is not null and created_by=auth.uid() from public.organizations where id=:'new_org'),'onboarding complete');
reset role;

-- A failed context seed rolls back creator organization, membership and workflow seed.
create function pg_temp.fail_onboarding_context() returns trigger language plpgsql as $$
begin if new.category='ONBOARDING' then raise exception 'TEST_CONTEXT_FAILURE' using errcode='P0001'; end if; return new; end $$;
create trigger c01_test_context_failure before insert on public.business_context_items for each row execute function pg_temp.fail_onboarding_context();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000009","role":"authenticated"}',true);
select pg_temp.expect_error($q$select public.complete_business_onboarding('Must roll back',9,'CONSULTING','Lead Research & Qualification','Test context')$q$,'P0001','onboarding seed failure');
reset role;
select pg_temp.check_true((select count(*)=0 from public.organizations where created_by='10000000-0000-0000-0000-000000000009'),'no half-created organization');
select pg_temp.check_true((select count(*)=0 from public.organization_members where user_id='10000000-0000-0000-0000-000000000009'),'no half-created owner');
drop trigger c01_test_context_failure on public.business_context_items;

-- Member, manager and admin cannot manage membership. Existing owner can invite/change.
set local role authenticated;
do $$ declare u text; begin
  foreach u in array array['10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000005'] loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
    perform pg_temp.check_true(public.is_org_member('20000000-0000-0000-0000-000000000001'),'active role read');
    perform pg_temp.expect_error($q$select public.change_business_member('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000005','OWNER')$q$,'42501','nonowner cannot promote');
  end loop;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select public.invite_business_member('20000000-0000-0000-0000-000000000001','invite@example.invalid','MEMBER');
select pg_temp.expect_error($q$update public.organization_members set permissions=array['*'] where id='30000000-0000-0000-0000-000000000005'$q$,'42501','owner direct permission forgery denied');
select pg_temp.expect_error($q$select public.change_business_member('20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000006','MEMBER')$q$,'42501','cross-org member change');
select public.change_business_member('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','ADMIN');
select pg_temp.expect_error($q$select public.change_business_member('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','MEMBER')$q$,'23514','last owner demotion');
select pg_temp.expect_error($q$select public.change_business_member('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','OWNER','SUSPENDED')$q$,'23514','last owner suspension');
select pg_temp.expect_error($q$select public.remove_business_member('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001')$q$,'23514','last owner delete');
select pg_temp.expect_error($q$update public.organizations set created_by='10000000-0000-0000-0000-000000000007' where id='20000000-0000-0000-0000-000000000001'$q$,'42501','creator cannot change');
reset role;

-- Tenant workflow fixtures and approval continuation: one safe step after approval.
insert into public.workflows(id,organization_id,name,description,agent_type,trigger,status,steps,approval_policy) values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','C01 approval','test','MARKETING_CONTENT','MANUAL','ACTIVE',
 '[{"id":"review","name":"Review","action":"publish content","risk":"APPROVAL_REQUIRED"},{"id":"after","name":"After","action":"draft summary","risk":"DRAFT"}]',
 '{"approverRoles":["OWNER","ADMIN","MANAGER"],"requiredForRisks":["APPROVAL_REQUIRED"]}'),
 ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','C01 B workflow','test','MARKETING_CONTENT','MANUAL','ACTIVE','[]','{}');
insert into public.workflow_runs(id,organization_id,workflow_id,status,idempotency_key) values
 ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','WAITING_FOR_APPROVAL','c01-1');
insert into public.workflow_steps(id,organization_id,workflow_run_id,step_definition_id,name,risk,status) values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','review','Review','APPROVAL_REQUIRED','WAITING_FOR_APPROVAL');
update public.workflow_runs set current_step_id='60000000-0000-0000-0000-000000000001' where id='50000000-0000-0000-0000-000000000001';
insert into public.approvals(id,organization_id,workflow_id,workflow_run_id,workflow_step_id,agent_type,action_type,action_risk,proposed_action,proposed_payload,target_system,target_entity,reason,requested_by)
 values('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',
 '50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','MARKETING_CONTENT','publish content','APPROVAL_REQUIRED','publish content',
 '{"stepId":"review","content":"Exact draft"}','documents','C01','Test approval','10000000-0000-0000-0000-000000000001');
set constraints all immediate;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select pg_temp.expect_error($q$insert into public.workflow_runs(organization_id,workflow_id,status,idempotency_key) values
 ('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','RUNNING','cross-org')$q$,'23503','admin cannot reference foreign workflow');
select pg_temp.expect_error($q$update public.approvals set status='APPROVED' where id='70000000-0000-0000-0000-000000000001'$q$,'42501','admin cannot bypass approval RPC');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.expect_error($q$select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED')$q$,'42501','member cannot approve');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select pg_temp.check_true((select count(*)=0 from public.approvals),'foreign owner cannot read approval');
select pg_temp.expect_error($q$select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED')$q$,'42501','foreign owner cannot approve');
reset role;

-- Inject a final audit failure: approval, continuation and run must ALL roll back.
create function pg_temp.fail_approval_audit() returns trigger language plpgsql as $$
begin if new.event_type='APPROVAL_APPROVED' then raise exception 'TEST_AUDIT_FAILURE' using errcode='P0001'; end if; return new; end $$;
create trigger c01_test_audit_failure before insert on public.audit_events for each row execute function pg_temp.fail_approval_audit();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
do $$ declare u text; begin
  foreach u in array array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004'] loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
    perform pg_temp.expect_error($q$select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED')$q$,'P0001','allowed role reaches atomic audit failure');
  end loop;
end $$;
select pg_temp.check_true((select status='PENDING' from public.approvals where id='70000000-0000-0000-0000-000000000001'),'approval rolled back');
select pg_temp.check_true((select status='WAITING_FOR_APPROVAL' from public.workflow_runs where id='50000000-0000-0000-0000-000000000001'),'run rolled back');
select pg_temp.check_true((select count(*)=1 from public.workflow_steps where workflow_run_id='50000000-0000-0000-0000-000000000001'),'continuation rolled back');
reset role;
drop trigger c01_test_audit_failure on public.audit_events;
set local role authenticated;
select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED');
select public.decide_business_approval('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','APPROVED');
select pg_temp.check_true((select count(*)=2 from public.workflow_steps where workflow_run_id='50000000-0000-0000-0000-000000000001'),'continuation exactly once');
select pg_temp.check_true((select status='COMPLETED' from public.workflow_runs where id='50000000-0000-0000-0000-000000000001'),'manager transaction complete');
select pg_temp.check_true((select count(*)=1 from public.audit_events where event_type='APPROVAL_APPROVED'),'decision audit once');
select pg_temp.expect_error($q$update public.audit_events set summary='forged'$q$,'42501','audit update denied');
select pg_temp.expect_error($q$delete from public.audit_events$q$,'42501','audit delete denied');
select pg_temp.expect_error($q$truncate public.audit_events$q$,'42501','audit truncate denied');
reset role;
select pg_temp.expect_error($q$update public.audit_events set summary='forged'$q$,'42501','audit trigger protects privileged DML');

-- Storage: same-org member read, admin writes; no malformed or cross-org paths.
insert into storage.buckets(id,name,public) values('business-documents','business-documents',false) on conflict(id) do nothing;
insert into storage.objects(bucket_id,name) values('business-documents','20000000-0000-0000-0000-000000000001/c01.txt');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.check_true((select count(*)=1 from storage.objects where name='20000000-0000-0000-0000-000000000001/c01.txt'),'member storage read');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name) values('business-documents','20000000-0000-0000-0000-000000000001/member.txt')$q$,'42501','member storage write denied');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
insert into storage.objects(bucket_id,name) values('business-documents','20000000-0000-0000-0000-000000000001/admin.txt');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name) values('business-documents','20000000-0000-0000-0000-000000000002/foreign.txt')$q$,'42501','foreign storage write denied');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name) values('business-documents','invalid/path.txt')$q$,'42501','malformed storage path denies');
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000007","role":"authenticated"}',true);
select pg_temp.check_true((select count(*)=0 from storage.objects where bucket_id='business-documents'),'nonmember storage read denied');
reset role;
rollback;
\echo 'C01 isolation assertions passed; all fixtures rolled back.'
