import assert from 'node:assert/strict'
import test from 'node:test'
import { TOOLS } from '../lib/data'
import { toolDescription, toolMetadata } from '../lib/tool-seo'
import evidence from './fixtures/bing-seo-before.json'

test('all catalog descriptions are unique, bounded and based on product data', () => {
  const descriptions = TOOLS.map(toolDescription)
  assert.equal(new Set(descriptions).size, TOOLS.length)
  for (const tool of TOOLS) {
    const metadata = toolMetadata(tool)
    const description = metadata.description!
    assert.ok(description.length <= 160, tool.slug)
    if (tool.slug !== 'muse-video') assert.ok(description.length >= 120, tool.slug)
    assert.ok(description.includes(tool.name), tool.slug)
    assert.doesNotMatch(description, /Honest .* review|Updated for 2026|Free listing submitted/)
    assert.equal(metadata.openGraph?.description, description)
    assert.equal(metadata.twitter?.description, description)
    assert.deepEqual(metadata.alternates, { canonical: 'https://www.aibeat.dev/tools/' + tool.slug })
    assert.ok((String(metadata.title) + ' | AIBeat.dev').length <= 65, tool.slug)
  }
})

test('supplied failing tool URLs now have product-specific descriptions', () => {
  const rows = evidence.filter(row => new URL(row.url).pathname.startsWith('/tools/'))
  assert.equal(rows.length, 37)
  for (const row of rows) {
    const tool = TOOLS.find(tool => '/tools/' + tool.slug === new URL(row.url).pathname)!
    assert.ok(tool, row.url)
    const description = toolDescription(tool)
    assert.notEqual(description, row.description)
    assert.ok(description.length >= 120 && description.length <= 160, row.url)
  }
  assert.match(toolDescription(TOOLS.find(t => t.slug === 'pictory')!), /scripts, blog posts/)
})

test('identify title outliers from captured evidence before shortening them', () => {
  const outliers = evidence.filter(row => row.titleLength > 65)
  assert.deepEqual(outliers.map(row => new URL(row.url).pathname).sort(), ['/tools/reverse-image-location', '/tools/vedic-astrology-chart'])
  for (const row of evidence.filter(row => new URL(row.url).pathname.startsWith('/tools/'))) {
    const tool = TOOLS.find(t => '/tools/' + t.slug === new URL(row.url).pathname)!
    const title = String(toolMetadata(tool).title) + ' | AIBeat.dev'
    if (row.titleLength <= 65) assert.equal(title, row.title)
    else assert.ok(title.length < row.titleLength)
  }
})

test('sparse submissions do not become invented pricing or feature claims', () => {
  const muse = TOOLS.find(t => t.slug === 'muse-video')!
  assert.equal(toolDescription(muse), 'Muse Video (test). Listed in AIBeat’s AI Video directory.')
  const rewords = TOOLS.find(t => t.slug === 'rewords-ai')!
  assert.match(toolDescription(rewords), /preserving meaning and tone/)
  assert.doesNotMatch(toolDescription(rewords), /free|paid/i)
  const whitespace = { ...rewords, description: '  AI rewriter   for text.  ', pricing: 'From $10/mo' }
  assert.doesNotMatch(toolDescription(whitespace), / {2}|\n/)
  assert.match(toolDescription(whitespace), /From \$10\/mo/)
})
