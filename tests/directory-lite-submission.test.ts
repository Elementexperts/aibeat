import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DIRECTORY_LITE_SUBMISSION_CATEGORIES, validateDirectoryLiteSubmission,
  type DirectoryLiteSubmissionField,
} from '../lib/directory-lite-submission'

const valid = Object.freeze({
  name: 'Example Product', url: 'https://example.com/product',
  shortDescription: 'A useful product for editing documents.', category: 'Developer Tools',
  email: 'founder@example.com', consent: true,
})
const fields: readonly DirectoryLiteSubmissionField[] = ['name', 'url', 'shortDescription', 'category', 'email']
function errors(input: unknown) {
  const result = validateDirectoryLiteSubmission(input)
  assert.equal(result.ok, false)
  if (result.ok) throw new Error('Expected validation errors')
  return result.errors
}

test('minimum valid input returns exactly the five normalized fields and explicit consent', () => {
  assert.deepEqual(validateDirectoryLiteSubmission(valid), { ok: true, value: valid })
})

test('outer whitespace trims, email lowercases and internal product spacing is preserved', () => {
  const result = validateDirectoryLiteSubmission({ ...valid, name: '  Example  Product  ',
    shortDescription: '\u00a0A useful  product for editing documents.\u00a0',
    category: ' Developer Tools ', email: ' FOUNDER@EXAMPLE.COM ', url: ' HTTPS://WWW.Example.COM:443/Product?q=one#section ' })
  assert.deepEqual(result, { ok: true, value: { ...valid, name: 'Example  Product',
    shortDescription: 'A useful  product for editing documents.', url: 'https://www.example.com/Product?q=one' } })
})

test('existing eleven Nitro 1A categories are accepted without inventing taxonomy', () => {
  assert.deepEqual([...DIRECTORY_LITE_SUBMISSION_CATEGORIES], ['AI Writing', 'AI Image', 'AI Video',
    'AI Audio', 'AI Agents', 'Developer Tools', 'Productivity', 'Marketing', 'Education', 'Design', 'Business'])
  for (const category of DIRECTORY_LITE_SUBMISSION_CATEGORIES) {
    assert.equal(validateDirectoryLiteSubmission({ ...valid, category }).ok, true)
  }
  assert.ok(Object.isFrozen(DIRECTORY_LITE_SUBMISSION_CATEGORIES))
})

test('HTTPS keeps path case and meaningful repeated query entries; only the fragment is removed', () => {
  const result = validateDirectoryLiteSubmission({ ...valid, url: 'https://EXAMPLE.com./App?app=one&tag=a&tag=b&utm_source=x#part' })
  assert.deepEqual(result, { ok: true, value: { ...valid, url: 'https://example.com/App?app=one&tag=a&tag=b&utm_source=x' } })
  assert.deepEqual(validateDirectoryLiteSubmission({ ...valid, url: 'https://example.com' }),
    { ok: true, value: { ...valid, url: 'https://example.com/' } })
})

test('international website domains normalize to ASCII punycode without DNS', () => {
  assert.deepEqual(validateDirectoryLiteSubmission({ ...valid, url: 'https://bücher.de/catalog#item' }),
    { ok: true, value: { ...valid, url: 'https://xn--bcher-kva.de/catalog' } })
})

test('HTTP is rejected because the compatibility contract permits HTTPS only', () => {
  assert.equal(errors({ ...valid, url: 'http://example.com' }).url, 'INVALID_URL')
})

test('each missing required field gets a fixed field-level error', () => {
  for (const field of fields) {
    const input: Record<string, unknown> = { ...valid }
    delete input[field]
    assert.deepEqual(errors(input), { [field]: 'REQUIRED' })
  }
  assert.deepEqual(errors({}), { name: 'REQUIRED', url: 'REQUIRED', shortDescription: 'REQUIRED',
    category: 'REQUIRED', email: 'REQUIRED', consent: 'CONSENT_REQUIRED' })
})

test('empty and whitespace-only fields fail without coercion', () => {
  for (const field of fields) for (const value of ['', '   ', '\u00a0']) {
    assert.equal(errors({ ...valid, [field]: value })[field], 'REQUIRED')
  }
})

test('wrong field types are rejected without calling toString', () => {
  let calls = 0
  const object = { toString() { calls++; return 'not a field' } }
  for (const field of fields) for (const value of [undefined, null, 1, false, [], {}, object]) {
    assert.equal(errors({ ...valid, [field]: value })[field], 'INVALID_TYPE')
  }
  assert.equal(calls, 0)
})

test('name and short-description minimum and maximum boundaries match Nitro 1A', () => {
  for (const [name, shortDescription] of [['xx', 'x'.repeat(10)], ['x'.repeat(100), 'x'.repeat(280)]]) {
    assert.equal(validateDirectoryLiteSubmission({ ...valid, name, shortDescription }).ok, true)
  }
  for (const name of ['x', 'x'.repeat(101)]) assert.equal(errors({ ...valid, name }).name, 'INVALID_LENGTH')
  for (const shortDescription of ['x'.repeat(9), 'x'.repeat(281)]) {
    assert.equal(errors({ ...valid, shortDescription }).shortDescription, 'INVALID_LENGTH')
  }
})

test('text lengths use UTF-16 code units and do not truncate Unicode', () => {
  assert.equal(validateDirectoryLiteSubmission({ ...valid, name: '😀'.repeat(50) }).ok, true)
  assert.equal(errors({ ...valid, name: '😀'.repeat(51) }).name, 'INVALID_LENGTH')
  assert.equal(validateDirectoryLiteSubmission({ ...valid, name: 'Café 中文' }).ok, true)
})

test('URL input length is bounded and normalization cannot expand past the output bound', () => {
  const prefix = 'https://example.com/'
  assert.equal(validateDirectoryLiteSubmission({ ...valid, url: prefix + 'x'.repeat(2048 - prefix.length) }).ok, true)
  assert.equal(errors({ ...valid, url: prefix + 'x'.repeat(2049 - prefix.length) }).url, 'INVALID_LENGTH')
  assert.equal(errors({ ...valid, url: prefix + 'é'.repeat(1000) }).url, 'INVALID_URL')
})

test('email length is bounded and common valid ASCII mailbox formats normalize', () => {
  const maximum = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(61)
  assert.equal(maximum.length, 254)
  assert.equal(validateDirectoryLiteSubmission({ ...valid, email: maximum }).ok, true)
  assert.equal(errors({ ...valid, email: 'x'.repeat(255) }).email, 'INVALID_LENGTH')
  assert.deepEqual(validateDirectoryLiteSubmission({ ...valid, email: ' Founder+Tools@EXAMPLE.COM ' }),
    { ok: true, value: { ...valid, email: 'founder+tools@example.com' } })
})

test('malformed mailbox formats and trailing local-part dots are rejected', () => {
  for (const email of ['a@@example.com', 'a@example', '@example.com', '.a@example.com', 'a.@example.com',
    'a..b@example.com', 'a b@example.com', 'a@-bad.com', 'a@bad-.com', 'a@foo..com', '名@example.com']) {
    assert.equal(errors({ ...valid, email }).email, 'INVALID_EMAIL')
  }
})

test('categories are case-sensitive, bounded and restricted to the supported list', () => {
  for (const category of ['ai writing', 'Other', 'AI Coding', 'Make me admin']) {
    assert.equal(errors({ ...valid, category }).category, 'INVALID_CATEGORY')
  }
  assert.equal(errors({ ...valid, category: 'x'.repeat(16) }).category, 'INVALID_LENGTH')
})

test('privacy acknowledgement must be the explicit boolean true', () => {
  for (const consent of [undefined, false, 'true', 1, null, {}]) {
    assert.deepEqual(errors({ ...valid, consent }), { consent: 'CONSENT_REQUIRED' })
  }
  const { consent: omitted, ...withoutConsent } = valid
  assert.equal(omitted, true)
  assert.deepEqual(errors(withoutConsent), { consent: 'CONSENT_REQUIRED' })
})

test('unsupported schemes, relative and malformed URLs are rejected', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'ftp://example.com',
    'mailto:founder@example.com', '//example.com', '/product', 'https://', 'https:example.com',
    'https://-bad.com', 'https://bad-.com', 'https://example..com', 'https://%zz.com', 'https://example.com/with space',
    'https://example.com\\other']) {
    assert.equal(errors({ ...valid, url }).url, 'INVALID_URL')
  }
})

test('embedded credentials, empty user info and custom ports are rejected', () => {
  for (const url of ['https://user:pass@example.com', 'https://user@example.com', 'https://@example.com',
    'https://:pass@example.com', 'https://example.com:444']) {
    assert.equal(errors({ ...valid, url }).url, 'INVALID_URL')
  }
})

test('literal IP and reserved/local hostname shapes are rejected without resolution', () => {
  for (const url of ['https://localhost', 'https://internal.local', 'https://foo.internal', 'https://foo.test',
    'https://foo.invalid', 'https://foo.example', 'https://127.0.0.1', 'https://10.0.0.1', 'https://2130706433',
    'https://0x7f000001', 'https://[::1]', 'https://[::ffff:127.0.0.1]']) {
    assert.equal(errors({ ...valid, url }).url, 'INVALID_URL')
  }
})

test('raw controls and literal markup fail on every string field, even before trimming', () => {
  for (const field of fields) for (const value of ['<script>alert(1)</script>', '\n' + valid[field],
    valid[field] + '\r', 'one\t two', 'a\0b', 'a\x7fb', 'a\u0085b']) {
    assert.equal(errors({ ...valid, [field]: value })[field], 'INVALID_TEXT')
  }
})

test('null, arrays, primitive values and non-record instances fail as structures', () => {
  for (const input of [null, undefined, [], [valid], 'text', 5, true, Symbol('fixture'), new Date(0), new URL(valid.url),
    Object.create(valid)]) {
    assert.deepEqual(errors(input), { form: 'INVALID_STRUCTURE' })
  }
})

test('unexpected fields and symbol keys are rejected without echoing their names', () => {
  for (const key of ['role', 'status', 'featured', 'submissionVersion', 'website', '__proto__', 'constructor', valid.email]) {
    assert.deepEqual(errors({ ...valid, [key]: 'untrusted' }), { form: 'UNEXPECTED_FIELDS' })
  }
  assert.deepEqual(errors({ ...valid, [Symbol('extra')]: true }), { form: 'UNEXPECTED_FIELDS' })
})

test('getters and nonenumerable fields are rejected without invoking a getter', () => {
  let reads = 0
  const getter = Object.defineProperty({ ...valid }, 'email', { enumerable: true, get() { reads++; return valid.email } })
  assert.deepEqual(errors(getter), { form: 'INVALID_STRUCTURE' })
  assert.equal(reads, 0)
  const hidden = Object.defineProperty({ ...valid }, 'email', { enumerable: false, value: valid.email })
  assert.deepEqual(errors(hidden), { form: 'INVALID_STRUCTURE' })
})

test('throwing reflection fails with a fixed result and no exception detail', () => {
  const input = new Proxy({}, { ownKeys() { throw new Error('synthetic private exception') } })
  assert.deepEqual(errors(input), { form: 'INVALID_STRUCTURE' })
})

test('null-prototype and frozen records validate without mutating or retaining the input', () => {
  const input = Object.freeze(Object.assign(Object.create(null), valid))
  const first = validateDirectoryLiteSubmission(input)
  assert.deepEqual(first, { ok: true, value: valid })
  if (!first.ok) throw new Error('Expected valid result')
  first.value.name = 'Changed result'
  assert.equal(input.name, valid.name)
  assert.deepEqual(validateDirectoryLiteSubmission(input), { ok: true, value: valid })
})

test('results are deterministic and failures contain fixed codes, never submitted values', () => {
  const input = { ...valid, email: 'private-mailbox-at-example.com', name: 'x' }
  const before = JSON.stringify(input)
  const first = validateDirectoryLiteSubmission(input)
  assert.deepEqual(first, validateDirectoryLiteSubmission(input))
  assert.deepEqual(first, { ok: false, errors: { name: 'INVALID_LENGTH', email: 'INVALID_EMAIL' } })
  assert.equal(JSON.stringify(input), before)
  assert.equal(JSON.stringify(first).includes(input.email), false)
  assert.equal('value' in first, false)
})
