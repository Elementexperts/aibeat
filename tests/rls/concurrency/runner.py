"""SQL-PID concurrency runner. No execution without --execute-approved."""
import argparse
import json
import os
import queue
import threading
import time
from pathlib import Path
from scenarios import NAMES, build, q

EXPECTED={'PGHOST':'aws-0-us-west-1.pooler.supabase.com','PGPORT':'5432','PGDATABASE':'postgres','PGUSER':'postgres.oejxwsvlvelxmfbysjbx','PGSSLMODE':'require'}
ANCHOR='7692131729119822239'

def validate_config(env):
 for k,v in EXPECTED.items():
  if env.get(k)!=v: raise RuntimeError('CONFIG_REJECTED:'+k)
 for k in ['PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGPASSWORD','PGOPTIONS']:
  if env.get(k): raise RuntimeError('AMBIGUOUS_ROUTING:'+k)
 p=Path(env.get('PGPASSFILE',''))
 expected=Path(env['LOCALAPPDATA'])/'AIBeat/C01/credentials/staging.pgpass'
 if p.resolve()!=expected.resolve() or not p.is_file(): raise RuntimeError('PASSFILE_REJECTED')
 lines=[s for s in p.read_text(encoding='utf-8-sig').splitlines() if s and not s.startswith('#')]
 prefix='aws-0-us-west-1.pooler.supabase.com:5432:postgres:postgres.oejxwsvlvelxmfbysjbx:'
 if len(lines)!=1 or not lines[0].startswith(prefix) or not lines[0][len(prefix):]: raise RuntimeError('CREDENTIAL_SCOPE_REJECTED')

def identity(c):
 r=c.query('SELECT current_database(),system_identifier::text,pg_backend_pid()::text FROM pg_catalog.pg_control_system()')[0]
 if r[:2]!=['postgres',ANCHOR]: raise RuntimeError('IDENTITY_REJECTED')
 return int(r[2])

def await_block(control,a_pid,b_pid,outcome,deadline=5):
 end=time.monotonic()+deadline
 while time.monotonic()<end:
  if not outcome.empty(): raise RuntimeError('B_FINISHED_BEFORE_EXPECTED_BLOCK')
  r=control.query(f"SELECT {a_pid}=ANY(pg_blocking_pids({b_pid})), wait_event_type FROM pg_stat_activity WHERE pid={b_pid}")
  if r and r[0]==['t','Lock']: return {'a_pid':a_pid,'b_pid':b_pid,'blocker_verified':True}
  time.sleep(.05)
 raise RuntimeError('EXPECTED_BLOCK_NOT_OBSERVED')

def run(plan,output):
 from libpq_client import Connection,SqlError
 validate_config(os.environ)
 output.mkdir(parents=True,exist_ok=False)
 (output/'plan.json').write_text(json.dumps(plan,indent=2))
 conns=[]; worker=None; report={'scenario':plan['name'],'status':'FAIL','setup_committed':False,'ids':plan['ids']}
 try:
  for _ in range(3):
   c=Connection(); conns.append(c)
   c.query('BEGIN READ ONLY'); identity(c); c.query('ROLLBACK')
   # Set options in SQL, not startup PGOPTIONS (pooler does not forward it).
   c.query("SET statement_timeout='15s'; SET lock_timeout='10s'; SET idle_in_transaction_session_timeout='30s'")
  control,a,b=conns
  control.query('BEGIN'); identity(control)
  for sql in plan['setup']: control.query(sql)
  control.query('COMMIT'); report['setup_committed']=True
  pids=[]
  for c,user in [(a,plan['user_a']),(b,plan['user_b'])]:
   c.query('BEGIN ISOLATION LEVEL READ COMMITTED'); pids.append(identity(c))
   c.query("SET LOCAL ROLE authenticated")
   c.query(f"SELECT set_config('request.jwt.claims',jsonb_build_object('sub',{q(user)},'role','authenticated')::text,true)")
  if len(set(pids))!=2: raise RuntimeError('ACTORS_NOT_DISTINCT')
  first=a.query(plan['a']); outcome=queue.Queue()
  def execute_b():
   try: outcome.put(('ok',b.query(plan['b'])))
   except SqlError as e: outcome.put(('error',(e.code,e.primary)))
   except Exception: outcome.put(('error',('CLIENT','B_CLIENT_FAILURE')))
  worker=threading.Thread(target=execute_b,daemon=True); worker.start()
  report['blocking']=await_block(control,*pids,outcome)
  if plan['release']=='ROLLBACK':
   try: a.query('SELECT 1/0')
   except SqlError as e:
    if e.code!='22012': raise
   else: raise RuntimeError('EXPECTED_TRANSACTION_ABORT_MISSING')
  a.query(plan['release']); report['a_outcome']=plan['release']
  worker.join(16)
  if worker.is_alive(): raise RuntimeError('B_DID_NOT_FINISH')
  kind,value=outcome.get_nowait()
  if plan['expected']:
   if kind!='error' or tuple(value)!=tuple(plan['expected']): raise RuntimeError('WRONG_B_OUTCOME')
   b.query('ROLLBACK'); report['b_outcome']={'rollback':True,'sqlstate':value[0],'error':value[1]}
  else:
   if kind!='ok':
    report['b_sqlstate']=value[0]; raise RuntimeError('UNEXPECTED_B_ERROR')
   if plan['same_result'] and first!=value: raise RuntimeError('IDEMPOTENCY_RESULT_MISMATCH')
   if plan['release']=='ROLLBACK':
    ident=q(plan['ids']['approval']); org=q(plan['ids']['org']); rid=q(plan['ids']['run'])
    for sql in [f"SELECT status='PENDING' FROM public.approvals WHERE id={ident}",f"SELECT status='WAITING_FOR_APPROVAL' FROM public.workflow_runs WHERE id={rid}",f"SELECT count(*)=0 FROM public.audit_events WHERE organization_id={org}"]:
     if control.query(sql)!=[['t']]: raise RuntimeError('A_ROLLBACK_NOT_ATOMIC')
   b.query('COMMIT'); report['b_outcome']='COMMIT'
  for index,sql in enumerate(plan['checks']):
   if control.query(sql)!=[['t']]: raise RuntimeError('INVARIANT_FAILED:'+str(index))
  report['status']='PASS'; report['invariants']=len(plan['checks'])
 except Exception as e:
  # Never include connection strings or credential-bearing exception text.
  report['failure']=str(e) if isinstance(e,RuntimeError) else type(e).__name__
  raise
 finally:
  # Only roll back this runner's own transactions. Never delete committed evidence.
  if len(conns)>1:
   try: conns[1].query('ROLLBACK')
   except Exception: pass
  if worker and worker.is_alive(): worker.join(16)
  for c in reversed(conns):
   try: c.query('ROLLBACK')
   except Exception: pass
   c.close()
  report['cleanup']='Own transactions closed; committed synthetic setup/evidence retained. No DELETE/TRUNCATE or trigger changes.'
  (output/'result.json').write_text(json.dumps(report,indent=2))
  print(json.dumps(report))
 return report

if __name__=='__main__':
 parser=argparse.ArgumentParser(); parser.add_argument('--scenario',choices=NAMES,required=True); parser.add_argument('--execute-approved',action='store_true'); parser.add_argument('--output',type=Path)
 args=parser.parse_args()
 if not args.execute_approved or not args.output: parser.error('Execution requires separate human approval, --execute-approved and a fresh --output directory')
 run(build(args.scenario),args.output)
