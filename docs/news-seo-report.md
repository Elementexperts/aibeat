# AIBeat SEO implementation report

## 1. Existing functionality discovered

Next.js 14.2.35 App Router with server-rendered MDX, shared metadata, canonical production domain, a general sitemap, robots rules, one publisher schema, GA4, news pagination, local WebP images and newsletter/tool links. The audit covered 203 MDX stories plus the separate writing-tools article and 94 directory entries. See [the pre-change audit](news-seo-audit.md).

## 2. Problems discovered

Several routes inherited the homepage canonical. The general sitemap listed nonexistent catalogue stories and authentication pages, and used current timestamps for unchanged pages. Article schemas, RSS, a two-day news sitemap and IndexNow were absent. Source attribution and update dates lacked a reusable model. Child metadata hid inherited RSS discovery during integration testing. The image loader declared widths different from its generated assets. Three sidebar links led to missing stories. One directory entry is an agency rather than software.

## 3. Files modified

- `.env.example`
- `.github/workflows/daily-news.yml`
- `app/affiliate-disclosure/page.tsx`
- `app/business/forgot-password/page.tsx`
- `app/business/reset-password/page.tsx`
- `app/business/sign-in/page.tsx`
- `app/business/sign-up/page.tsx`
- `app/categories/page.tsx`
- `app/claim/page.tsx`
- `app/compare/[slug]/page.tsx`
- `app/compare/page.tsx`
- `app/directory/page.tsx`
- `app/free-tools/page.tsx`
- `app/launches/page.tsx`
- `app/layout.tsx`
- `app/news/[slug]/page.tsx`
- `app/news/best-ai-writing-tools-2026/page.tsx`
- `app/news/page.tsx`
- `app/page.tsx`
- `app/privacy/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/tools/[slug]/page.tsx`
- `app/tools/page.tsx`
- `app/unsubscribe/page.tsx`
- `components/ui/DirectoryClient.tsx`
- `components/ui/NewsImage.tsx`
- `lib/articles.ts`
- `lib/data.ts`
- `middleware.ts`
- `next.config.js`
- `package.json`
- `scripts/fetch-and-post.ts`
- `scripts/news-images.ts`
- `scripts/prepare-news-images.ts`
- `tests/aibeat-business.test.ts`
- `tests/news-images.test.ts`

## 4. Files created

- `.github/workflows/indexnow.yml`
- `app/feed.xml/route.ts`
- `app/free-tools/roi-calculator/layout.tsx`
- `app/indexnow-key.txt/route.ts`
- `app/news-sitemap.xml/route.ts`
- `docs/news-seo-audit.md`
- `docs/news-seo-report.md`
- `docs/news-seo-setup.md`
- `lib/article-seo.ts`
- `lib/indexnow.ts`
- `lib/news-feeds.ts`
- `lib/site-seo.ts`
- `lib/tool-seo.ts`
- `scripts/notify-indexnow.ts`
- `tests/news-seo.test.ts`

## 5. Packages installed

None. Reused Next.js Metadata, server-rendered JSON-LD, Node APIs, Sharp, gray-matter and existing RSS parsing/test dependencies. No new client library or tracking script.

## 6. Environment variables

Optional deployment verification: `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`. IndexNow: identical `INDEXNOW_KEY` in Vercel production and GitHub repository Actions secrets. Optional analytics override: `NEXT_PUBLIC_GA_MEASUREMENT_ID`; the existing property remains the default. Actions supplies `INDEXNOW_BASE_SHA`; Vercel's system `VERCEL_GIT_COMMIT_SHA` supports publication verification for the separate hand-written route. No `.env.local` or private credentials are included.

## 7. Google-specific changes

Article metadata now shares canonical URLs, actual publication/update dates, descriptions, bylines, categories and optional tags with NewsArticle schema. The sitemap contains actual public routes and avoids fabricated last-modified values. A dynamic news sitemap limits entries to 48 hours and 1000 stories. Existing 1200-pixel covers support large image previews. Authentication and filter pages receive noindex directives. Apex page requests redirect to www; robots references canonical sitemap URLs. Source text remains available in server-rendered HTML.

## 8. Bing/Microsoft-specific changes

Optional Bing verification metadata and bounded IndexNow notifications for changed news only. Notifications wait for the actual article revision on production and verify the public key. Daily automation calls the notifier directly; a separate workflow covers human pushes and manual retries. Errors do not stop publication. No full-site submission runs automatically.

## 9. OpenAI/ChatGPT-specific changes

Explicit OAI-SearchBot access for public content. No explicit GPTBot rule existed, so its existing wildcard behavior remains unchanged for the owner to decide. Source links, canonical URLs, readable HTML and structured data support discovery; no special inclusion or citation guarantee is made.

## 10. RSS/news feed changes

`/feed.xml` returns RSS 2.0 with the latest 50 MDX stories, canonical links/GUIDs, dates, categories, bylines and featured images. A root-head discovery link persists across child metadata overrides. XML text is escaped and invalid dates, drafts and future publications are excluded. `/news-sitemap.xml` expires old entries at request time; older content remains in the general sitemap.

## 11. Image SEO changes

Preserved existing prepared covers and historic dimensions. New covers use 1200×675, with 640×360 and 240×135 WebP variants. Alt text and stored dimensions flow into the article and social metadata. Main article and archive hero images retain priority loading; decorative thumbnails remain lazy. Next.js image widths now match generated files, avoiding inaccurate srcset descriptors. The existing 60.8 KB branded OG image is the fallback when no prepared cover is usable. No image backfill or historical image replacement was run as part of this SEO change.

## 12. Structured data implemented

One shared Organization/NewsMediaOrganization and WebSite graph; article-specific NewsArticle; BreadcrumbList for articles/tools; SoftwareApplication for software entries and Service for the identified agency. No invented people, scores, reviews, offers, prices, credentials or social profiles. Existing bylines remain AIBeat AI and AIBeat Staff. JSON-LD is server-rendered and escapes script-breaking characters.

## 13. Build/test results

- TypeScript: passed (`npm run typecheck`).
- Lint: passed; one pre-existing `ToolLogo.tsx` warning about a plain `<img>`.
- Full suite: **202/202 passed**. Focused SEO/image tests: **10/10 passed** after the schema/image changes.
- Final production build: passed, **363 static pages generated**. Shared first-load JavaScript: **87.3 KB**. Temporary dependency-junction caching warnings affected the review build cache, not compilation or output.
- Parsed `/sitemap.xml`, `/news-sitemap.xml` and `/feed.xml` as XML and verified their XML content types. All **329 sitemap URLs returned HTTP 200** locally. The news sitemap contained **4 eligible recent stories**; RSS contained **50 items** at validation time.
- Inspected rendered metadata/schema on three current MDX articles, the hand-written article, two directory entries, pagination, category filters and sign-in. Canonicals use www HTTPS; date/byline/image schema matches visible content; no localhost/staging URLs occur in XML or canonical/social metadata.
- Verified OAI-SearchBot, Googlebot and Bingbot user-agent requests return public article HTML locally; production firewall/IP access remains a post-deployment check.
- Browser: final cover loaded with accurate 640w/1200w sources; RSS discovery present; no horizontal overflow at desktop and 390px mobile viewport; no captured browser console errors in the inspected article.
- Both workflows parse as YAML. IndexNow without configuration logs a safe skip; the key endpoint returns 404. Mocked provider success/failure tests passed. No live IndexNow notification, account verification or external publishing was performed.

## 14. Remaining manual actions

Follow the [owner setup checklist](news-seo-setup.md) for Search Console and Bing ownership, sitemap submissions, matching IndexNow keys, deployment, GA4 history-based pageview verification, robots/firewall checks and Google Rich Results testing. Decide the GPTBot policy. Supply approved editorial/author/Terms information if those pages are desired; no editorial process or legal claims were fabricated.

The generator now requests evidence-backed facts, source attribution, logical headings, clearly framed analysis, no fabricated quotes and shorter briefs when evidence is thin. This is not a factual verification service: historical accuracy/originality and the existing hand-written article's testing claims still need editorial review. Google, Bing and OpenAI retain control over indexing, ranking and citations. Live Core Web Vitals and third-party account settings require post-deployment verification.
