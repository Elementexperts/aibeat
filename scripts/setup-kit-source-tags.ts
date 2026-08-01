import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'

const KIT_API_BASE = 'https://api.kit.com/v4'

export const REQUIRED_SOURCE_TAGS = [
  { envName: 'KIT_TAG_SOURCE_DIRECT', name: 'Source — Direct' },
  { envName: 'KIT_TAG_SOURCE_LINKEDIN', name: 'Source — LinkedIn' },
  { envName: 'KIT_TAG_SOURCE_REDDIT', name: 'Source — Reddit' },
  { envName: 'KIT_TAG_SOURCE_FAZIER', name: 'Source — Fazier' },
  { envName: 'KIT_TAG_SOURCE_UNEED', name: 'Source — Uneed' },
  { envName: 'KIT_TAG_SOURCE_PARTNER', name: 'Source — Partner' },
  { envName: 'KIT_TAG_SOURCE_OTHER', name: 'Source — Other' },
] as const

type RequiredTagName = typeof REQUIRED_SOURCE_TAGS[number]['name']
type RequiredEnvName = typeof REQUIRED_SOURCE_TAGS[number]['envName']

export type KitTag = {
  id: string
  name: string
}

export type KitSourceTagSummary = {
  created: KitTag[]
  existing: KitTag[]
  mapping: Record<RequiredEnvName, string>
}

type KitApiTag = {
  id?: unknown
  name?: unknown
}

type RunOptions = {
  apiKey: string | undefined
  envFilePath?: string
  updateLocalEnv?: boolean
  fetchImpl?: typeof fetch
  log?: (message: string) => void
}

function wait(ms: number) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms))
}

function sanitizeError(status: number): Error {
  return new Error(`Kit API request failed with status ${status}`)
}

function parseTags(payload: unknown): KitTag[] {
  const source = payload as { tags?: unknown; data?: unknown }
  const rawTags = Array.isArray(source.tags)
    ? source.tags
    : Array.isArray(source.data)
      ? source.data
      : []

  return rawTags.flatMap((tag): KitTag[] => {
    const item = tag as KitApiTag
    if (typeof item.name !== 'string') return []
    if (typeof item.id !== 'number' && typeof item.id !== 'string') return []
    return [{ id: String(item.id), name: item.name }]
  })
}

async function requestKit(input: {
  apiKey: string
  path: string
  method?: 'GET' | 'POST'
  body?: Record<string, string>
  fetchImpl: typeof fetch
}) {
  const res = await input.fetchImpl(`${KIT_API_BASE}${input.path}`, {
    method: input.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': input.apiKey,
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  })

  if (!res.ok) {
    throw sanitizeError(res.status)
  }

  return res.json() as Promise<unknown>
}

export async function listKitTags(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<KitTag[]> {
  const payload = await requestKit({
    apiKey,
    path: '/tags?per_page=100',
    fetchImpl,
  })

  return parseTags(payload)
}

export async function createKitTag(input: {
  apiKey: string
  name: RequiredTagName
  fetchImpl?: typeof fetch
}): Promise<KitTag> {
  const payload = await requestKit({
    apiKey: input.apiKey,
    path: '/tags',
    method: 'POST',
    body: { name: input.name },
    fetchImpl: input.fetchImpl || fetch,
  })
  const tags = parseTags(payload)
  const exact = tags.find((tag) => tag.name === input.name)

  if (exact) return exact

  const item = payload as { tag?: KitApiTag }
  if (
    item.tag &&
    (typeof item.tag.id === 'number' || typeof item.tag.id === 'string') &&
    typeof item.tag.name === 'string' &&
    item.tag.name === input.name
  ) {
    return { id: String(item.tag.id), name: item.tag.name }
  }

  throw new Error(`Kit returned an invalid tag response for ${input.name}`)
}

export function verifySourceTags(tags: KitTag[]): Record<RequiredEnvName, string> {
  const mapping = {} as Record<RequiredEnvName, string>
  const usedIds = new Set<string>()

  for (const required of REQUIRED_SOURCE_TAGS) {
    const matches = tags.filter((tag) => tag.name === required.name)

    if (matches.length === 0) {
      throw new Error(`Missing required Kit tag: ${required.name}`)
    }

    if (matches.length > 1) {
      throw new Error(`Duplicate Kit tags found for: ${required.name}`)
    }

    const id = matches[0].id

    if (!/^\d+$/.test(id)) {
      throw new Error(`Kit tag has a non-numeric ID: ${required.name}`)
    }

    if (usedIds.has(id)) {
      throw new Error(`Duplicate Kit tag ID detected for: ${required.name}`)
    }

    usedIds.add(id)
    mapping[required.envName] = id
  }

  return mapping
}

function updateEnvContent(content: string, mapping: Record<RequiredEnvName, string>): string {
  let next = content

  for (const { envName } of REQUIRED_SOURCE_TAGS) {
    const value = mapping[envName]
    const line = `${envName}=${value}`
    const pattern = new RegExp(`^${envName}=.*$`, 'm')
    next = pattern.test(next) ? next.replace(pattern, line) : `${next.trimEnd()}\n${line}\n`
  }

  return next.endsWith('\n') ? next : `${next}\n`
}

export function updateLocalEnvFile(envFilePath: string, mapping: Record<RequiredEnvName, string>) {
  const current = existsSync(envFilePath) ? readFileSync(envFilePath, 'utf-8') : ''
  writeFileSync(envFilePath, updateEnvContent(current, mapping))
}

export async function setupKitSourceTags(options: RunOptions): Promise<KitSourceTagSummary> {
  if (!options.apiKey) {
    throw new Error('KIT_API_KEY is unavailable in the process environment')
  }

  const fetchImpl = options.fetchImpl || fetch
  const log = options.log || (() => undefined)
  const before = await listKitTags(options.apiKey, fetchImpl)
  const existing: KitTag[] = []
  const created: KitTag[] = []

  for (const required of REQUIRED_SOURCE_TAGS) {
    const match = before.find((tag) => tag.name === required.name)

    if (match) {
      existing.push(match)
      continue
    }

    const tag = await createKitTag({
      apiKey: options.apiKey,
      name: required.name,
      fetchImpl,
    })
    created.push(tag)
    log(`Created ${required.name}`)
  }

  let mapping: Record<RequiredEnvName, string> | undefined
  let lastError: unknown

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const after = await listKitTags(options.apiKey, fetchImpl)
      mapping = verifySourceTags(after)
      break
    } catch (err) {
      lastError = err
      if (attempt < 4) {
        await wait(1500)
      }
    }
  }

  if (!mapping) {
    throw lastError instanceof Error ? lastError : new Error('Kit source tag verification failed')
  }

  if (options.updateLocalEnv && options.envFilePath) {
    updateLocalEnvFile(options.envFilePath, mapping)
  }

  return { created, existing, mapping }
}

async function main() {
  loadEnv({ path: resolve(process.cwd(), '.env.local') })

  try {
    const summary = await setupKitSourceTags({
      apiKey: process.env.KIT_API_KEY,
      envFilePath: resolve(process.cwd(), '.env.local'),
      updateLocalEnv: true,
      log: (message) => console.log(message),
    })

    console.log('Kit source tags verified.')
    console.log(`Existing tags: ${summary.existing.map((tag) => tag.name).join(', ') || 'none'}`)
    console.log(`Created tags: ${summary.created.map((tag) => tag.name).join(', ') || 'none'}`)
    console.log('Environment mapping:')

    for (const { envName } of REQUIRED_SOURCE_TAGS) {
      console.log(`${envName}=${summary.mapping[envName]}`)
    }

    console.log('.env.local updated with source tag IDs.')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Kit source tag setup error'
    console.error(message)
    process.exitCode = 1
  }
}

if (require.main === module) {
  void main()
}
