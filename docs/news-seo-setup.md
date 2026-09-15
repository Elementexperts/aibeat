# AIBeat search and news setup

This implementation improves technical eligibility. Google, Bing, Microsoft and OpenAI independently decide whether to crawl, index, rank or cite content.

## Configuration

No new packages or paid services are required. Existing production credentials remain unchanged; never commit `.env.local`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `GOOGLE_SITE_VERIFICATION` | Vercel production | Optional Search Console HTML verification token; unnecessary if DNS verification already works. |
| `BING_SITE_VERIFICATION` | Vercel production | Optional Bing HTML verification token. |
| `INDEXNOW_KEY` | Vercel production **and** GitHub repository Actions secret | The same 8–128 character key containing letters, digits or hyphens. Intentionally public at `/indexnow-key.txt`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel production | Optional GA4 override. Omit to keep the existing `G-JD3XXLRLZ5` property. |
| `INDEXNOW_BASE_SHA` | Actions/script only | Commit before the relevant changes. The workflow supplies it. Manual retry accepts a SHA or `HEAD~1`. |

After changing deployment variables, redeploy. Generate an IndexNow key locally, for example with `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`. This verification key is public by design; it is not a Google/Bing API credential.

## Owner checklist

- [ ] Verify `aibeat.dev` ownership in [Google Search Console](https://search.google.com/search-console), preferably a DNS domain property. If using a URL-prefix property, choose `https://www.aibeat.dev`.
- [ ] Submit `https://www.aibeat.dev/sitemap.xml` and `https://www.aibeat.dev/news-sitemap.xml` in Search Console.
- [ ] Verify the site in [Bing Webmaster Tools](https://www.bing.com/webmasters/) and submit the general sitemap.
- [ ] Set matching `INDEXNOW_KEY` values in Vercel production and GitHub Actions. After deployment, open `https://www.aibeat.dev/indexnow-key.txt` and confirm the exact key is returned. Without configuration this route intentionally returns 404 and notifications skip safely.
- [ ] Publish an article and inspect the final Daily AI News Automation step. For manually pushed articles, inspect “Notify IndexNow after news deployment.” A response accepted by IndexNow does not guarantee indexing.
- [ ] If deployment takes longer than the bounded wait or a network request fails, re-run the IndexNow workflow after production is ready, supplying the SHA printed in its log as `base_ref`.
- [ ] In GA4's existing web data stream, verify **Enhanced measurement → Page views → Page changes based on browser history events** is enabled. The existing Google tag handles initial loads; enhanced measurement handles Next.js navigation. No second manual tracker was added, avoiding duplicate page views. Check Realtime/DebugView while navigating from the news index to two articles. Account settings and live collection cannot be proven by a build.
- [ ] Open `https://www.aibeat.dev/robots.txt`; confirm public crawling and both www sitemap URLs. Ensure CDN/firewall rules also allow legitimate crawlers and image requests.
- [ ] Run several actual articles through [Google Rich Results Test](https://search.google.com/test/rich-results) and Search Console URL Inspection; inspect the rendered text, canonical and featured image. SoftwareApplication schema omits unverified offers/ratings, so tool pages may not qualify for Google's software rich-result feature.
- [ ] Verify public access for Googlebot, Bingbot and OAI-SearchBot using HTTP requests and hosting logs. A user-agent probe alone cannot establish access from official crawler IPs.
- [ ] Review LinkedIn/X sharing previews after deployment; their caches may need refreshing.
- [ ] Decide the separate GPTBot training-crawl policy. No explicit GPTBot rule existed and none was added. The existing wildcard rule remains permissive. OAI-SearchBot access is explicitly allowed for search discovery.
- [ ] Review existing About/contact/Privacy information. Supply a truthful editorial policy, real author biographies if applicable, and approved Terms text before adding those pages. This change does not invent human review, testing credentials or legal policies.
- [ ] Review historical articles for factual accuracy and originality. A stricter generator prompt is a safeguard, not a factual verification service or a retrospective editorial audit.

## Publication and maintenance

- MDX `publishedAt` is the original publication date/time. New automated articles record an ISO timestamp. Historical date-only values remain unchanged; their News-sitemap eligibility is measured from midnight UTC.
- Set optional `updatedAt` only for a real material update, never to today's date merely to appear fresh. It must be no earlier than publication. The visible update date, Open Graph, NewsArticle and general sitemap share this value.
- Optional fields: `tags: ["..."]`, `sources: [{ name: "Publisher", url: "https://..." }]`, `relatedTools: ["existing-tool-slug"]`, `coverImageAlt`, `coverImageWidth`, `coverImageHeight`, `draft: true`.
- Add source URLs that actually support the article. Existing stored source-page URLs become a visible Sources section; no unverified research is implied. Prefer original reporting and primary documentation where available.
- Only explicit related tools or full tool names in the headline/deck create automatic tool relationships; short names require `relatedTools`. Review ambiguous common names before publication.
- Keep one H1 in the page shell; body HTML uses logical H2/H3 headings. Generated content must distinguish reported facts from analysis and must not invent quotes, benchmarks, prices or availability. Short source evidence should produce a short brief.
- Existing prepared 1200×630 covers remain unchanged. Newly prepared covers use 1200×675 with 640×360 and 240×135 WebP variants; optional stored dimensions keep layout and metadata aligned. Decorative list thumbnails use empty alt; primary covers use a story-specific title/alt. Missing covers use the actual branded OG image.
- `/feed.xml` includes the latest 50 published MDX stories, newest first, with escaped XML, canonical GUIDs, bylines, categories and media images.
- `/news-sitemap.xml` is generated at request time, includes at most 1000 stories younger than 48 hours, and can correctly be empty. Older stories remain in the general sitemap.
- IndexNow submits changed MDX articles after matching their content hash on the live page. Formatting-only changes do not submit. The separate hand-written writing-tools route uses Vercel's public deployment commit marker; its date must be maintained explicitly if materially edited. Vercel must expose its system environment variable `VERCEL_GIT_COMMIT_SHA` for that route's notification.
- The daily workflow invokes IndexNow itself because pushes using `GITHUB_TOKEN` do not launch another push workflow. Provider failures remain nonfatal. No historical full-site batch is submitted automatically.

## References

- [Google News sitemap requirements](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap)
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [IndexNow protocol](https://www.indexnow.org/documentation)
- [OpenAI crawler definitions](https://developers.openai.com/api/docs/bots)
- [GA4 single-page application measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [GA4 page-view configuration and duplicate tracking](https://developers.google.com/analytics/devguides/collection/ga4/views)
