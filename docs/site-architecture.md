# AIBeat Site Architecture

## Stack

- Framework: Next.js 14 App Router.
- React: 18.
- Runtime target: Node.js 22.x.
- Styling: Tailwind CSS 3 plus global CSS utilities.
- Icons: `lucide-react`.
- Animation: CSS keyframes only for the first redesign phase.
- Content: local TypeScript data in `lib/data.ts` and MDX/articles loaded through `lib/articles.ts`.
- Newsletter: existing Kit API integration in `app/api/subscribe/route.ts`.
- Tool submission: existing Resend integration in `app/api/submit/route.ts`.
- Outreach automation: existing local JSON store and Kit client in `lib/outreach-*` and `lib/kit/client.ts`.
- Supabase/auth: not present in the repository during this audit.
- Analytics: Google Analytics script in `app/layout.tsx`.

## Public Routes

- `/`
- `/tools`
- `/tools/[slug]`
- `/directory`
- `/categories`
- `/news`
- `/news/[slug]`
- `/compare`
- `/compare/[slug]`
- `/launches`
- `/launch`
- `/spotlight`
- `/newsletter`
- `/submit`
- `/advertise`
- `/partners`
- `/claim`
- `/about`
- `/privacy`
- `/affiliate-disclosure`
- `/free-tools`
- `/free-tools/roi-calculator`

## Preserved Systems

The redesign preserves existing URLs, Kit newsletter signup, tool submission API, article loading, tool/comparison data, sitemap generation, robots route, GitHub Actions, and outreach automation.

## Compatibility

New premium pages opt into the dark system with `dark-page`. Older pages remain readable through a compatibility surface until they are redesigned in later phases.

## Deployment

AIBeat production builds use Node.js 22.x. GitHub Actions and Vercel should use the same Node major version so validation matches production. New production deployments are triggered automatically by pushes to `main`.
