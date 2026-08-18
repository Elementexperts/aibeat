import Link from 'next/link'
import { ArrowRight, Newspaper, Rocket, Search, Sparkles, Zap } from 'lucide-react'
import { TOOLS, getPopularTools } from '@/lib/data'
import { getArticles } from '@/lib/articles'
import { NewsletterBox } from '@/components/ui/NewsletterBox'
import { PremiumToolCard } from '@/components/ui/PremiumToolCard'
import { ToolLogo } from '@/components/ui/ToolLogo'
import { BusinessHomepageTeaser } from '@/components/business/BusinessHomepageTeaser'

export const revalidate = 3600

const SEARCH_SUGGESTIONS = [
  'AI agents for sales',
  'Best free image generators',
  'AI coding assistants',
  'Marketing automation tools',
  'Research copilots',
]

const DISCOVERY_ITEMS = ['New today', 'Trending', 'Editor picks', 'Open source', 'Free tools', 'Product Hunt launches', 'Founder launches', 'AIBeat Daily']

const FOUNDER_SERVICES = [
  {
    title: 'Submit a Tool',
    body: 'Add your product to the AIBeat directory and make it discoverable by category, use case, and search intent.',
    href: '/submit',
  },
  {
    title: 'Launch on AIBeat',
    body: 'Create a dedicated launch experience for a new product, major update, or public release.',
    href: '/launch',
  },
  {
    title: 'AIBeat Spotlight',
    body: 'Increase visibility through featured placement, enhanced presentation, and optional promotional exposure.',
    href: '/spotlight',
  },
  {
    title: 'Newsletter and Editorial',
    body: 'Introduce your product through a newsletter feature, editorial review, founder interview, or sponsored story.',
    href: '/advertise',
  },
]

function categorySummary() {
  const categories = Array.from(new Set(TOOLS.map((tool) => tool.category)))
  return categories.map((category) => ({
    category,
    count: TOOLS.filter((tool) => tool.category === category).length,
    tools: TOOLS.filter((tool) => tool.category === category).slice(0, 3),
  }))
}

export default async function HomePage() {
  const articles = await getArticles()
  const popularTools = getPopularTools(8)
  const categories = categorySummary()
  const heroArticle = articles[0]
  const secondaryArticles = articles.slice(1, 4)
  const toolCount = TOOLS.length
  const categoryCount = categories.length
  const articleCount = articles.length

  return (
    <div className="dark-page overflow-hidden">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
        </div>

        <div className="site-shell grid min-h-[720px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              The AI discovery platform
            </div>

            <h1 className="mt-6 max-w-5xl text-balance text-6xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
              Discover <span className="gradient-text">Tomorrow&apos;s AI</span> Today
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Explore useful AI tools, emerging startups, important industry news, and new product launches-all curated in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/directory" className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                Explore AI Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/launch" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40">
                Launch Your Product
              </Link>
              <Link href="/newsletter" className="inline-flex items-center justify-center rounded-full px-2 py-3 text-sm font-semibold text-cyan-200 transition hover:text-white">
                Join the AIBeat Newsletter
              </Link>
            </div>

            <div className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
              <div className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3">
                <Search className="h-5 w-5 text-cyan-200" />
                <span className="text-sm text-slate-400">Search tools, categories, use cases, or companies</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <Link key={suggestion} href={`/directory?query=${encodeURIComponent(suggestion)}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                    {suggestion}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { value: toolCount, label: 'Tools indexed' },
                { value: categoryCount, label: 'Categories' },
                { value: articleCount, label: 'News updates' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[560px] lg:block" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.03]" />
            <div className="hero-orbit absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-300/15" />
            <div className="hero-core absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-300 p-px shadow-[0_0_120px_rgba(34,211,238,0.28)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#080A10]">
                <Zap className="h-16 w-16 text-cyan-200" />
              </div>
            </div>
            {['Agents', 'News', 'Launches', 'Tools', 'Founders'].map((label, index) => (
              <div
                key={label}
                className="absolute rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200 shadow-2xl backdrop-blur"
                style={{
                  left: `${18 + (index % 2) * 58}%`,
                  top: `${10 + index * 17}%`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-white/10 py-4">
        <div className="discovery-marquee flex w-max gap-3 px-4">
          {[...DISCOVERY_ITEMS, ...DISCOVERY_ITEMS].map((item, index) => (
            <span key={`${item}-${index}`} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-slate-300">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="site-shell py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Popular Now</p>
            <h2 className="mt-3 text-balance text-4xl font-black text-white md:text-5xl">AI products people are exploring now</h2>
            <p className="mt-4 max-w-2xl text-slate-400">A ranked snapshot of practical AI tools and platforms with strong category fit, broad usefulness, and AIBeat editorial signal.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/launches" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300/40">View All Launches</Link>
            <Link href="/launch" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Launch on AIBeat</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {popularTools.slice(0, 5).map((tool, index) => (
            <PremiumToolCard key={tool.slug} tool={tool} variant={index === 0 ? 'featured' : 'standard'} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-20">
        <div className="site-shell">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Trending Tools</p>
              <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Tools worth comparing this week</h2>
            </div>
            <div className="flex overflow-x-auto rounded-full border border-white/10 bg-black/20 p-1 text-sm text-slate-400">
              {['Today', 'This Week', 'This Month', 'All Time'].map((tab, index) => (
                <span key={tab} className={`shrink-0 rounded-full px-4 py-2 ${index === 1 ? 'bg-white text-black' : ''}`}>{tab}</span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <PremiumToolCard tool={popularTools[0]} variant="featured" />
            <div className="grid gap-3">
              {popularTools.slice(1, 6).map((tool, index) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="premium-card flex items-center gap-4 p-4">
                  <span className="text-sm font-mono text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                  <ToolLogo tool={tool} className="h-10 w-10 rounded-xl text-xs" imageClassName="p-2" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{tool.name}</div>
                    <div className="truncate text-xs text-slate-500">{tool.tagline}</div>
                  </div>
                  <span className="hidden rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300 sm:block">{tool.category}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-20">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Category Discovery</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Browse AI by workflow</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 12).map((item, index) => (
            <Link key={item.category} href={`/directory?category=${encodeURIComponent(item.category)}`} className="premium-card group p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-white/[0.06] p-3 text-cyan-200">
                  {index % 3 === 0 ? <Sparkles className="h-5 w-5" /> : index % 3 === 1 ? <Rocket className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                </span>
                <span className="text-xs text-slate-500">{item.count} tools</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{item.category}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Explore tools for {item.category.toLowerCase()} workflows, teams, and use cases.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tools.map((tool) => (
                  <span key={tool.slug} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-400">{tool.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BusinessHomepageTeaser />

      {heroArticle && (
        <section className="border-y border-white/10 bg-white/[0.025] py-20">
          <div className="site-shell">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">AI News</p>
                <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Editorial signal for the AI industry</h2>
              </div>
              <Link href="/news" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300/40">Read the Latest AI News</Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Link href={`/news/${heroArticle.slug}`} className="premium-card p-6">
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">{heroArticle.category}</span>
                <h3 className="mt-6 text-3xl font-black leading-tight text-white md:text-5xl">{heroArticle.title}</h3>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">{heroArticle.deck}</p>
                <div className="mt-6 text-xs text-slate-500">{heroArticle.author} - {heroArticle.publishedAt} - {heroArticle.readTime} min read</div>
              </Link>
              <div className="grid gap-4">
                {secondaryArticles.map((article) => (
                  <Link key={article.slug} href={`/news/${article.slug}`} className="premium-card p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{article.category}</div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-white">{article.title}</h3>
                    <div className="mt-3 text-xs text-slate-500">{article.publishedAt} - {article.readTime} min read</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="site-shell grid gap-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-card p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">AIBeat Daily</p>
          <h2 className="mt-3 text-4xl font-black text-white">The most useful AI developments, delivered clearly.</h2>
          <p className="mt-4 text-slate-400">Get selected AI tools, important launches, and industry news without spending hours searching.</p>
          <div className="mt-6">
            <NewsletterBox dark />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {['Essential AI story', 'Tool worth trying', 'Startup to watch', 'Practical workflow'].map((item) => (
            <div key={item} className="premium-card p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item}</div>
              <p className="mt-4 text-sm leading-6 text-slate-300">Curated into AIBeat Daily when there is useful, relevant context to share.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-shell pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">For Founders</p>
              <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Launching an AI product?</h2>
              <p className="mt-4 text-slate-400">Reach people actively searching for new AI tools, products, and solutions.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/launch" className="gradient-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">Launch Your Product</Link>
                <Link href="/for-founders" className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white">View Promotion Options</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FOUNDER_SERVICES.map((service) => (
                <Link key={service.title} href={service.href} className="premium-card p-5">
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{service.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
