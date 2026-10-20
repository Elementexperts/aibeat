import json,os,queue,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(os.environ['LOCALAPPDATA'])/'AIBeat/C01/tools/sql-parser'))
from pglast import parse_sql
from scenarios import NAMES,build
from runner import EXPECTED,identity,await_block,validate_config

class GuardAndPlans(unittest.TestCase):
 def test_all_plans_parse(self):
  count=0
  for name in NAMES:
   p=build(name)
   for sql in p['setup']+[p['a'],p['b']]+p['checks']:
    parse_sql(sql); count+=1
   self.assertNotEqual(p['ids']['a'],p['ids']['b'])
   self.assertGreater(len(p['checks']),0)
  print('Offline PostgreSQL parser statements:',count)
 def test_synthetic_repeatable(self):
  for name in NAMES:
   a,b=build(name),build(name)
   self.assertFalse(set(a['ids'].values()) & set(b['ids'].values()))
   self.assertTrue(all('example.invalid' in x for x in a['setup'][:3]))
 def test_expected_errors(self):
  for name in ['removal','demotion','suspension']: self.assertEqual(build(name)['expected'],('23514','LAST_ACTIVE_OWNER'))
  self.assertEqual(build('approval_conflict')['expected'],('23514','APPROVAL_ALREADY_RESOLVED'))
 def test_transaction_order_contract(self):
  self.assertEqual(build('approval_rollback')['release'],'ROLLBACK')
  for name in NAMES:
   if name!='approval_rollback': self.assertEqual(build(name)['release'],'COMMIT')
 def test_provision_same_actor(self):
  for name in ['provisioning','onboarding']:
   p=build(name); self.assertEqual(p['user_a'],p['user_b']); self.assertTrue(p['same_result'])
 def test_no_destructive_cleanup(self):
  src=Path(__file__).with_name('runner.py').read_text()
  self.assertNotIn('DISABLE TRIGGER',src); self.assertNotIn("query('DELETE",src); self.assertNotIn("query('TRUNCATE",src)
 def test_real_pid_identity(self):
  class C:
   def query(self,s): return [['postgres','7692131729119822239','42']]
  self.assertEqual(identity(C()),42)
 def test_wrong_identity(self):
  class C:
   def query(self,s): return [['postgres','other','42']]
  self.assertRaises(RuntimeError,identity,C())
 def test_block_verified(self):
  class C:
   def query(self,s):
    if 'pg_blocking_pids(22)' not in s or '11=ANY' not in s: raise AssertionError('Wrong actor PID query')
    return [['t','Lock']]
  self.assertTrue(await_block(C(),11,22,queue.Queue())['blocker_verified'])
 def test_early_completion_rejected(self):
  q=queue.Queue();q.put('done');self.assertRaises(RuntimeError,await_block,None,11,22,q)
 def test_missing_block_rejected(self):
  class C:
   def query(self,s): return [['f','Client']]
  self.assertRaises(RuntimeError,await_block,C(),11,22,queue.Queue(),.001)
 def test_configuration(self):
  with tempfile.TemporaryDirectory() as tmp:
   env={**EXPECTED,'LOCALAPPDATA':tmp};p=Path(tmp)/'AIBeat/C01/credentials/staging.pgpass';p.parent.mkdir(parents=True);p.write_text('aws-0-us-west-1.pooler.supabase.com:5432:postgres:postgres.oejxwsvlvelxmfbysjbx:dummy\n');env['PGPASSFILE']=str(p)
   validate_config(env)
   for key in EXPECTED:
    bad=dict(env);bad[key]='wrong';self.assertRaises(RuntimeError,validate_config,bad)
   bad=dict(env);bad['PGPASSWORD']='dummy';self.assertRaises(RuntimeError,validate_config,bad)
   p.unlink();self.assertRaises(RuntimeError,validate_config,env)

class CoordinatorMocks(unittest.TestCase):
 def test_all_eight_coordinator_paths(self):
  import contextlib,io,threading,types
  from unittest.mock import patch
  import runner
  for name in NAMES:
   with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
    plan=build(name); release=threading.Event(); started=threading.Event(); events=[]; instances=[]
    class E(Exception):
     def __init__(self,code,primary): self.code=code;self.primary=primary
    class Fake:
     def __init__(self): self.index=len(instances);instances.append(self)
     def close(self): events.append((self.index,'close'))
     def query(self,sql):
      events.append((self.index,sql))
      if 'pg_control_system' in sql: return [['postgres',runner.ANCHOR,str(101+self.index)]]
      if 'pg_blocking_pids' in sql:
       started.wait(1); return [['t','Lock']]
      if self.index==1 and sql==plan['a']: return [['same-result']]
      if self.index==2 and sql==plan['b']:
       started.set()
       if not release.wait(2): raise RuntimeError('Mock A never released')
       if plan['expected']: raise E(*plan['expected'])
       return [['same-result']]
      if self.index==1 and sql=='SELECT 1/0': raise E('22012','division by zero')
      if self.index==1 and sql==plan['release'] and started.is_set(): release.set()
      if sql.startswith('SELECT'): return [['t']]
      return []
    with patch.dict(sys.modules,{'libpq_client':types.SimpleNamespace(Connection=Fake,SqlError=E)}), patch.object(runner,'validate_config'), contextlib.redirect_stdout(io.StringIO()):
     result=runner.run(plan,Path(tmp)/'run')
    self.assertEqual(result['status'],'PASS')
    observed=next(i for i,e in enumerate(events) if 'pg_blocking_pids' in e[1])
    released=next(i for i,e in enumerate(events) if i>observed and e==(1,plan['release']))
    self.assertGreater(released,observed)
    self.assertEqual(len(instances),3)

if __name__=='__main__': unittest.main(verbosity=2)
