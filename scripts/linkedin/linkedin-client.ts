import type { LinkedInAutomationConfig, LinkedInDraft } from './types'

export type LinkedInCreateDraftResult = {
  ok: boolean
  postUrn?: string
  status: number
  message?: string
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
  fetchImpl?: typeof fetch
}): Promise<LinkedInCreateDraftResult> {
  const fetchImpl = input.fetchImpl || fetch
  if (!input.config.accessToken) return { ok: false, status: 0, message: 'Missing LINKEDIN_ACCESS_TOKEN' }
  if (!input.config.authorUrn) return { ok: false, status: 0, message: 'Missing LINKEDIN_AUTHOR_URN' }

  const res = await fetchImpl('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.config.accessToken}`,
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
