import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import type { LinkedInAutomationConfig, LinkedInTone } from './types'

loadEnv({ path: resolve(process.cwd(), '.env.local') })

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true'
}

function numberFromEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function cleanSiteUrl(value: string | undefined) {
  return (value || 'https://www.aibeat.dev').replace(/\s+/g, '').replace(/\/$/, '')
}

function toneFromEnv(value: string | undefined): LinkedInTone {
  if (value === 'founder' || value === 'editorial') return value
  return 'humanized'
}

export function getLinkedInConfig(overrides?: Partial<LinkedInAutomationConfig>): LinkedInAutomationConfig {
  return {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    refreshToken: process.env.LINKEDIN_REFRESH_TOKEN,
    authorUrn: process.env.LINKEDIN_AUTHOR_URN || process.env.LINKEDIN_PERSON_URN,
    siteUrl: cleanSiteUrl(process.env.AIBEAT_SITE_URL),
    dataDir: process.env.LINKEDIN_DATA_DIR || 'data/linkedin',
    draftCount: numberFromEnv(process.env.LINKEDIN_DAILY_DRAFT_COUNT, 3),
    lookbackDays: numberFromEnv(process.env.LINKEDIN_ARTICLE_LOOKBACK_DAYS, 1),
    dryRun: boolFromEnv(process.env.LINKEDIN_DRY_RUN, true),
    createDraftsEnabled: boolFromEnv(process.env.LINKEDIN_CREATE_DRAFTS_ENABLED, false),
    linkedinVersion: process.env.LINKEDIN_VERSION || '202604',
    tone: toneFromEnv(process.env.LINKEDIN_TONE),
    ...overrides,
  }
}

export function getMissingLinkedInCredentials(config: LinkedInAutomationConfig) {
  const missing: string[] = []
  const canRefresh = Boolean(config.refreshToken && config.clientId && config.clientSecret)
  if (!config.accessToken && !canRefresh) {
    missing.push('LINKEDIN_ACCESS_TOKEN or LINKEDIN_REFRESH_TOKEN + LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET')
  }
  if (!config.authorUrn) missing.push('LINKEDIN_AUTHOR_URN')
  return missing
}
