import { SITE_URL } from './site-seo'

export function indexNowPayload(key: string, urls: string[]) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow key')
  const urlList = Array.from(new Set(urls)).filter((value) => {
    try {
      const url = new URL(value)
      return url.origin === SITE_URL && /^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname) && !url.search && !url.hash
    } catch { return false }
  }).slice(0, 10000)
  return { host: 'www.aibeat.dev', key, keyLocation: `${SITE_URL}/indexnow-key.txt`, urlList }
}

export async function submitIndexNow(key: string, urls: string[], fetcher: typeof fetch = fetch) {
  try {
    const payload = indexNowPayload(key, urls)
    if (!payload.urlList.length) return { submitted: 0 }
    const response = await fetcher('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10000),
    })
    if (response.status !== 200 && response.status !== 202) throw new Error(`IndexNow returned ${response.status}`)
    return { submitted: payload.urlList.length }
  } catch (error) {
    return { submitted: 0, error: error instanceof Error ? error.message : 'IndexNow unavailable' }
  }
}
