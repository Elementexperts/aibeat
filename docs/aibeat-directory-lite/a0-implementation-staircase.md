# A0 — implementation staircase

Date: 2026-10-22. **PROPOSED milestones; A0 authorizes none of their implementation or execution.** Scope approval precedes a separate file-bounded coding task. Infrastructure/security gates constrain execution/release even when local design is complete. N/F/C roots are in a0-preservation-baseline.md.

## Order and common acceptance rules

Recommended order: approve A0 boundaries -> narrowly scoped A1 -> secure A2 -> design/qualify A3 -> A4 presentation/disclosure improvements -> A5 acceptance/release. Test planning and infrastructure qualification begin before runtime-dependent work; A5 is not permission to postpone security until after a live rollout. A4 planning can proceed after A1/A2 contracts, but no payment/feature activation precedes its gates. If A3 cannot qualify, defer it rather than release insecure community writes; discovery/submission changes can have a separately approved narrower acceptance decision.

Every milestone records exact worktree/base/changed files, protects N/F/C and prior reports, uses a dedicated reviewed branch only if authorized, distinguishes local code/offline model/runtime/deployment evidence, and obtains separate commit/push/PR/migration/deploy permissions. No blind founder/C01 merge. Protect homepage/global navigation/footer/article/newsletter/Business/payment/SEO schedules and routes. No passing claim based on skipped checks or inherited historical counts.

## A1 — listing simplicity and discovery

**Objective:** reuse Nitro 0A URL discovery and make directory cards/readability clear without changing AIBeat's editorial identity. Smallest first slice: directory-only card information hierarchy/accessibility, not a full redesign, new search engine, new backend or rebuilt filter system.

**Prerequisites:** approve exact Directory Lite scope and base. ed9ae9e already includes q/category/pricing/reset/metadata. Concurrent cached main contains independent listings; review reconciliation separately, never silently refresh the frozen baseline to hide differences. Resolve which small UI changes are wanted before widening file scope. New local implementation does not imply release authorization.

**Reuse:** DirectoryClient, directory-filters helper, ToolLogo/ToolAffiliateOffer rendering contracts, /categories links and tool-detail paths; existing baseline and 14 directory tests. PremiumToolCard is shared with protected homepage and should not be changed for the first slice.

**Proposed first file budget:** components/ui/DirectoryClient.tsx, focused tests/directory-filters.test.ts and an A1 report under docs/aibeat-directory-lite. lib/directory-filters.ts/app/directory/page.tsx are preservation references, not necessary edits for a card-only task. No lib/data.ts, category data, common Navbar/Footer/globals.css, app/page.tsx or tool SEO change. A later separately approved category-entry tweak can address inert /tools category controls without renaming taxonomy.

**New work:** show the same name, short description/tagline, category, pricing and global rank with clearer labels and accessible semantics; keep submit CTA/empty/reset behavior and local filter state contract. Do not add fake save/vote/comment controls or marketing claims. Tool-detail simplification is a later A1 sub-slice only if its protected URLs/schema/content can remain unchanged.

**Risks:** CSS leaks into homepage, loss of focus/history/URL query/hash, reordered global ranks, changed catalogue precedence, mislabeled featured/organic or fabricated ratings, new query indexability.

**Acceptance:** exact base catalog/ranked/featured slug sequences unchanged; filtered results remain subsequences with original rank numbers; existing listing and category links/canonical/robots unchanged. Search commit/draft, AND filters, repeated/invalid params, clear/back/refresh behavior preserved. Accessible labels/focus/keyboard and viewport review required. Use only approved safe static/offline checks; real build/browser waits for independent runtime authorization and is not waived by the smaller UI scope.

**Release gate:** no merge/deploy/push, no CI activation; source-only acceptance is not runtime acceptance. A5 must approve any public release.

## A2 — submission simplification

**Objective:** minimal secure Submit -> Review -> Approve -> Publish; no advanced founder portal. Keep existing paid flow and legacy payload/storage ID correlation. Five-field free form plus privacy receipt is a reusable local foundation, not a complete backend workflow.

**Prerequisites:** select/review specific F Nitro 1A paths rather than merge F wholesale. Decide human editorial authority, public-RPC/abuse closure, duplicate/idempotency contract, taxonomy/query-aware identity and free badge/backlink policy. Resolve compatibility with automatic NEW/IN_REVIEW processing before new live intake.

**Reuse:** F FounderSubmissionForm, founder-submission.ts/handler, submission-request-body.ts, API version dispatch; existing storage RPC/helpers and source evidence; offline editorial model, guarded storage design and tests as review input. Existing private source rows span tool/newsletter/unsubscribe/Business kinds, so new tooling must scope tool rows only. Business OWNER/ADMIN is not an editor grant.

**New work:** reviewed authoritative intake validation/quotas including direct RPC paths; atomic pending identity/request reservation with generic responses; private editor queue and narrowly authorized approve/reject actions; transactionally versioned content decisions/audit; compatible idempotent publication mapping, worker lease/fencing and live proof; notification reconciliation, privacy/retention. A basic authenticated internal queue/manual publication can be a smaller first design, but must genuinely prevent the existing automated worker bypass. No client-only permission or in-memory idempotency as security proof.

**Likely file areas (not authorization):** app/submit, selected founder components/API/helpers; a separately reviewed private editorial adapter/UI; explicit additive DB changes if required; scoped tests/docs. Existing workflow eligibility or worker behavior changes need their own operational approval; schedules remain preserved. Guarded draft stays outside migrations until separately approved and tested. Do not implement all ten candidate tables or advanced scheduling merely because the draft contains them; a smaller design must preserve equivalent required authorization/privacy/audit controls.

**Acceptance:** field/size/URL/consent errors, duplicate/retry/concurrency behavior, no private IDs/contact disclosure, no live URL fetching in intake, server/DB denial of wrong/expired/revoked roles and direct bypass, immutable source/audit, exactly-once-effect publication proofs and notification retry reconciliation. Preserve legacy paid/newsletter/Business form behavior and other source kinds; no PUBLICATION from an unapproved request/content version. Real DB/auth verification is mandatory before activation, not supplied by model tests.

**Release gate:** qualified disposable Linux/DB/auth environment, correct reviewed schema/RLS/capabilities, migration approval and compatibility evidence, worker/main-publish/deployment controls, privacy and ops acceptance. No real emails/accounts/fixtures/migrations/provider calls without separate explicit authorization. Nitro 1B-A/C01 gates remain unchanged.

## A3 — lightweight community

**Objective:** one authenticated vote/user/tool with unvote, weekly/monthly eligible organic rankings, basic product comments/verified founder responses and moderator reporting. No launch contest, social feed, reputation or complex profile.

**Prerequisites:** approve community account/opt-in/verified-email policy and separate moderation capabilities; stable catalog-product identity; product publication eligibility; vote/recast/self-vote/suspension rules, rank timezone/ties/correction/freeze policy; comment edit/delete/retention and abuse budgets. F/C security designs are reference only. Business membership neither grants moderator power nor becomes a requirement to vote.

**Reuse:** existing Supabase auth/server session concepts after shared-session review; local catalog/tool routes; C docs/community-phase-0/community-feature-design.md and feature-flags-rollback.md, clearly PROPOSED. Do not treat these designs/flags/tables as implemented.

**New work:** minimal additive product/vote/comment/report/audit/rate storage, least-privilege RLS/RPC/session ownership, unique and immutable identities, idempotent cast/remove, server timestamps, safe public projections; plain-text XSS-safe rendering; verified owner association; moderation controls, rate/challenge/incident response; deterministic separate period aggregation and snapshot/correction evidence. Never modify popularity weights to fake organic votes.

**Acceptance:** wrong-user/anon/unconfirmed/suspended/revoked role denials; concurrent duplicate votes one active effect; idempotent unvote and recast not manufacturing period freshness; no payment/feature/Business-plan weighting; reproducible week/month boundary/tie/correction outcomes. Comment spam/XSS/forged ownership/private field exposure denied; bounded rates enforced at authoritative mutation path, not UI only. Public read/write pause and moderator audit/rollback demonstrated without touching Business.

**Risks:** Sybil/vote rings, email/PII leaks, tenant privilege bleed, ranking manipulation, new crawl surface and unsafe write exposure. Verified email alone does not solve abuse. Small opt-in beta/moderation capacity first.

**Release gate:** reviewed threat model and moderation policy, qualified auth/DB/concurrency/runtime tests, explicit additive migration/write-control approval, safe private fixtures and rollback, SEO policy and A5 acceptance. Community remains deferred until those exist.

## A4 — featuring and monetization

**Objective:** clarify existing free/simple/featured/Spotlight offers, comparison/CTAs and promotional disclosures; no new checkout/pricing/subscription experiment.

**Prerequisites:** approve editorial-featured vs paid provenance model and wording; preserve existing plan IDs/prices/entitlements/checkout/referral/notification contracts; agree organic rankings receive no paid boost.

**Reuse:** data/founder-services.ts, lib/founder-services.ts, SubmissionPricingCards/ServiceBlocks/CheckoutButton, spotlight/for-founders/advertise/affiliate-disclosure pages, Stripe/offline tests. Existing launch/newsletter/sponsored-article/growth/partnership packages remain, even when new advanced Toolsvio capabilities are excluded.

**New work:** narrowly approved comparison/copy/sponsored-label presentation, source-backed placement disclosure and no false approval/ranking/verified badge promise. Persistent payment replay/order/fulfillment/duplicate handling requires a separate security task if commercial behavior is changed; existing in-memory webhook sets do not establish cross-instance durability.

**Acceptance:** prices/currency/plan IDs and legacy paid API remain identical; clear free-versus-paid and sponsored/editorial separation; affiliate rel/disclosure intact; no paid influence on organic score. No payment session, live webhook, email or fulfillment action used for casual validation.

**Release gate:** approved commercial/disclosure scope, offline provider-double tests and separately authorized payment sandbox validation if needed; never production payment operations. No founder-growth subscription or gamification scope.

## A5 — controlled validation and release

**Objective:** accept only the exact independently verified Lite release scope while retaining editorial/news/Business/commercial behavior. A0 completion is not deployment authorization.

**Prerequisites:** exact integration base/manifest; local work preserved; appropriate qualified runtime per feature. The existing Nitro CI is intentionally blocked and its diff allowlist excludes new Directory Lite code/docs: reusing it needs separate review, not a condition flip. Verify non-deploying synchronization route/default-branch dispatch bootstrap, Vercel settings/scopes and redirect behavior before any push.

**Reuse:** 0A baseline/tests, 0B assessments/workflow/checklists, relevant existing catalog/SEO/submission/payment tests; selected F/C authorization scenarios only under their own gates. Do not run 1B-A fixtures on ordinary hosted Actions.

**New work:** independent isolation/secret/descendant/teardown evidence; reproducible Linux artifacts and no-service full build; actual browser navigation, keyboard/focus/viewport/metadata/sitemap/rank/link checks; editorial/newsletter/paid/Business regressions; DB/auth/concurrency and abuse evidence for write features. Baseline title defect has historical clean-export reproduction; fix only separately or obtain documented non-green scope disposition, never silently skip it.

**Acceptance:** every check has evidence/scope/date/source, no unexplained skipped/blocked check marked pass; preserved route/catalog/rank/SEO invariants; rollback/incident owner; sanitized exports; no unintended network/email/payment/publication/migration. Auth/community write controls and kill/rollback paths actually verified, not just hidden UI.

**Release gates:** separate exact commit/push/PR/merge/deployment and each DB/migration/fixture/provider authorization. Vercel read access, environment isolation, production redirect resolution and deployment controls precede preview. Retain existing schedules; never disable unrelated automation merely to ship Lite. After release, authorized monitoring checks public URLs/SEO, error/abuse/rank drift and provider side effects within approved boundaries; no automatic full C01/founder rollout.

**Rollback:** stop only new write/jobs via independently enforced controls if implemented/approved, preserve immutable audit/payment/publication evidence, revert exact compatible UI/code with approval, retain existing data/schema and independent workstreams. Never drop source records, undo C01 RLS or assume sent email/payment/published content can be rolled back by reverting Git.

## Recommended next Codex task

After A0 scope approval: authorize A1's directory-card clarity/accessibility slice only, on an explicitly reviewed separate branch/base if desired, using components/ui/DirectoryClient.tsx, focused directory tests and an A1 report. Preserve helper/URL contract, lib/data.ts, every tool URL and global rank, shared homepage/nav/footer, paid services, Business, source/SEO/config/workflows. No automatic implementation, commit/push, build/browser, infrastructure, auth/DB or founder migration. Reuse 0A rather than building another filter system.
