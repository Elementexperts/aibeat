export type KitRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class KitApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = 'KitApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type KitTag = { id: string; name: string }
export type KitCustomField = { id: string; key: string; label?: string }
export type KitSubscriber = {
  id: string
  email_address?: string
  first_name?: string | null
  state?: string
  fields?: Record<string, unknown>
}

export type KitBroadcast = {
  id: string
  subject?: string
  description?: string
  public?: boolean
  send_at?: string | null
  status?: string
}

export type KitBroadcastStats = {
  id?: string
  broadcast_id?: string
  status?: string
  recipients?: number
  emails_opened?: number
  open_rate?: number
  total_clicks?: number
  click_rate?: number
  unsubscribes?: number
  unsubscribe_rate?: number
  progress?: number
}

export type KitSubscriberFilterCondition = { type: 'tag'; ids: Array<string | number> }
export type KitSubscriberFilter = Array<{
  all?: KitSubscriberFilterCondition[]
  any?: KitSubscriberFilterCondition[]
  none?: KitSubscriberFilterCondition[]
}>

type ClientOptions = {
  apiKey?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
  maxRetries?: number
}

const KIT_API_BASE = 'https://api.kit.com/v4'
const RETRYABLE = new Set([429, 500, 502, 503, 504])

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseKitId(value: unknown): string | undefined {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : undefined
}

function parseErrorPayload(payload: unknown): { message: string; code?: string; details?: unknown } {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.errors)) {
      const message = record.errors.map(String).join('; ')
      return { message: message || 'Kit API request failed', details: record.errors }
    }
    if (typeof record.error === 'string') return { message: record.error, details: record }
    if (typeof record.message === 'string') return { message: record.message, details: record }
  }
  return { message: 'Kit API request failed', details: payload }
}

export function parseKitTags(payload: unknown): KitTag[] {
  const record = payload as { tags?: unknown; data?: unknown; tag?: unknown }
  const list = Array.isArray(record.tags) ? record.tags : Array.isArray(record.data) ? record.data : record.tag ? [record.tag] : []
  return list.flatMap((item): KitTag[] => {
    const tag = item as Record<string, unknown>
    const id = parseKitId(tag.id)
    return id && typeof tag.name === 'string' ? [{ id, name: tag.name }] : []
  })
}

export function parseKitCustomFields(payload: unknown): KitCustomField[] {
  const record = payload as { custom_fields?: unknown; data?: unknown; custom_field?: unknown }
  const list = Array.isArray(record.custom_fields) ? record.custom_fields : Array.isArray(record.data) ? record.data : record.custom_field ? [record.custom_field] : []
  return list.flatMap((item): KitCustomField[] => {
    const field = item as Record<string, unknown>
    const id = parseKitId(field.id)
    const key = typeof field.key === 'string' ? field.key : typeof field.name === 'string' ? field.name : undefined
    if (!id || !key) return []
    return [{ id, key, label: typeof field.label === 'string' ? field.label : undefined }]
  })
}

export class KitClient {
  private apiKey: string
  private fetchImpl: typeof fetch
  private timeoutMs: number
  private maxRetries: number

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey || process.env.KIT_API_KEY
    if (!apiKey) throw new KitApiError('KIT_API_KEY is unavailable', 0, 'missing_api_key')
    this.apiKey = apiKey
    this.fetchImpl = options.fetchImpl || fetch
    this.timeoutMs = options.timeoutMs || 12000
    this.maxRetries = options.maxRetries ?? 2
  }

  private async request<T>(path: string, options: { method?: KitRequestMethod; body?: unknown } = {}): Promise<T> {
    let attempt = 0
    while (true) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await this.fetchImpl(`${KIT_API_BASE}${path}`, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Kit-Api-Key': this.apiKey,
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        })

        if (res.status === 204) return undefined as T

        const payload = await res.json().catch(() => undefined)
        if (!res.ok) {
          if (RETRYABLE.has(res.status) && attempt < this.maxRetries) {
            attempt += 1
            await wait(250 * 2 ** attempt)
            continue
          }
          const parsed = parseErrorPayload(payload)
          throw new KitApiError(parsed.message, res.status, parsed.code, parsed.details)
        }
        return payload as T
      } catch (err) {
        if (err instanceof KitApiError) throw err
        if (attempt < this.maxRetries) {
          attempt += 1
          await wait(250 * 2 ** attempt)
          continue
        }
        throw new KitApiError(err instanceof Error ? err.message : 'Kit API request failed', 0, 'network_error')
      } finally {
        clearTimeout(timeout)
      }
    }
  }

  async listTags(): Promise<KitTag[]> {
    return parseKitTags(await this.request('/tags?per_page=100'))
  }

  async createTag(name: string): Promise<KitTag> {
    const tags = parseKitTags(await this.request('/tags', { method: 'POST', body: { name } }))
    const tag = tags.find((item) => item.name === name) || tags[0]
    if (!tag) throw new KitApiError('Kit returned an invalid tag response', 502, 'invalid_tag_response')
    return tag
  }

  async createOrUpdateSubscriber(input: { email_address: string; first_name?: string; fields?: Record<string, string> }): Promise<KitSubscriber> {
    const payload = await this.request<{ subscriber?: Record<string, unknown> }>('/subscribers', { method: 'POST', body: input })
    const subscriber = payload.subscriber || {}
    const id = parseKitId(subscriber.id)
    if (!id) throw new KitApiError('Kit returned no subscriber id', 502, 'missing_subscriber_id')
    return { id, email_address: typeof subscriber.email_address === 'string' ? subscriber.email_address : undefined, first_name: typeof subscriber.first_name === 'string' ? subscriber.first_name : undefined, state: typeof subscriber.state === 'string' ? subscriber.state : undefined, fields: subscriber.fields as Record<string, unknown> | undefined }
  }

  async tagSubscriber(tagId: string, subscriberId: string): Promise<void> {
    await this.request(`/tags/${encodeURIComponent(tagId)}/subscribers/${encodeURIComponent(subscriberId)}`, { method: 'POST' })
  }

  async removeSubscriberTag(tagId: string, subscriberId: string): Promise<void> {
    await this.request(`/tags/${encodeURIComponent(tagId)}/subscribers/${encodeURIComponent(subscriberId)}`, { method: 'DELETE' })
  }

  async listCustomFields(): Promise<KitCustomField[]> {
    return parseKitCustomFields(await this.request('/custom_fields?per_page=100'))
  }

  async createCustomField(key: string): Promise<KitCustomField> {
    const fields = parseKitCustomFields(await this.request('/custom_fields', { method: 'POST', body: { label: key, key } }))
    const field = fields.find((item) => item.key === key) || fields[0]
    if (!field) throw new KitApiError('Kit returned an invalid custom field response', 502, 'invalid_custom_field_response')
    return field
  }

  async createBroadcast(input: { email_template_id?: string; subject: string; content: string; description?: string; preview_text?: string; public: boolean; send_at: string | null; subscriber_filter: KitSubscriberFilter }): Promise<KitBroadcast> {
    const payload = await this.request<{ broadcast?: Record<string, unknown> }>('/broadcasts', { method: 'POST', body: input })
    const broadcast = payload.broadcast || {}
    const id = parseKitId(broadcast.id)
    if (!id) throw new KitApiError('Kit returned no broadcast id', 502, 'missing_broadcast_id')
    return { id, subject: typeof broadcast.subject === 'string' ? broadcast.subject : undefined, description: typeof broadcast.description === 'string' ? broadcast.description : undefined, public: typeof broadcast.public === 'boolean' ? broadcast.public : undefined, send_at: typeof broadcast.send_at === 'string' ? broadcast.send_at : null, status: typeof broadcast.status === 'string' ? broadcast.status : undefined }
  }

  async updateBroadcast(broadcastId: string, input: Record<string, unknown>): Promise<KitBroadcast> {
    const payload = await this.request<{ broadcast?: Record<string, unknown> }>(`/broadcasts/${encodeURIComponent(broadcastId)}`, { method: 'PATCH', body: input })
    const id = parseKitId(payload.broadcast?.id) || broadcastId
    return { id, status: typeof payload.broadcast?.status === 'string' ? payload.broadcast.status : undefined }
  }

  async getBroadcast(broadcastId: string): Promise<KitBroadcast> {
    const payload = await this.request<{ broadcast?: Record<string, unknown> }>(`/broadcasts/${encodeURIComponent(broadcastId)}`)
    const id = parseKitId(payload.broadcast?.id) || broadcastId
    return { id, subject: typeof payload.broadcast?.subject === 'string' ? payload.broadcast.subject : undefined, status: typeof payload.broadcast?.status === 'string' ? payload.broadcast.status : undefined }
  }

  async getBroadcastStats(broadcastId: string): Promise<KitBroadcastStats> {
    const payload = await this.request<{ broadcast?: KitBroadcastStats; stats?: KitBroadcastStats }>(`/broadcasts/${encodeURIComponent(broadcastId)}/stats`)
    return payload.stats || payload.broadcast || {}
  }

  async listBroadcastStats(): Promise<KitBroadcastStats[]> {
    const payload = await this.request<{ broadcasts?: KitBroadcastStats[]; stats?: KitBroadcastStats[] }>('/broadcasts/stats?per_page=100')
    return Array.isArray(payload.stats) ? payload.stats : Array.isArray(payload.broadcasts) ? payload.broadcasts : []
  }
}
