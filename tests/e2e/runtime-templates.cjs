// Templates are copied into the temporary snapshot only, never into production routes.
module.exports={
violationRoute:`export const runtime = 'nodejs'
export async function POST() {
  const load = require('node:module').createRequire(process.cwd() + '/package.json')
  const { policy } = load('./tests/e2e/runtime-preload.cjs')
  load('./tests/e2e/run-monitor.cjs').fatal(policy,{source:'middleware',transport:'fetch'})
  return new Response(null,{status:503})
}
`,
actionProbe:`'use client'
import { useState } from 'react'
import { runBusinessWorkflowAction } from '@/app/business/actions'
export default function Probe() {
  const [result,setResult]=useState('pending')
  return <><input id="c01-workflow-id"/><button onClick={async()=>{
    const id=(document.getElementById('c01-workflow-id') as HTMLInputElement).value
    try {await runBusinessWorkflowAction(id,{});setResult('UNEXPECTED_SUCCESS')}
    catch(error) {setResult(error instanceof Error && error.message === 'Business role is not authorized for this operation' ? 'ROLE_DENIED' : 'UNCLASSIFIED_ERROR')}
  }}>Probe server action</button><pre id="c01-action-result">{result}</pre></>
}
`,
route:`export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  const nodeRequire = require('node:module').createRequire(process.cwd() + '/package.json')
  const { family } = nodeRequire('./tests/e2e/runtime-probe.cjs')
  const { MockModelRouter } = require('../../lib/business/model-router')
  const ai = await new MockModelRouter().generate('local containment probe')
  return Response.json({ ...(await family()), aiMock: ai.usage.provider === 'mock' })
}
`,
page:`'use client'
import { useEffect, useState } from 'react'
import { getSupabaseUrl, getSupabasePublishableKey } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/client'
export default function Probe() {
  const [result,setResult] = useState('pending')
  useEffect(()=>{try {const client=createClient();setResult(JSON.stringify({url:getSupabaseUrl(),key:getSupabasePublishableKey(),secretAbsent:!process.env.SUPABASE_SERVICE_ROLE_KEY,privateAbsent:!process.env.GMAIL_CLIENT_SECRET,clientInitialized:!!client.auth,clientSingleton:client===createClient()}))}catch{setResult('public-config-unavailable')}},[])
  return <pre id="c01-public-config">{result}</pre>
}
`,
middleware:`
// Test-only snapshot wrapper: Edge has its own fetch realm.
export async function middleware(request: NextRequest) {
  const nativeFetch = globalThis.fetch
  const rejected: string[] = []
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
    if (url.origin !== 'http://127.0.0.1:3101') {
      rejected.push(url.hostname)
      if (request.nextUrl.pathname !== '/c01-local-middleware') {
        await nativeFetch('http://127.0.0.1:3101/c01-containment-violation',{method:'POST',redirect:'error'})
      }
      throw new Error('C01_EDGE_BLOCKED')
    }
    return nativeFetch(input, { ...init, redirect: 'error' })
  }
  try {
    if (request.nextUrl.pathname === '/c01-local-middleware') {
      let blocked = false
      try { await fetch('https://edge-probe.example.invalid/event') } catch { blocked = true }
      const response = await containedApplicationMiddleware(request)
      return NextResponse.json({blocked, rejected, applicationMiddlewarePassed: response.status === 200, stagingDisabled: process.env.C01_E2E_STAGING_ENABLED === '0', aiMock: process.env.AIBEAT_BUSINESS_AI_MODE === 'mock', poisonAbsent: !process.env.C01_PARENT_POISON, keyIsDummy: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === 'C01_LOCAL_ONLY_NOT_A_CREDENTIAL', runtime: process.env.NEXT_RUNTIME})
    }
    return await containedApplicationMiddleware(request)
  } finally { globalThis.fetch = nativeFetch }
}
`
};
