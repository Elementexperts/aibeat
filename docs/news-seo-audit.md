# AIBeat news SEO audit (2026-09-15)

Audit completed before implementation. Source repository: Elementexperts/aibeat.

## Existing implementation to preserve

- Next.js 14 App Router, React 18. News MDX contains HTML and is rendered on the server; dynamic news pages use generateStaticParams. One hand-written news comparison route is separate.
- Root metadata uses https://www.aibeat.dev, shared OG/Twitter defaults, indexing directives and large image previews. Most founder-service pages already have canonical metadata.
- One NewsMediaOrganization schema exists in the root layout, with the existing LinkedIn company URL. Do not invent more profiles.
- GA4 uses G-JD3XXLRLZ5 once, plus PublicAnalytics click events. No existing NEXT_PUBLIC_GA_MEASUREMENT_ID configuration.
- General sitemap includes tools, comparisons, MDX and a static article catalogue. robots.ts allows public paths but blocks /_next/ and references the non-www sitemap.
- Current MDX byline is AIBeat AI; the hand-written article visibly uses AIBeat Staff. MDX records have date-only publication values and no update dates or structured sources. Source URLs are retained in coverImageSourceUrl.
- News image pipeline generates local WebP sizes, small thumbnails, source captions, responsive covers, caching and a branded fallback. Existing valid 1200×630 covers must be preserved.
- News has category filters and linked pagination; article pages link to recent stories, newsletters and explicit relatedTools when provided. Tool categories are directory filters, not independent category routes.
- Private Business pages already have noindex directives and authentication middleware. Stripe, Supabase and newsletter integrations are outside this change.

## Problems and gaps

- News index, tool pages and comparison pages can inherit the homepage canonical. The special writing-tools article lacks complete social metadata.
- No NewsArticle, BreadcrumbList, WebSite or SoftwareApplication schemas; root organization script uses next/script rather than plain server-rendered JSON-LD.
- General sitemap includes sign-in, sign-up and password routes, assigns current timestamps to unchanged static/tool pages, and includes catalogue article URLs that may not have a real route.
- No news sitemap, public RSS feed, IndexNow implementation or repository verification tokens were found. Search Console/Bing ownership outside the repository is unknown.
- No GPTBot-specific policy exists. Its existing default policy will remain unchanged pending the owner's decision.
- No dedicated author profile system, editorial policy or terms route was found. About, contact email and Privacy exist. Do not invent editorial review claims, human identities or credentials.
- Automated generation expands short source summaries to 400–700 words without an explicit rule against unsupported facts or invented quotes. Structured source attribution is absent.

## Implementation boundaries

Reuse native metadata and the existing image pipeline. Add server-rendered schemas, feed/news-sitemap routes, canonical fixes, accurate optional update dates, source links and a bounded post-deployment IndexNow workflow. Preserve historic content, image files, dates, authors, existing social profile, GA4 property and GPTBot policy. No redesign, new tracking libraries or new paid services.
