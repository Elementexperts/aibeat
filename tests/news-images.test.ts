import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { isPublicAddress, optimizeNewsImage, prepareNewsImage } from '../scripts/news-images'

test('news images become three bounded WebP assets with stable content-based URLs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aibeat-news-images-'))
  try {
    const input = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#164e63' } }).png().toBuffer()
    const first = await optimizeNewsImage(input, dir)
    assert.equal((await optimizeNewsImage(input, dir)).url, first.url)
    assert.match(first.url, /^\/news-images\/[a-f0-9]{20}-1200\.webp$/)
    for (const output of first.outputs) {
      const metadata = await sharp(await readFile(join(dir, output.name))).metadata()
      assert.equal(metadata.format, 'webp')
      assert.equal(metadata.width, output.width)
      assert.equal(metadata.height, Math.round(output.width * 630 / 1200))
      assert.equal(metadata.exif, undefined)
      assert.ok(output.bytes < 200_000)
    }
    const other = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ff0000' } }).png().toBuffer()
    assert.notEqual((await optimizeNewsImage(other, dir)).url, first.url)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('missing or invalid image sources fall back without blocking article publication', async () => {
  for (const url of [undefined, 'file:///private/image.png', 'http://127.0.0.1/image.png']) {
    const image = await prepareNewsImage({ url })
    assert.deepEqual(image, { url: '/news-images/fallback.svg', source: 'placeholder', sourceUrl: '' })
  }
})

test('image download rejects private and local address ranges', () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '192.168.1.2', '169.254.169.254', '172.16.0.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(isPublicAddress(address), false, address)
  assert.equal(isPublicAddress('8.8.8.8'), true)
  assert.equal(isPublicAddress('192.0.66.220'), true)
  assert.equal(isPublicAddress('2606:4700::1111'), true)
})
