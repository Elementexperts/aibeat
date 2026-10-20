"""Small libpq adapter; passwords stay in libpq's protected passfile."""
import ctypes as C
import os
from pathlib import Path

BIN = Path(os.environ['LOCALAPPDATA']) / 'AIBeat/C01/tools/postgresql-17.11/pgsql/bin'
DLL_DIR = os.add_dll_directory(str(BIN))
PQ = C.CDLL(str(BIN / 'libpq.dll'))
for name, restype, args in [
 ('PQconnectdb', C.c_void_p, [C.c_char_p]), ('PQstatus', C.c_int, [C.c_void_p]),
 ('PQfinish', None, [C.c_void_p]), ('PQexec', C.c_void_p, [C.c_void_p,C.c_char_p]),
 ('PQclear',None,[C.c_void_p]), ('PQresultStatus',C.c_int,[C.c_void_p]),
 ('PQntuples',C.c_int,[C.c_void_p]), ('PQnfields',C.c_int,[C.c_void_p]),
 ('PQgetvalue',C.c_char_p,[C.c_void_p,C.c_int,C.c_int]),
 ('PQresultErrorField',C.c_char_p,[C.c_void_p,C.c_int]),
 ('PQbackendPID',C.c_int,[C.c_void_p])]:
 f=getattr(PQ,name); f.restype=restype; f.argtypes=args

class SqlError(Exception):
 def __init__(self, code, primary):
  self.code=code; self.primary=primary
  super().__init__('Database operation failed: SQLSTATE '+code)

class Connection:
 def __init__(self):
  self.ptr=PQ.PQconnectdb(b'dbname=postgres')
  if not self.ptr or PQ.PQstatus(self.ptr)!=0:
   self.close(); raise RuntimeError('STAGING_CONNECTION_FAILED (details suppressed)')
 def query(self, sql):
  result=PQ.PQexec(self.ptr,sql.encode())
  if not result: raise RuntimeError('NO_DATABASE_RESULT')
  try:
   if PQ.PQresultStatus(result) not in (1,2):
    code=(PQ.PQresultErrorField(result,ord('C')) or b'unknown').decode()
    primary=(PQ.PQresultErrorField(result,ord('M')) or b'').decode()
    raise SqlError(code,primary)
   return [[PQ.PQgetvalue(result,r,c).decode() for c in range(PQ.PQnfields(result))] for r in range(PQ.PQntuples(result))]
  finally: PQ.PQclear(result)
 def close(self):
  if getattr(self,'ptr',None): PQ.PQfinish(self.ptr); self.ptr=None
 def protocol_pid(self): return PQ.PQbackendPID(self.ptr)
