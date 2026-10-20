import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { acceptInvitation, invitationNext, invitationPath } from '../lib/business/invitations'
import { isAuthenticatedBusinessPath, sanitizeBusinessNext } from '../lib/business/routes'

const invitation='10000000-0000-4000-8000-000000000001', org='20000000-0000-4000-8000-000000000001'
const user='30000000-0000-4000-8000-000000000001'
function fake(options: { confirmed?: boolean; signedIn?: boolean; failure?: string; response?: unknown } = {}) {
  const calls: unknown[]=[]
  const client={auth:{getUser:async()=>({data:{user:options.signedIn===false?null:{id:user,email:'recipient@example.invalid',email_confirmed_at:options.confirmed===false?null:'2026-01-01'}},error:null})},
    rpc:async(name:string,args:unknown)=>{calls.push({name,args});return {data:options.response??{id:invitation,organization_id:org,user_id:user,status:'ACTIVE'},error:options.failure?{message:options.failure}:null}}} as unknown as SupabaseClient
  return {client,calls}
}
test('correct authenticated recipient invokes only narrow invitation RPC',async()=>{
  const {client,calls}=fake();assert.deepEqual(await acceptInvitation(client,invitation),{ok:true,organizationId:org})
  assert.deepEqual(calls,[{name:'accept_business_invitation',args:{p_invitation_id:invitation}}])
})
test('anonymous, unverified and malformed requests never invoke activation',async()=>{
  for(const options of [{signedIn:false},{confirmed:false}]){const f=fake(options);assert.equal((await acceptInvitation(f.client,invitation)).ok,false);assert.equal(f.calls.length,0)}
  const f=fake();assert.equal((await acceptInvitation(f.client,'bad')).ok,false);assert.equal(f.calls.length,0)
})
for(const failure of ['INVITATION_UNAVAILABLE','VERIFIED_EMAIL_REQUIRED','INVITATION_EXPIRED','INVITATION_REVOKED','MEMBERSHIP_EXISTS','MEMBERSHIP_CHANGED']) {
  test('mocked database rejection is safe and not treated as success: '+failure,async()=>{
    const f=fake({failure});const r=await acceptInvitation(f.client,invitation);assert.equal(r.ok,false)
    if(!r.ok)assert.ok(r.error.length>10)
  })
}
test('provider error payloads and untrusted returned identity are not disclosed or accepted',async()=>{
  const r=await acceptInvitation(fake({failure:'SECRET SQL payload'}).client,invitation)
  assert.equal(r.ok,false);assert.ok(!JSON.stringify(r).includes('SECRET'))
  for(const response of [{organization_id:org,user_id:'other',status:'ACTIVE'},{organization_id:org,user_id:user,status:'SUSPENDED'},{organization_id:'invalid',user_id:user,status:'ACTIVE'}])
    assert.equal((await acceptInvitation(fake({response}).client,invitation)).ok,false)
})
test('invitation intent is exact, authenticated but membership-independent, and redirect safe',()=>{
  const path=invitationPath(invitation)!;assert.equal(invitationNext(path),path)
  assert.equal(sanitizeBusinessNext(path),path);assert.equal(isAuthenticatedBusinessPath('/business/invitations/accept'),true)
  for(const bad of ['//evil.test'+path,'https://evil.test'+path,path+'&role=OWNER',path+'&invitation='+invitation,path+'#evil','/business/dashboard','/business/invitations/accept?invitation=bad','/business/invitations/accept?invitation='+invitation+'\\evil']) assert.equal(invitationNext(bad),null)
})
test('password, callback, existing-session and signup paths preserve invitation intent before onboarding',()=>{
  for(const file of ['app/business/sign-in/actions.ts','app/business/auth/callback/route.ts','app/business/sign-up/actions.ts','middleware.ts']) {
    const source=fs.readFileSync(file,'utf8');assert.match(source,/invitationNext\(/)
  }
  const page=fs.readFileSync('app/business/invitations/accept/page.tsx','utf8')
  assert.match(page,/auth.getUser\(\)/);assert.match(page,/form action=\{acceptBusinessInvitation\}/)
  assert.doesNotMatch(page,/\.rpc\(/) // GET never activates
  const action=fs.readFileSync('app/business/invitations/accept/actions.ts','utf8')
  assert.ok(action.startsWith("'use server'"));assert.match(action,/httpOnly: true, sameSite: 'lax'/)
  assert.match(action,/redirect\('\/business\/dashboard'\)/)
})

// Static contract checks are NOT a PostgreSQL parser or database execution proof.
const sql=fs.readFileSync('supabase/migrations/202610200001_business_invitation_acceptance.sql','utf8')
const accept=sql.slice(sql.indexOf('create function public.accept_business_invitation'))
test('migration statically preserves RLS, narrow grants, frozen identity and immutable receipts',()=>{
  assert.match(sql,/enable row level security/);assert.match(sql,/revoke all on public.business_invitation_acceptances from public, anon, authenticated/)
  assert.match(sql,/grant execute on function public.accept_business_invitation\(uuid\) to authenticated/)
  assert.doesNotMatch(sql,/disable (?:trigger|row level security)|grant\s+(?:all|insert|update|delete).*organization_members/i)
  assert.doesNotMatch(sql,/update public.organization_members set (?:user_id|organization_id|id)\s*=/)
  assert.match(sql,/before update or delete[\s\S]*business_audit_immutable/)
  assert.match(sql,/INVITATION_IDENTITY_IMMUTABLE/)
  assert.ok(sql.trim().endsWith('commit;'));assert.equal((sql.match(/\$\$/g)??[]).length,8)
})
test('SQL recipient, expiry, revocation, owner-role provenance and cross-tenant checks are explicit',()=>{
  assert.match(accept,/from auth.users where id=v_user for share/)
  assert.match(accept,/v_confirmed is null/);assert.doesNotMatch(accept,/raw_user_meta_data|auth.jwt/)
  assert.match(accept,/lower\(trim\(v_inv.invited_email\)\) is distinct from v_email/)
  assert.match(accept,/invitation_revoked_at is not null/);assert.match(accept,/invitation_expires_at<=clock_timestamp\(\)/)
  assert.match(accept,/user_id=v_inv.invited_by and role='OWNER' and status='ACTIVE'/)
  assert.match(accept,/values\(v_org,v_user,v_inv.role,'\{\}','ACTIVE'\)/)
  assert.match(accept,/where id=p_invitation_id and organization_id=v_org for update/)
  assert.match(sql,/interval '7 days'/);assert.match(sql,/create function public.revoke_business_invitation/)
})
test('SQL serialized acceptance, uniqueness, atomic audit and retry do not reactivate members',()=>{
  assert.match(accept,/ACCEPTANCE_REQUIRES_READ_COMMITTED/)
  assert.ok(accept.indexOf('update public.organizations')<accept.indexOf('select * into v_receipt'))
  assert.ok(accept.indexOf('return v_member;')<accept.indexOf('insert into public.organization_members'))
  assert.match(accept,/v_receipt.recipient_user_id<>v_user or v_receipt.recipient_email<>v_email/)
  assert.match(accept,/id=v_receipt.member_id and organization_id=v_org and user_id=v_user and status='ACTIVE'/)
  assert.match(accept,/where organization_id=v_org and user_id=v_user/)
  assert.match(accept,/'MEMBER_INVITATION_ACCEPTED',v_member.id::text/)
  assert.match(sql,/invitation_id uuid primary key/)
})

// Explicit offline reference model: illustrates transaction semantics, NOT actual
// PostgreSQL locking, RLS, trigger or race validation. Production uses the SQL above.
class AcceptanceModel {
  lock=Promise.resolve(); members=new Map<string,{id:string;role:string;status:string}>(); receipts=new Map<string,string>(); audits:unknown[]=[]
  revoked=false;expires=10;ownerActive=true
  async accept(who=user,email='recipient@example.invalid',confirmed=true,now=1,role='MEMBER') {
    const previous=this.lock;let release!:()=>void;this.lock=new Promise<void>(r=>{release=r});await previous
    try {
      if(!confirmed||email!=='recipient@example.invalid'||who!==user)throw Error('recipient')
      if(this.receipts.has(invitation)){const m=this.members.get(who);if(!m||m.status!=='ACTIVE')throw Error('changed');return m}
      if(this.revoked||!this.ownerActive)throw Error('revoked');if(now>=this.expires)throw Error('expired')
      if(this.members.has(who))throw Error('exists')
      const m={id:'new-membership',role,status:'ACTIVE'};this.members.set(who,m);this.receipts.set(invitation,m.id)
      this.audits.push({actor:who,organization:org,invitation,member:m.id,role});return m
    }finally{release()}
  }
}
test('MOCK reference transaction: duplicate concurrent accepts produce one membership and one attributed audit',async()=>{
  const model=new AcceptanceModel();const rows=await Promise.all(Array.from({length:8},()=>model.accept()))
  assert.equal(new Set(rows.map(r=>r.id)).size,1);assert.equal(model.members.size,1)
  assert.deepEqual(model.audits,[{actor:user,organization:org,invitation,member:'new-membership',role:'MEMBER'}])
  assert.deepEqual(await model.accept(),rows[0]);assert.equal(model.audits.length,1)
  model.members.get(user)!.status='SUSPENDED';await assert.rejects(model.accept(),/changed/)
})
test('MOCK reference transaction: wrong recipient, unverified, expired, revoked and existing suspended reject without writes',async()=>{
  for(const attempt of [()=>new AcceptanceModel().accept('foreign'),()=>new AcceptanceModel().accept(user,'wrong@example.invalid'),()=>new AcceptanceModel().accept(user,undefined,false),()=>new AcceptanceModel().accept(user,undefined,true,10)])await assert.rejects(attempt())
  const revoked=new AcceptanceModel();revoked.revoked=true;await assert.rejects(revoked.accept(),/revoked/);assert.equal(revoked.audits.length,0)
  const suspended=new AcceptanceModel();suspended.members.set(user,{id:'prior',role:'MEMBER',status:'SUSPENDED'});await assert.rejects(suspended.accept(),/exists/)
})

test('role, tenant and user claims cannot be supplied through the activation API', async()=>{
  const f=fake();assert.equal((await acceptInvitation(f.client,{invitation,role:'OWNER',organization_id:org,user_id:'foreign'})).ok,false)
  assert.equal(f.calls.length,0)
  const source=fs.readFileSync('lib/business/invitations.ts','utf8')
  assert.match(source,/p_invitation_id: id/);assert.doesNotMatch(source,/p_role:|p_user_id:|p_organization_id:/)
})
test('revocation, reissue and durable retries remain explicit even after invitation removal',()=>{
  assert.match(sql,/invitation_accepted_at is not null then[\s\S]*INVITATION_ALREADY_ACCEPTED/)
  assert.match(sql,/invitation_revoked_at is null and invitation_accepted_at is null/)
  assert.match(accept,/from public.business_invitation_acceptances where invitation_id=p_invitation_id/)
  assert.match(accept,/if v_org is null then/)
  assert.doesNotMatch(accept,/delete from public.business_invitation_acceptances|update public.business_invitation_acceptances/)
})
