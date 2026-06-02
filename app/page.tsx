import Link from 'next/link'
import {
  TOOLS, TRENDING,
  getFeaturedTools,
  CATEGORY_COLORS
} from '@/lib/data'
import { getArticles } from '@/lib/articles'
import { NewsletterBox } from '@/components/ui/NewsletterBox'

export const revalidate = 3600 // refresh page every hour

export default async function HomePage() {
  const articles      = await getArticles()
  const heroStory     = articles.find((a) => a.featured) ?? articles[0]
  const subStories    = articles.filter((a) => a.slug !== heroStory.slug).slice(0, 4)
  const featuredTools = getFeaturedTools()

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">

        {/* LEFT — STORIES */}
        <div className="border-r border-border">

          {/* HERO STORY */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className={`cat-tag ${CATEGORY_COLORS[heroStory.category]}`}>
                {heroStory.category}
              </span>
              <span className="font-mono text-[10px] text-ink-4">2 hours ago</span>
            </div>
            {/* Hero image placeholder */}
            <div className="w-full h-44 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-sm mb-4 flex items-center justify-center relative overflow-hidden">
              <span className="font-serif text-5xl font-black text-white/10 tracking-tight">AI</span>
              <span className="absolute bottom-2 left-2 bg-beat-red text-white text-[10px] px-2 py-0.5 font-mono">EXCLUSIVE</span>
            </div>
            <Link href={`/news/${heroStory.slug}`}>
              <h1 className="headline-hero hover:text-beat-red transition-colors cursor-pointer mb-3">
                {heroStory.title}
              </h1>
            </Link>
            <p className="text-sm text-ink-2 leading-relaxed mb-3">{heroStory.deck}</p>
            <div className="flex items-center gap-3 font-mono text-[10px] text-ink-4">
              <span>{heroStory.author}</span>
              <span>·</span>
              <span>{heroStory.readTime} min read</span>
              <span>·</span>
              <span>4,231 readers</span>
            </div>
          </div>

          {/* SUB STORIES */}
          {subStories.map((article, i) => (
            <Link key={article.slug} href={`/news/${article.slug}`}>
              <div className="flex gap-3 p-5 border-b border-border card-hover">
                <span className="font-mono text-lg font-medium text-border-dark min-w-[28px] leading-tight">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <h2 className="headline-md hover:text-beat-red transition-colors mb-2">
                    {article.title}
                  </h2>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-ink-4">
                    <span className={`cat-tag ${CATEGORY_COLORS[article.category]} text-[9px] py-0.5 px-1.5`}>
                      {article.category}
                    </span>
                    <span>Yesterday</span>
                    <span>·</span>
                    <span>{article.readTime} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          {/* Newsletter */}
          <div className="bg-ink p-5 text-white">
            <h3 className="font-serif text-xl font-bold mb-1.5 leading-tight">
              The AI Beat.<br />Daily.
            </h3>
            <p className="text-xs text-ink-4 mb-4 leading-relaxed">
              Join 8,400+ founders and freelancers getting AI news + top tool picks every morning. Free.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-transparent border border-ink-3 text-white text-xs px-3 py-2 mb-2 outline-none placeholder:text-ink-4"
            />
            <button className="w-full bg-beat-red text-white text-xs py-2 font-semibold hover:bg-red-700 transition-colors">
              Get the daily brief →
            </button>
            <p className="font-mono text-[10px] text-ink-4 mt-2">Free. No spam. Unsubscribe anytime.</p>
          </div>

          {/* Trending */}
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

          {/* Top Tools */}
          <div className="p-4">
            <div className="section-label">Top tools this week</div>
            {featuredTools.slice(0, 4).map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <div className="flex gap-2.5 py-2.5 border-b border-border last:border-0 card-hover">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: tool.logo }}
                  >
                    {tool.logoInitials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink">{tool.name}</div>
                    <div className="text-[11px] text-ink-3 leading-snug">{tool.tagline}</div>
                    <div className="font-mono text-[10px] text-beat-green mt-0.5">
                      ★ {tool.rating} · {tool.pricing}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM STORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t-2 border-ink">
        {articles.slice(4, 7).map((article, i) => (
          <Link key={article.slug} href={`/news/${article.slug}`}>
            <div className={`p-5 border-b border-border md:border-b-0 ${i < 2 ? 'md:border-r border-border' : ''} card-hover`}>
              <div className={`font-mono text-[10px] font-medium tracking-widest uppercase mb-2 ${
                article.category === 'breaking' ? 'text-beat-red' :
                article.category === 'tools' ? 'text-beat-green' : 'text-beat-blue'
              }`}>
                {article.category}
              </div>
              <h3 className="headline-md hover:text-beat-red transition-colors mb-2">{article.title}</h3>
              <p className="text-xs text-ink-3 leading-relaxed line-clamp-2">{article.deck}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* TOOLS DIRECTORY SECTION */}
      <div className="border-t-2 border-ink">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Featured in the directory</h2>
          <Link href="/directory" className="font-mono text-[11px] text-beat-red hover:underline">
            Browse all 500+ tools →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {featuredTools.map((tool, i) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <div className={`p-4 border-b border-border card-hover ${i % 4 !== 3 ? 'md:border-r' : ''} border-border`}>
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold text-white mb-3"
                  style={{ background: tool.logo }}
                >
                  {tool.logoInitials}
                </div>
                <div className="text-sm font-semibold text-ink mb-0.5">{tool.name}</div>
                <div className="font-mono text-[10px] text-ink-4 uppercase tracking-wide mb-1.5">{tool.category}</div>
                <p className="text-[11px] text-ink-3 leading-relaxed mb-2 line-clamp-2">{tool.tagline}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-yellow-600">★ {tool.rating}</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                    tool.pricingType === 'free' ? 'bg-beat-green-light text-beat-green' :
                    tool.pricingType === 'freemium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-paper-3 text-ink-2'
                  }`}>
                    {tool.pricingType === 'free' ? 'Free' : tool.pricingType === 'freemium' ? 'Freemium' : tool.pricing}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
