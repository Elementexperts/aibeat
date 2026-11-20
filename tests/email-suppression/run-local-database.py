import os,pathlib,subprocess,tempfile,json,socket,uuid,sys
root=pathlib.Path.cwd();bin=pathlib.Path(os.environ['LOCALAPPDATA'])/'AIBeat/C01/tools/postgresql-17.11/pgsql/bin'
assert (bin/'initdb.exe').exists(), 'Local PostgreSQL binaries unavailable'
# Inherit the normal temp-directory ACL; mkdtemp's owner-only ACL blocks PostgreSQL's restricted token on Windows.
base=pathlib.Path(tempfile.gettempdir())/('aibeat-email-suppression-'+str(uuid.uuid4()));base.mkdir();data=base/'data'
env={k:v for k,v in os.environ.items() if not k.upper().startswith('PG')};env['PGPASSFILE']=str(base/'no-credentials');env['PGCONNECT_TIMEOUT']='5'
def run(name,*args):
 log=base/(name+'-output.log')
 offset=log.stat().st_size if log.exists() else 0
 with log.open('a',encoding='utf8') as handle:
  r=subprocess.run([str(bin/(name+'.exe')),*map(str,args)],env=env,stdout=handle,stderr=handle,text=True,creationflags=subprocess.CREATE_NO_WINDOW,timeout=60)
 with log.open('rb') as handle:
  handle.seek(offset);output=handle.read().decode('utf8',errors='replace')
 if r.returncode:raise RuntimeError(name+' failed: '+output[-1500:])
 return output
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
started=False
try:
 run('initdb','-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8')
 run('pg_ctl','-D',data,'-l',base/'server.log','-o',f'-h 127.0.0.1 -p {port}','-w','start');started=True
 common=['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',str(port),'-U','postgres']
 run('psql',*common,'-d','postgres','-c','create database aibeat_suppression_test;')
 common+=['-d','aibeat_suppression_test']
 run('psql',*common,'-c','create role anon; create role authenticated; create role service_role bypassrls;')
 run('psql',*common,'-f',root/'supabase/migrations/202609040001_public_form_submissions.sql')
 run('psql',*common,'-c',"create table public.email_suppressions(email text primary key,reason text,source text,suppressed_at timestamptz,created_at timestamptz); alter table public.email_suppressions enable row level security; insert into public.email_suppressions select case when n=0 then ' OLD0@EXAMPLE.INVALID ' else 'old'||n||'@example.invalid' end,'Existing reason','manual','2020-01-01','2020-01-01' from generate_series(0,23) n; insert into public.public_form_submissions(kind,email,status) values('unsubscribe','legacy@example.invalid','COMPLETED');")
 run('psql',*common,'-f',root/'supabase/migrations/202611200001_email_suppression.sql')
 output=run('psql',*common,'-f',root/'tests/email-suppression/database.sql')
 if '--automation' in sys.argv:
  run('psql',*common,'-f',root/'supabase/migrations/202611200002_unsubscribe_automation.sql')
  output+=run('psql',*common,'-f',root/'tests/email-suppression/automation-database.sql')
 print(json.dumps({'database':'aibeat_suppression_test','host':'127.0.0.1','version':run('psql','--version').strip(),'assertions':output.count('PASS:'),'log_directory':str(base)}))
finally:
 if started or (data/'postmaster.pid').exists():run('pg_ctl','-D',data,'-m','fast','-w','stop')
