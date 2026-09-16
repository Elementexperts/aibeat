import { Rejection } from './types'

export function safeLabel(value: string) { return value.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').slice(0, 160) }
// Deliberately omit userinfo, query strings and fragments from diagnostic URLs.
export function diagnosticUrl(value: string) {
  try { const url = new URL(value); return safeLabel(url.origin + url.pathname) } catch { return 'invalid-url' }
}
export function failureDetail(error: unknown) {
  if (error instanceof Rejection) return `${error.reason}${error.detail ? ': ' + safeLabel(error.detail) : ''}`
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return 'TIMEOUT'
  const code = (error as { cause?: { code?: string }; code?: string })?.cause?.code || (error as { code?: string })?.code
  if (code && /^(ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|UND_ERR_CONNECT_TIMEOUT)$/.test(code)) return code
  return 'NETWORK_OR_PARSE_ERROR'
}
