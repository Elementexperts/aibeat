# News images

Daily news automation prepares cover images before committing an article. Source preview images are preferred, followed by the existing generated-image provider. Download or decode failures use a bundled AIBeat illustration and do not prevent publication. Source-image and AI-image captions are distinguished on article pages.

Sharp creates 1200×630, 640×336, and 240×126 WebP files under `public/news-images/`. File names contain a content hash. The news image component serves these prepared assets directly: thumbnail requests use the 240px file, covers use responsive variants, and no visitor triggers image generation or a Next.js image transform. Article/news hero images load eagerly; archive and homepage images use lazy loading. Image boxes reserve their size and fall back on errors.

The workflow stages images and article metadata together. `npm run news:images` prepares images for the latest 12 articles, including older articles still pointing at external images. `NEWS_IMAGE_BACKFILL_LIMIT` accepts 1–50; existing complete local variants are skipped. Older articles outside this batch display the bundled illustration until backfilled. A failed backfill keeps the original external URL for the next scheduled retry; the UI displays a local fallback meanwhile. For a newly generated article that was saved with the placeholder, supply a reviewed source-image URL in frontmatter to retry.

Downloads allow public HTTPS images, validate redirect destinations, time out, cap input at 8 MB and decoded input at 40 million pixels, strip metadata, and retain source attribution. The generated-image provider remains optional: provider outages require no workflow intervention. Review source-image reuse permissions as part of editorial sourcing.

Images increase static storage and transfer volume. Resize/compression happen in Actions; thumbnails never fetch full-size images. Content-hashed files permit cache reuse; the `/news-images/` response header requests one day of browser caching with stale revalidation. For a much larger archive, move prepared assets to object storage instead of growing Git indefinitely.

Validation: `node --import tsx --test tests/news-images.test.ts`, `npm run typecheck`, `npm run build`, and browser checks for `/news`, an article, and the homepage news section.

Initial backfill: 12 articles, 8 unique source images, 24 WebP variants totaling about 450 KB with the fallback. Thumbnails average 3.9 KB (maximum 8.9 KB); full covers average 39.6 KB (maximum 65.2 KB). These are file sizes, not a measured change in page-load time.
