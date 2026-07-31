import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import type { RedditAutomationConfig } from './types'

loadEnv({ path: resolve(process.cwd(), '.env.local') })

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true'
}

function cleanSiteUrl(value: string | undefined) {
  return (value || 'https://aibeat.dev').replace(/\/$/, '')
}

export function getRedditConfig(overrides?: Partial<RedditAutomationConfig>): RedditAutomationConfig {
  return {
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
    userAgent: process.env.REDDIT_USER_AGENT || 'AIBeatCommunityBot/1.0 by u/Mother_Form7041',
    subreddit: process.env.REDDIT_SUBREDDIT || 'AIBeat',
    publishEnabled: boolFromEnv(process.env.REDDIT_PUBLISH_ENABLED, false),
    dryRun: boolFromEnv(process.env.REDDIT_DRY_RUN, true),
    siteUrl: cleanSiteUrl(process.env.AIBEAT_SITE_URL),
    ...overrides,
  }
}

export function getMissingRedditCredentials(config: RedditAutomationConfig) {
  const missing: string[] = []
  if (!config.clientId) missing.push('REDDIT_CLIENT_ID')
  if (!config.clientSecret) missing.push('REDDIT_CLIENT_SECRET')
  if (!config.refreshToken) missing.push('REDDIT_REFRESH_TOKEN')
  if (!config.userAgent) missing.push('REDDIT_USER_AGENT')
  if (!config.subreddit) missing.push('REDDIT_SUBREDDIT')
  return missing
}
