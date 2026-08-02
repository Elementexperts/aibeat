import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Parser from 'rss-parser'
import { KitClient } from './kit/client'
import { getDefaultCampaign, readOutreachStore, upsertLeads, writeOutreachStore } from './outreach-store'
import type { OutreachContactType, OutreachLead, OutreachStore } from './outreach-types'
import { createIndividualLeadDraft } from './outreach-workflow'
import { isBlockedContact, isValidEmail, makeLead, normalizeEmail, sanitizeUrl } from './outreach-validation'

export type LeadCandidate = {
  toolName: string
  description?: string
  productHuntUrl?: string
  websiteUrl?: string
  launchDate?: string
  category?: string
  sourceUrl: string
}

export type ValidatedContact = {
  email: string
  contactType: OutreachContactType
  sourceUrl: string
  notes: string
}

export type ScoredLead = {
  candidate: LeadCandidate
  contact: ValidatedContact
  score: number
  reasons: string[]
}

export type DailyLeadDiscoveryReport = {
  runId: string
  createdAt: string
  dryRun: boolean
  candidatesFound: number
  contactsValidated: number
  qualifiedLeads: number
  leadsStored: number
  draftsCreated: Array<{ email: string; toolName: string; broadcastId: string; tagId?: string; reused: boolean }>
  skipped: Array<{ toolName?: string; reason: string }>
}

type DiscoveryOptions = {
  now?: Date
  fetchImpl?: typeof fetch
  feedUrl?: string
  lookbackHours?: number
  maxCandidates?: number
  maxLeads?: number
  minScore?: number
  createDrafts?: boolean
  dryRun?: boolean
  storePath?: string
  reportDir?: string
}

const DEFAULT_FEED_URL = 'https://www.producthunt.com/feed'
const AI_KEYWORDS = ['ai', 'artificial intelligence', 'llm', 'gpt', 'agent', 'automation', 'chatbot', 'copilot', 'prompt', 'machine learning', 'generative']
const BLOCKED_EMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com'])
const BUSINESS_LOCALS: Array<{ match: RegExp; type: OutreachContactType }> = [
  { match: /^(hello|hi|contact|team|info)$/, type: 'general_business' },
  { match: /^(partnerships?|partners|bizdev|business)$/, type: 'partnerships' },
  { match: /^(press|media|pr)$/, type: 'press' },
  { match: /^(sales|growth)$/, type: 'sales' },
  { match: /^(support|help)$/, type: 'support' },
  { match: /^(founders?|founder)$/, type: 'founder_public' },
]
const BLOCKED_WEBSITE_HOSTS = ['producthunt.com', 'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 'github.com', 'medium.com']

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeBasicEntities(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function host(url: string | undefined) {
  if (!url) return undefined
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return undefined
  }
}

function rootDomain(hostname: string | undefined) {
  if (!hostname) return undefined
  const parts = hostname.split('.')
  return parts.length <= 2 ? hostname : parts.slice(-2).join('.')
}

export function inferContactType(email: string): OutreachContactType {
  const local = normalizeEmail(email).split('@')[0]
  return BUSINESS_LOCALS.find((item) => item.match.test(local))?.type || 'unknown'
}

export function extractEmailsFromHtml(html: string): string[] {
  const matches = decodeBasicEntities(html).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
  const emails = matches.map((email) => normalizeEmail(email).replace(/[),.;:]+$/, ''))
  return Array.from(new Set(emails)).filter((email) => isValidEmail(email) && !isBlockedContact({ email, contact_type: inferContactType(email) }))
}

export function isPublicBusinessEmail(email: string, websiteUrl?: string) {
  const normalized = normalizeEmail(email)
  const type = inferContactType(normalized)
  if (isBlockedContact({ email: normalized, contact_type: type })) return false
  const [local, domain] = normalized.split('@')
  if (!local || !domain || BLOCKED_EMAIL_DOMAINS.has(domain)) return false
  const emailRoot = rootDomain(domain)
  const websiteRoot = rootDomain(host(websiteUrl))
  if (websiteRoot && emailRoot === websiteRoot) return true
  return type !== 'unknown' && !BLOCKED_EMAIL_DOMAINS.has(domain)
}

function extractLinks(html: string, baseUrl: string) {
  const links = Array.from(decodeBasicEntities(html).matchAll(/href=["']([^"']+)["']/gi)).flatMap((match) => {
    try {
      return [new URL(match[1], baseUrl).toString()]
    } catch {
      return []
    }
  })
  return Array.from(new Set(links))
}

function chooseExternalWebsite(productHuntHtml: string, productHuntUrl: string) {
  return extractLinks(productHuntHtml, productHuntUrl).find((link) => {
    const hostname = host(link)
    return hostname && !BLOCKED_WEBSITE_HOSTS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))
  })
}

function contactPageUrls(websiteUrl: string) {
  const origin = new URL(websiteUrl).origin
  return [websiteUrl, `${origin}/contact`, `${origin}/about`, `${origin}/press`, `${origin}/media`]
}

async function fetchText(url: string, fetchImpl: typeof fetch) {
  const res = await fetchImpl(url, { headers: { 'User-Agent': 'AIBeatLeadDiscovery/1.0 (+https://www.aibeat.dev)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function isAiTool(candidate: LeadCandidate) {
  const haystack = `${candidate.toolName} ${candidate.description || ''} ${candidate.category || ''}`.toLowerCase()
  return AI_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

export function scoreLead(candidate: LeadCandidate, contact: ValidatedContact, now = new Date()): { score: number; reasons: string[] } {
  let score = 35
  const reasons: string[] = ['public business contact found']
  if (isAiTool(candidate)) {
    score += 25
    reasons.push('AI-related product positioning')
  }
  if (candidate.websiteUrl) {
    score += 10
    reasons.push('product website identified')
  }
  if (candidate.productHuntUrl) {
    score += 10
    reasons.push('Product Hunt launch source')
  }
  if (candidate.launchDate) {
    const ageHours = (now.getTime() - new Date(candidate.launchDate).getTime()) / 36e5
    if (ageHours <= 72) {
      score += 15
      reasons.push('recent launch')
    }
  }
  if (contact.contactType === 'partnerships' || contact.contactType === 'press' || contact.contactType === 'sales') {
    score += 10
    reasons.push(`${contact.contactType} inbox`)
  }
  return { score: Math.min(score, 100), reasons }
}

async function fetchProductHuntCandidates(options: Required<Pick<DiscoveryOptions, 'fetchImpl' | 'feedUrl' | 'lookbackHours' | 'maxCandidates' | 'now'>>) {
  const parser = new Parser()
  const xml = await fetchText(options.feedUrl, options.fetchImpl)
  const feed = await parser.parseString(xml)
  const cutoff = options.now.getTime() - options.lookbackHours * 60 * 60 * 1000

  return feed.items.flatMap((item): LeadCandidate[] => {
    const date = item.isoDate || item.pubDate
    const timestamp = date ? new Date(date).getTime() : options.now.getTime()
    if (Number.isNaN(timestamp) || timestamp < cutoff) return []
    const link = sanitizeUrl(item.link)
    const toolName = stripHtml(String(item.title || '')).replace(/\s*-\s*Product Hunt\s*$/i, '')
    if (!toolName || !link) return []
    return [{
      toolName,
      description: stripHtml(String(item.contentSnippet || item.content || '')),
      productHuntUrl: link,
      launchDate: new Date(timestamp).toISOString().slice(0, 10),
      category: 'AI tools',
      sourceUrl: link,
    }]
  }).filter(isAiTool).slice(0, options.maxCandidates)
}

async function validateContact(candidate: LeadCandidate, fetchImpl: typeof fetch): Promise<ValidatedContact | undefined> {
  let websiteUrl = candidate.websiteUrl

  if (!websiteUrl && candidate.productHuntUrl) {
    try {
      websiteUrl = sanitizeUrl(chooseExternalWebsite(await fetchText(candidate.productHuntUrl, fetchImpl), candidate.productHuntUrl))
      candidate.websiteUrl = websiteUrl
    } catch {
      // Product Hunt pages can block automated reads; continue with feed-only context.
    }
  }

  if (!websiteUrl) return undefined

  for (const pageUrl of contactPageUrls(websiteUrl)) {
    try {
      const html = await fetchText(pageUrl, fetchImpl)
      const email = extractEmailsFromHtml(html).find((item) => isPublicBusinessEmail(item, websiteUrl))
      if (email) return { email, contactType: inferContactType(email), sourceUrl: pageUrl, notes: `Email found on public page: ${pageUrl}` }
    } catch {
      // Some contact routes will not exist; the next likely public page is tried.
    }
  }

  return undefined
}

function leadFromScored(scored: ScoredLead, runId: string, now: Date): OutreachLead | undefined {
  const opening = `Congrats on the recent ${scored.candidate.toolName} launch. ${scored.candidate.description ? `The positioning around ${scored.candidate.description.slice(0, 180)} stood out as relevant for AIBeat readers.` : 'It stood out as relevant for AIBeat readers looking for practical AI tools.'}`
  const result = makeLead({
    email: scored.contact.email,
    tool_name: scored.candidate.toolName,
    company_name: scored.candidate.toolName,
    website_url: scored.candidate.websiteUrl,
    product_hunt_url: scored.candidate.productHuntUrl,
    launch_date: scored.candidate.launchDate,
    category: scored.candidate.category,
    contact_type: scored.contact.contactType,
    source: 'Product Hunt daily discovery',
    public_contact_source_url: scored.contact.sourceUrl,
    personalized_opening: opening,
    priority: scored.score >= 85 ? 'high' : scored.score >= 70 ? 'medium' : 'low',
    consent_status: 'legitimate_business_interest_reviewed',
    lawful_basis: 'Legitimate business interest reviewed: public business contact for relevant editorial/promotional AIBeat outreach.',
  }, now)

  if (!result.lead) return undefined
  result.lead.status = 'approved'
  result.lead.approved_for_outreach = true
  result.lead.approved_at = now.toISOString()
  result.lead.approved_by = 'daily-lead-discovery'
  result.lead.discovered_at = now.toISOString()
  result.lead.discovery_run_id = runId
  result.lead.contact_verified_at = now.toISOString()
  result.lead.contact_validation_notes = scored.contact.notes
  result.lead.qualification_score = scored.score
  result.lead.qualification_reasons = scored.reasons
  return result.lead
}

function writeReport(report: DailyLeadDiscoveryReport, reportDir: string) {
  mkdirSync(reportDir, { recursive: true })
  const date = report.createdAt.slice(0, 10)
  const jsonPath = resolve(reportDir, `${date}.json`)
  const mdPath = resolve(reportDir, `${date}.md`)
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(mdPath, [
    `# AIBeat Daily Lead Discovery - ${date}`,
    '',
    `- Run ID: ${report.runId}`,
    `- Dry run: ${report.dryRun}`,
    `- Candidates found: ${report.candidatesFound}`,
    `- Contacts validated: ${report.contactsValidated}`,
    `- Qualified leads stored: ${report.leadsStored}`,
    `- Kit draft broadcasts created: ${report.draftsCreated.length}`,
    '',
    '## Drafts',
    ...report.draftsCreated.map((draft) => `- ${draft.toolName} <${draft.email}>: broadcast ${draft.broadcastId}`),
    '',
    '## Skipped',
    ...report.skipped.map((item) => `- ${item.toolName || 'candidate'}: ${item.reason}`),
    '',
  ].join('\n'))
  return { jsonPath, mdPath }
}

export async function runDailyLeadDiscovery(options: DiscoveryOptions = {}): Promise<DailyLeadDiscoveryReport> {
  const now = options.now || new Date()
  const runId = `daily_${now.toISOString().slice(0, 10)}_${now.getTime()}`
  const fetchImpl = options.fetchImpl || fetch
  const feedUrl = options.feedUrl || process.env.DAILY_LEAD_DISCOVERY_FEED_URL || DEFAULT_FEED_URL
  const lookbackHours = options.lookbackHours || Number(process.env.DAILY_LEAD_DISCOVERY_LOOKBACK_HOURS || 48)
  const maxCandidates = options.maxCandidates || Number(process.env.DAILY_LEAD_DISCOVERY_MAX_CANDIDATES || 30)
  const maxLeads = options.maxLeads || Number(process.env.DAILY_LEAD_DISCOVERY_MAX_LEADS || 5)
  const minScore = options.minScore || Number(process.env.DAILY_LEAD_DISCOVERY_MIN_SCORE || 70)
  const dryRun = options.dryRun ?? process.env.DAILY_LEAD_DISCOVERY_DRY_RUN === 'true'
  const createDrafts = options.createDrafts ?? process.env.DAILY_LEAD_DISCOVERY_CREATE_DRAFTS !== 'false'
  const reportDir = resolve(process.cwd(), options.reportDir || process.env.DAILY_LEAD_DISCOVERY_REPORT_DIR || 'data/outreach/reports')
  const storePath = options.storePath || undefined
  const store: OutreachStore = readOutreachStore(storePath)
  const skipped: DailyLeadDiscoveryReport['skipped'] = []

  const candidates = await fetchProductHuntCandidates({ fetchImpl, feedUrl, lookbackHours, maxCandidates, now })
  const scored: ScoredLead[] = []

  for (const candidate of candidates) {
    const contact = await validateContact(candidate, fetchImpl)
    if (!contact) {
      skipped.push({ toolName: candidate.toolName, reason: 'No public business contact found.' })
      continue
    }
    const score = scoreLead(candidate, contact, now)
    if (score.score < minScore) {
      skipped.push({ toolName: candidate.toolName, reason: `Score ${score.score} below threshold ${minScore}.` })
      continue
    }
    scored.push({ candidate, contact, ...score })
    if (scored.length >= maxLeads) break
  }

  const leads = scored.flatMap((item) => {
    const lead = leadFromScored(item, runId, now)
    if (!lead) {
      skipped.push({ toolName: item.candidate.toolName, reason: 'Lead failed final validation.' })
      return []
    }
    return [lead]
  })

  if (!dryRun && leads.length > 0) {
    upsertLeads(store, leads)
  }

  const draftsCreated: DailyLeadDiscoveryReport['draftsCreated'] = []
  if (!dryRun && createDrafts && leads.length > 0) {
    try {
      const client = new KitClient()
      const campaign = getDefaultCampaign(store)
      for (const lead of store.leads.filter((item) => item.discovery_run_id === runId)) {
        try {
          const result = await createIndividualLeadDraft({ store, campaign, client, lead })
          draftsCreated.push({ email: lead.email, toolName: lead.tool_name, broadcastId: result.broadcastId, tagId: result.tagId, reused: result.reused })
        } catch (err) {
          skipped.push({ toolName: lead.tool_name, reason: err instanceof Error ? `Kit draft failed: ${err.message}` : 'Kit draft failed.' })
        }
      }
    } catch (err) {
      skipped.push({ reason: err instanceof Error ? `Kit setup failed: ${err.message}` : 'Kit setup failed.' })
    }
  }

  if (!dryRun) writeOutreachStore(store, storePath)

  const report: DailyLeadDiscoveryReport = {
    runId,
    createdAt: now.toISOString(),
    dryRun,
    candidatesFound: candidates.length,
    contactsValidated: scored.length,
    qualifiedLeads: leads.length,
    leadsStored: dryRun ? 0 : leads.length,
    draftsCreated,
    skipped,
  }

  writeReport(report, reportDir)
  return report
}
