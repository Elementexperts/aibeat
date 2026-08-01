import Link from 'next/link'
import { TRENDING, getFeaturedTools, CATEGORY_COLORS } from '@/lib/data'
import type { Category } from '@/lib/data'
import { getArticles } from '@/lib/articles'
import { NewsBanner } from '@/components/ui/NewsBanner'
import { NewsletterBox } from '@/components/ui/NewsletterBox'
import { ToolLogo } from '@/components/ui/ToolLogo'
import type { Metadata } from 'next'

const ARTICLES_PER_PAGE = 10
const CATEGORY_LABELS: Record<Category, string> = {
  breaking: 'Breaking',
  news: 'News',
  tools: 'Tools',
  compare: 'Compare',
  'deep-dive': 'Deep Dive',
}

export const metadata: Metadata = {
  title: 'AI News - AIBeat.dev',
  description: 'Breaking AI news, tool launches, and analysis for founders and freelancers. Updated daily.',
}

function isCategory(value: string | undefined): value is Category {
  return Boolean(value && value in CATEGORY_LABELS)
}

function categoryHref(category?: Category) {
  return category ? `/news?category=${category}` : '/news'
}

function pageHref(page: number, category?: Category) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/news?${query}` : '/news'
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { category?: string; page?: string }
}) {
  const articles = await getArticles()

  if (articles.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink mb-4">First articles coming soon</h1>
        <p className="text-ink-3 text-sm">The automation runs 3x daily - check back shortly.</p>
      </div>
    )
  }

  const selectedCategory = isCategory(searchParams?.category) ? searchParams?.category : undefined
  const requestedPage = Number(searchParams?.page ?? '1')
  const categoryCounts = articles.reduce<Record<Category, number>>((counts, article) => {
    counts[article.category] = (counts[article.category] ?? 0) + 1
    return counts
  }, { breaking: 0, news: 0, tools: 0, compare: 0, 'deep-dive': 0 })

  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles
  const heroArticle = filteredArticles[0]
  const archiveArticles = filteredArticles.slice(1)
  const totalPages = Math.max(1, Math.ceil(archiveArticles.length / ARTICLES_PER_PAGE))
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages)
  const pageStart = (currentPage - 1) * ARTICLES_PER_PAGE
  const pagedArticles = archiveArticles.slice(pageStart, pageStart + ARTICLES_PER_PAGE)
  const featuredTools = getFeaturedTools()
  const activeLabel = selectedCategory ? CATEGORY_LABELS[selectedCategory] : 'All News'

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">
      <div className="px-6 py-5 border-b-2 border-ink flex items-end justify-between gap-5">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-beat-red">Home</Link>
            <span className="mx-1">/</span>
            <span>News</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink">AI News</h1>
        </div>
        <p className="text-xs text-ink-3 max-w-xs text-right hidden md:block">
          Breaking AI news, tool launches, and analysis - updated daily.
        </p>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-border bg-paper-2 px-6">
        <Link
          href="/news"
          className={`border-r border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors first:border-l ${
            !selectedCategory ? 'bg-ink text-white' : 'text-ink-3 hover:text-beat-red'
          }`}
        >
          All ({articles.length})
        </Link>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
          <Link
            key={category}
            href={categoryHref(category)}
            className={`border-r border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              selectedCategory === category ? 'bg-ink text-white' : 'text-ink-3 hover:text-beat-red'
            }`}
          >
            {CATEGORY_LABELS[category]} ({categoryCounts[category]})
          </Link>
        ))}
      </div>

      {heroArticle ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
          <div className="border-r border-border">
            {currentPage === 1 && (
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`cat-tag ${CATEGORY_COLORS[heroArticle.category]}`}>
                    {heroArticle.category}
                  </span>
                  <span className="font-mono text-[10px] text-ink-4">{heroArticle.publishedAt}</span>
                </div>
                <NewsBanner category={heroArticle.category} title={heroArticle.title} />
                <Link href={`/news/${heroArticle.slug}`}>
                  <h2 className="headline-hero hover:text-beat-red transition-colors cursor-pointer mb-3">
                    {heroArticle.title}
                  </h2>
                </Link>
                <p className="text-sm text-ink-2 leading-relaxed mb-3">{heroArticle.deck}</p>
                <div className="flex items-center gap-3 font-mono text-[10px] text-ink-4">
                  <span>{heroArticle.author}</span>
                  <span>.</span>
                  <span>{heroArticle.readTime} min read</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-paper-2">
              <div>
                <div className="section-label mb-0 pb-0 border-0">Older stories</div>
                <p className="mt-1 text-[11px] text-ink-4">
                  {activeLabel} archive, page {currentPage} of {totalPages}
                </p>
              </div>
              <span className="font-mono text-[10px] text-ink-4">
                {archiveArticles.length} stories
              </span>
            </div>

            {pagedArticles.length > 0 ? (
              pagedArticles.map((article, i) => (
                <Link key={article.slug} href={`/news/${article.slug}`}>
                  <div className="flex gap-3 p-5 border-b border-border card-hover">
                    <span className="font-mono text-lg font-medium text-border-dark min-w-[28px] leading-tight">
                      {String(pageStart + i + 2).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <h2 className="headline-md hover:text-beat-red transition-colors mb-2">
                        {article.title}
                      </h2>
                      <p className="text-xs text-ink-3 leading-relaxed mb-2 line-clamp-2">{article.deck}</p>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-ink-4">
                        <span className={`cat-tag ${CATEGORY_COLORS[article.category]} text-[9px] py-0.5 px-1.5`}>
                          {article.category}
                        </span>
                        <span>{article.publishedAt}</span>
                        <span>.</span>
                        <span>{article.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 border-b border-border text-sm text-ink-3">
                No older stories in this category yet.
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-5">
                <Link
                  href={pageHref(Math.max(1, currentPage - 1), selectedCategory)}
                  aria-disabled={currentPage === 1}
                  className={`border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                    currentPage === 1 ? 'pointer-events-none text-ink-4 opacity-50' : 'text-ink-2 hover:border-ink hover:text-ink'
                  }`}
                >
                  Previous
                </Link>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Link
                      key={page}
                      href={pageHref(page, selectedCategory)}
                      aria-current={page === currentPage ? 'page' : undefined}
                      className={`flex h-8 w-8 items-center justify-center border font-mono text-[11px] transition-colors ${
                        page === currentPage
                          ? 'border-ink bg-ink text-white'
                          : 'border-border text-ink-3 hover:border-ink hover:text-ink'
                      }`}
                    >
                      {page}
                    </Link>
                  ))}
                </div>
                <Link
                  href={pageHref(Math.min(totalPages, currentPage + 1), selectedCategory)}
                  aria-disabled={currentPage === totalPages}
                  className={`border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                    currentPage === totalPages ? 'pointer-events-none text-ink-4 opacity-50' : 'text-ink-2 hover:border-ink hover:text-ink'
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </div>

          <div>
            <NewsletterBox dark />

            <div className="p-4 border-b border-border">
              <div className="section-label">Old news by category</div>
              <Link href="/news" className="flex items-center justify-between py-2 border-b border-border text-xs card-hover">
                <span className="text-ink-2">All stories</span>
                <span className="font-mono text-[10px] text-ink-4">{articles.length}</span>
              </Link>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                <Link
                  key={category}
                  href={categoryHref(category)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 text-xs card-hover"
                >
                  <span className="text-ink-2">{CATEGORY_LABELS[category]}</span>
                  <span className="font-mono text-[10px] text-ink-4">{categoryCounts[category]}</span>
                </Link>
              ))}
            </div>

            <div className="p-4 border-b border-border">
              <div className="section-label">Trending searches</div>
              {TRENDING.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 card-hover text-xs">
                    <span className="font-mono text-[10px] text-ink-4 min-w-[16px]">{i + 1}</span>
                    <span className="flex-1 text-ink-2 leading-snug">{item.query}</span>
                    <span className={`font-mono text-[10px] font-medium ${item.change === 'BREAKOUT' ? 'text-beat-red' : 'text-beat-green'}`}>
                      {item.change}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-4">
              <div className="section-label">Top tools this week</div>
              {featuredTools.slice(0, 4).map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <div className="flex gap-2.5 py-2.5 border-b border-border last:border-0 card-hover">
                    <ToolLogo tool={tool} className="w-8 h-8 rounded text-xs" imageClassName="p-1" />
                    <div>
                      <div className="text-xs font-semibold text-ink">{tool.name}</div>
                      <div className="text-[11px] text-ink-3 leading-snug">{tool.tagline}</div>
                      <div className="font-mono text-[10px] text-beat-green mt-0.5">
                        * {tool.rating} . {tool.pricing}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">No stories found</h2>
          <p className="text-sm text-ink-3 mb-5">There are no stories in this category yet.</p>
          <Link href="/news" className="btn-primary">
            View all news
          </Link>
        </div>
      )}
    </div>
  )
}
