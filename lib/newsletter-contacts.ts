import type { PublicFormKind } from './public-form-submissions'

export type AudienceRow = { id: string; kind: PublicFormKind; email: string | null; status: string }
const normalize = (value: string) => value.trim().toLowerCase()
export function newsletterAudience(rows: AudienceRow[]) {
  const valid = rows.filter(r => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(r.email)))
  // An opt-out remains authoritative even after staff marks its request complete.
  const suppressed = new Set(valid.filter(r => r.kind === 'unsubscribe' || (r.kind === 'newsletter' && r.status === 'SUPPRESSED')).map(r => normalize(r.email!)))
  const subscribers = new Map<string, string[]>()
  for (const row of valid.filter(r => r.kind === 'newsletter')) {
    const email = normalize(row.email!)
    if (!suppressed.has(email)) subscribers.set(email, [...(subscribers.get(email) || []), row.id])
  }
  return { subscribers, suppressed }
}

type Person = { resourceName: string; emailAddresses?: Array<{ value: string }>; memberships?: Array<{ contactGroupMembership?: { contactGroupResourceName: string } }> }
type Group = { name: string; resourceName: string }
export async function syncNewsletterContacts(rows: AudienceRow[], token: string, fetchImpl: typeof fetch = fetch) {
  async function api<T>(path: string, body?: unknown): Promise<T> {
    const r = await fetchImpl('https://people.googleapis.com/v1/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) throw new Error('Google Contacts request failed: HTTP ' + r.status + (r.status === 403 ? '; enable People API and authorize the contacts scope' : ''))
    return await r.json() as T
  }
  const groups: Group[] = []
  let page = ''
  do {
    const result = await api<{ contactGroups?: Group[]; nextPageToken?: string }>('contactGroups?pageSize=1000' + (page ? '&pageToken=' + encodeURIComponent(page) : ''))
    groups.push(...(result.contactGroups || [])); page = result.nextPageToken || ''
  } while (page)
  const matching = groups.filter(g => g.name.toLowerCase() === 'newsletter')
  if (matching.length > 1) throw new Error('Multiple Newsletter groups; select one manually before syncing')
  const people: Person[] = []
  do {
    const result = await api<{ connections?: Person[]; nextPageToken?: string }>('people/me/connections?personFields=emailAddresses,memberships&pageSize=1000' + (page ? '&pageToken=' + encodeURIComponent(page) : ''))
    people.push(...(result.connections || [])); page = result.nextPageToken || ''
  } while (page)
  const audience = newsletterAudience(rows)
  const group = matching[0] || await api<Group>('contactGroups', { contactGroup: { name: 'Newsletter' } })
  if (!/^contactGroups\/[\w-]+$/.test(group.resourceName)) throw new Error('Missing contact group resource')
  const inGroup = (p: Person) => p.memberships?.some(m => m.contactGroupMembership?.contactGroupResourceName === group.resourceName)
  const blocked = (p: Person) => p.emailAddresses?.some(e => audience.suppressed.has(normalize(e.value)))
  async function membership(resourceName: string, remove = false) {
    const result = await api<{ notFoundResourceNames?: string[]; canNotRemoveLastContactGroupResourceNames?: string[] }>(group.resourceName + '/members:modify', { [remove ? 'resourceNamesToRemove' : 'resourceNamesToAdd']: [resourceName] })
    if (result.notFoundResourceNames?.length || result.canNotRemoveLastContactGroupResourceNames?.length) throw new Error('Google Contacts membership update was not applied')
  }
  let removed = 0, created = 0, added = 0
  // Remove opt-outs first. Never delete contacts or alter other labels.
  for (const person of people.filter(p => inGroup(p) && blocked(p))) { await membership(person.resourceName, true); removed++ }
  const completedIds: string[] = []
  const conflicts: string[] = []
  for (const [email, ids] of Array.from(audience.subscribers)) {
    const matches = people.filter(p => p.emailAddresses?.some(e => normalize(e.value) === email))
    // A contact with both subscribed and unsubscribed addresses cannot safely be added.
    if (matches.some(blocked)) { conflicts.push(...ids); continue }
    let person = matches[0]
    if (!person) {
      person = await api<Person>('people:createContact?personFields=emailAddresses,memberships', { emailAddresses: [{ value: email }] })
      if (!/^people\/[\w-]+$/.test(person.resourceName)) throw new Error('Missing contact resource')
      people.push(person); created++
    }
    if (!inGroup(person)) {
      await membership(person.resourceName); added++
      person.memberships = [...(person.memberships || []), { contactGroupMembership: { contactGroupResourceName: group.resourceName } }]
    }
    completedIds.push(...ids)
  }
  return { created, added, removed, completedIds, conflicts }
}
