import { getArticles } from '@/lib/articles'
import { rssFeed } from '@/lib/news-feeds'

export const dynamic = 'force-dynamic'
export function GET() {
  return new Response(rssFeed(getArticles()), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' } })
}
