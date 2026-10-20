import json,sys,os
from pathlib import Path
from runner import validate_config,identity
from libpq_client import Connection
validate_config(os.environ)
p=Path(sys.argv[1]); r=json.loads((p/'result.json').read_text()); ids=r['ids']; c=Connection()
try:
 c.query('BEGIN READ ONLY'); identity(c)
 data={'scenario':r['scenario'],'organizations':[]}
 for row in c.query(f"SELECT id::text FROM public.organizations WHERE created_by='{ids['a']}'"):
  org=row[0]; d={'id':org}
  for table,fields in [('organization_members','id::text,user_id::text,role::text,status::text'),('audit_events','id::text,actor_user_id::text,event_type,entity_id::text'),('approvals','id::text,status::text,resolved_by::text'),('workflow_runs','id::text,status::text'),('workflows','id::text'),('workflow_steps','id::text,status::text'),('business_context_items','id::text')]:
   d[table]=c.query(f"SELECT {fields} FROM public.{table} WHERE organization_id='{org}'")
  d['active_owners']=c.query(f"SELECT count(*) FROM public.organization_members WHERE organization_id='{org}' AND role='OWNER' AND status='ACTIVE'")[0][0]
  data['organizations'].append(d)
 data['synthetic_users']=c.query(f"SELECT id::text FROM auth.users WHERE id IN ('{ids['a']}','{ids['b']}','{ids['target']}')")
 b=r.get('blocking',{})
 data['actor_transactions']=c.query(f"SELECT count(*) FROM pg_stat_activity WHERE pid IN ({int(b.get('a_pid',0))},{int(b.get('b_pid',0))}) AND xact_start IS NOT NULL")[0][0]
 data['global_totals']={t:c.query(f'SELECT count(*) FROM {t}')[0][0] for t in ['auth.users','public.organizations','public.organization_members','public.audit_events']}
 c.query('COMMIT'); (p/'postflight.json').write_text(json.dumps(data,indent=2)); print(json.dumps(data))
finally: c.close()
