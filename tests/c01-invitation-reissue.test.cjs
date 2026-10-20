const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/202610200001_business_invitation_acceptance.sql','utf8');
const issue=sql.slice(sql.indexOf('create or replace function public.invite_business_member'),sql.indexOf('create function public.revoke_business_invitation'));
test('actual SQL locks and authorizes OWNER before stale revocation, audit, reuse and issuance',()=>{
 const positions=['perform public.business_lock_owner','for v_stale in','MEMBER_INVITATION_REVOKED','select * into v_result','insert into public.organization_members'].map(s=>issue.indexOf(s));
 assert.ok(positions.every(n=>n>=0));assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
 assert.match(issue,/i.organization_id=p_organization_id and lower\(i.invited_email\)=v_email/);
 assert.match(issue,/issuer.user_id=i.invited_by/);assert.match(issue,/issuer.role='OWNER' and issuer.status='ACTIVE'/);
});
test('actual SQL revokes every unconsumed stale row once, never rewrites invitation identity or activates membership',()=>{
 assert.match(issue,/returning i.id[\s\S]*loop[\s\S]*auth.uid\(\),'MEMBER_INVITATION_REVOKED',v_stale::text/);
 assert.match(issue,/i.invitation_accepted_at is null and i.invitation_revoked_at is null/);
 assert.doesNotMatch(issue,/set (?:invited_by|invited_email|invitation_expires_at|user_id|role|status)\s*=/);
 assert.match(issue,/'INVITED',v_email,auth.uid\(\)/);assert.match(issue,/invitation_expires_at>clock_timestamp\(\)/);
});
// Offline reference model only: NOT execution of SQL, real row locks or PostgreSQL concurrency.
class Model {
 rows=[];audit=[];members=[];owners=new Set(['current']);serial=Promise.resolve();next=1;
 async reissue(caller='current',email='recipient@example.invalid') {
  const previous=this.serial;let unlock;this.serial=new Promise(r=>unlock=r);await previous;
  try {
   if(!this.owners.has(caller))throw Error('OWNER_REQUIRED');
   for(const row of this.rows)if(row.email===email&&!row.accepted&&!row.revoked&&!this.owners.has(row.inviter)){
    row.revoked=true;this.audit.push({entity:row.id,actor:caller,event:'MEMBER_INVITATION_REVOKED'});
   }
   const reuse=this.rows.find(r=>r.email===email&&!r.accepted&&!r.revoked&&!r.expired);
   if(reuse)return reuse;
   const row={id:'new-'+this.next++,email,inviter:caller,role:'MEMBER',revoked:false,accepted:false,expired:false};this.rows.push(row);return row;
  } finally {unlock();}
 }
}
function stale(model,extra={}){const row={id:'stale-'+model.rows.length,email:'recipient@example.invalid',inviter:'former',role:'MEMBER',revoked:false,accepted:false,expired:false,...extra};model.rows.push(row);return row;}
test('MOCK authorized reissue after original inviter demotion preserves original identity and attributes both audits',async()=>{
 const m=new Model(),old=stale(m);const replacement=await m.reissue();assert.notEqual(replacement.id,old.id);assert.equal(old.inviter,'former');assert.equal(old.revoked,true);assert.equal(replacement.inviter,'current');assert.deepEqual(m.audit,[{entity:old.id,actor:'current',event:'MEMBER_INVITATION_REVOKED'}]);
});
test('MOCK unauthorized caller cannot revoke or issue',async()=>{const m=new Model(),r=stale(m);await assert.rejects(m.reissue('intruder'),/OWNER_REQUIRED/);assert.equal(r.revoked,false);assert.equal(m.audit.length,0);assert.equal(m.rows.length,1)});
test('MOCK removed inviter is stale just like a demoted inviter',async()=>{const m=new Model(),r=stale(m,{inviter:'deleted-user'});assert.notEqual((await m.reissue()).id,r.id);assert.equal(r.revoked,true)});
test('MOCK multiple stale invitations each produce exactly one revocation audit',async()=>{const m=new Model();for(let i=0;i<3;i++)stale(m);await m.reissue();await m.reissue();assert.equal(m.audit.length,3);assert.equal(new Set(m.audit.map(a=>a.entity)).size,3)});
test('MOCK expired valid-owner invitation is not reused or extended',async()=>{const m=new Model(),r=stale(m,{inviter:'current',expired:true});assert.notEqual((await m.reissue()).id,r.id);assert.equal(r.expired,true);assert.equal(m.audit.length,0)});
test('MOCK explicit revocation is never undone or re-audited',async()=>{const m=new Model(),r=stale(m,{revoked:true});assert.notEqual((await m.reissue()).id,r.id);assert.equal(r.revoked,true);assert.equal(m.audit.length,0)});
test('MOCK reuse valid invitation after revoking stale rows, with no membership activation',async()=>{const m=new Model();stale(m);const valid=stale(m,{id:'valid',inviter:'current'});assert.equal((await m.reissue()).id,valid.id);assert.equal(m.members.length,0);assert.equal(m.rows.length,2)});
test('MOCK concurrent reissues serialize to one new invitation and one revocation audit',async()=>{const m=new Model();stale(m);const results=await Promise.all(Array.from({length:10},()=>m.reissue()));assert.equal(new Set(results.map(r=>r.id)).size,1);assert.equal(m.audit.length,1);assert.equal(m.members.length,0)});
test('MOCK consumed/foreign-recipient invitations are outside matching stale scope',async()=>{const m=new Model(),a=stale(m,{accepted:true}),b=stale(m,{email:'other@example.invalid'});await m.reissue();assert.equal(a.revoked,false);assert.equal(b.revoked,false)});
test('F1 SQL regression now requires fresh identity, stable retry, correct revocation audit and no pre-accept activation',()=>{const s=fs.readFileSync('tests/rls/invitations/stale-inviter-reissue.sql','utf8');assert.match(s,/retry_ok/);assert.match(s,/audit_ok/);assert.match(s,/count\(\*\)=0 from public.organization_members/);assert.doesNotMatch(s,/Expected-red|expected to stop at F1/)});
