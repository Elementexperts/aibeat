import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
  betaListUrl?: string
  websiteUrl?: string
  launchDate?: string
  category?: string
  sourceName: string
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

export type CandidateInspection = {
  toolName: string
  sourceName: string
  productHuntUrl?: string
  betaListUrl?: string
  websiteUrl?: string
  pagesChecked: string[]
  contactLinksFound: string[]
  emailsFound: string[]
  validatedEmails: string[]
  status: 'qualified' | 'needs_manual_review' | 'skipped'
  reason: string
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
  candidateInspections: CandidateInspection[]
  skipped: Array<{ toolName?: string; reason: string }>
}

type DiscoveryOptions = {
  now?: Date
  fetchImpl?: typeof fetch
  feedUrl?: string
  betaListUrl?: string
  lookbackHours?: number
  maxCandidates?: number
  maxLeads?: number
  minScore?: number
  createDrafts?: boolean
  dryRun?: boolean
  storePath?: string
  reportDir?: string
  sources?: string[]
}

const DEFAULT_FEED_URL = 'https://www.producthunt.com/feed'
const DEFAULT_BETALIST_URL = 'https://betalist.com'
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
const BLOCKED_WEBSITE_HOSTS = ['producthunt.com', 'betalist.com', 'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 'github.com', 'medium.com']
const CONTACT_PATHS = ['/', '/contact', '/contact-us', '/about', '/company', '/team', '/press', '/media', '/partnerships', '/partners', '/support', '/help', '/pricing', '/terms']
const CONTACT_LINK_RE = /(contact|about|company|team|press|media|partner|support|help|sales|pricing|terms)/i

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

function sameSite(link: string, websiteUrl: string) {
  return rootDomain(host(link)) === rootDomain(host(websiteUrl))
}

function contactLinksFromHtml(html: string, pageUrl: string, websiteUrl: string) {
  return extractLinks(html, pageUrl)
    .filter((link) => sameSite(link, websiteUrl) && CONTACT_LINK_RE.test(link))
    .slice(0, 20)
}

function chooseExternalWebsite(productHuntHtml: string, productHuntUrl: string) {
  return extractLinks(productHuntHtml, productHuntUrl).find((link) => {
    const hostname = host(link)
    return hostname && !BLOCKED_WEBSITE_HOSTS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))
  })
}

function titleFromHtml(html: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const title = h1 || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return title ? stripHtml(decodeBasicEntities(title)).replace(/\s+\|\s+BetaList.*$/i, '').trim() : undefined
}

function descriptionFromHtml(html: string) {
  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]
  const description = h2 || meta
  return description ? stripHtml(decodeBasicEntities(description)) : undefined
}

function betaListStartupLinks(html: string, baseUrl: string) {
  const baseHost = host(baseUrl)
  return extractLinks(html, baseUrl).filter((link) => {
    try {
      const url = new URL(link)
      return url.hostname.replace(/^www\./, '').toLowerCase() === baseHost && /^\/startups\/[^/?#]+\/?$/.test(url.pathname)
    } catch {
      return false
    }
  })
}

function contactPageUrls(websiteUrl: string) {
  const origin = new URL(websiteUrl).origin
  const directPages = CONTACT_PATHS.map((path) => new URL(path, origin).toString())
  return Array.from(new Set([websiteUrl, ...directPages]))
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
      sourceName: 'Product Hunt',
      sourceUrl: link,
    }]
  }).filter(isAiTool).slice(0, options.maxCandidates)
}

async function fetchBetaListCandidates(options: { fetchImpl: typeof fetch; betaListUrl: string; maxCandidates: number; now: Date }) {
  const homepage = await fetchText(options.betaListUrl, options.fetchImpl)
  const links = betaListStartupLinks(homepage, options.betaListUrl).slice(0, options.maxCandidates * 2)
  const candidates: LeadCandidate[] = []

  for (const link of links) {
    if (candidates.length >= options.maxCandidates) break
    try {
      const html = await fetchText(link, options.fetchImpl)
      const toolName = titleFromHtml(html)
      if (!toolName) continue
      const description = descriptionFromHtml(html)
      const candidate: LeadCandidate = {
        toolName,
        description,
        betaListUrl: link,
        websiteUrl: sanitizeUrl(chooseExternalWebsite(html, link)),
        launchDate: options.now.toISOString().slice(0, 10),
        category: 'AI tools',
        sourceName: 'BetaList',
        sourceUrl: link,
      }
      if (isAiTool(candidate)) candidates.push(candidate)
    } catch {
      // Individual startup pages may fail; keep the daily source scan moving.
    }
  }

  return candidates
}

async function fetchDiscoveryCandidates(input: {
  fetchImpl: typeof fetch
  feedUrl: string
  betaListUrl: string
  lookbackHours: number
  maxCandidates: number
  now: Date
  sources: string[]
}) {
  const candidates: LeadCandidate[] = []
  const normalizedSources = new Set(input.sources.map((source) => source.trim().toLowerCase()).filter(Boolean))

  if (normalizedSources.has('product_hunt') || normalizedSources.has('producthunt')) {
    candidates.push(...await fetchProductHuntCandidates(input))
  }

  if (normalizedSources.has('betalist') || normalizedSources.has('beta_list')) {
    candidates.push(...await fetchBetaListCandidates({ fetchImpl: input.fetchImpl, betaListUrl: input.betaListUrl, maxCandidates: input.maxCandidates, now: input.now }))
  }

  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const key = `${candidate.sourceName}:${candidate.toolName}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, input.maxCandidates)
}

async function validateContact(candidate: LeadCandidate, fetchImpl: typeof fetch): Promise<{ contacts: ValidatedContact[]; inspection: CandidateInspection }> {
  let websiteUrl = candidate.websiteUrl
  const pagesChecked: string[] = []
  const contactLinksFound = new Set<string>()
  const emailsFound = new Set<string>()

  if (!websiteUrl && candidate.productHuntUrl) {
    try {
      websiteUrl = sanitizeUrl(chooseExternalWebsite(await fetchText(candidate.productHuntUrl, fetchImpl), candidate.productHuntUrl))
      candidate.websiteUrl = websiteUrl
    } catch {
      // Product Hunt pages can block automated reads; continue with feed-only context.
    }
  }

  if (!websiteUrl) {
    return {
      contacts: [],
      inspection: {
        toolName: candidate.toolName,
        sourceName: candidate.sourceName,
        productHuntUrl: candidate.productHuntUrl,
        betaListUrl: candidate.betaListUrl,
        pagesChecked,
        contactLinksFound: [],
        emailsFound: [],
        validatedEmails: [],
        status: 'needs_manual_review',
        reason: 'No product website URL found from the feed or Product Hunt page.',
      },
    }
  }

  const queued = contactPageUrls(websiteUrl)
  const seenPages = new Set<string>()
  const contacts: ValidatedContact[] = []

  for (let index = 0; index < queued.length && index < 30; index += 1) {
    const pageUrl = queued[index]
    if (seenPages.has(pageUrl)) continue
    seenPages.add(pageUrl)
    pagesChecked.push(pageUrl)
    try {
      const html = await fetchText(pageUrl, fetchImpl)
      for (const link of contactLinksFromHtml(html, pageUrl, websiteUrl)) {
        contactLinksFound.add(link)
        if (!seenPages.has(link) && !queued.includes(link)) queued.push(link)
      }
      for (const email of extractEmailsFromHtml(html)) {
        emailsFound.add(email)
        if (isPublicBusinessEmail(email, websiteUrl) && !contacts.some((contact) => contact.email === email)) {
          contacts.push({ email, contactType: inferContactType(email), sourceUrl: pageUrl, notes: `Email found on public page: ${pageUrl}` })
        }
      }
    } catch {
      // Some contact routes will not exist; the next likely public page is tried.
    }
  }

  return {
    contacts,
    inspection: {
      toolName: candidate.toolName,
      sourceName: candidate.sourceName,
      productHuntUrl: candidate.productHuntUrl,
      betaListUrl: candidate.betaListUrl,
      websiteUrl,
      pagesChecked,
      contactLinksFound: Array.from(contactLinksFound),
      emailsFound: Array.from(emailsFound),
      validatedEmails: contacts.map((contact) => contact.email),
      status: contacts.length > 0 ? 'qualified' : 'needs_manual_review',
      reason: contacts.length > 0 ? 'Validated public business contact found.' : 'Website inspected, but no validated public business email was found.',
    },
  }
}

function leadFromScored(scored: ScoredLead, runId: string, now: Date): OutreachLead | undefined {
  const opening = `Congrats on the recent ${scored.candidate.toolName} launch. ${scored.candidate.description ? `The positioning around ${scored.candidate.description.slice(0, 180)} stood out as relevant for AIBeat readers.` : 'It stood out as relevant for AIBeat readers looking for practical AI tools.'}`
  const result = makeLead({
    email: scored.contact.email,
    tool_name: scored.candidate.toolName,
    company_name: scored.candidate.toolName,
    website_url: scored.candidate.websiteUrl,
    product_hunt_url: scored.candidate.productHuntUrl || scored.candidate.betaListUrl,
    launch_date: scored.candidate.launchDate,
    category: scored.candidate.category,
    contact_type: scored.contact.contactType,
    source: `${scored.candidate.sourceName} daily discovery`,
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
    '## Candidate Inspections',
    ...report.candidateInspections.map((item) => [
      `- ${item.toolName} (${item.sourceName}): ${item.status} - ${item.reason}`,
      `  - Product Hunt: ${item.productHuntUrl || 'unknown'}`,
      `  - BetaList: ${item.betaListUrl || 'unknown'}`,
      `  - Website: ${item.websiteUrl || 'unknown'}`,
      `  - Pages checked: ${item.pagesChecked.length}`,
      `  - Contact links found: ${item.contactLinksFound.length}`,
      `  - Emails found: ${item.emailsFound.length ? item.emailsFound.join(', ') : 'none'}`,
      `  - Validated emails: ${item.validatedEmails.length ? item.validatedEmails.join(', ') : 'none'}`,
    ].join('\n')),
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
  const betaListUrl = options.betaListUrl || process.env.DAILY_LEAD_DISCOVERY_BETALIST_URL || DEFAULT_BETALIST_URL
  const sources = options.sources || (process.env.DAILY_LEAD_DISCOVERY_SOURCES || 'product_hunt,betalist').split(',')
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
  const candidateInspections: CandidateInspection[] = []

  const candidates = await fetchDiscoveryCandidates({ fetchImpl, feedUrl, betaListUrl, lookbackHours, maxCandidates, now, sources })
  const scored: ScoredLead[] = []

  for (const candidate of candidates) {
    const validation = await validateContact(candidate, fetchImpl)
    candidateInspections.push(validation.inspection)
    if (validation.contacts.length === 0) {
      skipped.push({ toolName: candidate.toolName, reason: validation.inspection.reason })
      continue
    }
    for (const contact of validation.contacts) {
      const score = scoreLead(candidate, contact, now)
      if (score.score < minScore) {
        skipped.push({ toolName: candidate.toolName, reason: `Score ${score.score} below threshold ${minScore} for ${contact.email}.` })
        continue
      }
      scored.push({ candidate, contact, ...score })
      if (scored.length >= maxLeads) break
    }
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
    candidateInspections,
    skipped,
  }

  writeReport(report, reportDir)
  return report
}
