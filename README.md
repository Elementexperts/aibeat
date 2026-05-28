# AIBeat.dev

> The pulse of artificial intelligence — Daily AI news, honest tool reviews, and side-by-side comparisons.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Fonts:** Playfair Display + IBM Plex Sans + IBM Plex Mono
- **Deployment:** Vercel (free tier)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open http://localhost:3000
```

## Project Structure

```
aibeat/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── layout.tsx          # Root layout
│   ├── news/[slug]/        # Article pages
│   ├── tools/[slug]/       # Tool review pages
│   ├── compare/            # Comparison pages
│   ├── directory/          # Full tools directory
│   ├── free-tools/         # Embedded calculators
│   ├── sitemap.ts          # Auto-generated sitemap
│   └── robots.ts           # Robots.txt
├── components/
│   ├── layout/             # Navbar, Footer, Ticker, TopBar
│   ├── ui/                 # Reusable UI components
│   ├── news/               # News-specific components
│   └── tools/              # Tool card components
├── lib/
│   └── data.ts             # Central data store (replace with CMS)
└── content/
    ├── news/               # MDX article files
    └── tools/              # MDX tool review files
```

## Deployment to Vercel (Free)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit — AIBeat.dev"
git remote add origin https://github.com/YOUR_USERNAME/aibeat.git
git push -u origin main

# 2. Go to vercel.com
# 3. Import your GitHub repo
# 4. Set domain: aibeat.dev
# 5. Deploy — automatic on every git push
```

## Adding New Content

### New article
Add to `lib/data.ts` in the `ARTICLES` array, or create `/content/news/your-slug.mdx`

### New tool review
Add to `lib/data.ts` in the `TOOLS` array

### New comparison page
Create `app/compare/[tool-a]-vs-[tool-b]/page.tsx`

## Revenue Configuration

Update affiliate URLs in `lib/data.ts`:
- Replace `?via=aibeat` with your actual affiliate tracking IDs
- Add Google AdSense script to `app/layout.tsx`
- Add affiliate disclosure to `app/affiliate-disclosure/page.tsx`

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX        # Google Analytics
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXX   # Google AdSense
NEWSLETTER_API_KEY=your_convertkit_key # Newsletter provider
```
