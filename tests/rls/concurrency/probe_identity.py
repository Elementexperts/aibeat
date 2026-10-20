import json
from libpq_client import Connection
c=Connection()
try:
 c.query('BEGIN READ ONLY')
 row=c.query("SELECT current_database(),system_identifier::text,pg_backend_pid()::text FROM pg_catalog.pg_control_system()")[0]
 if row[:2]!=['postgres','7692131729119822239']: raise RuntimeError('IDENTITY_REJECTED')
 print(json.dumps({'database':row[0],'system_identifier':row[1],'sql_backend_pid':int(row[2]),'protocol_backend_pid':c.protocol_pid(),'pid_match':int(row[2])==c.protocol_pid()}))
 c.query('ROLLBACK')
finally: c.close()
