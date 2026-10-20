const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const root='tests/rls/invitations/',{cases}=require('./rls/invitations/collect.cjs');
test('collects all 16 required real SQL cases plus the prepared F1 passing-contract regression',()=>{
 for(let i=1;i<=16;i++)assert.equal(cases.filter(c=>c.id===String(i).padStart(2,'0')).length,1);
 assert.equal(cases.length,17);assert.ok(cases.every(c=>c.status==='PREPARED_NOT_EXECUTED'));
});
test('collection has no database/network/process execution dependency or opt-in',()=>{
 const s=fs.readFileSync(root+'collect.cjs','utf8');assert.doesNotMatch(s,/require\(['"](?:pg|postgres|child_process|node:child_process|net|node:net|https|node:https)['"]\)/);assert.match(s,/Collection only; database execution is not supported/);
});
test('real SQL scripts are fail-fast and identity guarded',()=>{
 for(const f of ['acceptance.sql','stale-inviter-reissue.sql'])assert.match(fs.readFileSync(root+f,'utf8'),/\\ir identity.sql/);
 const gate=fs.readFileSync(root+'identity.sql','utf8');assert.match(gate,/ON_ERROR_STOP/);assert.match(gate,/expected_run_id/);assert.match(gate,/inet_server_addr/);assert.match(gate,/c01_test_control.identity/);assert.match(gate,/\\quit 3/);
});
test('both concurrency specs use independent backend sessions, held transactions and exact one-member/receipt/audit assertions',()=>{
 for(const f of ['acceptance-concurrency.spec','acceptance-concurrency-reverse.spec']){
 const s=fs.readFileSync(root+f,'utf8');assert.match(s,/session a/);assert.match(s,/session b/);assert.match(s,/session observer/);
 assert.equal((s.match(/^permutation /gm)||[]).length,1);assert.match(s,/BEGIN ISOLATION LEVEL READ COMMITTED/);assert.match(s,/pg_backend_pid/);assert.match(s,/count\(distinct member_id\)/);assert.match(s,/CONCURRENT_ACCEPTANCE_FAILED/);assert.match(s,/DISPOSABLE_IDENTITY_REQUIRED/);
 }
 assert.notEqual(fs.readFileSync(root+'acceptance-concurrency.spec','utf8'),fs.readFileSync(root+'acceptance-concurrency-reverse.spec','utf8'));
});
test('fault injection exercises actual SQL rollback without disabling security protections',()=>{
 const s=fs.readFileSync(root+'acceptance.sql','utf8');assert.match(s,/before insert on public.audit_events/);assert.match(s,/TEST_ACCEPTANCE_AUDIT_FAILURE/);assert.match(s,/12 receipt rollback/);assert.match(s,/12 marker rollback/);assert.match(s,/rollback;/);assert.doesNotMatch(s,/disable trigger|disable row level security|session_replication_role/i);
});
test('frozen C01 and reviewed F1 migration hashes match',()=>{
 for(const [file,expected] of [['202610140001_business_authorization_hardening.sql','731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C'],['202610200001_business_invitation_acceptance.sql','EEAB243A588D6DE90FD2E5169EA16B7C07C4022D1C004D75592018215C6AD7BB']])
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('supabase/migrations/'+file)).digest('hex').toUpperCase(),expected);
});
