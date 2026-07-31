import type { PublishResult, RedditAutomationConfig } from './types'

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const SUBMIT_URL = 'https://oauth.reddit.com/api/submit'
const REQUEST_TIMEOUT_MS = 15_000

type RedditSubmitResponse = {
  json?: {
    errors?: Array<[string, string, string?]>
    data?: {
      id?: string
      url?: string
    }
  }
}

function assertNonEmpty(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function authHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
}

async function retryTemporary<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const message = err instanceof Error ? err.message : ''
      if (!message.startsWith('Temporary Reddit server error')) break
      if (attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  throw lastError
}

export class RedditClient {
  constructor(private readonly config: RedditAutomationConfig) {}

  async getAccessToken(): Promise<string> {
    const clientId = assertNonEmpty(this.config.clientId, 'REDDIT_CLIENT_ID')
    const clientSecret = assertNonEmpty(this.config.clientSecret, 'REDDIT_CLIENT_SECRET')
    const refreshToken = assertNonEmpty(this.config.refreshToken, 'REDDIT_REFRESH_TOKEN')

    const res = await fetchWithTimeout(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader(clientId, clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Reddit OAuth failed (${res.status}): ${text.slice(0, 300)}`)
    }

    const data = JSON.parse(text) as { access_token?: string; error?: string }
    if (!data.access_token) {
      throw new Error(`Reddit OAuth did not return an access token${data.error ? `: ${data.error}` : ''}`)
    }
    return data.access_token
  }

  async submitTextPost(input: {
    subreddit: string
    title: string
    text: string
    flairId?: string
  }): Promise<PublishResult> {
    if (!input.subreddit.trim()) throw new Error('Target subreddit is required')
    if (!input.title.trim()) throw new Error('Reddit title is required')
    if (!input.text.trim()) throw new Error('Reddit post body is required')
    if (input.title.length > 300) throw new Error('Reddit title must be 300 characters or fewer')

    const accessToken = await this.getAccessToken()
    return retryTemporary(async () => {
      const params = new URLSearchParams({
        api_type: 'json',
        kind: 'self',
        sr: input.subreddit,
        title: input.title,
        text: input.text,
        resubmit: 'false',
        sendreplies: 'true',
      })
      if (input.flairId) params.set('flair_id', input.flairId)

      const res = await fetchWithTimeout(SUBMIT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.config.userAgent,
        },
        body: params,
      })
      const text = await res.text()

      if (res.status === 429) throw new Error(`Reddit rate limit reached: ${text.slice(0, 300)}`)
      if (res.status >= 500) throw new Error(`Temporary Reddit server error (${res.status})`)
      if (!res.ok) throw new Error(`Reddit submit failed (${res.status}): ${text.slice(0, 300)}`)

      const data = JSON.parse(text) as RedditSubmitResponse
      const errors = data.json?.errors ?? []
      if (errors.length) {
        const message = errors.map((error) => error.filter(Boolean).join(': ')).join('; ')
        throw new Error(`Reddit rejected the post: ${message}`)
      }

      const id = data.json?.data?.id
      const url = data.json?.data?.url
      if (!id || !url) throw new Error('Reddit submit response did not include a post id and url')
      return { id, url }
    })
  }
}
