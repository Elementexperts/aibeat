import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import DirectoryClient from '../components/ui/DirectoryClient'
import DirectoryPage, { generateMetadata } from '../app/directory/page'
import { directoryFilterHref, directoryNavigation, filterDirectoryTools, hasDirectoryFilterInput, parseDirectoryFilters, type DirectoryFilters } from '../lib/directory-filters'
import { TOOLS, getPopularTools, getFeaturedTools } from '../lib/data'
import baseline from '../docs/nitro-v2/nitro-0a-baseline.json'

const categories = Array.from(new Set(TOOLS.map(tool => tool.category)))
const empty: DirectoryFilters = { q: '', category: '', pricing: '' }
const parse = (query: string) => parseDirectoryFilters(new URLSearchParams(query), categories)
const ranked = getPopularTools()
const html = (filters: DirectoryFilters) => renderToStaticMarkup(createElement(AppRouterContext.Provider, {
  value: { push() {}, replace() {}, back() {}, forward() {}, refresh() {}, prefetch: async () => {} },
}, createElement(DirectoryClient, { initialFilters: filters })))

test('parsing defaults, invalid parameters and exact merged-catalog categories', () => {
  assert.deepEqual(parse(''), empty)
  assert.deepEqual(parse('category=all&pricing=enterprise'), empty)
  assert.equal(parse('category=ai+coding').category, '')
  for (const category of categories) assert.equal(parseDirectoryFilters({ category }, categories).category, category)
  assert.equal(parse('pricing=+PAID+').pricing, 'paid')
  assert.equal(parse('q=++ChatGPT++').q, 'ChatGPT')
})

test('repeated parameters consistently use first occurrence on server and client', () => {
  assert.deepEqual(parse('q=one&q=two&category=bad&category=AI+Coding&pricing=free&pricing=paid'), { q: 'one', category: '', pricing: 'free' })
  assert.deepEqual(parseDirectoryFilters({ q: ['one', 'two'], category: ['bad', 'AI Coding'], pricing: ['free', 'paid'] }, categories), { q: 'one', category: '', pricing: 'free' })
  assert.deepEqual(parse('q=&q=two&pricing=&pricing=paid'), empty)
})

test('search is trimmed and capped at 200 Unicode code points without splitting emoji', () => {
  const value = parseDirectoryFilters({ q: '  ' + '😀'.repeat(201) + '  ' }, categories).q
  assert.equal(Array.from(value).length, 200)
  assert.equal(value, '😀'.repeat(200))
  assert.equal(parseDirectoryFilters({ q: ' Café 中文 😀 ' }, categories).q, 'Café 中文 😀')
})

test('serialization is stable, removes filter duplicates, and preserves unrelated repeated keys and hash', () => {
  const current = new URLSearchParams('utm=x&q=old&q=ignored&tag=a&tag=b&pricing=wrong')
  const filters: DirectoryFilters = { q: 'Café 😀', category: 'AI Coding', pricing: 'free' }
  const href = directoryFilterHref(filters, current, '#results')
  assert.equal(href, '/directory?q=Caf%C3%A9+%F0%9F%98%80&category=AI+Coding&pricing=free&utm=x&tag=a&tag=b#results')
  assert.deepEqual(parse(new URL(href, 'http://localhost').search), filters)
  assert.equal(directoryFilterHref(empty, current, '#results'), '/directory?utm=x&tag=a&tag=b#results')
})

test('AND matching retains existing name, tagline and category fields with literal case-insensitive search', () => {
  const tools = [
    { name: 'Alpha', tagline: 'Create VIDEO', category: 'AI Video', pricingType: 'free' },
    { name: 'Video maker', tagline: 'Work', category: 'AI Video', pricingType: 'paid' },
    { name: 'Other', tagline: 'Work', category: 'AI Coding', pricingType: 'free' },
  ]
  assert.deepEqual(filterDirectoryTools(tools, { q: 'video', category: 'AI Video', pricing: 'free' }), [tools[0]])
  assert.deepEqual(filterDirectoryTools(tools, { ...empty, q: 'ALPHA' }), [tools[0]])
  assert.deepEqual(filterDirectoryTools(tools, { ...empty, q: 'coding' }), [tools[2]])
  assert.deepEqual(filterDirectoryTools(tools, { ...empty, q: '.*' }), [])
})

test('offline history model: push, no duplicate, normalization replace, back/forward and refresh reconstruction', () => {
  const history = ['/directory?utm=keep#results']
  let index = 0
  const navigate = (filters: DirectoryFilters) => {
    const next = directoryNavigation(history[index], filters, categories)
    if (next?.method === 'push') { history.splice(index + 1); history.push(next.href); index++ }
    else if (next) history[index] = next.href
  }
  const search = { ...empty, q: 'chat' }
  navigate(search)
  navigate(search)
  assert.equal(history.length, 2)
  navigate({ ...search, pricing: 'free' })
  assert.equal(history.length, 3)
  index--
  assert.deepEqual(parse(new URL(history[index], 'http://localhost').search), search)
  index++
  assert.equal(parse(new URL(history[index], 'http://localhost').search).pricing, 'free')
  const refresh = DirectoryPage({ searchParams: Object.fromEntries(new URL(history[index], 'http://localhost').searchParams) })
  assert.deepEqual(refresh.props.initialFilters, { ...search, pricing: 'free' })
  assert.deepEqual(directoryNavigation('/directory?q=%20chat%20&q=ignored', search, categories), { href: '/directory?q=chat', method: 'replace' })
  assert.equal(directoryNavigation('/directory?q=chat', search, categories), null)
})

test('clear individual and all filters keeps unrelated URL state', () => {
  const current = '/directory?q=chat&category=AI+Coding&pricing=paid&utm=x#results'
  for (const key of ['q', 'category', 'pricing'] as const) {
    const filters = { q: 'chat', category: 'AI Coding', pricing: 'paid' as const, [key]: '' }
    const next = directoryNavigation(current, filters, categories)!
    assert.equal(parse(new URL(next.href, 'http://localhost').search)[key], '')
    assert.ok(next.href.endsWith('utm=x#results'))
  }
  assert.equal(directoryNavigation(current, empty, categories)?.href, '/directory?utm=x#results')
})

test('main baseline catalog, popularity order, featured selection and protected source hashes unchanged', () => {
  assert.equal(TOOLS.length, 147)
  assert.deepEqual(TOOLS.map(tool => ({ slug: tool.slug, category: tool.category, pricingType: tool.pricingType, rating: tool.rating, featured: tool.featured })), baseline.catalog)
  assert.deepEqual(ranked.map(tool => tool.slug), baseline.rankedSlugs)
  assert.deepEqual(getFeaturedTools().map(tool => tool.slug), baseline.featuredSlugs)
  for (const [file, hash] of Object.entries(baseline.hashes)) assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), hash, file)
})

test('all category/pricing combinations select stable ranked subsequences without mutation', () => {
  const before = JSON.stringify(ranked)
  for (const category of ['', ...categories]) for (const pricing of ['', 'free', 'freemium', 'paid'] as const) {
    const filtered = filterDirectoryTools(ranked, { q: '', category, pricing })
    const positions = filtered.map(tool => ranked.indexOf(tool))
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b))
    for (const tool of filtered) {
      assert.ok(!category || tool.category === category)
      assert.ok(!pricing || tool.pricingType === pricing)
    }
  }
  assert.equal(JSON.stringify(ranked), before)
})

test('server markup restores draft, selected controls, global rank labels and listing URLs', () => {
  const example = ranked[10]
  const filters: DirectoryFilters = { q: '', category: example.category, pricing: example.pricingType }
  const markup = html(filters)
  assert.match(markup, /aria-label="Category"/)
  assert.match(markup, /aria-label="Pricing"/)
  assert.match(markup, /aria-pressed="true"/)
  assert.match(markup, /for="directory-search"/)
  assert.match(markup, /type="submit"/)
  assert.match(markup, /role="status" aria-live="polite"/)
  const selected = filterDirectoryTools(ranked, filters)
  assert.ok(selected.length)
  const links = Array.from(markup.matchAll(/href="\/tools\/([^"?]+)"/g), match => match[1])
  assert.deepEqual(links, selected.map(tool => tool.slug))
  assert.deepEqual(Array.from(markup.matchAll(/>#(\d+)<\/span>/g), match => Number(match[1])), selected.map(tool => ranked.indexOf(tool) + 1))
  assert.match(html({ ...empty, q: 'ChatGPT' }), /value="ChatGPT"/)
})

test('unfiltered grouping follows first category occurrence and empty state stays recoverable', () => {
  const markup = html(empty)
  const labels = Array.from(markup.matchAll(/class="section-label">([^<]+)<\/div>/g), match => match[1])
  assert.deepEqual(labels, Array.from(new Set(ranked.map(tool => tool.category))))
  const emptyMarkup = html({ ...empty, q: 'zzzz-no-such-tool' })
  assert.match(emptyMarkup, /No tools match your filters/)
  assert.match(emptyMarkup, /Clear all filters/)
  assert.match(emptyMarkup, /Clear search/)
})

test('SEO preserves title, description and clean canonical; every filter type stays noindex/follow', () => {
  const clean = generateMetadata({})
  assert.deepEqual(clean.robots, { index: true, follow: true })
  assert.equal(clean.title, 'AI Tool Directory — AIBeat.dev')
  assert.equal(clean.description, 'Browse AIBeat’s AI tool directory by category, pricing, and rating. Explore product descriptions, features, and alternatives for your next workflow.')
  for (const searchParams of [{ q: 'chat' }, { category: 'AI Coding' }, { pricing: 'free' }, { category: 'invalid' }, { pricing: 'invalid' }, { q: '   ' }, { q: ['chat', 'other'] }]) {
    const meta = generateMetadata({ searchParams })
    assert.deepEqual(meta.robots, { index: false, follow: true })
    assert.deepEqual(meta.alternates, { canonical: '/directory' })
  }
  assert.equal(hasDirectoryFilterInput({ q: ['', 'chat'] }), false)
  assert.deepEqual(generateMetadata({ searchParams: { utm: 'x' } }).robots, clean.robots)
})

test('static sitemap invariant: unchanged generator enumerates clean directory and catalog tool paths', () => {
  // Importing sitemap outside Next fails on the baseline React 18 cache API.
  // Check its unchanged source rather than substituting a fake server runtime.
  const source = readFileSync('app/sitemap.ts', 'utf8')
  assert.equal(source.split("'/directory'").length - 1, 1)
  assert.ok(source.includes('for (const tool of TOOLS) pages.push'))
  assert.ok(source.includes('canonicalUrl(`/tools/${tool.slug}`)'))
  assert.ok(source.includes('new Map(pages.map(page => [page.url, page]))'))
  assert.doesNotMatch(source, /searchParams|directory\?/)
})

test('client wiring commits only via submit/buttons, keeps scroll and avoids keyed remounts', () => {
  const source = readFileSync('components/ui/DirectoryClient.tsx', 'utf8')
  assert.match(source, /onChange=\{event => setSearch\(event.target.value\)\}/)
  assert.match(source, /onSubmit=\{event => \{ event.preventDefault\(\); commit/)
  assert.match(source, /router\[navigation.method\]\(navigation.href, \{ scroll: false \}\)/)
  assert.match(source, /useEffect\(\(\) => \{ setSearch\(q\) \}, \[q, category, pricing\]\)/)
  assert.match(source, /overflow-x-auto/)
  assert.match(source, /focus-visible:outline/)
  assert.doesNotMatch(readFileSync('app/directory/page.tsx', 'utf8'), /<DirectoryClient key=/)
})

// These checks describe static SSR markup, not browser layout, focus or AT behavior.
const cardMarkup = (filters: DirectoryFilters) => Array.from(
  html(filters).matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g), match => match[1])
const escapedText = (value: string) => renderToStaticMarkup(createElement('span', null, value)).slice(6, -7)
const groupedTools = () => Array.from(new Set(ranked.map(tool => tool.category)))
  .flatMap(category => ranked.filter(tool => tool.category === category))

test('directory cards have product headings and one named native detail link in both result modes', () => {
  const example = ranked[10]
  for (const filters of [empty, { q: '', category: example.category, pricing: example.pricingType }]) {
    const selected = filters === empty ? groupedTools() : filterDirectoryTools(ranked, filters)
    const cards = cardMarkup(filters)
    assert.equal(cards.length, selected.length)
    assert.ok(cards.length)
    cards.forEach((card, index) => {
      const tool = selected[index]
      const links = Array.from(card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g))
      const [attributes, body] = [links[0][1], links[0][2]]
      assert.ok(attributes.includes(`href="/tools/${tool.slug}"`))
      assert.ok(attributes.includes(`aria-label="${escapedText(`View details for ${tool.name}`)}"`))
      assert.doesNotMatch(attributes, /\b(?:role|tabindex)=/i)
      const headings = Array.from(body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g))
      assert.equal(headings.length, 1)
      assert.equal(headings[0][1], escapedText(tool.name))
      assert.equal(links.filter(link => link[1].includes('href="/tools/')).length, 1)
      assert.doesNotMatch(body, /<(?:a|button|input|select|textarea)\b/i)
      const decorativeLogo = body.match(/<div\b[^>]*aria-hidden="true"[^>]*>([\s\S]*?)<\/div>/)
      assert.ok(decorativeLogo)
      assert.doesNotMatch(decorativeLogo[1], /<(?:a|button|input|select|textarea|h2|p)\b/i)
      assert.ok(card.includes(`>#${ranked.indexOf(tool) + 1}</span>`))
    })
  }
  assert.deepEqual(cardMarkup({ ...empty, q: 'zzzz-no-such-tool' }), [])
})

test('card presentation retains catalog text, factual score and pricing without new placement labels', () => {
  const cards = cardMarkup(empty)
  const selected = groupedTools()
  assert.equal(cards.length, selected.length)
  assert.ok(selected.some(tool => tool.rating === null))
  assert.ok(selected.some(tool => tool.rating !== null))
  assert.deepEqual(new Set(selected.map(tool => tool.pricingType)), new Set(['free', 'freemium', 'paid']))
  cards.forEach((card, index) => {
    const tool = selected[index]
    assert.ok(card.includes(`>${escapedText(tool.category)}</div>`))
    assert.ok(card.includes(`>${escapedText(tool.tagline)}</p>`))
    const spanText = Array.from(card.matchAll(/<span\b[^>]*>([^<]*)<\/span>/g), match => match[1])
    const score = tool.rating === null ? 'Not yet rated' : `AIBeat Score ${tool.rating}`
    const pricing = tool.pricingType === 'free' ? 'Free' : tool.pricingType === 'freemium' ? 'Freemium' : tool.pricing
    assert.ok(spanText.includes(escapedText(score)))
    assert.ok(spanText.includes(escapedText(pricing)))
    assert.doesNotMatch(card, />\s*(?:Featured|Sponsored|Editor's Pick)\s*</)
  })
})

test('affiliate offers remain separate from the detail link with original destinations and disclosure', () => {
  const cards = cardMarkup(empty)
  const selected = groupedTools()
  assert.ok(selected.some(tool => tool.affiliateOffer))
  cards.forEach((card, index) => {
    const tool = selected[index]
    const links = Array.from(card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g))
    assert.equal(links.length, tool.affiliateOffer ? 2 : 1)
    if (!tool.affiliateOffer) return
    assert.ok(links[1][1].includes(`href="${escapedText(tool.affiliateUrl)}"`))
    assert.ok(links[1][1].includes('target="_blank"'))
    const rel = links[1][1].match(/\brel="([^"]+)"/)![1].split(/\s+/)
    for (const token of ['noopener', 'noreferrer', 'sponsored']) assert.ok(rel.includes(token))
    assert.ok(links[1][2].includes(escapedText(`Get ${tool.affiliateOffer.discount} ${tool.name} →`)))
    assert.ok(card.includes(escapedText(tool.affiliateOffer.code)))
    assert.ok(card.includes('Affiliate link: AIBeat may earn a commission at no extra cost to you.'))
    assert.doesNotMatch(links[0][2], /Affiliate link:|Use promo code|target="_blank"/)
  })
})

test('directory-only responsive and focus utility contracts are present without claiming computed layout', () => {
  // No CSS/browser engine is used here; utility tokens are the available static guard.
  const source = readFileSync('components/ui/DirectoryClient.tsx', 'utf8')
  const grids = Array.from(source.matchAll(/className="([^"]+)"/g), match => match[1].split(/\s+/))
    .filter(tokens => tokens.includes('grid'))
  assert.equal(grids.length, 2)
  for (const tokens of grids) {
    for (const token of ['grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-4']) assert.ok(tokens.includes(token))
  }
  const card = cardMarkup(empty)[0]
  const mainLink = card.match(/<a\b[^>]*\bclass="([^"]+)"/)
  assert.ok(mainLink)
  const focusTokens = mainLink[1].split(/\s+/)
  for (const token of ['focus-visible:outline', 'focus-visible:outline-2', 'focus-visible:outline-ink', 'focus-visible:outline-offset-2']) {
    assert.ok(focusTokens.includes(token))
  }
  const metadataRows = Array.from(card.matchAll(/<div\b[^>]*\bclass="([^"]+)"/g), match => match[1].split(/\s+/))
    .filter(tokens => tokens.includes('flex-wrap'))
  assert.equal(metadataRows.length, 1)
  assert.ok(metadataRows[0].includes('gap-2'))
  assert.ok(metadataRows[0].includes('items-start'))
})
