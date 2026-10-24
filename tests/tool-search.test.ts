import test from 'node:test'
import assert from 'node:assert/strict'
import { isExactToolMatch, matchesToolSearch, searchTools } from '../lib/tool-search'

const tools = [
  { name: 'Other', slug: 'other', tagline: 'ChatGPT companion', category: 'Research', description: 'Document summaries and citations.' },
  { name: 'ChatGPT', slug: 'chatgpt', tagline: 'AI assistant', category: 'AI Chat', description: 'Writing and coding.' },
  { name: 'Image Studio', slug: 'image-studio', tagline: 'Create images', category: 'Design', description: 'Marketing workflows.' },
]

test('exact normalized name or slug appears before descriptive matches without mutating catalog', () => {
  assert.deepEqual(searchTools(tools, ' CHATGPT '), [tools[1], tools[0]])
  assert.equal(isExactToolMatch(tools[2], 'image-studio'), true)
  assert.equal(isExactToolMatch(tools[0], 'ChatGPT'), false)
  assert.equal(tools[0].slug, 'other')
})

test('keywords match across name, category, tagline and description', () => {
  assert.deepEqual(searchTools(tools, 'design marketing'), [tools[2]])
  assert.deepEqual(searchTools(tools, 'research citations'), [tools[0]])
  assert.equal(matchesToolSearch(tools[1], 'AI   coding'), true)
  assert.equal(matchesToolSearch(tools[1], 'coding video'), false)
})

test('empty search retains catalog order and literal punctuation is not a regex', () => {
  assert.deepEqual(searchTools(tools, ''), tools)
  assert.deepEqual(searchTools(tools, '.*'), [])
  assert.deepEqual(searchTools(tools, '<script>'), [])
})

test('search normalization handles Unicode compatibility and missing optional fields', () => {
  assert.equal(matchesToolSearch(tools[1], 'ＣｈａｔＧＰＴ'), true)
  assert.equal(matchesToolSearch({ name: 'Café', tagline: 'Notes', category: 'Writing' }, 'CAFÉ'), true)
})
