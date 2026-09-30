// Run after npm run build: npm run test:seo-built
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { TOOLS } from '../lib/data'
import { toolMetadata } from '../lib/tool-seo'
import evidence from './fixtures/bing-seo-before.json'

function decode(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

test('production HTML has the expected bounded tool metadata and semantic logo ALT', () => {
  const descriptions = new Set<string>()
  for (const tool of TOOLS) {
    const html = readFileSync('.next/server/app/tools/' + tool.slug + '.html', 'utf8')
    const title = decode(html.match(/<title>(.*?)<\/title>/)![1])
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)![1])
    const expected = toolMetadata(tool)
    assert.equal(title, String(expected.title) + ' | AIBeat.dev', tool.slug)
    assert.equal(description, expected.description, tool.slug)
    assert.ok(title.length <= 65)
    assert.ok(description.length <= 160)
    for (const property of ['property="og:description"', 'name="twitter:description"']) {
      const tag = html.match(new RegExp('<meta ' + property + ' content="([^"]*)"'))
      assert.equal(decode(tag![1]), description, tool.slug)
    }
    if (tool.logoUrl) assert.ok(html.includes('alt="' + tool.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + ' logo"'), tool.slug)
    descriptions.add(description)
  }
  assert.equal(descriptions.size, TOOLS.length)
})

test('rendered images on supplied static pages retain ALT, including decorative empty ALT', () => {
  let pages = 0
  let images = 0
  for (const row of evidence) {
    const file = '.next/server/app' + new URL(row.url).pathname + '.html'
    if (!existsSync(file)) continue // Dynamic directory/auth routes are covered by robots tests.
    pages++
    for (const image of Array.from(readFileSync(file, 'utf8').matchAll(/<img\b[^>]*>/gi))) {
      images++
      assert.match(image[0], /\balt="[^"]*"/, row.url)
    }
  }
  assert.ok(pages >= 40, 'Missing production HTML; run npm run build first')
  assert.ok(images > 0)
})
