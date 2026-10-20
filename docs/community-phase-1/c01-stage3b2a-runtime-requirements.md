# C01 Option B — restricted runtime contract (preparation only)

No staging transport is enabled by this contract. All prepared environments set C01_E2E_STAGING_ENABLED=0, and the shared Node/browser policies reject staging requests regardless of an inherited flag. --start and global setup remain closed. The approved strategy changes the intended infrastructure approach; it does not authorize using the network exception.

## Independent boundary

An operator must identify an existing approved runtime and prove a default-deny policy covering the controller, Next main/server/worker/child processes, Playwright workers, Chromium browser/renderer/GPU/utility/network processes, DNS, raw sockets and alternate transports. A proxy setting, caught fetch error or point-in-time connection list is not proof. No host installation or firewall change is included in preparation.

Before any separately authorized staging access, exercise deny-all with dummy data and retain independent management-plane evidence. Future allowlisting is limited to HTTPS port 443 for oejxwsvlvelxmfbysjbx.supabase.co. No wildcard Supabase domain, production host, deployment hostname, broad IP range or general internet exception is acceptable. Shared service IPs are not project identity.

DNS must be controlled by the boundary: prevent arbitrary resolver/DoH/UDP bypass and validate exact-name resolution and rebinding behavior. The TLS path must validate the certificate/hostname and approved origin, with no disabled certificate checks or unreviewed CA injection. If a controlled proxy is used, its enforcement and every process's mandatory use must be independently demonstrated. Supabase client keys and user JWTs must reach only the exact approved origin; redirects must not forward them elsewhere.

No remote redirect is followed. Local redirects may remain on the exact loopback origin. Raw alternative egress and browser background traffic remain denied independently of JavaScript guards. A boundary policy change invalidates prior deny-only evidence for that path; verify the approved exception before E2E.

## Shared runtime and process controls

Both prepare() and prepareLocal() use runtime-config.cjs. It creates a fresh filtered snapshot, an explicit Windows environment, dummy provider values, mock AI, one preload/policy, the snapshot Stripe fetch adapter, the snapshot layout adapter and the same middleware guard. Public configuration uses the existing corrected direct NEXT_PUBLIC references. No repo-root normal app launch is allowed.

runtime-preload.cjs handles Node network/DNS/child/worker restrictions. containment.cjs is only a compatibility import, not a separate security implementation. browser-policy.cjs is used by both local browser probes and the prepared Playwright fixture. Legacy browser/staging opt-in flags do not unlock this preparation.

The local probe mode alone permits exact intentional negative probes. Unexpected browser or Node requests synchronously persist a first-violation file and terminate their originating process; the supervisor stops registered/observed run processes and closes registered browsers. A shared pre-scenario fence prevents a later scenario starting after abort. Middleware sends an unexpected remote-attempt signal to a snapshot-only local fatal endpoint, so catching the original exception cannot silently suppress the evidence. The intentional middleware self-probe is limited to local-probe snapshots.

Supervision is event driven with a short polling fallback, not a hard-real-time OS transaction. Independent enforcement must stop an unauthorized packet; monitoring supplies shutdown/evidence. Unreadable/corrupt complete ledger evidence fails closed. A failure to persist evidence is itself a failed/blocked run, never a pass. Only owned run PIDs/handles may be terminated; the external runtime should additionally offer a scoped job/container teardown.

## Credential separation and fixtures

The application receives the approved staging public client key/user context only after separately authorized pairing verification; browser sessions use normal user credentials. No service-role/postgres/setup key belongs in app or browser environments, files, arguments, traces or logs. The protected test manifest belongs to the supervised test worker only, not the app environment. runner-policy.cjs prepares a separate runner role with the protected manifest pointer; the shared preload validates that role, permits only the installed Playwright worker entry and constrained Chromium executables, and forbids starting Next with the runner environment. Browser options use a minimal environment and the controlled loopback proxy. Full Playwright scheduling is still unexecuted and is not unlocked by global setup.

Privileged identity setup remains a separately authorized short-lived process. The provisioning review module has no executable adapter and stops before all writes. Its nine-account/three-organization proposal is BLOCKED on ordinary authorized membership activation, which C01 does not currently implement. Do not insert active memberships using SQL/service role, disable triggers, weaken RLS or fabricate invitation acceptance to bypass that blocker.

All future fixture manifests must contain exact fresh synthetic identities and IDs, exact namespaced storage paths, reviewed workflow snapshots and naturally generated audit IDs. Preserve all Stage 1/2 evidence and retain new data by default. Any deletion needs an exact independent approval; no automatic broad cleanup.

## Before unlocking an actual staging run

Required: independently verified boundary and descendants; genuine staging URL/key/cluster identity preflight; staging backend email/webhook/schedule effect review; approved role-fixture activation path; reviewed exact provisioning definitions and ID ledger; protected runner manifest/worker integration; genuine expired-session cookie provenance; live TLS/transport exception implementation and verification; separate fixture-write and selected-case E2E authorizations.

The live transport/worker bootstrap remain gated preparation dependencies, not completed runtime evidence. Current offline/local checks cannot certify them. Do not remove global setup, add an environment-only bypass or treat 23-case collection as execution.

## Evidence and shutdown

Retain sanitized first-violation and per-process JSONL records, test names/statuses, source/configuration hashes, expected-probe labels, independent boundary configuration and descendant environment comparison results. Do not log URL queries, Authorization headers, JWTs, passwords, cookie values or raw error payloads. Traces/screenshots/video remain disabled.

On the first unexpected violation: fence scheduling, persist sanitized evidence, terminate the emitting process, stop the owned process group and close Chromium. Verify shutdown and retain the exact fixture ID/path inventory. A failed run is not automatically retried; do not recycle Stage 1/2 records or delete immutable audits.
