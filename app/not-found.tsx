import Link from 'next/link'
import { ARTICLES } from '@/lib/data'

export default function NotFound() {
  const recentArticles = ARTICLES.slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* 404 HERO */}
      <div className="px-6 py-14 md:py-20 text-center border-b-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-4">Edition 404</div>
        <h1 className="font-serif text-7xl md:text-9xl font-black text-ink leading-none mb-2">404</h1>
        <p className="font-serif text-2xl md:text-3xl text-ink-2 mb-3">Story Not Found</p>
        <p className="text-sm text-ink-3 max-w-md mx-auto mb-8 leading-relaxed">
          This page has been moved, deleted, or never existed.
          It happens in the best newsrooms.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="font-mono text-xs text-white bg-ink px-6 py-3 hover:bg-beat-red transition-colors"
          >
            ← Back to homepage
          </Link>
          <Link
            href="/news"
            className="font-mono text-xs border border-border px-6 py-3 hover:bg-paper-2 transition-colors text-ink-2"
          >
            Browse latest news
          </Link>
          <Link
            href="/directory"
            className="font-mono text-xs border border-border px-6 py-3 hover:bg-paper-2 transition-colors text-ink-2"
          >
            Tool directory
          </Link>
        </div>
      </div>

      {/* RECOVERY — recent articles */}
      <div className="border-b border-border">
        <div className="px-6 pt-5 pb-3">
          <div className="section-label">You might want to read instead</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {recentArticles.map((article, i) => (
            <Link key={article.slug} href={`/news/${article.slug}`}>
              <div className={`p-5 border-b md:border-b-0 border-border card-hover ${i < 2 ? 'md:border-r' : ''}`}>
                <div className="font-mono text-[10px] text-beat-red uppercase tracking-widest mb-2">
                  {article.category}
                </div>
                <h2 className="headline-md hover:text-beat-red transition-colors mb-2">{article.title}</h2>
                <p className="text-xs text-ink-3 leading-relaxed line-clamp-2">{article.deck}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SEARCH SUGGESTION */}
      <div className="px-6 py-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-xs text-ink-3">Looking for a specific tool or article?</p>
        <Link
          href="/directory"
          className="font-mono text-xs text-beat-red hover:underline"
        >
          Search the tool directory →
        </Link>
      </div>
    </div>
  )
}
