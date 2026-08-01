import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  REQUIRED_SOURCE_TAGS,
  setupKitSourceTags,
  updateLocalEnvFile,
  verifySourceTags,
  type KitTag,
} from '../scripts/setup-kit-source-tags'

type FetchCall = {
  url: string
  init?: RequestInit
}

function tag(id: number, name: string): KitTag {
  return { id: String(id), name }
}

function mockFetch(input: {
  initialTags?: KitTag[]
  failAuth?: boolean
  failCreateFor?: string
} = {}) {
  const calls: FetchCall[] = []
  const tags = [...(input.initialTags || [])]
  let nextId = 1000

  const fetchImpl = async (urlInput: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = urlInput.toString()
    calls.push({ url, init })

    if (input.failAuth) {
      return Response.json({ error: 'invalid key' }, { status: 401 })
    }

    if (url.endsWith('/v4/tags?per_page=100')) {
      return Response.json({ tags })
    }

    if (url.endsWith('/v4/tags') && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { name: string }

      if (input.failCreateFor === body.name) {
        return Response.json({ error: 'temporary failure' }, { status: 500 })
      }

      const existing = tags.find((item) => item.name === body.name)
      if (existing) return Response.json({ tag: existing })

      const created = tag(nextId++, body.name)
      tags.push(created)
      return Response.json({ tag: created })
    }

    return Response.json({ error: 'not found' }, { status: 404 })
  }

  return { fetchImpl, calls, tags }
}

test('existing tags are reused', async () => {
  const existing = REQUIRED_SOURCE_TAGS.map((item, index) => tag(index + 1, item.name))
  const { fetchImpl, calls } = mockFetch({ initialTags: existing })

  const result = await setupKitSourceTags({
    apiKey: 'secret-key',
    fetchImpl,
  })

  assert.equal(result.existing.length, REQUIRED_SOURCE_TAGS.length)
  assert.equal(result.created.length, 0)
  assert.equal(calls.some((call) => call.init?.method === 'POST'), false)
})

test('missing tags are created', async () => {
  const existing = [tag(1, 'Source — Direct')]
  const { fetchImpl } = mockFetch({ initialTags: existing })

  const result = await setupKitSourceTags({
    apiKey: 'secret-key',
    fetchImpl,
  })

  assert.equal(result.existing.length, 1)
  assert.equal(result.created.length, REQUIRED_SOURCE_TAGS.length - 1)
  assert.equal(Object.keys(result.mapping).length, REQUIRED_SOURCE_TAGS.length)
})

test('duplicate execution remains idempotent', async () => {
  const { fetchImpl, calls } = mockFetch()

  const first = await setupKitSourceTags({ apiKey: 'secret-key', fetchImpl })
  const postCallsAfterFirstRun = calls.filter((call) => call.init?.method === 'POST').length
  const second = await setupKitSourceTags({ apiKey: 'secret-key', fetchImpl })
  const postCallsAfterSecondRun = calls.filter((call) => call.init?.method === 'POST').length

  assert.equal(first.created.length, REQUIRED_SOURCE_TAGS.length)
  assert.equal(second.created.length, 0)
  assert.equal(postCallsAfterFirstRun, postCallsAfterSecondRun)
})

test('API authentication errors fail safely', async () => {
  const { fetchImpl } = mockFetch({ failAuth: true })

  await assert.rejects(
    setupKitSourceTags({ apiKey: 'secret-key', fetchImpl }),
    /status 401/,
  )
})

test('partial API failures do not produce an incomplete configuration', async () => {
  const { fetchImpl } = mockFetch({ failCreateFor: 'Source — Reddit' })

  await assert.rejects(
    setupKitSourceTags({ apiKey: 'secret-key', fetchImpl }),
    /status 500/,
  )
})

test('incorrect or duplicate IDs are rejected', () => {
  const duplicateIdTags = REQUIRED_SOURCE_TAGS.map((item) => tag(7, item.name))
  const nonNumericTags = REQUIRED_SOURCE_TAGS.map((item, index) => ({
    id: index === 0 ? 'not-numeric' : String(index + 1),
    name: item.name,
  }))

  assert.throws(() => verifySourceTags(duplicateIdTags), /Duplicate Kit tag ID/)
  assert.throws(() => verifySourceTags(nonNumericTags), /non-numeric ID/)
})

test('duplicate tag names are rejected', () => {
  const tags = REQUIRED_SOURCE_TAGS.map((item, index) => tag(index + 1, item.name))
  tags.push(tag(999, 'Source — Direct'))

  assert.throws(() => verifySourceTags(tags), /Duplicate Kit tags/)
})

test('API key never appears in normal output or thrown error messages', async () => {
  const apiKey = 'very-secret-kit-key'
  const output: string[] = []
  const { fetchImpl } = mockFetch({ failAuth: true })

  await assert.rejects(
    setupKitSourceTags({
      apiKey,
      fetchImpl,
      log: (message) => output.push(message),
    }),
    (err: unknown) => {
      assert.ok(err instanceof Error)
      assert.equal(err.message.includes(apiKey), false)
      return true
    },
  )

  assert.equal(output.join('\n').includes(apiKey), false)
})

test('local env file is updated without replacing unrelated values', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-kit-tags-'))
  const envFile = join(dir, '.env.local')
  const mapping = Object.fromEntries(
    REQUIRED_SOURCE_TAGS.map((item, index) => [item.envName, String(index + 10)]),
  ) as Record<typeof REQUIRED_SOURCE_TAGS[number]['envName'], string>

  writeFileSync(envFile, 'KIT_API_KEY=keep-this\nKIT_TAG_SOURCE_DIRECT=old\nOTHER_VALUE=keep\n')
  updateLocalEnvFile(envFile, mapping)
  const content = readFileSync(envFile, 'utf-8')

  assert.match(content, /KIT_API_KEY=keep-this/)
  assert.match(content, /OTHER_VALUE=keep/)
  assert.match(content, /KIT_TAG_SOURCE_DIRECT=10/)
  assert.match(content, /KIT_TAG_SOURCE_OTHER=16/)
})
