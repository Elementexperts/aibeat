import test from 'node:test'
import assert from 'node:assert/strict'
import { getSupabaseUrl, getSupabasePublishableKey } from '../lib/supabase/config'

test('explicit public configuration remains injectable without falling back to ambient values', () => {
  const env = { NODE_ENV: 'test' as const, NEXT_PUBLIC_SUPABASE_URL: 'https://oejxwsvlvelxmfbysjbx.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'C01_LOCAL_ONLY_NOT_A_CREDENTIAL' }
  assert.equal(getSupabaseUrl(env), env.NEXT_PUBLIC_SUPABASE_URL)
  assert.equal(getSupabasePublishableKey(env), env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  assert.throws(() => getSupabaseUrl({ NODE_ENV: 'test' }), /NEXT_PUBLIC_SUPABASE_URL is required/)
  assert.throws(() => getSupabasePublishableKey({ NODE_ENV: 'test' }), /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required/)
})

test('default helpers resolve intended runtime public values', () => {
  const beforeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const beforeKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://oejxwsvlvelxmfbysjbx.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'C01_LOCAL_ONLY_NOT_A_CREDENTIAL'
    assert.equal(getSupabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_URL)
    assert.equal(getSupabasePublishableKey(), 'C01_LOCAL_ONLY_NOT_A_CREDENTIAL')
  } finally {
    if (beforeUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = beforeUrl
    if (beforeKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = beforeKey
  }
})

test('missing public configuration never substitutes a service-role credential', () => {
  const env = { NODE_ENV: 'test' as const, SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role-poison' }
  assert.throws(() => getSupabaseUrl(env), /NEXT_PUBLIC_SUPABASE_URL is required/)
  assert.throws(() => getSupabasePublishableKey(env), /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required/)
})
