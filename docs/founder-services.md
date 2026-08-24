# Founder Services

AIBeat's founder-facing commercial system positions the site as a discovery and media platform for AI startups, not only a static tool directory.

## Routes

- `/for-founders`: central founder-services hub.
- `/submit`: free tool submission, listing updates, claim/update requests, and promotional-interest intake.
- `/spotlight`: Simple Placement, Featured Placement, Spotlight Pro, and promotional visibility rules.
- `/launch`: launch service page for new products, major updates, and public releases.
- `/advertise`: newsletter sponsorships, Spotlight, sponsored articles, and custom campaign inquiries.
- `/partners`: affiliate, content, newsletter, launch, community, and marketplace partnership options.
- `/claim`: manual listing claim guidance.

## Centralized Data

Commercial package data lives in:

```text
data/founder-services.ts
```

Shared rendering components live in:

```text
components/founders/ServiceBlocks.tsx
components/founders/SubmitToolForm.tsx
```

Edit package names, prices, availability text, inclusions, exclusions, CTAs, and disclosure language in `data/founder-services.ts` first. Avoid hard-coding commercial details directly in route pages unless the content is page-specific.

## Package Types

The current package menu includes:

- Free Listing: Free.
- Simple Placement: $1.99 one time.
- Featured Placement: $9.95 one time.
- Spotlight Pro: $29 one time.
- Launch Campaign: Custom.
- Newsletter Sponsorship: Custom.
- Sponsored Article: $199 one time.
- Growth Campaign: From $349.
- Media and Affiliate Partnership: Custom or exchange-based.

## Pricing Rules

- Use the values in `data/founder-services.ts`.
- Do not publish invented prices, traffic estimates, subscriber counts, conversion rates, ranking claims, or guaranteed outcomes.
- Use Stripe Checkout for Simple Placement, Featured Placement, and Spotlight Pro. Resolve Price IDs server-side from allowed plan keys only.

## Disclosure Rules

AIBeat distinguishes:

- `Editorial`: independent coverage selected by AIBeat.
- `Featured`: enhanced visibility or presentation for relevant products.
- `Sponsored`: paid promotion, sponsorship, or partner content.
- `Affiliate`: commercial links or partnerships that may generate commission.

Sponsored, partner, affiliate, and featured placements must be labeled clearly where they could affect reader interpretation.

## Submission Flow

The `/submit` page preserves the existing API:

```text
app/api/submit/route.ts
```

The form still posts:

- submission type;
- tool name;
- product URL;
- category;
- product context;
- optional founder/team email;
- honeypot spam field.

Do not create a duplicate submission API unless a full intake database, admin review flow, and abuse controls are added.

## Free Listing Verification

Free Listing can be submitted before website-control verification is complete. AIBeat may request verification before approval or publication. The submit form provides:

- visual badge snippet;
- text-link snippet;
- verification page URL field;
- badge/text method selector;
- Verify Placement and Check Again actions.

Server-side verification lives in:

```text
app/api/submissions/verify-aibeat-link/route.ts
lib/aibeat-link-verification.ts
```

Badge assets live in:

```text
public/badges/listed-on-aibeat.svg
public/badges/listed-on-aibeat-dark.svg
public/badges/listed-on-aibeat-light.svg
```

The backlink verifies website control only. It does not guarantee publication, rankings, positive editorial coverage, or newsletter inclusion.

## Admin And Database Status

This repository currently has no Supabase, Prisma, database migrations, or production admin interface. Founder-service requests continue through the existing email-backed submission API.

Future admin fields should include:

- selected_plan;
- service_interest;
- submission_status;
- payment_status;
- payment_reference;
- campaign_status;
- placement_start;
- placement_end;
- newsletter_date;
- article_status;
- sponsored_disclosure;
- partner_status;
- internal_notes.

Future statuses:

- new;
- under_review;
- needs_information;
- approved;
- rejected;
- awaiting_payment;
- payment_received;
- scheduled;
- in_production;
- published;
- completed;
- cancelled.

## Commercial Boundaries

AIBeat should not offer:

- paid rankings;
- guaranteed traffic, leads, sales, or SEO outcomes;
- undisclosed sponsored posts;
- hidden affiliate links;
- fake testimonials or logos;
- fake audience numbers;
- fake voting or launch urgency;
- guaranteed positive editorial reviews.

## Future Enhancements

- Step-based founder intake form.
- Separate launch application form.
- Dedicated partnership inquiry form.
- Media kit PDF or page.
- Payment links or checkout after package pricing is finalized.
- Admin review workflow for claims and founder submissions.
- Analytics events for founder CTA clicks and submission completion.
