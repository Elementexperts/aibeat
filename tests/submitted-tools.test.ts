import test from 'node:test'
import assert from 'node:assert/strict'
import { TOOLS, getFeaturedTools, getPopularTools, getToolRatingLabel, getToolPopularityScore } from '../lib/data'
import { SUBMITTED_TOOLS } from '../data/submitted-tools'

test('reviewed submissions are unique listings with valid internal alternatives', () => {
  assert.equal(SUBMITTED_TOOLS.length, 29)
  assert.equal(new Set(TOOLS.map(t => t.slug)).size, TOOLS.length)
  for (const tool of SUBMITTED_TOOLS) {
    assert.equal(TOOLS.filter(t => t.slug === tool.slug).length, 1)
    assert.equal(TOOLS.filter(t => new URL(t.websiteUrl).hostname.replace(/^www\./, '') === new URL(tool.websiteUrl).hostname.replace(/^www\./, '')).length, 1)
    assert.equal(getFeaturedTools().some(t => t.slug === tool.slug), tool.featured)
    assert.equal(tool.affiliateUrl, tool.websiteUrl)
    assert.equal(new URL(tool.websiteUrl).protocol, 'https:')
    for (const slug of tool.alternatives) assert.ok(TOOLS.some(t => t.slug === slug), slug)
  }
  assert.deepEqual(getFeaturedTools().slice(0, 4).map(t => t.slug), SUBMITTED_TOOLS.filter(t => t.featured).slice(0, 4).map(t => t.slug))
  assert.equal(TOOLS.filter(t => t.slug === 'toolsvio').length, 1)
  assert.ok(getFeaturedTools().some(t => t.slug === 'toolsvio'))
  const preview = TOOLS.find(t => t.slug === 'removebgtools')!
  assert.match(preview.tagline, /still in development/)
  assert.match(preview.pricing, /not yet available/)
  assert.equal(TOOLS.find(t => t.slug === 'modelrush')?.pricingType, 'paid')
})

test('unscored listings display no invented score and keep ranking finite', () => {
  for (const tool of SUBMITTED_TOOLS) {
    assert.equal(tool.rating, null)
    assert.equal(getToolRatingLabel(tool), 'Not yet rated')
    assert.ok(Number.isFinite(getToolPopularityScore(tool)))
  }
  assert.equal(getToolRatingLabel({ rating: 4.5 }), 'AIBeat Score 4.5')
  assert.equal(getPopularTools().length, TOOLS.length)
})

test('requested featured listings and PawCinema identity are correct', () => {
  for (const slug of ['openfate', 'pregnancy-ai']) assert.ok(getFeaturedTools().some(t => t.slug === slug));
  assert.equal(TOOLS.find(t => t.slug === 'pawcinema')?.name, 'PawCinema');
  assert.ok(!TOOLS.some(t => t.slug === 'support-pawcinema-com'));
});

test('Currawong Web remains a standard unscored listing', () => {
  const tool = TOOLS.find(t => t.slug === 'currawong-web');
  assert.ok(tool);
  assert.equal(tool.featured, false);
  assert.equal(tool.rating, null);
  assert.equal(tool.name, 'Currawong Web');
});


test('ShopChief has one standard listing with factual signup credits and no invented score', () => {
  const tool = TOOLS.find(t => t.slug === 'shopchief')!
  assert.ok(tool)
  assert.equal(tool.featured, false)
  assert.equal(tool.rating, null)
  assert.match(tool.pricing, /1,500 free signup credits/)
  assert.equal(tool.websiteUrl, 'https://shopchief.ai/')
})
