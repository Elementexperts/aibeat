-- Read-only deployment audit. Run on the explicitly verified PUBLIC SUBMISSIONS project.
begin read only;
select current_database(), current_user;
select c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) as owner
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='email_suppressions';
select count(*) as suppressed_count from public.email_suppressions;
select policyname, roles, cmd from pg_policies where schemaname='public' and tablename='email_suppressions';
select r, has_table_privilege(r,'public.email_suppressions','SELECT') as can_read,
 has_table_privilege(r,'public.email_suppressions','INSERT') as can_insert,
 has_table_privilege(r,'public.email_suppressions','UPDATE') as can_update,
 has_table_privilege(r,'public.email_suppressions','DELETE') as can_delete
from unnest(array['anon','authenticated','service_role']) r;
select p.proname, p.prosecdef, p.proconfig,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('record_email_unsubscribe','check_marketing_recipients','list_marketing_suppressions','capture_email_unsubscribe');
rollback;
