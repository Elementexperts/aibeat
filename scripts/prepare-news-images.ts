import { readFile, readdir, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import { prepareNewsImage } from './news-images'

async function main() {
  const directory = join(process.cwd(), 'content/articles')
  const limit = Math.max(1, Math.min(50, Number.parseInt(process.env.NEWS_IMAGE_BACKFILL_LIMIT || '12', 10) || 12))
  const articles = await Promise.all((await readdir(directory)).filter((name) => name.endsWith('.mdx')).map(async (name) => {
    const raw = await readFile(join(directory, name), 'utf8')
    const file = matter(raw)
    return { name, file, raw }
  }))
  articles.sort((a, b) => String(b.file.data.publishedAt).localeCompare(String(a.file.data.publishedAt)))
  for (const { name, file, raw } of articles.slice(0, limit)) {
    const current = String(file.data.coverImageUrl || '')
    if (/^\/news-images\/(?:[a-f0-9]{20}-1200\.webp|fallback\.svg)$/.test(current)) {
      const variants = current.endsWith('.webp') ? [240, 640, 1200].map((width) => current.replace('-1200.webp', `-${width}.webp`)) : [current]
      if (await Promise.all(variants.map((path) => access(join(process.cwd(), 'public', path)).then(() => true, () => false))).then((results) => results.every(Boolean))) continue
    }
    const image = await prepareNewsImage({ url: current || undefined, source: file.data.coverImageSource, sourceUrl: file.data.coverImageSourceUrl })
    // Keep the external URL for a future retry if this run could not retrieve it.
    // The UI renders its local fallback while metadata still points externally.
    if (image.source === 'placeholder') continue
    const boundary = raw.indexOf('\n---', 3)
    if (boundary < 0) continue
    let frontmatter = raw.slice(0, boundary)
    for (const [key, value] of Object.entries({ coverImageUrl: image.url, coverImageSource: image.source, coverImageSourceUrl: image.sourceUrl })) {
      const pattern = new RegExp(`^${key}:.*$`, 'm')
      const line = `${key}: ${JSON.stringify(value)}`
      frontmatter = pattern.test(frontmatter) ? frontmatter.replace(pattern, () => line) : `${frontmatter}\n${line}`
    }
    await writeFile(join(directory, name), frontmatter + raw.slice(boundary))
    console.log(`Prepared news image: ${name}`)
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
