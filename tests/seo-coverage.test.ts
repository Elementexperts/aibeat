import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'
import { privateBusinessRobots } from '../lib/business/metadata'
import { BUSINESS_PRIVATE_PREFIXES, BUSINESS_AUTHENTICATED_PATHS } from '../lib/business/routes'
import { generateMetadata as directoryMetadata } from '../app/directory/page'

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
}

test('every raw JSX image declares ALT explicitly; embedded HTML images do too', () => {
  let checked = 0
  for (const file of [...files('app'), ...files('components')].filter(f => /\.tsx$/.test(f))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node: ts.Node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'img') {
        checked++
        const alt = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(source) === 'alt')
        assert.ok(alt && ts.isJsxAttribute(alt) && alt.initializer, file + ': image without ALT')
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  assert.ok(checked >= 6)
  for (const file of [...files('content'), 'components/founders/SubmitToolForm.tsx']) {
    for (const image of Array.from(readFileSync(file, 'utf8').matchAll(/<img\b[^>]*>/gi))) assert.match(image[0], /\balt\s*=/i, file)
  }
})

test('directory search/filter pages stay noindex with a clean canonical', () => {
  for (const searchParams of [{ category: 'AI Video' }, { q: 'pictory' }, { category: 'AI Video', q: 'pictory' }]) {
    const metadata = directoryMetadata({ searchParams })
    assert.deepEqual(metadata.robots, { index: false, follow: true })
    assert.deepEqual(metadata.alternates, { canonical: '/directory' })
  }
  assert.deepEqual(directoryMetadata({}).robots, { index: true, follow: true })
})

test('all protected workspace pages retain shared noindex and nofollow metadata', () => {
  assert.deepEqual(privateBusinessRobots, { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } })
  for (const path of [...BUSINESS_PRIVATE_PREFIXES, ...Array.from(BUSINESS_AUTHENTICATED_PATHS), '/business/workflows/[id]']) {
    const source = readFileSync('app' + path + '/page.tsx', 'utf8')
    assert.match(source, /robots:\s*privateBusinessRobots/, path)
    assert.match(source, /import.*privateBusinessRobots.*business\/metadata/, path)
  }
  for (const route of ['sign-in', 'sign-up', 'forgot-password', 'reset-password']) {
    assert.match(readFileSync('app/business/' + route + '/page.tsx', 'utf8'), /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/, route)
  }
})

test('unauthenticated workspace requests redirect to sign-in without exposing workspace content', async () => {
  const saved = process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    for (const path of [...BUSINESS_PRIVATE_PREFIXES, ...Array.from(BUSINESS_AUTHENTICATED_PATHS), '/business/workflows/example']) {
      const response = await middleware(new NextRequest('https://www.aibeat.dev' + path, { headers: { host: 'www.aibeat.dev' } }))
      assert.equal(response.status, 307, path)
      const destination = new URL(response.headers.get('location')!)
      assert.equal(destination.pathname, '/business/sign-in')
      assert.equal(destination.searchParams.get('next'), path)
    }
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = saved
  }
})
