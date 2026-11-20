-- LOCAL disposable PostgreSQL only. Synthetic rows; everything rolls back.
begin;
do $$ begin
 if current_database()<>'aibeat_suppression_test' or inet_server_addr() is distinct from '127.0.0.1'::inet then raise exception 'Local fixture target required'; end if;
end $$;
create function pg_temp.expect(ok boolean, label text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label;
end $$;
select pg_temp.expect((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.email_suppressions'::regclass),'RLS enabled and forced');
select pg_temp.expect(not has_table_privilege('anon','public.email_suppressions','SELECT'),'anonymous cannot read list');
select pg_temp.expect(not has_table_privilege('authenticated','public.email_suppressions','SELECT'),'authenticated cannot read list');
select pg_temp.expect(not has_table_privilege('service_role','public.email_suppressions','DELETE'),'backend cannot delete suppressions');
select pg_temp.expect(not has_table_privilege('service_role','public.email_suppressions','UPDATE'),'backend cannot clear suppression via update');
select pg_temp.expect(not has_function_privilege('anon','public.check_marketing_recipients(text[])','EXECUTE'),'anonymous cannot enumerate recipients');
select pg_temp.expect(not has_function_privilege('authenticated','public.record_email_unsubscribe(text,jsonb)','EXECUTE'),'private unsubscribe RPC is backend only');
select pg_temp.expect(has_function_privilege('service_role','public.record_email_unsubscribe(text,jsonb)','EXECUTE'),'backend can record unsubscribe');
select pg_temp.expect(public.check_marketing_recipients(array[' OLD0@EXAMPLE.INVALID ']) @> '["old0@example.invalid"]','preexisting mixed-case row matched');
select pg_temp.expect(public.check_marketing_recipients(array['legacy@example.invalid']) @> '["legacy@example.invalid"]','historical completed request backfilled');
select pg_temp.expect((select count(*)=24 from public.email_suppressions where reason='Existing reason'),'all original 24 rows preserved');
select pg_temp.expect((select min(suppressed_at)='2020-01-01'::timestamptz from public.email_suppressions where reason='Existing reason'),'original suppression times preserved');
select public.record_email_unsubscribe(' Fresh@Example.Invalid ', '{"reason":"Too frequent"}');
select public.record_email_unsubscribe('fresh@example.invalid', '{}');
select pg_temp.expect((select count(*)=1 from public.email_suppressions where email='fresh@example.invalid'),'duplicate opt-out idempotent');
select pg_temp.expect((select reason='Too frequent' from public.email_suppressions where email='fresh@example.invalid'),'blank retry preserves reason');
select pg_temp.expect((select count(*)=2 from public.public_form_submissions where email='fresh@example.invalid'),'both original submissions retained');
select public.record_public_form_submission('newsletter','fresh@example.invalid','{}');
select pg_temp.expect(public.check_marketing_recipients(array['fresh@example.invalid']) @> '["fresh@example.invalid"]','later signup cannot resubscribe');
select public.record_public_form_submission('unsubscribe','direct@example.invalid','{"reason":"Legacy path"}');
select pg_temp.expect(public.check_marketing_recipients(array['direct@example.invalid']) @> '["direct@example.invalid"]','legacy public recorder trigger enforces suppression');
select pg_temp.expect(public.check_marketing_recipients(array['allowed@example.invalid'])='[]','unsuppressed address allowed');
select pg_temp.expect(jsonb_array_length(public.check_marketing_recipients(array['fresh@example.invalid','allowed@example.invalid','direct@example.invalid']))=2,'mixed batch filters accurately');
-- Inject a local-only failure to prove the entire unsubscribe transaction is atomic.
create function pg_temp.reject_test_suppression() returns trigger language plpgsql as $$ begin
 if new.email='rollback@example.invalid' then raise exception 'Synthetic failure'; end if; return new;
end $$;
create trigger synthetic_failure before insert on public.email_suppressions for each row execute function pg_temp.reject_test_suppression();
do $$ begin
 begin perform public.record_email_unsubscribe('rollback@example.invalid','{}'); raise exception 'Expected failure not raised';
 exception when others then if sqlerrm <> 'Synthetic failure' then raise; end if; end;
end $$;
select pg_temp.expect(not exists(select 1 from public.public_form_submissions where email='rollback@example.invalid'),'suppression failure rolls back submission');
select pg_temp.expect(not exists(select 1 from public.email_suppressions where email='rollback@example.invalid'),'suppression failure leaves no partial record');
rollback;
