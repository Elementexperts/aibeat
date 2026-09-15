import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const MAX_BYTES = 8 * 1024 * 1024
export const IMAGE_WIDTHS = [240, 640, 1200] as const
export type PreparedNewsImage = { url: string; source: string; sourceUrl: string; width?: number; height?: number }

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 6) return /^[23][0-9a-f]{3}:/i.test(address)
  if (isIP(address) !== 4) return false
  const [a, b, c] = address.split('.').map(Number)
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)))
}

async function validateUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Only public HTTPS images are supported')
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Non-public image host')
  return url
}

export async function downloadNewsImage(value: string): Promise<Buffer> {
  const signal = AbortSignal.timeout(15000)
  for (let redirects = 0; redirects <= 3; redirects++) {
    const url = await validateUrl(value)
    signal.throwIfAborted()
    const response = await fetch(url, { signal, redirect: 'manual', headers: { 'User-Agent': 'AIBeat-bot/1.0', Accept: 'image/*' } })
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) throw new Error('Image redirect has no location')
      value = new URL(location, url).href
      continue
    }
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/') || Number(response.headers.get('content-length')) > MAX_BYTES) {
      await response.body?.cancel()
      throw new Error('Invalid or oversized image response')
    }
    if (!response.body) throw new Error('Empty image response')
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        length += chunk.length
        if (length > MAX_BYTES) throw new Error('Image exceeds 8 MB')
        chunks.push(chunk)
      }
    } finally { await reader.cancel() }
    return Buffer.concat(chunks)
  }
  throw new Error('Too many image redirects')
}

export async function optimizeNewsImage(input: Buffer, outputDir: string) {
  // Normalize orientation and strip metadata. Pixel limits also bound decompression.
  const normalized = await sharp(input, { limitInputPixels: 40_000_000, animated: false }).rotate().resize(1200, 675, { fit: 'cover' }).webp({ quality: 76 }).toBuffer()
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 20)
  await mkdir(outputDir, { recursive: true })
  const outputs = await Promise.all(IMAGE_WIDTHS.map(async (width) => {
    const data = width === 1200 ? normalized : await sharp(normalized).resize(width, Math.round(width * 675 / 1200)).webp({ quality: 72 }).toBuffer()
    const name = `${hash}-${width}.webp`
    await writeFile(join(outputDir, name), data)
    return { width, bytes: data.length, name }
  }))
  return { url: `/news-images/${hash}-1200.webp`, outputs }
}

export async function prepareNewsImage(options: {
  url?: string; source?: string; sourceUrl?: string; fallbackUrl?: string; outputDir?: string
}): Promise<PreparedNewsImage> {
  const candidates = [
    { url: options.url, source: options.source || 'og' },
    { url: options.fallbackUrl, source: 'ai' },
  ]
  for (const candidate of candidates) {
    if (!candidate.url) continue
    try {
      const image = await optimizeNewsImage(await downloadNewsImage(candidate.url), options.outputDir || join(process.cwd(), 'public/news-images'))
      return { url: image.url, width: 1200, height: 675, source: candidate.source, sourceUrl: options.sourceUrl || '' }
    } catch {
      console.warn(`News ${candidate.source} image unavailable; using the next fallback.`)
    }
  }
  return { url: '/news-images/fallback.svg', source: 'placeholder', sourceUrl: '' }
}
