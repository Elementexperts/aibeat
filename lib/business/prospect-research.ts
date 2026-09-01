import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export interface ProspectEvidence { requestedUrl: string; finalUrl: string; title: string; description: string; text: string; warnings: string[] }
const MAX_BYTES = 512_000
function isPrivateIp(address: string) {
  if (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true
  const octets = address.split('.').map(Number)
  return octets.length === 4 && (octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168) || octets[0] === 0)
}
async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only public http/https prospect URLs are allowed.')
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Private prospect addresses are not allowed.')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Private prospect addresses are not allowed.')
}
function cleanHtml(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/g, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim()
}
function meta(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const tag = tags.find((entry) => new RegExp(`(?:name|property)=["']${name}["']`, 'i').test(entry))
  return tag?.match(/content=["']([^"']*)["']/i)?.[1]?.trim() ?? ''
}
export async function researchProspectWebsite(requestedUrl: string): Promise<ProspectEvidence> {
  let current = new URL(requestedUrl)
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicUrl(current)
    const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { accept: 'text/html,text/plain;q=0.9', 'user-agent': 'AIBeatBusinessResearch/1.0' } })
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) { current = new URL(response.headers.get('location')!, current); continue }
    if (!response.ok) throw new Error('The prospect website could not be accessed.')
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) throw new Error('The prospect URL did not return an HTML or text page.')
    const declared = Number(response.headers.get('content-length') ?? 0)
    if (declared > MAX_BYTES) throw new Error('The prospect page is too large to research safely.')
    const buffer = new Uint8Array(await response.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) throw new Error('The prospect page is too large to research safely.')
    const raw = new TextDecoder().decode(buffer)
    const title = raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? current.hostname
    return { requestedUrl, finalUrl: current.toString(), title: cleanHtml(title).slice(0, 300), description: cleanHtml(meta(raw, 'description') || meta(raw, 'og:description')).slice(0, 600), text: cleanHtml(raw).slice(0, 12_000), warnings: [] }
  }
  throw new Error('The prospect website redirected too many times.')
}
