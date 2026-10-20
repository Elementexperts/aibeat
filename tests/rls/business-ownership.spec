# PostgreSQL isolationtester spec. Only disposable aibeat_c01_isolation.
# Apply migrations first. This fixture intentionally persists until database disposal;
# do not disable immutable audit protection just to delete test records.
setup
{
  DO $$ BEGIN IF current_database()<>'aibeat_c01_isolation' THEN RAISE EXCEPTION 'ISOLATED_DATABASE_REQUIRED'; END IF; END $$;
  INSERT INTO auth.users(id,email) VALUES
    ('11000000-0000-0000-0000-000000000001','race1@example.invalid'),('11000000-0000-0000-0000-000000000002','race2@example.invalid');
  INSERT INTO public.organizations(id,name,primary_profile,created_by) VALUES
    ('22000000-0000-0000-0000-000000000001','Ownership race','CONSULTING','11000000-0000-0000-0000-000000000001');
  INSERT INTO public.organization_members(id,organization_id,user_id,role,status) VALUES
    ('33000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','OWNER','ACTIVE'),
    ('33000000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000002','OWNER','ACTIVE');
}
session a
step a_begin { BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims',jsonb_build_object('sub','11000000-0000-0000-0000-000000000001','role','authenticated')::text,true); }
step a_demote { SELECT public.change_business_member('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001','MEMBER'); }
step a_commit { COMMIT; }
session b
step b_begin { BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims',jsonb_build_object('sub','11000000-0000-0000-0000-000000000002','role','authenticated')::text,true); }
step b_demote { SELECT public.change_business_member('22000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000002','MEMBER'); }
step b_rollback { ROLLBACK; }
step b_assert { DO $$ BEGIN IF (SELECT count(*) FROM public.organization_members WHERE organization_id='22000000-0000-0000-0000-000000000001' AND role='OWNER' AND status='ACTIVE')<>1 THEN RAISE EXCEPTION 'OWNER_RACE_FAILED'; END IF; END $$; }
# b_demote must WAIT for a_commit, then fail with LAST_ACTIVE_OWNER.
permutation a_begin a_demote b_begin b_demote a_commit b_rollback b_assert
