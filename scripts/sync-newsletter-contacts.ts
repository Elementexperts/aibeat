import dotenv from 'dotenv'
import { newsletterAudience, syncNewsletterContacts, type AudienceRow } from '../lib/newsletter-contacts'
dotenv.config({ path: '.env.local', quiet: true })

async function main() {
  const url = process.env.SUBMISSIONS_SUPABASE_URL || ''
  const key = process.env.SUBMISSIONS_SUPABASE_KEY || ''
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !key) throw new Error('Missing private submissions database configuration')
  const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
  const rows: AudienceRow[] = []
  for (let offset = 0; ; offset += 500) {
    const r = await fetch(url + '/rest/v1/public_form_submissions?kind=in.(newsletter,unsubscribe)&select=id,kind,email,status&order=id&limit=500&offset=' + offset, { headers, signal: AbortSignal.timeout(30000) })
    if (!r.ok) throw new Error('Audience read failed: HTTP ' + r.status)
    const batch = await r.json() as AudienceRow[]; rows.push(...batch)
    if (batch.length < 500) break
  }
  const audience = newsletterAudience(rows)
  console.log('Audience:', { eligible: audience.subscribers.size, suppressed: audience.suppressed.size })
  if (process.argv.includes('--dry-run')) return
  const clientId = process.env.GMAIL_CLIENT_ID, clientSecret = process.env.GMAIL_CLIENT_SECRET, refreshToken = process.env.GOOGLE_CONTACTS_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Configure GOOGLE_CONTACTS_REFRESH_TOKEN with contacts scope and the matching Gmail OAuth client')
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }), signal: AbortSignal.timeout(15000) })
  if (!tokenResponse.ok) throw new Error('Contacts OAuth refresh failed: HTTP ' + tokenResponse.status)
  const token = await tokenResponse.json() as { access_token?: string; scope?: string }
  if (!token.access_token || !token.scope?.split(' ').includes('https://www.googleapis.com/auth/contacts')) throw new Error('Google Contacts authorization is missing; Gmail compose permission is insufficient')
  const result = await syncNewsletterContacts(rows, token.access_token)
  for (let i = 0; i < result.completedIds.length; i += 100) {
    const ids = result.completedIds.slice(i, i + 100)
    if (!ids.every(id => /^[a-f0-9-]{36}$/.test(id))) throw new Error('Invalid stored submission ID')
    const r = await fetch(url + '/rest/v1/public_form_submissions?kind=eq.newsletter&status=in.(NEW,IN_REVIEW)&id=in.(' + ids.join(',') + ')', { method: 'PATCH', headers, body: JSON.stringify({ status: 'COMPLETED', updated_at: new Date().toISOString() }), signal: AbortSignal.timeout(30000) })
    if (!r.ok) throw new Error('Audience status update failed: HTTP ' + r.status)
  }
  console.log('Newsletter contact sync:', { created: result.created, added: result.added, removed: result.removed, completed: result.completedIds.length, conflicts: result.conflicts.length })
  if (result.conflicts.length) throw new Error('Contacts with mixed subscription consent require manual review')
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Contact sync failed'); process.exitCode = 1 })
