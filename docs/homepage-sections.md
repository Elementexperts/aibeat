# Homepage Sections

## Hero

Communicates AIBeat's core message within the first viewport:

- AI tool discovery.
- AI news.
- Startup launches.
- Newsletter insights.
- Founder promotional services.

The hero uses CSS-only immersive visuals with reduced-motion support. No heavy 3D dependency is shipped in this phase.

## Discovery Strip

A lightweight horizontal strip links to active discovery and founder routes. It avoids unsupported live metrics.

## Featured Launches

Uses real featured tools from `lib/data.ts` as launch-style cards. The presentation is future-ready for dedicated launch data.

## Trending Tools

Uses existing tool data and ranking presentation without fabricating usage counts.

## Categories

Uses real categories and counts from the local tool array.

## Editorial News

Uses articles from `getArticles()` and preserves existing news URLs.

## AIBeat Daily

Uses existing newsletter components and Kit API route. No duplicate subscriber logic is introduced.

## Founder Services

Routes users toward submission, launch, Spotlight, and advertising paths with transparent copy and no guaranteed results claims.
