import test from 'node:test'
import assert from 'node:assert/strict'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { businessCapabilities, canDecideApproval, auditResult, businessHostRoute, needsBusinessOnboarding, isBusinessDatabaseEnvironmentAllowed } from '../lib/business/compatibility'
import { loadBusinessSession } from '../lib/business/session-state'
import { copyBusinessCookies } from '../lib/business/response-cookies'
import { resolveBusinessMembership } from '../lib/business/auth'
import { hasPermission } from '../lib/business/security'
import { ingestBusinessDocument } from '../lib/business/document-ingestion'
import { SupabaseBusinessDataStore, checkedBusinessWrite, assertRecoverableRun } from '../lib/business/supabase-store'
import type { Approval, WorkflowRun, WorkflowDefinition, AgentFinding, OrganizationMember } from '../lib/business/types'

type Op = { table: string; kind: string; value?: any; filters: Record<string, unknown> }
function fakeClient(handler: (op: Op) => { data: any; error: any }, user: any = { id: 'u' }) {
  const operations: Op[] = []
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table: string) {
      const op: Op = { table, kind: 'select', filters: {} }
      const finish = () => { operations.push(structuredClone(op)); return handler(op) }
      const query: any = {
        select() { return query }, order() { return query }, limit() { return query }, in() { return query },
        eq(k: string, v: unknown) { op.filters[k] = v; return query },
        insert(value: any) { op.kind = 'insert'; op.value = value; return query },
        upsert(value: any) { op.kind = 'upsert'; op.value = value; return query },
        update(value: any) { op.kind = 'update'; op.value = value; return query },
        single: async () => finish(), maybeSingle: async () => finish(),
        then(resolve: any, reject: any) { return Promise.resolve().then(finish).then(resolve, reject) },
      }
      return query
    },
    rpc: async () => ({ data: { id: 'audit', event_type: 'WORKFLOW_STARTED', summary: 'test' }, error: null }),
  }
  return { client: client as unknown as SupabaseClient, operations }
}
const owner = (org: string) => ({ id: 'm-' + org, organization_id: org, user_id: 'u', role: 'OWNER', status: 'ACTIVE', permissions: [] })
const organization = { created_by: 'u', business_onboarded_at: null }

for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] as const) {
  test('C01 capability and custom permission boundary: ' + role, () => {
    assert.equal(businessCapabilities(role).write, role === 'OWNER' || role === 'ADMIN')
    assert.equal(businessCapabilities(role).manageMembers, role === 'OWNER')
    const member = { role, status: 'ACTIVE', permissions: ['workflow:run'], id: 'm', organizationId: 'o', userId: 'u' } as OrganizationMember
    assert.equal(hasPermission(member, 'workflow:run'), role === 'OWNER' || role === 'ADMIN')
    assert.equal(hasPermission({ ...member, status: 'SUSPENDED' }, 'workflow:run'), false)
  })
}
test('approval policy narrows role eligibility and resolved requests disable controls', () => {
  const approval = { status: 'PENDING', approverRoles: ['OWNER'] } as Approval
  assert.equal(canDecideApproval('MANAGER', approval), false)
  assert.equal(canDecideApproval('OWNER', approval), true)
  assert.equal(canDecideApproval('MEMBER', { ...approval, approverRoles: [] }), false)
  assert.equal(canDecideApproval('OWNER', { ...approval, status: 'APPROVED' }), false)
})
test('host routing keeps preview/local traffic isolated and production canonical', () => {
  assert.equal(businessHostRoute('aibeat.dev', { VERCEL_ENV: 'production' }), 'canonical')
  assert.equal(businessHostRoute('www.aibeat.dev', { VERCEL_ENV: 'production' }), 'allow')
  assert.equal(businessHostRoute('production.vercel.app', { VERCEL_ENV: 'production', VERCEL_URL: 'production.vercel.app' }), 'canonical')
  assert.equal(businessHostRoute('stage.vercel.app', { VERCEL_ENV: 'preview', AIBEAT_STAGING_HOSTS: 'stage.vercel.app' }), 'allow')
  assert.equal(businessHostRoute('stage.vercel.app', { VERCEL_ENV: 'preview' }), 'deny')
  assert.equal(businessHostRoute('www.aibeat.dev', { VERCEL_ENV: 'preview', AIBEAT_STAGING_HOSTS: 'www.aibeat.dev' }), 'deny')
  assert.equal(businessHostRoute('localhost:3000', {}), 'allow')
  assert.equal(businessHostRoute('unknown.test', {}), 'deny')
  assert.equal(businessHostRoute('localhost:3000', { VERCEL_ENV: 'production' }), 'deny')
  assert.equal(businessHostRoute('stage.test', { VERCEL_ENV: 'production', AIBEAT_APP_ENV: 'staging', AIBEAT_STAGING_HOSTS: 'stage.test' }), 'deny')
})
test('nonproduction auth requires the exact staging project URL', () => {
  for (const value of [undefined, 'https://other.supabase.co', 'https://oejxwsvlvelxmfbysjbx.supabase.co.attacker.test', 'http://oejxwsvlvelxmfbysjbx.supabase.co']) {
    assert.equal(isBusinessDatabaseEnvironmentAllowed({ NEXT_PUBLIC_SUPABASE_URL: value }), false)
  }
  assert.equal(isBusinessDatabaseEnvironmentAllowed({ NEXT_PUBLIC_SUPABASE_URL: 'https://oejxwsvlvelxmfbysjbx.supabase.co' }), true)
})
test('refreshed chunked session cookies retain options on redirect responses', () => {
  const source = NextResponse.next()
  source.cookies.set('sb-session.0', 'synthetic', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 120 })
  source.cookies.set('sb-session.1', 'synthetic-second', { path: '/' })
  const target = copyBusinessCookies(source, NextResponse.redirect('http://localhost:3000/business/dashboard'))
  assert.equal(target.cookies.get('sb-session.0')?.httpOnly, true)
  assert.equal(target.cookies.get('sb-session.0')?.secure, true)
  assert.equal(target.cookies.get('sb-session.1')?.value, 'synthetic-second')
})
test('only the creator-owner can resume incomplete onboarding', () => {
  assert.equal(needsBusinessOnboarding('u', 'OWNER', organization), true)
  assert.equal(needsBusinessOnboarding('other', 'OWNER', organization), false)
  assert.equal(needsBusinessOnboarding('u', 'MEMBER', organization), false)
  assert.equal(needsBusinessOnboarding('u', 'OWNER', { ...organization, business_onboarded_at: 'done' }), false)
})
test('stale cookie recovers deterministically, explicit unauthorized selection fails', async () => {
  const { client } = fakeClient(op => ({ data: op.table === 'organization_members' ? [owner('z'), owner('a')] : organization, error: null }))
  const state = await loadBusinessSession(client, 'foreign')
  assert.equal(state.context?.organizationId, 'a')
  assert.equal(state.needsOnboarding, true)
  await assert.rejects(loadBusinessSession(client, 'foreign', true), /not available/)
  assert.equal((await loadBusinessSession(client, 'z', true)).context?.organizationId, 'z')
})
test('membership errors never become new-user onboarding', async () => {
  const { client } = fakeClient(() => ({ data: null, error: { code: '42501' } }))
  await assert.rejects(loadBusinessSession(client), /Unable to verify workspace membership/)
})
test('no-membership and anonymous identities remain distinct', async () => {
  const { client } = fakeClient(() => ({ data: [], error: null }))
  assert.equal((await loadBusinessSession(client)).needsOnboarding, true)
  assert.equal((await loadBusinessSession(client)).context, null)
  const anonymous = fakeClient(() => { throw new Error('must not query') }, null)
  assert.equal((await loadBusinessSession(anonymous.client)).user, null)
})
test('explicit tenant resolution never accepts forged membership selection', () => {
  assert.throws(() => resolveBusinessMembership({ userId: 'u', organizationId: 'foreign', members: [] }), /no active/)
})
for (const status of ['FAILED', 'WAITING_FOR_APPROVAL', 'COMPLETED'] as const) {
  test('approval refresh preserves authoritative ' + status + ' and step/audit state', async () => {
    const store = new SupabaseBusinessDataStore({} as SupabaseClient)
    const approval = { id: 'a', status: 'APPROVED' } as Approval
    const run = { id: 'r', status, steps: [{ id: 's', status: 'FAILED' }] } as WorkflowRun
    store.decideApproval = async () => approval
    store.getRuns = async () => [run]
    store.getApprovals = async () => [approval]
    store.getAuditEvents = async () => [{ id: 'event', result: 'FAILED' } as any]
    const result = await store.decideApprovalAndReload({ organizationId: 'o', userId: 'u' }, 'a', 'APPROVED')
    assert.equal(result.runs[0].status, status)
    assert.equal(result.runs[0].steps[0].status, 'FAILED')
    assert.equal(result.auditEvents[0].result, 'FAILED')
  })
}
test('refresh failure discloses committed decision; RPC failure never reloads or falls back', async () => {
  const store = new SupabaseBusinessDataStore({} as SupabaseClient)
  store.decideApproval = async () => ({} as Approval)
  store.getRuns = async () => { throw new Error('offline') }
  store.getApprovals = async () => []
  store.getAuditEvents = async () => []
  await assert.rejects(store.decideApprovalAndReload({ organizationId: 'o', userId: 'u' }, 'a', 'APPROVED'), /decision was recorded/)
  store.decideApproval = async () => { throw new Error('authorization denied') }
  let reads = 0
  store.getRuns = async () => { reads++; return [] }
  await assert.rejects(store.decideApprovalAndReload({ organizationId: 'o', userId: 'u' }, 'a', 'APPROVED'), /authorization denied/)
  assert.equal(reads, 0)
})
test('duplicate document content gets document-scoped chunk IDs across and within tenants', () => {
  const input = { organizationId: 'org-a', userId: 'u', title: 'Synthetic', mimeType: 'text/plain', bytes: Buffer.from('Synthetic text for duplicate upload.') }
  const results = [ingestBusinessDocument(input), ingestBusinessDocument(input), ingestBusinessDocument({ ...input, organizationId: 'org-b' })]
  const ids = results.flatMap(r => r.chunks.map(c => c.id))
  assert.equal(new Set(ids).size, ids.length)
  for (const result of results) for (const chunk of result.chunks) {
    assert.equal(chunk.documentId, result.document.id)
    assert.ok(chunk.id.includes(result.document.id))
  }
})
test('chunk failure marks only its document FAILED and never reports indexed success', async () => {
  const { client, operations } = fakeClient(op => ({
    data: op.table === 'documents' ? (op.value ?? { id: 'doc' }) : null,
    error: op.table === 'document_chunks' ? { message: 'injected failure' } : null,
  }))
  const store = new SupabaseBusinessDataStore(client)
  await assert.rejects(store.ingestDocument({ organizationId: 'org', userId: 'u' }, {
    title: 'Synthetic', mimeType: 'text/plain', bytes: Buffer.from('Synthetic text.'),
  }), /marked FAILED/)
  const failure = operations.find(op => op.kind === 'update')
  assert.equal(failure?.value.extraction_status, 'FAILED')
  assert.equal(failure?.filters.organization_id, 'org')
  assert.equal(operations.some(op => op.value?.extraction_status === 'INDEXED'), false)
})
test('audit display preserves failure, rejection and waiting semantics', () => {
  assert.equal(auditResult('WORKFLOW_FAILED'), 'FAILED')
  assert.equal(auditResult('AGENT_EXECUTION_FAILED'), 'FAILED')
  assert.equal(auditResult('APPROVAL_REJECTED'), 'BLOCKED')
  assert.equal(auditResult('APPROVAL_REQUESTED'), 'BLOCKED')
  assert.equal(auditResult('WORKFLOW_COMPLETED'), 'SUCCESS')
})
test('checked writes reject denied and zero-row mutations', async () => {
  await assert.rejects(checkedBusinessWrite(Promise.resolve({ data: null, error: null })), /write failed/)
  await assert.rejects(checkedBusinessWrite(Promise.resolve({ data: null, error: {} })), /write failed/)
})
test('incomplete saved runs cannot be reported as successful idempotent retries', () => {
  assert.throws(() => assertRecoverableRun({ status: 'RUNNING' } as WorkflowRun), /incomplete/)
  assert.throws(() => assertRecoverableRun({ status: 'WAITING_FOR_APPROVAL', steps: [] } as unknown as WorkflowRun), /boundary is incomplete/)
})
function approvalRunner(failPause: boolean) {
  const mock = fakeClient(op => {
    if (op.kind === 'select') return { data: null, error: null }
    if (op.kind === 'update' && op.table === 'workflow_runs' && failPause) return { data: null, error: { message: 'injected' } }
    return { data: { id: op.table === 'workflow_runs' ? 'r' : op.table === 'workflow_steps' ? 's' : 'a', ...op.value }, error: null }
  })
  const store = new SupabaseBusinessDataStore(mock.client)
  store.getWorkflow = async () => ({ id: 'w', status: 'ACTIVE', inputs: [], agentType: 'MARKETING_CONTENT',
    steps: [{ id: 'review', name: 'Review', action: 'publish content', risk: 'APPROVAL_REQUIRED' }],
    approvalPolicy: { requiredForRisks: ['APPROVAL_REQUIRED'], approverRoles: ['OWNER'] },
  } as unknown as WorkflowDefinition)
  ;(store as any).persistRuntimeAgentFinding = async () => ({ id: 'finding', content: 'draft' } as AgentFinding)
  store.getRuns = async () => [{ id: 'r', status: 'FAILED', steps: [] } as unknown as WorkflowRun]
  store.getApprovals = async () => [{ id: 'a', status: 'APPROVED' } as Approval]
  return { ...mock, store }
}
test('failed pause prevents publishing a pending approval', async () => {
  const { store, operations } = approvalRunner(true)
  await assert.rejects(store.runWorkflow({ organizationId: 'org', userId: 'u' }, 'w'), /write failed/)
  assert.equal(operations.some(op => op.table === 'approvals' && op.kind === 'insert'), false)
})
test('request publication follows pause and never overwrites a concurrent decision', async () => {
  const { store, operations } = approvalRunner(false)
  const result = await store.runWorkflow({ organizationId: 'org', userId: 'u' }, 'w')
  const index = operations.findIndex(op => op.table === 'approvals' && op.kind === 'insert')
  assert.ok(index > operations.findIndex(op => op.table === 'workflow_runs' && op.kind === 'update'))
  assert.equal(operations.slice(index + 1).some(op => op.kind === 'update'), false)
  assert.equal(result.run.status, 'FAILED')
  assert.equal(result.approval?.status, 'APPROVED')
})

test('failed document chunks are excluded from retrieval without destructive cleanup', async () => {
  const { client, operations } = fakeClient(() => { throw new Error('must not read chunks') })
  const store = new SupabaseBusinessDataStore(client)
  store.getDocuments = async () => [{ id: 'doc', extractionStatus: 'FAILED' } as any]
  assert.deepEqual(await store.getDocumentChunks({ organizationId: 'org', userId: 'u' }), [])
  assert.equal(operations.length, 0)
})
