# AIBeat Business automation delivery plan

## Operating structure

Every automation should follow: validate inputs → retrieve organization memory → collect verified source data → generate and validate a draft → persist evidence and model usage → request review → execute only the approved action → record the outcome.

Business Memory should contain a reviewed company overview, products and pricing, ideal customers, brand rules, reporting definitions, and source dates. Store measured results separately from targets and estimates. Do not treat previous AI findings as independently verified facts.

## Implemented in this change

- Forward workflow inputs to live agent generation.
- Persist generated content before requesting approval, and include the finding and exact content in the approval payload.
- Stop approval resumption at a later approval or restricted boundary.
- Identify pilot connector outputs as simulated, including reads.
- Reject invalid schedule syntax and invalid times; correct calendar-date handling for western timezones.
- Count returned failed workflow runs as scheduler failures.
- Supply canonical Business navigation paths to the assistant.

## Production work still required

1. Add organization-scoped OAuth adapters for a specifically selected CRM and Google Workspace. Credentials must belong to the organization; do not reuse the website owner's newsletter credentials for customer organizations. Health checks must verify provider access, not just saved connection status.
2. Implement real read adapters with source timestamps and bounded results. Begin with report inputs and public prospect evidence. Give unavailable sources explicit missing-data results.
3. Implement delivery adapters separately from generation. Approved payloads need immutable versions, destination validation, provider idempotency keys, execution receipts, and retries that cannot send twice. Current approval resolution still simulates writes.
4. Connect scheduling to a durable production worker. The existing scheduler is an in-memory component, not an unattended production service. Use database-atomic leases, stable occurrence IDs across retries, persisted workflow inputs, backoff, dead-letter review, and per-organization limits. Do not enable recurring sends until this exists.
5. Implement additional approval checkpoints as resumable states. This change stops rather than bypasses a second approval boundary.
6. Add workflow readiness and source-health UI, run budgets, duplicate-run protection under concurrency, and failure notifications. Clearly distinguish mock execution, live AI generation, and live external actions.

## Acceptance checks before rollout

- Marketing input changes the generated draft and the reviewer sees that exact saved draft.
- Report output identifies unavailable KPIs without inventing figures.
- Failed generation creates no approval request.
- One approval cannot authorize subsequent sensitive steps.
- Pilot outputs cannot be mistaken for completed external operations.
- Production scheduler survives restarts and two simultaneous workers without duplicate runs.
- Tenant A cannot retrieve tenant B's memory, tokens, findings, or approvals.
- A retried delivery produces one provider receipt and one external action.

Deploy the code after tests and build pass. No production credentials, external sends, or recurring jobs are activated by this change.
