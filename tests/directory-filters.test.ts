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
