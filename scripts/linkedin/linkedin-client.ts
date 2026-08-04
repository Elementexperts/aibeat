import type { LinkedInAutomationConfig, LinkedInDraft } from './types'

export type LinkedInCreateDraftResult = {
  ok: boolean
  postUrn?: string
  status: number
  message?: string
}

export type LinkedInRefreshTokenResult = {
  ok: boolean
  accessToken?: string
  expiresIn?: number
  refreshTokenExpiresIn?: number
  status: number
  message?: string
}

export async function refreshLinkedInAccessToken(input: {
  config: LinkedInAutomationConfig
  fetchImpl?: typeof fetch
}): Promise<LinkedInRefreshTokenResult> {
  const fetchImpl = input.fetchImpl || fetch
  if (!input.config.refreshToken || !input.config.clientId || !input.config.clientSecret) {
    return {
      ok: false,
      status: 0,
      message: 'Missing LINKEDIN_REFRESH_TOKEN, LINKEDIN_CLIENT_ID, or LINKEDIN_CLIENT_SECRET',
    }
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: input.config.refreshToken,
    client_id: input.config.clientId,
    client_secret: input.config.clientSecret,
  })

  const res = await fetchImpl('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(12000),
  })

  const text = await res.text().catch(() => '')
  if (!res.ok) return { ok: false, status: res.status, message: text.slice(0, 500) }

  try {
    const data = JSON.parse(text) as {
      access_token?: string
      expires_in?: number
      refresh_token_expires_in?: number
    }
    if (!data.access_token) return { ok: false, status: res.status, message: 'LinkedIn refresh response did not include access_token' }
    return {
      ok: true,
      status: res.status,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshTokenExpiresIn: data.refresh_token_expires_in,
    }
  } catch {
    return { ok: false, status: res.status, message: 'LinkedIn refresh response was not valid JSON' }
  }
}

export function buildLinkedInDraftPayload(draft: LinkedInDraft, config: LinkedInAutomationConfig) {
  if (!config.authorUrn) throw new Error('Missing LinkedIn author URN')

  return {
    author: config.authorUrn,
    commentary: draft.body.slice(0, 3000),
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'NONE',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      article: {
        source: draft.articleUrl,
        title: draft.title.slice(0, 200),
        description: 'AIBeat daily AI news discussion draft.',
      },
    },
    lifecycleState: 'DRAFT',
    isReshareDisabledByAuthor: false,
  }
}

export async function createLinkedInDraft(input: {
  draft: LinkedInDraft
  config: LinkedInAutomationConfig
  accessToken?: string
  fetchImpl?: typeof fetch
}): Promise<LinkedInCreateDraftResult> {
  const fetchImpl = input.fetchImpl || fetch
  const accessToken = input.accessToken || input.config.accessToken
  if (!accessToken) return { ok: false, status: 0, message: 'Missing LINKEDIN_ACCESS_TOKEN' }
  if (!input.config.authorUrn) return { ok: false, status: 0, message: 'Missing LINKEDIN_AUTHOR_URN' }

  const res = await fetchImpl('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Linkedin-Version': input.config.linkedinVersion,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(buildLinkedInDraftPayload(input.draft, input.config)),
    signal: AbortSignal.timeout(12000),
  })

  const postUrn = res.headers.get('x-restli-id') || undefined
  if (res.ok) return { ok: true, status: res.status, postUrn }

  const message = await res.text().catch(() => '')
  return { ok: false, status: res.status, message: message.slice(0, 500) }
}
