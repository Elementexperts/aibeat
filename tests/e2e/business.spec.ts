import { test, expect } from './browser'
import { login, client, manifest, assertMemberBaseline } from './fixtures'

async function onboard(page: import('@playwright/test').Page) {
  await page.goto('/business/onboarding')
  await page.locator('[name="companyName"]').fill(manifest().runId)
  await page.locator('[name="industry"]').selectOption({label:'Digital marketing agency'})
  await page.locator('[name="companySize"]').selectOption({label:'1-9'})
  await page.locator('[name="objective"]').selectOption({label:'Automate lead research'})
  await page.locator('[name="firstWorkflow"]').selectOption({label:'Lead Research & Qualification'})
  await page.getByRole('button',{name:'Finish onboarding'}).click()
  await expect(page).not.toHaveURL(/onboarding/)
}
test('01 organization onboarding',async({page})=>{
  await login(page,'newOwner'); await onboard(page)
  const c=await client('newOwner'); const r=await c.from('organization_members').select('role,status').eq('user_id',manifest().actors.newOwner.id)
  expect(r.error).toBeNull();expect(r.data).toEqual([expect.objectContaining({role:'OWNER',status:'ACTIVE'})])
})
test('02 incomplete onboarding recovery',async({page})=>{
  await login(page,'recoverOwner');await expect(page).toHaveURL(/onboarding/);await onboard(page)
  const c=await client('recoverOwner');const r=await c.from('organization_members').select('id').eq('user_id',manifest().actors.recoverOwner.id)
  expect(r.error).toBeNull();expect(r.data).toHaveLength(1)
})
test('03 existing user authentication',async({page})=>{
  await login(page);await page.goto('/business/dashboard');await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible()
})
test('04 session refresh and logout',async({page})=>{
  await login(page)
  const c=await client();const before=(await c.auth.getSession()).data.session
  expect(before).not.toBeNull();const refreshed=await c.auth.refreshSession();expect(refreshed.error).toBeNull();expect(refreshed.data.session?.user.id).toBe(manifest().actors.owner.id)
  await page.reload();await page.getByRole('button',{name:'Sign out'}).click();await page.goto('/business/dashboard');await expect(page).toHaveURL(/sign-in/)
  // Browser expired-cookie refresh is separately blocked until a bounded expiry fixture exists.
})
test('05 tenant selection and stale-cookie recovery',async({page,context})=>{
  await login(page);await page.getByLabel('Workspace',{exact:true}).selectOption(manifest().secondOrganizationId)
  await expect(page.getByLabel('Workspace',{exact:true})).toHaveValue(manifest().secondOrganizationId)
  await context.addCookies([{name:'aibeat_business_organization_id',value:'00000000-0000-0000-0000-000000000001',url:manifest().baseURL}])
  await page.reload();await expect(page.getByLabel('Workspace',{exact:true})).toHaveValue([manifest().organizationId,manifest().secondOrganizationId].sort()[0])
})
test('06 role permissions',async({page})=>{
  await assertMemberBaseline()
  for(const role of ['owner','admin','manager','member']) {
    await login(page,role);await page.goto('/business/settings')
    if(role==='owner') await expect(page.getByRole('button',{name:'Invite',exact:true})).toBeEnabled()
    else await expect(page.getByRole('button',{name:'Invite',exact:true})).toBeDisabled()
    if(role!=='owner') {const c=await client(role);const r=await c.rpc('change_business_member',{p_organization_id:manifest().organizationId,p_member_id:manifest().actors.owner.memberId,p_role:'MEMBER'});expect(r.error).not.toBeNull()}
    if(['manager','member'].includes(role)) {
      const c=await client(role),m=manifest()
      const before=await c.from('workflow_runs').select('id').eq('workflow_id',m.workflowId).order('id');expect(before.error).toBeNull()
      await page.goto('/c01-action-probe');await page.locator('#c01-workflow-id').fill(m.workflowId)
      await page.getByRole('button',{name:'Probe server action',exact:true}).click()
      await expect(page.locator('#c01-action-result')).toHaveText('ROLE_DENIED')
      const after=await c.from('workflow_runs').select('id').eq('workflow_id',m.workflowId).order('id');expect(after.error).toBeNull();expect(after.data).toEqual(before.data)
    }
    await page.goto('/business/workflows/'+manifest().workflowId)
    for(const [label,value] of Object.entries(manifest().workflowInputs)) await page.getByLabel(label,{exact:true}).fill(value)
    const execute=page.getByRole('button',{name:'Run Workflow',exact:true})
    if(['owner','admin'].includes(role)) await expect(execute).toBeEnabled();else await expect(execute).toBeDisabled()
    await page.getByRole('button',{name:'Sign out'}).click()
  }
  for(const role of ['suspended','nonmember']) {
    await login(page,role);await page.goto('/business/dashboard');await expect(page).toHaveURL(/onboarding/)
    const c=await client(role);const r=await c.from('organizations').select('id').eq('id',manifest().organizationId);expect(r.error).toBeNull();expect(r.data).toEqual([])
    await page.context().clearCookies()
  }
})
test('07 membership invitation creation',async({page})=>{
  await login(page);await page.goto('/business/settings');await page.locator('[name="email"]').fill(manifest().invitationEmail);await page.getByRole('button',{name:'Invite',exact:true}).click()
  const c=await client();await expect.poll(async()=>{const r=await c.from('organization_members').select('status').eq('organization_id',manifest().organizationId).eq('invited_email',manifest().invitationEmail);if(r.error)throw Error('Invitation read failed');return r.data}).toEqual([expect.objectContaining({status:'INVITED'})])
})
test('08 membership role changes',async({page})=>{
  await assertMemberBaseline()
  await login(page);await page.goto('/business/settings')
  const m=manifest(),c=await client('owner')
  const row=page.locator('div').filter({has:page.locator('p',{hasText:m.actors.member.id})}).filter({has:page.locator('select')}).last()
  try {
    await row.locator('select').selectOption('MANAGER')
    await expect.poll(async()=>{const r=await c.from('organization_members').select('role').eq('id',m.actors.member.memberId).single();if(r.error)throw Error('Membership read failed');return r.data.role}).toBe('MANAGER')
  } finally {
    // Restore through the ordinary owner-authorized RPC; never reset privileges directly.
    const restored=await c.rpc('change_business_member',{p_organization_id:m.organizationId,p_member_id:m.actors.member.memberId,p_role:'MEMBER'})
    expect(restored.error).toBeNull();await assertMemberBaseline()
  }
})

test('09 last-active-owner protection',async()=>{
  const c=await client('secondOwner');const m=manifest();const r=await c.rpc('change_business_member',{p_organization_id:m.secondOrganizationId,p_member_id:m.actors.secondOwner.memberId,p_role:'MEMBER'})
  expect(r.error?.message).toContain('LAST_ACTIVE_OWNER')
  const after=await c.from('organization_members').select('role,status').eq('id',m.actors.secondOwner.memberId).single();expect(after.error).toBeNull();expect(after.data).toEqual({role:'OWNER',status:'ACTIVE'})
})
test('10 approval decisions',async({page})=>{
  const m=manifest(),owner=await client('owner'),member=await client('member')
  await assertMemberBaseline()
  const denied=await member.rpc('decide_business_approval',{p_organization_id:m.organizationId,p_approval_id:m.approvalId,p_decision:'APPROVED',p_edited_content:null})
  expect(denied.error?.code).toBe('42501')
  const pending=await owner.from('approvals').select('status,resolved_by').eq('id',m.approvalId).single();expect(pending.error).toBeNull();expect(pending.data).toEqual({status:'PENDING',resolved_by:null})
  // UI authorization controls; only owner makes the successful decision in this fixture.
  for(const role of ['admin','manager']) {
    await page.context().clearCookies();await login(page,role);await page.goto('/business/approvals')
    await page.getByRole('button',{name:'Review approval',exact:true}).first().click()
    await expect(page.getByRole('button',{name:'Approve',exact:true})).toBeEnabled()
  }
  await page.context().clearCookies();await login(page);await page.goto('/business/approvals')
  await page.getByRole('button',{name:'Review approval',exact:true}).first().click();await page.getByRole('button',{name:'Approve',exact:true}).click()
  await expect.poll(async()=>{const r=await owner.from('approvals').select('status,resolved_by').eq('id',m.approvalId).single();if(r.error)throw Error('Approval read failed');return r.data}).toEqual({status:'APPROVED',resolved_by:m.actors.owner.id})
  const audits=await owner.from('audit_events').select('id').eq('organization_id',m.organizationId).eq('actor_user_id',m.actors.owner.id).eq('event_type','APPROVAL_APPROVED').eq('entity_id',m.approvalId).eq('workflow_run_id',m.workflowRunId)
  expect(audits.error).toBeNull();expect(audits.data).toHaveLength(1)
})

test('11 workflow pause/resume',async({page})=>{
  await login(page); const m=manifest();const c=await client()
  await page.goto('/business/workflows/'+m.workflowId)
  for(const [label,value] of Object.entries(m.workflowInputs)) await page.getByLabel(label,{exact:true}).fill(value)
  await page.getByRole('button',{name:'Run Workflow',exact:true}).click()
  await expect(page.getByText('WAITING_FOR_APPROVAL',{exact:true}).first()).toBeVisible()
  const runs=await c.from('workflow_runs').select('id,status').eq('workflow_id',m.workflowId).eq('organization_id',m.organizationId)
  expect(runs.error).toBeNull();expect(runs.data).toHaveLength(1);expect(runs.data?.[0].status).toBe('WAITING_FOR_APPROVAL')
  await page.goto('/business/approvals');await page.getByRole('button',{name:'Review approval',exact:true}).first().click();await page.getByRole('button',{name:'Approve',exact:true}).click()
  await expect.poll(async()=>{const r=await c.from('workflow_runs').select('status').eq('id',runs.data![0].id).single();if(r.error)throw Error('Run read failed');return r.data.status}).toBe('COMPLETED')
})
test('12 workflow failure display',async({page})=>{
  await login(page);await page.goto('/business/workflows');await expect(page.getByText('FAILED',{exact:true}).first()).toBeVisible()
  const c=await client();const r=await c.from('workflow_runs').select('status').eq('id',manifest().failureRunId).single();expect(r.error).toBeNull();expect(r.data?.status).toBe('FAILED')
})
test('13 audit attribution and status',async({page})=>{
  const m=manifest();test.skip(!m.auditExpectation,'BLOCKED: exact naturally generated failure audit fixture required')
  const e=m.auditExpectation!
  await login(page);await page.goto('/business/audit');await expect(page.getByText('FAILED',{exact:true}).first()).toBeVisible()
  const c=await client();const r=await c.from('audit_events').select('id,actor_user_id,event_type,entity_id,workflow_run_id,organization_id').eq('id',e.id).single()
  expect(r.error).toBeNull();expect(r.data).toEqual({id:e.id,actor_user_id:m.actors[e.actorRole].id,event_type:e.eventType,entity_id:e.entityId,workflow_run_id:e.workflowRunId,organization_id:m.organizationId})
})

test('14 document ingestion duplicate content',async({page})=>{
  await login(page);await page.goto('/business/context')
  for(const suffix of ['a','b']) {await page.locator('[name="title"]').fill(manifest().runId+suffix);await page.locator('[name="file"]').setInputFiles({name:suffix+'.txt',mimeType:'text/plain',buffer:Buffer.from('C01 synthetic duplicate content')});await page.getByRole('button',{name:'Upload & Index'}).click();await expect(page.getByText(/indexed/i).first()).toBeVisible()}
  const c=await client();const r=await c.from('documents').select('id,extraction_status').eq('organization_id',manifest().organizationId).like('title',manifest().runId+'%')
  expect(r.error).toBeNull();expect(r.data).toHaveLength(2);expect(new Set(r.data?.map(x=>x.id)).size).toBe(2);expect(r.data?.every(x=>x.extraction_status==='INDEXED')).toBe(true)
  const chunks=await c.from('document_chunks').select('id,document_id').in('document_id',r.data!.map(x=>x.id));expect(chunks.error).toBeNull();expect(new Set(chunks.data?.map(x=>x.document_id)).size).toBe(2);expect(new Set(chunks.data?.map(x=>x.id)).size).toBe(chunks.data?.length)
})
test('15 cross-tenant read/write denial',async()=>{
  await assertMemberBaseline();const m=manifest();test.skip(!m.foreign,'BLOCKED: populated foreign sentinel manifest required')
  const c=await client('member'),foreignOwner=await client('secondOwner')
  const r=await c.from('organizations').select('id').eq('id',m.secondOrganizationId);expect(r.error).toBeNull();expect(r.data).toEqual([])
  for(const [table,id] of [['documents',m.foreign!.documentId],['workflows',m.foreign!.workflowId],['approvals',m.foreign!.approvalId]]) {
    const exists=await foreignOwner.from(table).select('id').eq('id',id).eq('organization_id',m.secondOrganizationId).single();expect(exists.error).toBeNull();expect(exists.data?.id).toBe(id)
    const denied=await c.from(table).select('id').eq('id',id);expect(denied.error).toBeNull();expect(denied.data).toEqual([])
  }
  const write=await c.rpc('change_business_member',{p_organization_id:m.secondOrganizationId,p_member_id:m.actors.secondOwner.memberId,p_role:'MEMBER'});expect(write.error?.code).toBe('42501')
})

test('16 storage access restrictions',async()=>{
  await assertMemberBaseline();const m=manifest();test.skip(!m.foreign||!m.permittedStoragePath,'BLOCKED: exact own/foreign storage fixtures required')
  const c=await client('member'),storage=c.storage.from(m.storageBucket)
  const allowed=await storage.download(m.permittedStoragePath!);expect(allowed.error).toBeNull();expect(allowed.data).not.toBeNull()
  const deniedRead=await storage.download(m.foreign!.storagePath);expect(deniedRead.error).not.toBeNull()
  for(const org of [m.organizationId,m.secondOrganizationId]) {
    const deniedWrite=await storage.upload(org+'/'+m.runId+'/forbidden-member.txt',Buffer.from('synthetic'),{upsert:false});expect(deniedWrite.error).not.toBeNull()
  }
})

test('17 public directory and submission regressions',async({page})=>{
  await page.goto('/tools');await expect(page.locator('main')).toBeVisible()
  const result=await page.evaluate(async(runId)=>{const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'tool',name:runId,url:'https://example.invalid',shortDescription:'Synthetic fixture',description:'Synthetic fixture',category:'Productivity',email:runId+'-public@example.invalid',submitWithoutVerification:true})});return r.status},manifest().runId)
  expect(result).toBe(200)
})
test('18 newsletter and paid-placement mocked regressions',async({page})=>{
  await page.goto('/')
  const statuses=await page.evaluate(async()=>{
    const post=async(url:string,body:unknown)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}}
    return [await post('/api/subscribe',{email:'c01@example.invalid'}),await post('/api/stripe/checkout',{tier:'simple',email:'c01@example.invalid',productName:'C01 synthetic'})]
  });expect(statuses.map(x=>x.status)).toEqual([200,200]);expect(JSON.stringify(statuses[1].body)).toContain('127.0.0.1:3101')
})
for(const feature of ['Atomic approval request-and-pause','Multiple approval boundaries','Automated legacy approval recovery']) test(feature+' — NOT IMPLEMENTED',()=>{test.skip(true,'Requires separately approved database design; no success assertion')})
test('Invitation acceptance — DATABASE VALIDATION PENDING',()=>{test.skip(true,'Local implementation exists; additive migration and recipient fixtures require separate validation and authorization')})
test('Browser expired-cookie SSR renewal — fixture gated',async({page,context})=>{
  const m=manifest();test.skip(!m.expiredBrowserCookies,'BLOCKED: genuine expired signed owner session and valid refresh token required')
  const {PREFIX,expiredFixture,decodeCookies}=require('./session-fixture.cjs')
  const cookies: {name:string;value:string;url:string;httpOnly:boolean;sameSite:'Lax';secure:boolean}[]=expiredFixture(m.expiredBrowserCookies,m.actors.owner.id)
  await context.clearCookies();await context.addCookies(cookies)
  let emitted=false
  page.on('response',response=>{if(response.url().startsWith(m.baseURL+'/')&&(response.headers()['set-cookie']||'').includes(PREFIX))emitted=true})
  await page.goto('/business/dashboard');await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible()
  const after=(await context.cookies(m.baseURL)).filter(c=>c.name.startsWith(PREFIX))
  expect(emitted).toBe(true);expect(after.map(c=>c.value).join('')).not.toBe(cookies.map(c=>c.value).join(''))
  const decoded=decodeCookies(after);expect(decoded.claims.sub).toBe(m.actors.owner.id);expect(decoded.claims.exp).toBeGreaterThan(Math.floor(Date.now()/1000))
})
