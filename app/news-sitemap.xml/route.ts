import { getArticles } from '@/lib/articles'
import { newsSitemap } from '@/lib/news-feeds'

// Evaluate the rolling 48-hour window on each request, even without a new deployment.
export const dynamic = 'force-dynamic'
export function GET() {
  return new Response(newsSitemap(getArticles()), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } })
}
