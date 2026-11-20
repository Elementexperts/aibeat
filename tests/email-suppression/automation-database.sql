-- Disposable localhost database only; synthetic fixtures roll back.
begin;
do $$ begin
 if current_database()<>'aibeat_suppression_test' or inet_server_addr() is distinct from '127.0.0.1'::inet then raise exception 'Local fixture target required'; end if;
end $$;
create function pg_temp.expect(ok boolean,label text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label;
end $$;
select pg_temp.expect((select bool_and(relrowsecurity and relforcerowsecurity) from pg_class where oid in ('public.unsubscribe_automation_contacts'::regclass,'public.unsubscribe_automation_jobs'::regclass)),'ledger RLS forced');
select pg_temp.expect(not has_table_privilege('anon','public.unsubscribe_automation_jobs','SELECT'),'anonymous cannot read ledger');
select pg_temp.expect(not has_table_privilege('service_role','public.unsubscribe_automation_jobs','DELETE'),'backend cannot erase ledger');
select pg_temp.expect(not has_function_privilege('authenticated','public.claim_unsubscribe_automation(uuid)','EXECUTE'),'authenticated cannot claim');
select pg_temp.expect(has_function_privilege('service_role','public.claim_unsubscribe_automation(uuid)','EXECUTE'),'backend can claim');
select pg_temp.expect(public.claim_unsubscribe_automation('00000000-0000-4000-8000-000000000001')->>'email'='legacy@example.invalid','historical unsubscribe discovered');
select pg_temp.expect(public.claim_unsubscribe_automation('00000000-0000-4000-8000-000000000002') is null,'second worker cannot claim leased recipient');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','verify');
do $$ begin
 begin perform public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000002','legacy@example.invalid','reserve'); raise exception 'Missing rejection';
 exception when others then if sqlerrm<>'Lease unavailable' then raise; end if; end;
end $$;
select pg_temp.expect((select draft_status='pending' from public.unsubscribe_automation_contacts where email='legacy@example.invalid'),'wrong worker cannot reserve');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','label','{"status":"skipped"}');
select pg_temp.expect(public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','reserve')->>'draft_status'='creating','durable draft reservation');
do $$ begin
 begin perform public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','reserve'); raise exception 'Missing rejection';
 exception when others then if sqlerrm<>'Draft already reserved' then raise; end if; end;
end $$;
select pg_temp.expect((select draft_status='creating' from public.unsubscribe_automation_jobs where email='legacy@example.invalid'),'job tracks reserved draft');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','draft','{"status":"created","id":"synthetic-draft"}');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000001','legacy@example.invalid','finish');
select pg_temp.expect((select processed_at is not null and gmail_draft_id='synthetic-draft' from public.unsubscribe_automation_jobs where email='legacy@example.invalid'),'completed ledger stores draft identity');
select pg_temp.expect(public.claim_unsubscribe_automation('00000000-0000-4000-8000-000000000002') is null,'completed jobs not replayed');
select public.record_email_unsubscribe('LEGACY@example.invalid','{"reason":"Too frequent"}');
select public.claim_unsubscribe_automation('00000000-0000-4000-8000-000000000002');
select pg_temp.expect((select count(*)=1 from public.unsubscribe_automation_contacts),'repeat request shares contact');
select pg_temp.expect((select count(*)=2 from public.unsubscribe_automation_jobs),'each original request has unique ledger row');
select pg_temp.expect((select draft_status='created' from public.unsubscribe_automation_contacts),'repeat request preserves original draft');
select public.record_email_unsubscribe('legacy@example.invalid','{"reason":"Never signed up. Spam."}');
select pg_temp.expect(public.unsubscribe_has_complaint('legacy@example.invalid'),'late non-consent complaint detected across history');
select pg_temp.expect(public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000002','legacy@example.invalid','heartbeat')->>'complaint'='true','complaint rechecked before draft');
select pg_temp.expect((select reason='Too frequent' from public.email_suppressions where email='legacy@example.invalid'),'original nonblank suppression reason retained');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000002','legacy@example.invalid','fail','{"code":"private@example.invalid secret"}');
select pg_temp.expect((select bool_and(error_code='processing_failed') from public.unsubscribe_automation_jobs where claim_token='00000000-0000-4000-8000-000000000002'),'errors restricted to sanitized enum');
select pg_temp.expect((select status='COMPLETED' from public.public_form_submissions where kind='unsubscribe' order by created_at,id limit 1),'form status semantics unchanged');
-- Privileged manipulation is confined to disposable synthetic local evidence.
delete from public.email_suppressions where email='legacy@example.invalid';
update public.unsubscribe_automation_contacts set next_attempt_at=now(),lease_until=null where email='legacy@example.invalid';
select public.claim_unsubscribe_automation('00000000-0000-4000-8000-000000000003');
do $$ begin
 begin perform public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000003','legacy@example.invalid','verify'); raise exception 'Missing rejection';
 exception when others then if sqlerrm<>'Suppression missing' then raise; end if; end;
end $$;
select pg_temp.expect(not exists(select 1 from public.email_suppressions where email='legacy@example.invalid'),'missing suppression not repaired without flag');
select public.step_unsubscribe_automation('00000000-0000-4000-8000-000000000003','legacy@example.invalid','verify','{"repair":true}');
select pg_temp.expect(exists(select 1 from public.email_suppressions where email='legacy@example.invalid'),'authorized repair restores suppression');
rollback;
