export const dynamic = 'force-dynamic'
export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return new Response('Not configured', { status: 404 })
  // IndexNow verification keys are intentionally public. No other env values are exposed.
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
