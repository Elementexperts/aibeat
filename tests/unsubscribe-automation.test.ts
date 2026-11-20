import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { headerHasRecipient, reconcileUnsubscribes, GmailUnsubscribeMailbox, GmailUnavailable, confirmationMessage, confirmationKey, UNSUBSCRIBE_LABEL, type Ledger, type Job, type UnsubscribeMailbox, UnsubscribeLedger } from '../lib/unsubscribe-automation'
import { EmailSuppressionService } from '../lib/email-suppression'
import { suppressionEnv } from './helpers/suppression'

function fixture(options: { complaint?: boolean; state?: Job['draft_status']; existing?: string; missing?: boolean; labelFailure?: boolean; postFailure?: boolean; commitFailure?: boolean; suppressed?: boolean } = {}) {
  let pending = true, leased = false, token = '', labeled = false, suppressed = options.suppressed ?? true
  let state: Job['draft_status'] = options.state ?? 'pending'
  let draftId = options.existing
  const calls: string[] = []
  const ledger: Ledger = {
    async claim(t) {
      calls.push('claim')
      if (!pending || leased) return null
      leased = true; token=t
      return { email: 'contact@example.invalid', draft_status: state, complaint: options.complaint ?? false }
    },
    async step(t, email, op, details = {}) {
      assert.equal(t, token); assert.ok(leased); assert.equal(email, 'contact@example.invalid')
      calls.push(op)
      if (op === 'verify' && !suppressed) {
        if (!details.repair) throw new Error('missing')
        suppressed = true
      }
      if (op === 'label') labeled=true
      if (op === 'reserve') { assert.equal(state,'pending'); state=options.complaint ? 'skipped' : 'creating' }
      if (op === 'draft') {
        if (options.commitFailure) { options.commitFailure=false; throw new Error('commit unavailable') }
        state=details.status as Job['draft_status']
      }
      if (op === 'finish') { assert.ok(labeled); assert.ok(!['pending','creating'].includes(state)); pending=false; leased=false }
      if (op === 'fail') leased=false
      return { complaint: options.complaint ?? false, draft_status: state }
    },
  }
  const gmail: UnsubscribeMailbox = {
    async verify() { calls.push('mailbox') },
    async label(email, fence) { calls.push('label-api'); await fence(); if (options.labelFailure) { options.labelFailure=false; throw new GmailUnavailable() }; return options.missing ? 'skipped' : 'done' },
    async findDraft() { calls.push('lookup'); return draftId ? { id: draftId } : {} },
    async createDraft() { calls.push('post'); draftId='draft1'; if (options.postFailure) { options.postFailure=false; throw new GmailUnavailable() }; return draftId },
  }
  const run = (drafts = true, repair = false) => reconcileUnsubscribes({ ledger, gmail, drafts, repair, limit: 1 })
  return { run, calls, ledger, gmail, options, repeat() { pending=true }, loseDraft() { draftId=undefined }, get state() { return state }, get suppressed() { return suppressed } }
}
test('new request: suppression precedes labeling and durable reservation precedes draft creation', async () => {
  const f=fixture(); const result=await f.run()
  assert.equal(result.processed,1);assert.equal(result.drafts,1)
  assert.ok(f.calls.indexOf('verify')<f.calls.indexOf('label-api'))
  assert.ok(f.calls.indexOf('reserve')<f.calls.indexOf('post'))
})
test('already suppressed and duplicate requests produce one draft across repeated jobs', async () => {
  const f=fixture();await f.run();f.repeat();await f.run()
  assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('no correspondence skips labeling but can prepare an eligible draft', async () => {
  const f=fixture({missing:true});assert.equal((await f.run()).drafts,1)
})
test('existing confirmation draft is adopted without another POST', async () => {
  const f=fixture({existing:'old'});await f.run();assert.ok(!f.calls.includes('post'));assert.equal(f.state,'created')
})
for (const complaint of ['spam','never subscribed']) test(complaint+' complaint labels only without lookup or survey',async()=>{
  const f=fixture({complaint:true});assert.equal((await f.run()).skipped,1);assert.ok(!f.calls.includes('post'));assert.ok(!f.calls.includes('lookup'))
})
test('late complaint flags previously created survey for manual review, never updates it', async()=>{
  const f=fixture({complaint:true,state:'created'});assert.equal((await f.run()).review,1);assert.ok(!f.calls.includes('post'))
})
test('Gmail transient failure resumes from ledger without duplicate creation',async()=>{
  const f=fixture({labelFailure:true});assert.equal((await f.run()).failed,1);assert.equal((await f.run()).processed,1)
  assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('lost POST response finds already created draft on next run',async()=>{
  const f=fixture({postFailure:true});assert.equal((await f.run()).failed,1);assert.equal(f.state,'creating')
  assert.equal((await f.run()).processed,1);assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('ambiguous POST without discoverable draft requires review and never repeats POST',async()=>{
  const f=fixture({postFailure:true});await f.run();f.loseDraft();assert.equal((await f.run()).review,1)
  f.repeat();await f.run();assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('database checkpoint failure after Gmail success is recoverable',async()=>{
  const f=fixture({commitFailure:true});await assert.rejects(f.run());await f.run()
  assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('missing suppression blocks all Gmail work unless repair is explicitly enabled',async()=>{
  const f=fixture({suppressed:false});await assert.rejects(f.run());assert.ok(!f.calls.includes('label-api'))
  await f.run(true,true);assert.ok(f.suppressed)
})
test('concurrent workers sharing ledger reserve recipient once',async()=>{
  const f=fixture();await Promise.all([f.run(),f.run()]);assert.equal(f.calls.filter(c=>c==='post').length,1)
})
test('daily no-op and label-only mode do not create drafts',async()=>{
  const f=fixture();assert.equal((await f.run(false)).skipped,1);assert.equal((await f.run()).processed,0);assert.ok(!f.calls.includes('post'))
})
test('DB claim failure prevents Gmail mutations and sanitized adapter failure hides credentials',async()=>{
  let calls=0
  const db=new EmailSuppressionService({env:suppressionEnv,fetchImpl:async()=>{calls++;return new Response('secret contact@example.invalid',{status:500})}})
  await assert.rejects(new UnsubscribeLedger(db).claim('token'),e=>e instanceof Error && !e.message.includes('secret') && !e.message.includes('@'))
  assert.equal(calls,1)
})
test('neutral branded template is multipart-ready, image/tracking-free and stable per normalized recipient',()=>{
  const m=confirmationMessage(' Contact@Example.Invalid ')
  assert.match(m.html,/max-width:580px/);assert.match(m.html,/#15192c/);assert.doesNotMatch(m.html,/<img|<script|<form|https:|upgrade|featured/i)
  assert.match(m.plainText,/Optional:/);assert.match(m.plainText,/Never subscribed/);assert.equal(m.key,confirmationKey('contact@example.invalid'))
})

function mailboxMock(settings: { wrong?: boolean; alreadyLabeled?: boolean; spam?: boolean; mismatch?: boolean; empty?: boolean; fail?: boolean; existingDraft?: boolean; legacy?: boolean } = {}) {
  const requests: Array<{url:string;method:string;body:any}> = []
  const fetchImpl: typeof fetch=async(url,init)=>{
    const u=String(url); const method=init?.method??'GET'
    requests.push({url:u,method,body:init?.body ? String(init.body) : undefined})
    if(u.includes('oauth2')) return Response.json({access_token:'fake',scope:'https://www.googleapis.com/auth/gmail.modify'})
    if(u.endsWith('/profile'))return Response.json({emailAddress:settings.wrong?'wrong@example.invalid':'hello@aibeat.dev'})
    if(settings.fail)return new Response('private data',{status:503})
    if(u.endsWith('/labels'))return Response.json({labels:[{id:'label1',name:UNSUBSCRIBE_LABEL}]})
    if(u.includes('/messages?'))return Response.json({messages:settings.empty||u.includes('rfc822msgid')?[]:[{id:'m1'}]})
    if(u.includes('/messages/m1?') && settings.legacy && u.includes('metadataHeaders=Subject')) return Response.json({payload:{headers:[{name:'To',value:'contact@example.invalid'},{name:'Subject',value:'Your AIBeat unsubscribe request is confirmed'}]}})
    if(u.includes('/messages/m1?'))return Response.json({labelIds:settings.spam?['SPAM']:settings.alreadyLabeled?['label1']:[],payload:{headers:[{name:'From',value:settings.mismatch?'other@example.invalid':'Name <contact@example.invalid>'}]}})
    if(u.endsWith('/messages/m1/modify'))return Response.json({id:'m1'})
    if(u.includes('/drafts?'))return Response.json({drafts:settings.existingDraft?[{id:'draft1'}]:[]})
    if(u.includes('/drafts/draft1?'))return Response.json({message:{payload:{headers:[{name:'X-AIBeat-Newsletter-Key',value:confirmationKey('contact@example.invalid')},{name:'To',value:'contact@example.invalid'}]}}})
    if(u.endsWith('/drafts')&&method==='POST')return Response.json({id:'draft1'})
    throw new Error('Unexpected request')
  }
  const mailbox=new GmailUnsubscribeMailbox({GMAIL_CLIENT_ID:'fake',GMAIL_CLIENT_SECRET:'fake',UNSUBSCRIBE_GMAIL_REFRESH_TOKEN:'fake'},fetchImpl)
  return {mailbox,requests}
}
test('Gmail exact label applied only to exact participant without spam/trash and never removes labels',async()=>{
  const m=mailboxMock();await m.mailbox.verify();assert.equal(await m.mailbox.label('contact@example.invalid',async()=>{}),'done')
  const writes=m.requests.filter(r=>r.method==='POST'&&!r.url.includes('oauth2'))
  assert.equal(writes.length,1);assert.deepEqual(JSON.parse(writes[0].body),{addLabelIds:['label1']})
  assert.match(decodeURIComponent(m.requests.find(r=>r.url.includes('/messages?'))!.url),/-in:spam -in:trash/)
})
for(const settings of [{alreadyLabeled:true},{spam:true},{mismatch:true},{empty:true}])test('label reconciliation is bounded and idempotent '+JSON.stringify(settings),async()=>{
  const m=mailboxMock(settings);await m.mailbox.verify();await m.mailbox.label('contact@example.invalid',async()=>{})
  assert.ok(!m.requests.some(r=>r.url.endsWith('/modify')))
})
test('wrong mailbox and forbidden send/delete paths fail closed',async()=>{
  const bad=mailboxMock({wrong:true});await assert.rejects(bad.mailbox.verify())
  const m=mailboxMock();await m.mailbox.verify()
  for(const [path,method] of [['messages/send','POST'],['drafts/send','POST'],['messages/m1','DELETE'],['threads/t1/modify','POST']])await assert.rejects(m.mailbox.request(path,method))
  assert.equal(m.requests.length,2)
})
test('draft lookup validates marker and recipient; create is unsent multipart MIME',async()=>{
  const m=mailboxMock({existingDraft:true});await m.mailbox.verify()
  assert.deepEqual(await m.mailbox.findDraft('contact@example.invalid'),{id:'draft1'})
  await m.mailbox.createDraft('contact@example.invalid')
  const write=m.requests.find(r=>r.url.endsWith('/drafts')&&r.method==='POST')!
  const raw=Buffer.from(JSON.parse(write.body).message.raw,'base64url').toString()
  assert.ok(raw.includes('multipart/alternative'));assert.ok(raw.includes('Content-Type: text/plain'));assert.ok(raw.includes('Content-Type: text/html'))
  assert.ok(raw.includes('Message-ID: <'+confirmationKey('contact@example.invalid')+'@aibeat.dev>'))
})
test('Gmail failure is sanitized and draft POST is never automatically retried',async()=>{
  const m=mailboxMock({fail:true});await m.mailbox.verify();await assert.rejects(m.mailbox.createDraft('contact@example.invalid'),GmailUnavailable)
  assert.equal(m.requests.filter(r=>r.url.endsWith('/drafts')).length,1)
})
test('workflow remains disabled without explicit variable and cannot send or expose recipient output',()=>{
  const y=readFileSync('.github/workflows/unsubscribe-reconciliation.yml','utf8')
  assert.ok(y.includes('0 3 * * *'));assert.match(y,/cancel-in-progress: false/);assert.match(y,/UNSUBSCRIBE_AUTOMATION_ENABLED == 'true'/)
  assert.match(y,/contents: read/);assert.doesNotMatch(y,/gmail.send|contents: write/)
})

test('mailbox matching excludes addresses in display names and handles quoted commas',()=>{
  assert.equal(headerHasRecipient('"contact@example.invalid" <other@example.invalid>','contact@example.invalid'),false)
  assert.equal(headerHasRecipient('"Name, First" <CONTACT@example.invalid>, other@example.invalid','contact@example.invalid'),true)
  assert.equal(headerHasRecipient('prefixcontact@example.invalid','contact@example.invalid'),false)
})

test('unmarked historical confirmation requires review instead of a new draft',async()=>{
  const m=mailboxMock({legacy:true});await m.mailbox.verify()
  assert.deepEqual(await m.mailbox.findDraft('contact@example.invalid'),{uncertain:true})
  assert.ok(!m.requests.some(r=>r.url.endsWith('/drafts') && r.method==='POST'))
})
