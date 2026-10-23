# A2A implementation report — pure submission validation

Date: 2026-10-23. **IMPLEMENTED LOCALLY — AWAITING REVIEW.** No runtime validation has occurred. This is an unmounted pure helper and test source, not an active intake workflow or production-ready submission system.

## 1. Repository baseline and scope

Source root: `C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery`.

Branch: `codex/nitro-v2-directory-discovery`. HEAD: `7d45a92fdd8c12b00136dcf1cdee8ce6829082b6`. Preflight matched the required clean tracked tree and index, with nine pre-existing untracked files: seven Nitro 0B preparation files and the two A2 inspection/proposal documents. All three authorized creation paths were absent.

Only these files are created:

1. `lib/directory-lite-submission.ts`
2. `tests/directory-lite-submission.test.ts`
3. `docs/aibeat-directory-lite/a2a-implementation-report.md`

Required A2 inspection/proposal references, the actual founder Nitro 1A validator and tests, worker category definitions, and directory URL conventions were read. No existing source, configuration, dependencies or documentation is modified. Nothing is wired into a form, route, API, storage adapter or publication worker.

## 2. Actual contract and compatibility

`validateDirectoryLiteSubmission(input: unknown)` accepts a plain object with own enumerable data properties, including a null-prototype record. Arrays, class instances, custom prototypes, accessor/nonenumerable properties, symbol keys and unexpected fields are rejected. Values are not coerced. Own property checks distinguish missing fields from explicit invalid types; input is not mutated or retained in the output. Reflection errors produce a fixed structural error without exception details. Proxy reflection traps can execute caller code: the helper is not a sandbox for hostile JavaScript objects. Future ingress must parse bounded JSON independently.

The actual Nitro 1A reference has five string fields plus explicit boolean privacy acknowledgement. A2A preserves their names and practical normalization rules:

| Field | Contract after outer whitespace trimming |
| --- | --- |
| `name` | 2–100 UTF-16 code units; internal spacing preserved |
| `url` | 1–2048 UTF-16 code units; HTTPS website normalization below |
| `shortDescription` | 10–280 UTF-16 code units; internal spacing preserved |
| `category` | Exact supported category; explicit 1–15 bound covers the longest supported name |
| `email` | 1–254 UTF-16 code units; lowercased ASCII mailbox syntax check |
| `consent` | Own property with boolean `true`; privacy acknowledgement, not marketing subscription |

The eleven unchanged worker-compatible categories are AI Writing, AI Image, AI Video, AI Audio, AI Agents, Developer Tools, Productivity, Marketing, Education, Design and Business. This list applies only to the new helper; the existing 31-category catalog is untouched.

Every raw string rejects literal angle brackets, ASCII controls and C1 controls before trimming. Empty/whitespace-only values fail. Text is not truncated, HTML-decoded, Unicode-normalized or internally collapsed. Lengths use JavaScript `string.length`, matching Nitro 1A rather than directory search's separate code-point policy.

Website rules: explicit HTTPS only; no whitespace, backslashes, embedded credentials (including empty user-info delimiters), nondefault ports, literal IPs, single-label/local/reserved hostname shapes or invalid DNS label syntax. Host labels are bounded to 63 characters and the normalized hostname to 253. Built-in WHATWG `URL` parsing lowercases the host, handles IDN-to-punycode, removes default port 443 and performs standard URL serialization. One trailing host dot and the fragment are removed. Path case, meaningful query entries, order and tracking parameters are retained. Serialized output is also bounded to 2048. A bare host gains `/`. No DNS resolution, URL fetch, ownership or reachability verification occurs.

Email uses Nitro 1A's lightweight ASCII syntax convention, rejects consecutive dots and leading/trailing local-part dots, and lowercases the full mailbox for compatibility. It is not exhaustive RFC mailbox validation, domain-label/local-part limit enforcement, deliverability or ownership verification. Internationalized email addresses are unsupported.

Deliberate differences from Nitro 1A: extra fields fail instead of being projected away; object structure is stricter; raw controls cannot disappear during trimming; C1 controls fail; trailing local-part dots and empty URL user-info fail; normalized URL/domain bounds are explicit. These local restrictions do not alter the existing founder helper or active admission behavior. No founder duplicate, payload, receipt or persistence helpers were copied/imported. No product identity or directory query convention is changed.

## 3. Structured errors and privacy

Success is `{ ok: true, value: { name, url, shortDescription, category, email, consent: true } }`. The normalized email remains private caller data; successful results must not be logged indiscriminately.

Failure is `{ ok: false, errors: { [fieldOrForm]: code } }`, with no value payload. Allowed keys are the five field names, `consent` and `form`. Codes are `INVALID_STRUCTURE`, `UNEXPECTED_FIELDS`, `REQUIRED`, `INVALID_TYPE`, `INVALID_LENGTH`, `INVALID_TEXT`, `INVALID_URL`, `INVALID_EMAIL`, `INVALID_CATEGORY`, and `CONSENT_REQUIRED`. Structural failures return early; valid structures aggregate field errors. No submitted values, unexpected property names, email addresses or exception messages are echoed. There are no logging calls.

## 4. Test declarations and static inspection

There are **26 top-level test declarations**, with table-driven cases covering the minimum contract; all categories; trimming and email normalization; HTTPS/default port/path/query/fragment behavior; IDN; HTTP rejection; missing/empty/wrong-type values without coercion; name/description/email/URL bounds including serialized expansion and UTF-16; invalid mailboxes/categories/consent; malformed and unsupported URLs; credentials, ports, local/IP hosts; markup/control characters on every string field; extra/symbol keys; arrays/null/class/custom-prototype input; accessors/nonenumerable properties; throwing reflection; frozen/null-prototype input; mutation isolation; deterministic fixed errors without email echo.

Tests import only Node test/assert builtins and the new helper. The helper imports nothing and has no filesystem, environment, network, database, email, credential, logging, clock or randomness calls. Its only URL operation is synchronous built-in parsing/serialization. No existing component/route imports it. These are source inspection findings, not runtime proof.

Static review checked the complete new helper/test source and compatibility against the references. Tracked and cached Git whitespace checks pass; those checks do not cover untracked files, so the three new files also receive direct trailing-whitespace/conflict-marker inspection. No new dependencies, scripts, configuration or feature flags are introduced.

Source SHA-256 values at review:

| File | SHA-256 |
| --- | --- |
| `lib/directory-lite-submission.ts` | `5ed2139e56633f7dd2fec7beaccf93a740594548818e8999359b3b0df67ce455` |
| `tests/directory-lite-submission.test.ts` | `586bfc3c5a727f1c6b4a726119c92b844543bef37fbb7742235726b9c3249c8e` |

## 5. Preservation verification

Before/after SHA-256 inventories cover every Git-tracked and nonignored untracked regular file in each worktree, excluding only the three new authorized paths in this worktree. The same sorted path-to-content-hash JSON manifest is hashed for comparison; symlink/reparse file entries are rejected. Dependency junctions and ignored caches are not traversed. This establishes preservation of inventoried source/evidence, not an inventory of ignored dependency content or Git internal files.

| Worktree | Existing files | Unchanged manifest SHA-256 |
| --- | ---: | --- |
| Current directory/Nitro | 909 | `2c2ff899b27c80c31a94b0a7470fed353c1b0bd6be0d17e36c1819ef3bbcaf36` |
| Founder | 915 | `fffcb77af555aeae0197600c532292dec94863d1c254e58ab2aa8ec97f5e0785` |
| C01 | 1030 | `3a9ba7fa89511530c5f4144f6b28d8a75c40a2e9b706362de85746d8d606eb50` |

The original nine untracked files remain present and byte-identical. Final expected current status is twelve untracked files (nine preserved plus these three), with no tracked or staged diff. Founder remains at `af519d1e28e9a2224e2568339c3215b755a9b15e` with four untracked files; C01 remains at `8e395c9d586559ba5233939fea3305e802ee1d83` with 86 untracked evidence files. Their branches, index and tracked status remain unchanged. Existing Nitro, A0/A1/A2 documents, workflows, directory/search/filter/ranking/URLs/SEO, commercial, news, Business, newsletter, auth and database files are included in preservation inventories.

## 6. Unexecuted validation and security gates

No tests, TypeScript, ESLint, builds, installs, application processes, browser automation, service calls, database operations, commits, pushes or deployment were performed. There are no test pass/fail counts. Type correctness, actual WHATWG normalization and all test expectations remain unverified at runtime. The new tests must await an independently qualified disposable environment with reviewed offline dependencies, independently blocked egress, no production secrets, read-only original repositories, bounded writable resources and complete process-tree teardown. The existing C01 dependency junction is unsuitable.

Validation does not prevent DNS rebinding/SSRF, encoded unsafe content, homograph deception, spam, impersonation or duplicate submissions. Future consumers still require safe contextual rendering and URL policy at every actual network boundary. No HTML sanitization or URL ownership claim is made. Pure unit tests cannot establish those external guarantees, actual consent capture, authenticated identity, storage privacy, rate limits or publication enforcement.

**A2A does not provide secure persistence, authoritative duplicate prevention, editorial authorization or publication approval enforcement.**

Activation remains blocked on separately approved authoritative ingress/body limits, abuse controls, identity/idempotency and atomic private persistence, least-privilege editorial grants with real provider identity/revocation verification, version-bound decisions/audit, existing-writer fencing, publication proof and compatibility with legacy paid/shared form flows. No submission receipt or accepted/pending state is provided here.

## 7. Recommended next approval

Review this pure contract and its documented stricter rejection rules, then authorize focused tests and type checking only after environment qualification. An optional unmounted in-memory draft form requires its own file allowlist; A2B persistence design/implementation requires a separate approval and must remain inert until its security gates are satisfied. Do not activate intake or begin another slice automatically.

**A2A IMPLEMENTED LOCALLY — AWAITING REVIEW**
