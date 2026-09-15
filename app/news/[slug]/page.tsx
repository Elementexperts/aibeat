import { articleMetadata, articleSchema, articleBreadcrumbs, articleSources, modifiedDate } from '@/lib/article-seo'
import { jsonLd } from '@/lib/site-seo'
import { articleMentionsTool } from '@/lib/tool-seo'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { NewsImage } from '@/components/ui/NewsImage'
import { TOOLS, CATEGORY_COLORS } from '@/lib/data'
import { getArticleBySlug, getArticles } from '@/lib/articles'
import type { Metadata } from 'next'
import { ToolLogo } from '@/components/ui/ToolLogo'
import { ToolShareLinks } from '@/components/ui/ToolShareLinks'
import { SubscribeForm } from '@/components/subscribe/SubscribeForm'

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)
  if (!article) return {}
  return articleMetadata(article)
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const [article, allArticles] = await Promise.all([
    getArticleBySlug(params.slug),
    getArticles(),
  ])
  if (!article) notFound()

  const relatedTools = TOOLS.filter(tool => articleMentionsTool(article, tool)).slice(0, 5)
  const sources = articleSources(article)
  const moreArticles = allArticles.filter(a => a.slug !== article.slug && a.category === article.category).slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([articleSchema(article), articleBreadcrumbs(article)]) }} />
      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-ink">AI News</Link>
        <span>/</span>
        <span className="text-ink truncate">{article.title.slice(0, 40)}...</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">

        {/* ARTICLE */}
        <article>
          <div className="flex items-center gap-2 mb-4">
            <span className={`cat-tag ${CATEGORY_COLORS[article.category]}`}>{article.category}</span>
            <time dateTime={article.publishedAt} className="font-mono text-[10px] text-ink-4">{article.publishedAt.slice(0, 10)}</time>
            <span className="font-mono text-[10px] text-ink-4">· {article.readTime} min read</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-ink mb-4">
            {article.title}
          </h1>
          <p className="text-base text-ink-2 leading-relaxed border-l-2 border-beat-red pl-4 mb-6">
            {article.deck}
          </p>
          <div className="font-mono text-xs text-ink-4 mb-6 pb-4 border-b border-border">
            By {article.author.startsWith('AIBeat') ? <Link href="/about">{article.author}</Link> : article.author}
            {article.updatedAt && modifiedDate(article) !== article.publishedAt && <> · Updated <time dateTime={modifiedDate(article)}>{article.updatedAt.slice(0, 10)}</time></>}
          </div>

          <figure className="mb-6">
            <NewsImage src={article.coverImageUrl} title={article.title} alt={article.coverImageAlt} width={article.coverImageWidth} height={article.coverImageHeight} priority />
            {article.coverImageUrl?.startsWith('/news-images/') && article.coverImageSource !== 'placeholder' && (
              <figcaption className="text-xs text-ink-4">
                {article.coverImageSource === 'ai' ? 'AI-generated illustration' : 'Source image'}
                {article.coverImageSource === 'og' && /^https?:\/\//.test(article.coverImageSourceUrl || '') && (
                  <> · <a href={article.coverImageSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Original source</a></>
                )}
              </figcaption>
            )}
          </figure>

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

          {sources.length > 0 && <section aria-labelledby="article-sources" className="mt-8 text-sm">
            <h2 id="article-sources" className="font-serif text-xl font-bold mb-3">Sources</h2>
            <ul className="list-disc pl-5 space-y-2">{sources.map(source => <li key={source.url}><a href={source.url} className="underline" rel="noopener noreferrer" target="_blank">{source.name}</a></li>)}</ul>
          </section>}
          {/* AFFILIATE DISCLOSURE */}
          <div className="mt-8 p-3 bg-paper-2 border border-border text-[11px] text-ink-4 font-mono">
            Disclosure: Some links in this article are affiliate links. AIBeat.dev earns a commission if you sign up — at no extra cost to you. We never let affiliate relationships influence our editorial judgments.
          </div>
        </article>

        {/* SIDEBAR */}
        <div className="space-y-4">
          <ToolShareLinks
            name={article.title}
            path={`/news/${article.slug}`}
            tagline={article.deck}
            heading="Share this story"
            description="Link readers back to the AIBeat article page."
            subject={article.title}
          />

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <div className="border border-border p-4">
              <div className="section-label">Tools mentioned</div>
              {relatedTools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                  <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 card-hover">
                    <ToolLogo tool={tool} className="w-8 h-8 rounded text-xs" imageClassName="p-1" />
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
            <SubscribeForm dark buttonLabel="Subscribe →" className="[&_div]:flex-col [&_div]:gap-2 [&_button]:w-full [&_input]:w-full" />
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
