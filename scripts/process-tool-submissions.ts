import dotenv from 'dotenv'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { TOOLS, type Tool } from '../lib/data'
import { productIdentity } from '../lib/automated-tool-catalog'
import { collectProductEvidence, ensureDraft, groupSubmissions, isPublished, reviewSubmission, SubmissionDrafts, SubmissionStore, validateTool, type State } from '../lib/submission-automation'
import { getGmailDraftConfig } from '../lib/gmail-newsletter-draft'

dotenv.config({ path: '.env.local', quiet: true })
const phase = process.argv[2]
const dryRun = process.argv.includes('--dry-run') || process.env.SUBMISSIONS_DRY_RUN === 'true'
const report: string[] = []
function log(message: string) { const clean = message.replace(/[\r\n]/g, ' ').replace(/::/g, ': ').slice(0, 600); report.push(clean); console.log(clean) }
async function main() {
  if (!['prepare', 'drafts'].includes(phase)) throw new Error('Use prepare or drafts, optionally --dry-run')
  if (dryRun && phase === 'drafts') throw new Error('Draft creation is not part of dry runs')
  const store = new SubmissionStore(process.env.SUBMISSIONS_SUPABASE_URL || '', process.env.SUBMISSIONS_SUPABASE_KEY || '')
  const [rows, states] = await Promise.all([store.rows(), store.states()])
  const groups = groupSubmissions(rows)
  const byKey = new Map(states.map(s => [s.product_key, s]))
  const catalog = (JSON.parse(readFileSync('data/automated-tools.json', 'utf8')) as unknown[]).map(validateTool)
  let failures = 0
  if (phase === 'prepare') {
    const limit = Number(process.env.SUBMISSIONS_MAX_REVIEWS || 5)
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Review limit must be 1–20')
    let reviewed = 0
    for (const group of groups) {
      const row = group.rows[0]
      const previous = byKey.get(group.key)
      const ids = Array.from(new Set([...(previous?.submission_ids || []), ...group.rows.map(r => r.id)]))
      const base = { product_key: group.key, submission_ids: ids, fingerprint: group.fingerprint, tool: null, reason: null }
      if (previous?.phase === 'complete' || previous?.phase === 'existing') {
        if (!dryRun) {
          await store.save({ ...previous, submission_ids: ids, fingerprint: group.fingerprint })
          if (previous.phase === 'complete') await store.complete(ids)
        }
        continue
      }
      if (previous?.phase === 'prepared' || previous?.phase === 'drafting') {
        const tool = validateTool(previous.tool)
        if (!TOOLS.some(t => productIdentity(t.websiteUrl) === productIdentity(tool.websiteUrl)) && !catalog.some(t => t.slug === tool.slug)) catalog.push(tool)
        if (!dryRun) await store.save({ ...previous, submission_ids: ids, fingerprint: group.fingerprint })
        log(`${tool.name}: awaiting publication/draft verification`)
        continue
      }
      let existing: Tool | undefined
      try { existing = TOOLS.find(t => productIdentity(t.websiteUrl) === productIdentity(String(row.payload.url))) } catch { /* Invalid URL is held below. */ }
      if (existing && !catalog.some(t => t.slug === existing!.slug)) {
        if (!dryRun) await store.save({ ...base, phase: 'existing', tool: existing, reason: 'Existing curated listing; preserve previous correspondence' })
        log(`${existing.name}: existing curated listing, no duplicate draft`)
        continue
      }
      if (previous?.phase === 'held' && previous.fingerprint === group.fingerprint && process.env.SUBMISSIONS_RETRY_HELD !== 'true') { log(`Submission ${row.id}: held for review (${previous.reason || 'see ledger'})`); continue }
      if (reviewed >= limit) continue
      reviewed++
      try {
        const pages = await collectProductEvidence(String(row.payload.url))
        const result = await reviewSubmission(row, pages, process.env.GEMINI_API_KEY || '')
        if (result.tool && TOOLS.concat(catalog).some(t => t.slug === result.tool!.slug && productIdentity(t.websiteUrl) !== productIdentity(result.tool!.websiteUrl))) { result.tool = null; result.reason = 'Slug conflicts with an existing product; manual review required' }
        const state: State = { ...base, tool: result.tool, phase: result.tool ? 'prepared' : 'held', reason: result.reason }
        if (!dryRun) await store.save(state)
        if (result.tool) { catalog.push(result.tool); log(`${result.tool.name}: ${dryRun ? 'would add' : 'prepared'} /tools/${result.tool.slug}`) }
        else log(`Submission ${row.id}: held — ${result.reason}`)
      } catch (error) {
        // Do not persist transient failures as reviewed: tomorrow must retry them.
        log(`Submission ${row.id}: retry needed — ${error instanceof Error ? error.message : 'Unknown failure'}`)
        failures++
      }
    }
    if (!dryRun) writeFileSync('data/automated-tools.json', JSON.stringify(catalog, null, 2) + '\n')
    log(`${reviewed} reviewed; ${failures} retryable failures; ${dryRun ? 'dry run: no changes' : 'prepared listings saved'}`)
  } else {
    const drafts = new SubmissionDrafts(getGmailDraftConfig({ ...process.env, GMAIL_DRAFT_TO: 'hello@aibeat.dev' }))
    const pending = groups.map(group => ({ group, state: byKey.get(group.key) })).filter(item => item.state && ['prepared', 'drafting', 'complete'].includes(item.state.phase))
    if (!pending.length) { log('No new publication confirmations to prepare'); return }
    await drafts.init()
    const attempts = Number(process.env.SUBMISSIONS_PUBLISH_ATTEMPTS || 16)
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 30) throw new Error('Invalid publication attempts')
    for (let attempt = 0; pending.length && attempt < attempts; attempt++) {
      for (let i = pending.length - 1; i >= 0; i--) {
        const { group, state } = pending[i]
        if (!state) continue
        if (state.phase === 'complete') { await store.complete(group.rows.map(r => r.id)); pending.splice(i, 1); continue }
        const tool = TOOLS.find(t => t.slug === state.tool?.slug && productIdentity(t.websiteUrl) === productIdentity(state.tool.websiteUrl))
        if (!tool) { log(`Submission ${group.rows[0].id}: prepared listing missing from checkout`); failures++; pending.splice(i, 1); continue }
        const url = `https://www.aibeat.dev/tools/${tool.slug}`
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' })
          if (!isPublished(tool, r.status, await r.text())) continue
          const done = await ensureDraft(state, group.rows[0].email, tool, drafts, s => store.save(s))
          await store.complete(group.rows.map(row => row.id))
          log(`${tool.name}: live ${url}; Gmail draft ${done.gmail_draft_id}`)
          pending.splice(i, 1)
        } catch (error) {
          log(`${tool.name}: ${error instanceof Error ? error.message : 'Draft verification failed'}`)
          failures++; pending.splice(i, 1)
        }
      }
      if (pending.length && attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 30000))
    }
    for (const { state } of pending) log(`${state!.tool?.name}: production listing not verified; draft deferred to next run`)
    failures += pending.length
  }
  if (failures) process.exitCode = 1
}
main().catch(error => { log(error instanceof Error ? error.message : 'Submission automation failed'); process.exitCode = 1 }).finally(() => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n## Tool submissions: ${phase}\n\n${report.map(line => `- ${line.replace(/[<>`]/g, '')}`).join('\n')}\n`)
})
