import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TOOLS, CATEGORY_COLORS } from '@/lib/data'
import { getArticleBySlug, getArticles } from '@/lib/sanity'
import type { Metadata } from 'next'

export const revalidate = 3600 // refresh page every hour

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.deck,
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const [article, allArticles] = await Promise.all([
    getArticleBySlug(params.slug),
    getArticles(),
  ])
  if (!article) notFound()

  const relatedTools = article.relatedTools?.map((slug: string) => TOOLS.find(t => t.slug === slug)).filter(Boolean) || []
  const moreArticles = allArticles.filter(a => a.slug !== article.slug).slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-ink">News</Link>
        <span>/</span>
        <span className="text-ink truncate">{article.title.slice(0, 40)}...</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">

        {/* ARTICLE */}
        <article>
          <div className="flex items-center gap-2 mb-4">
            <span className={`cat-tag ${CATEGORY_COLORS[article.category]}`}>{article.category}</span>
            <span className="font-mono text-[10px] text-ink-4">{article.publishedAt}</span>
            <span className="font-mono text-[10px] text-ink-4">· {article.readTime} min read</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-ink mb-4">
            {article.title}
          </h1>
          <p className="text-base text-ink-2 leading-relaxed border-l-2 border-beat-red pl-4 mb-6">
            {article.deck}
          </p>
          <div className="font-mono text-xs text-ink-4 mb-6 pb-4 border-b border-border">
            By {article.author}
          </div>

          {article.content ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <div className="article-body">
              <p>Full article content coming soon.</p>
            </div>
          )}

          {/* AFFILIATE DISCLOSURE */}
          <div className="mt-8 p-3 bg-paper-2 border border-border text-[11px] text-ink-4 font-mono">
            Disclosure: Some links in this article are affiliate links. AIBeat.dev earns a commission if you sign up — at no extra cost to you. We never let affiliate relationships influence our editorial judgments.
          </div>
        </article>

        {/* SIDEBAR */}
        <div className="space-y-4">

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <div className="border border-border p-4">
              <div className="section-label">Tools mentioned</div>
              {relatedTools.map((tool: any) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 card-hover">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: tool.logo }}>
                      {tool.logoInitials}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{tool.name}</div>
                      <div className="text-[10px] text-ink-4">{tool.pricing}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Newsletter */}
          <div className="bg-ink p-4 text-white">
            <div className="font-serif text-lg font-bold mb-1">Get the daily brief</div>
            <p className="text-xs text-ink-4 mb-3">AI news + top tools every morning. Free.</p>
            <input type="email" placeholder="your@email.com" className="w-full bg-transparent border border-ink-3 text-white text-xs px-3 py-2 mb-2 outline-none placeholder:text-ink-4" />
            <button className="w-full bg-beat-red text-white text-xs py-2 font-semibold">Subscribe →</button>
          </div>

          {/* More Articles */}
          <div className="border border-border p-4">
            <div className="section-label">More from AIBeat</div>
            {moreArticles.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`}>
                <div className="py-2.5 border-b border-border last:border-0 card-hover">
                  <div className="text-xs font-semibold text-ink leading-snug hover:text-beat-red transition-colors">{a.title}</div>
                  <div className="font-mono text-[10px] text-ink-4 mt-1">{a.readTime} min read</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
