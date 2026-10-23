# A0 — preservation baseline

Date: 2026-10-22. Status: **VERIFIED LOCAL PRESERVATION BASELINE; production/deployment state UNVERIFIED.** A0 is read-only inspection plus five new Markdown documents. No app, workflow, feature, dependency, data, price, auth, migration or infrastructure change; no build/test/browser, network/provider/DB request, commit, push or deployment. A0 does not resume Nitro 0B, 1B-A or C01.

## 1. Inspection roots and evidence vocabulary

Documentation target N: `C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery`.

Founder worktree F: `C:/Users/User/.codex/visualizations/2026/10/21/01a15e18-514a-71a0-b62d-157f773f95b3/nitro-v2-founder-submissions`.

C01 worktree C: `C:/Users/User/Desktop/aibeat-main/aibeat-main` (the original desktop checkout). It is a different branch, not the Directory Lite implementation target. Every command explicitly selected its intended root; no branch switch or new worktree occurred. Source paths below are relative to N unless marked F/C. Historical reports may describe earlier uncommitted state; current Git metadata takes precedence.

IMPLEMENTED means inspected local executable/UI source, not successful live deployment. PARTIALLY IMPLEMENTED means important gaps remain. PLANNED means design/roadmap only. BLOCKED means an explicit execution/activation gate prevents progress. NOT FOUND is scoped to the inspected routes/components/libs/schema; not a claim about undiscovered external systems. UNVERIFIED identifies absent runtime/production evidence.

## 2. Git/framework baseline

N branch `codex/nitro-v2-directory-discovery`, HEAD `ed9ae9ede6fc73fdb53051246124db3418bcf0e9`, parent `d5cc3b9013accd9a17a5fa132c9dd43d926ab255`. Tracked/index changes at start: none. Seven pre-existing untracked files: dedicated Nitro workflow plus six Stage 0B assessment/implementation/checklist/security reports. Preserve them byte-for-byte; they are not A0 additions.

Origin fetch/push is https://github.com/Elementexperts/aibeat.git. Cached origin/main resolves locally to `504d9dcecce988d3294cacbbbeacb66f50ef6533` (`504d9dc`). No remote was contacted/refreshed; cached refs do not certify remote synchronization or deployment.

Framework: Next App Router/React/TypeScript/Tailwind, static TS/JSON tool catalog and filesystem MDX content. npm/package-lock.json v3, .nvmrc=22, package engines Node 22.x. Lock evidence in preceding 0B assessment: Next 14.2.35, React 18.3.1, TypeScript 5.9.3. build=next build, start=next start; no A0 execution. Supabase/Stripe/Google/Kit dependencies exist for other product flows and are not required by pure directory filtering. No local vercel.json/project link found in previously inspected N/C locations; live hosting settings remain unknown.

### Worktree registrations

| Root (under C:/Users/User unless absolute above) | HEAD / branch |
| --- | --- |
| N | ed9ae9e; codex/nitro-v2-directory-discovery |
| F | af519d1; codex/nitro-v2-founder-submissions |
| C | 8e395c9; codex/c01-business-authorization-hardening |
| .codex/worktrees/1a38/aibeat-main | b42ecd33911d0c9e32333ed654a9f800668da7ab; detached |
| .codex/worktrees/95ca/aibeat-main | a94b28edd9015418027fd5aa5e470b1dd64b684a; detached |
| .codex/worktrees/a087/aibeat-main | 928e8d944af350ecdc0475120a730ce6a583c615; detached |
| .codex/worktrees/ff1b/aibeat-main | 0d21431bb0fa0d1c29388fb33f0e3aa66d81d93b; detached |
| .codex/worktrees/latest-tool-submissions/aibeat-main | 605f44c588cc8c1bb8ee7b0839d81a411e23593b; codex/latest-tool-submissions |
| .codex/worktrees/oct19-tool-listings/aibeat-main | 64ad465e7d381f5cd70345ed76ab37d5b0595f23; codex/oct19-tool-listings |

Registration is not a full content audit of every detached worktree. N/F/C are accessible and their statuses/evidence hashes were captured. A per-command exact-path safe.directory override was used for F ownership checks; no persistent Git config changed.

## 3. Checkpoint inventory

| Checkpoint / local existence | Implementation / tests / recorded functionality | Current state and limits |
| --- | --- | --- |
| Nitro 0A ed9ae9ede6fc73fdb53051246124db3418bcf0e9; exists, N HEAD | app/directory/page.tsx; components/ui/DirectoryClient.tsx; lib/directory-filters.ts; tests/directory-filters.test.ts and tests/directory-tsconfig.json; URL-backed search/category/pricing, resets and metadata | Committed. Historical 14/14 new tests; combined 26 PASS/1 FAIL, type/lint pass. No real browser/production build result. Remote sync UNVERIFIED; no cached remote ref contains this commit. |
| Nitro 0B, no new commit; N untracked preparation | .github/workflows/nitro-stage-0b-validation.yml; six reports in docs/nitro-v2; source metadata/failure gate, five literal-false install/type/lint/test/build steps | PARTIALLY IMPLEMENTED; 0B execution BLOCKED. Static review only, no dispatch. Prior report says two YAML parsers/eight shell/two Node syntax checks passed. Not committed/synchronized/deployed by this task. |
| Nitro 1A 52c6e90a8320ce46623c7c09db09310426ab73fd; exists, ancestor of F HEAD | F app/submit/page.tsx, components/founders/FounderSubmissionForm.tsx/SubmitToolForm.tsx, app/api/submit/route.ts; lib/founder-submission.ts, founder-submission-handler.ts, submission-request-body.ts, submission-editorial-model.ts; tests/founder-submissions.test.ts | Committed. Five-field free form, validated HTTPS intake, published-duplicate check and private-ID-free receipt; paid legacy path retained. 104 required offline passes in checkpoint report; broader SEO has existing failure. No live storage/approval/outbox/idempotency/abuse certification. Remote sync UNVERIFIED, no cached containing remote ref. |
| Nitro 1B-A af519d1e28e9a2224e2568339c3215b755a9b15e; exists, F HEAD | F tests/harness/nitro_integration.py/nitro_qualification.py/test_nitro_harness.py; tests/editorial-storage-policy.test.ts and fixtures; docs/nitro-v2/drafts/nitro-1b-a-storage.sql plus operator reports | Committed guarded design/harness. Checkpoint audit records 144 Node + 39 Python =183 offline passes (overlap with prior feature suites; do not add prior counts). Real qualified SQL/auth NOT EXECUTED/BLOCKED; draft is not an applied migration or working editor portal. Remote sync UNVERIFIED. |
| C01 d996449e908c237858fa0219efe0d01a673e605a ->93b7545f9bba140eb6f0c12a4a176c42e5733ea8 ->8e395c9d586559ba5233939fea3305e802ee1d83; all exist, C HEAD last | C authorization migration, Business helpers/routes, invitation acceptance/F1 correction; tests/rls, tests/e2e, invitation/concurrency fixtures; docs/community-phase-1/c01-development-handoff.md | PAUSED / DEFERRED VALIDATION. Historical Stage1 72/72, Stage2 8/8; invitation/F1 local implementation lacks real PostgreSQL/auth/browser validation. Cached origin/C01 now points at 8e395c9; this is not fresh remote/deployment proof. |

F has four pre-existing untracked reports (1A checkpoint audit and 1B architecture/readiness/roadmap), no tracked changes. C has 86 untracked evidence files, no tracked changes. Preserve all; do not auto-commit, export, delete, merge or retry tests. A0 checks existing evidence, not past test validity under current runtime.

### Important updated SEO evidence

F docs/nitro-v2/nitro-1a-checkpoint-audit.md records a clean export of base d5cc3b9 reproducing the same 66-character title assertion (tests/tool-seo.test.ts:20; slug a2o-lite-neon-ai-dance-generator). External local evidence `../nitro-1b-audit-baseline-seo.log` exists, tail reports 3 PASS/1 FAIL. This historical recorded reproduction is newer than N's earlier assessment saying reproduction pending. It supports pre-existing-defect classification; no A0 test/build ran and no fresh production build is certified. Do not rewrite preserved reports or quietly fix the title in A1.

### C01 immutability

Locally verified SHA-256:

- C supabase/migrations/202610140001_business_authorization_hardening.sql: 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C.
- C supabase/migrations/202610200001_business_invitation_acceptance.sql: EEAB243A588D6DE90FD2E5169EA16B7C07C4022D1C004D75592018215C6AD7BB.

Original authorization migration has historical staging application evidence; do not call it globally unapplied. Invitation migration is recorded unapplied/DB-unvalidated; current server state was not queried. Preserve RLS/owner/tenant/membership/audit/storage/receipt invariants and fixtures. No C01 branch deployment, RPC/schema coupling or auth change can be imported implicitly through Directory Lite.

## 4. Protected public structure / journeys

All rows describe local source preservation targets; none certifies current production UI or service behavior.

| Route / journey | Main sources, data and API dependencies | Preservation rule |
| --- | --- | --- |
| / editorial homepage | app/page.tsx; NewsImage/PremiumToolCard/NewsletterBox; getArticles from lib/articles.ts and content/articles/*.mdx; featured/popular from lib/data.ts | Preserve hero/news/editorial sections, ordering, Business/marketing teasers, links, CTA and shared styling. No directory-led redesign. |
| /news -> /news/[slug] | app/news/page.tsx (10-item archive pagination); app/news/[slug]/page.tsx; lib/article-seo.ts/article-content.ts, MDX, NewsImage | Preserve article layouts, canonical/pagination, metadata/schema, related/internal links and publication data. |
| /directory; /tools; /categories; /tools/[slug] | DirectoryClient/filter helper; static merged catalog; ToolLogo/ToolAffiliateOffer/ToolShareLinks; tool-seo | Preserve slugs/URLs, catalog precedence, deterministic ranks, group order, URL contract/canonical, offers/attribution. See feature matrix for gaps. |
| /compare; /compare/[slug]; /ai-score | app/compare/**, lib/data.ts COMPARISONS, existing score disclosures | Preserve comparison URLs/content/disclosures; no false community score. |
| /submit -> POST /api/submit | N legacy multi-step form; F simplified free variant exists separately; recordPublicFormSubmission -> Supabase RPC -> Gmail internal notification; optional verify-aibeat-link external fetch | Preserve paid/legacy payload and receipt correlation; no actual submission or provider request. Do not adopt F without approval and storage/abuse gates. |
| /for-founders; /spotlight; /advertise; /launch; /launches; /partners; /claim; /affiliate-disclosure | data/founder-services.ts; ServiceBlocks/SubmissionPricingCards/CheckoutButton; /launches uses featured catalog; inquiry/claim forms | Preserve offerings, route/copy/prices, promotion disclosures and checkout links. Existing launch marketing remains even though advanced future launches belong to Toolsvio. |
| /payment/success; /payment/cancelled; POST /api/stripe/{checkout,webhook} | lib/stripe.ts/stripe-webhook.ts, submission correlation and public storage | Preserve payment contract; no session/webhook/delivery operation. Persistent replay/order handling remains unverified. |
| /newsletter; /unsubscribe; public newsletter widgets | components/subscribe/*, NewsletterBox; /api/subscribe (Kit), /api/newsletter-request, /api/unsubscribe, suppression/contacts and Gmail helper | Preserve consent, recipients/suppressions/templates, popup, APIs and automation. Community opt-in must not subscribe users automatically. |
| /business/** public/private/auth | landing/demo/pricing/calculator; signup/signin/recovery/callback/onboarding; dashboard/workflows/approvals/etc; BusinessWorkspace, middleware, Supabase and server actions | Preserve current product and tenant checks; C01 paused is not an executable release flag. No shared auth changes for Lite. |
| Shared site shell | app/layout.tsx/globals.css; TopBar/Navbar/CommandSearch/ThemeViewToggle/BreakingTicker/Footer, SubscribePopup/PublicAnalytics | Visually/functionally unchanged without separate approval. Directory-only A1 cannot alter homepage/nav/footer styles or global analytics. |
| SEO/distribution | lib/site-seo.ts, article/tool SEO, app/{sitemap.ts,robots.ts,feed.xml/route.ts,news-sitemap.xml/route.ts,indexnow-key.txt/route.ts}; scripts/notify-indexnow.ts | Preserve canonical www host, robots, schema, sitemap/dedup, RSS/news feeds and IndexNow rules/schedules. |

## 5. Workflow and infrastructure baseline

Thirteen local workflows: twelve inherited tracked files plus the untracked blocked Nitro preparation. No activation state was queried or changed.

| File under .github/workflows | Source trigger / effects to preserve |
| --- | --- |
| daily-news.yml | M and daily 07/12/18 UTC; news/Groq/image generation, main publication and IndexNow |
| daily-tool-submissions.yml | Path-filter PR verify; daily 04 UTC and M; Supabase/Gemini review, catalog/main publication, Gmail unsent confirmation drafts |
| daily-lead-discovery.yml | Daily 04 UTC and M; lead discovery/Kit/Supabase/Gmail draft pipeline, queue/history writes/main push |
| product-hunt-outreach.yml | Daily 04:30 UTC and M; Kit import/drafts, variable-controlled send paths |
| linkedin-drafts.yml | Daily 18:30 UTC and M; draft artifacts, conditional LinkedIn API calls |
| reddit-community-automation.yml | Mon/Wed/Fri 08 UTC and M; drafts, optional enabled publication |
| newsletter-google-contacts.yml | Hourly minute 17 and M, enable flag; contacts/suppression sync |
| weekly-newsletter.yml | Wed 16 UTC and M; preview and conditional Gmail draft |
| weekly-tools-gmail-draft.yml | main push/PR tests; Fri 16 UTC and M gated draft job |
| monday-gmail-outreach-drafts.yml | M-only informational redirect, no actual scheduled job |
| indexnow.yml | main push restricted news paths and M; live checks/index submission |
| validate-redesign.yml | main push and M; broad lint/type/test/build; default token permissions not explicit |
| nitro-stage-0b-validation.yml | Untracked; M only, read token; unconditional containment failure; five app/install steps literal false |

M=workflow_dispatch. These are unchanged code schedules, not evidence of currently enabled hosted executions. No automatic newsletter send inferred from draft code. Drafts, contacts, DB writes and main publication are still external effects; do not call operational jobs harmless validators.

Prior 0B live inspection reported aibeat Vercel project-details 403; no retry/bypass occurred. N middleware still redirects *.vercel.app to production before route handling. Preview env scopes/Git integration/production branch/deploy hooks remain UNVERIFIED; manual-only CI does not prevent a push triggering preview deployment. Independent containment, dependency lifecycle safety, full-app build without services and browser descendant verification remain BLOCKED. No production credentials/values accessed. The historical Windows runtime limitations are not re-qualified here.

## 6. A0 preservation verification

Before/after: N/F/C HEADs unchanged; no tracked diff; all 13/12/12 workflow hashes and all 7/86/4 pre-existing untracked file hashes preserved respectively. Only the five authorized docs/aibeat-directory-lite Markdown files are new. Static document/path/whitespace checks only; no application tests. Hash inventories below bind the local uncommitted preparation and workflow baseline without copying private evidence contents.

### Seven pre-existing untracked Nitro files (SHA-256)

| Preserved file relative to N | Hash |
| --- | --- |
| .github/workflows/nitro-stage-0b-validation.yml | 4173006C6547C71ADD49A82E80882BF69CA73C81B0FBF21E6CF65985D8A502C2 |
| docs/nitro-v2/nitro-0b-ci-activation-checklist.md | 5EEDE6A910C0DCCE2C66D5FB59F559A7161107BAF262854B0BE6D266BBF702D8 |
| docs/nitro-v2/nitro-0b-ci-design.md | 576FA1D4B4BC9C1BD8B84E78E9D8E5981940531B1DA0710B7C278D26CEC0303F |
| docs/nitro-v2/nitro-0b-ci-implementation.md | B9FC8CBB842F7883C2BEC5A977C70EF65D8ACB04D385C43FB7AFD38DBFCBB990 |
| docs/nitro-v2/nitro-0b-ci-security-review.md | C9AA19832E588F94DF58F4B384747DB73CBCDE6571A815EF8C2358A183075B8E |
| docs/nitro-v2/nitro-0b-remote-testing-assessment.md | 721334A92208A1CAAB0B97B1E1810CB7F875EBE57E89735A3DE39F8BD82CFDEF |
| docs/nitro-v2/nitro-0b-testing-decision.md | 48AC67E3C522C7EA55AF5A628D2D8F392CFB36353F93130D6336286A30272B0C |

### Thirteen pre-existing local workflows (SHA-256)

| File under N/.github/workflows | Hash |
| --- | --- |
| daily-lead-discovery.yml | 320DCA06F467813604BDA7CF2C14B4892147F9CD6B4D22E64A4F00C3025805F3 |
| daily-news.yml | B1328213EB9C6E9192809A3344E98B7DCEDB133F712A6425C9BD869F843D8E28 |
| daily-tool-submissions.yml | F956E6321EFB3AE640430ED0AD368489E437267FCF91CCBF569791554E7A65B0 |
| indexnow.yml | 7F0DF767594878A8124595BC6E5B3077AA7F33BCFE5A3E28289011FD58A2B42C |
| linkedin-drafts.yml | 4AA54339EE29CFDC93A65E96C3D40A5122C19E38825FD1B3BE2C9E4953E8E737 |
| monday-gmail-outreach-drafts.yml | 7DF08C4757580C65D6AFE72C3A887E20F98E5FE9F8AD38FDCB59BBD4D3E651D6 |
| newsletter-google-contacts.yml | B1AC861955D0A20E3E6543FA1E75B776C976927C9AEB91F1FFA0C290840CC1C2 |
| nitro-stage-0b-validation.yml | 4173006C6547C71ADD49A82E80882BF69CA73C81B0FBF21E6CF65985D8A502C2 |
| product-hunt-outreach.yml | 1C0C95ECDC2C629FEDC4D0E94E8CEE1137BECA947D2FEFE18AFB27BECBA01EBE |
| reddit-community-automation.yml | 4BA9CB94C7CA8034DE90082DD29DE92852C8666CD52320377F688FA546584583 |
| validate-redesign.yml | 16C40D1765E4A22815DDF1A1D25CA58948D6BEB2CCFC445FB989BBFE66116BE9 |
| weekly-newsletter.yml | F93F1A7900D18C08E48F47E1C26C9EC4F13F8C569145BF0E63BD816728999658 |
| weekly-tools-gmail-draft.yml | 4FF4E6D55AE446D1BB5FCD3E583A86875AF0925A2D1E57E73F32470539F3D72C |
