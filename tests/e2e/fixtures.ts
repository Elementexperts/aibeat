import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'
const { validate, BASE } = require('./guard.cjs')
export type Actor = { email: string; password: string; id: string; memberId: string }
export type Manifest = {
  projectRef: string; supabaseUrl: string; anonKey: string; baseURL: string; clusterId: string;
  runId: string; organizationId: string; secondOrganizationId: string; recoveryOrganizationId: string;
  actors: Record<string, Actor>; invitationEmail: string; storageBucket: string;
  foreign?: { documentId: string; workflowId: string; approvalId: string; storagePath: string };
  permittedStoragePath?: string;
  auditExpectation?: { id: string; eventType: string; entityId: string; workflowRunId: string; actorRole: string };
  expiredBrowserCookies?: { name: string; value: string }[];
  workflowId: string; workflowInputs: Record<string,string>; approvalId: string; workflowRunId: string; failureRunId: string;
}
export function manifest(): Manifest {
  const file = process.env.C01_E2E_CONFIG_FILE
  if (!file || path.resolve(file).startsWith(path.resolve(__dirname, '../..') + path.sep)) throw Error('External protected manifest required')
  const m = validate(JSON.parse(fs.readFileSync(file, 'utf8'))) as Manifest
  if (!/^c01-e2e-[0-9a-f-]{36}$/.test(m.runId)) throw Error('Fresh synthetic run ID required')
  const roles = ['owner','admin','manager','member','suspended','nonmember','secondOwner','newOwner','recoverOwner']
  const ids = new Set<string>()
  for (const role of roles) {
    const actor = m.actors[role]
    if (!actor || !actor.email.endsWith('@example.invalid') || !actor.email.startsWith(m.runId) || !actor.password || ids.has(actor.id)) throw Error('Invalid or reused synthetic actor')
    ids.add(actor.id)
  }
  if (!m.organizationId || m.organizationId === m.secondOrganizationId) throw Error('Distinct tenants required')
  require('./fixture-contract.cjs').validateFixtureManifest(m)
  return m
}
export async function login(page: Page, role='owner') {
  const m=manifest(); const a=m.actors[role]
  await page.goto('/business/sign-in')
  await page.getByLabel('Work email').fill(a.email)
  await page.getByLabel('Password', {exact:true}).fill(a.password)
  await page.getByRole('button',{name:'Sign in',exact:true}).click()
  await page.waitForURL(url=>url.origin===BASE && !url.pathname.includes('sign-in'))
  if (role === 'owner') { await page.goto('/business/dashboard'); await page.getByLabel('Workspace',{exact:true}).selectOption(m.organizationId) }
}
export async function client(role='owner') {
  const m=manifest()
  if (!(globalThis as Record<symbol, unknown>)[Symbol.for('c01.runtime')]) throw new Error('Supervised runtime preload required for SDK traffic')
  const c=createClient(m.supabaseUrl,m.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  const {error}=await c.auth.signInWithPassword(m.actors[role])
  if(error) throw Error('Synthetic authentication failed') // never echo provider payload or credentials
  return c
}

export async function assertMemberBaseline() {
  const m = manifest(), c = await client('owner')
  const row = await c.from('organization_members').select('role,status').eq('id',m.actors.member.memberId).eq('organization_id',m.organizationId).single()
  if (row.error || row.data?.role !== 'MEMBER' || row.data?.status !== 'ACTIVE') throw new Error('Member fixture drift; stop without silent repair')
}