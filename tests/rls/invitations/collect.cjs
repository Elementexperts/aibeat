// Collection ONLY. No database client, process runner, network import or execution mode.
const cases=[
 ['01','Valid invitation acceptance','acceptance.sql'],['02','Wrong recipient rejection','acceptance.sql'],
 ['03','Unconfirmed email rejection','acceptance.sql'],['04','Expired invitation rejection','acceptance.sql'],
 ['05','Revoked invitation rejection','acceptance.sql'],['06','Duplicate acceptance','acceptance.sql'],
 ['07','Concurrent acceptance: both blocking orders','acceptance-concurrency.spec / acceptance-concurrency-reverse.spec'],
 ['08','Retry after suspension','acceptance.sql'],['09','Retry after membership removal','acceptance.sql'],
 ['10','Membership/invitation identity immutability','acceptance.sql'],['11','Cross-tenant isolation','acceptance.sql'],
 ['12','Atomic rollback on final audit failure','acceptance.sql'],['13','Audit actor attribution','acceptance.sql'],
 ['14','Receipt immutability','acceptance.sql'],['15','Last-owner protection','acceptance.sql'],
 ['16','Existing post-migration C01 RLS regression','../business-isolation.sql'],
 ['F1','Stale-inviter reissue corrected contract (database validation pending)','stale-inviter-reissue.sql'],
].map(([id,name,file])=>({id,name,file,status:'PREPARED_NOT_EXECUTED'}));
if(require.main===module) {
  if(process.argv.slice(2).some(a=>a!=='--list')){process.stderr.write('Collection only; database execution is not supported.\n');process.exitCode=2;}
  else process.stdout.write(JSON.stringify({databaseExecutionAuthorized:false,cases},null,2)+'\n');
}
module.exports={cases};
