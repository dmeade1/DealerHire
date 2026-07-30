# Gate G1 — No-PII walking skeleton

**Purpose:** Prove the synthetic vertical skeleton before any live applicant PII.  
**Entry:** Repository bootstrapped; ADRs and assurance docs present; synthetic tenant fixtures only.  
**Exit:** All criteria `Pass` with linked evidence. Fail/Pending blocks G2.

## Scope proven

Tenant/rooftop/team identity → forced tenant/purpose boundary → requirements/job-control versioning → deterministic audit → approval/effect manifest → atomic command/outbox/receipt/reconciliation (synthetic) → English `PageRelease` → admission/liveness/abstain-vs-halt → PII-free observability → audited recovery tooling → CI (SBOM/provenance/migration check).

**Out of scope:** Live PII, real Meta/Google actuation, reviewer-visible candidate AI, SMS, custom domains, Spanish, cross-tenant analytics.

## Criteria

| ID | Criterion | INV | Status | Evidence |
| --- | --- | --- | --- | --- |
| G1-01 | Clean-clone install, lint, typecheck, unit tests pass | — | Partial | Local `pnpm verify` (typecheck/lint/unit/migrate:check/scan:pii/build); CI `verify` job in `.github/workflows/ci.yml` — Pass when green on main |
| G1-02 | Preview deploy of platform-web + intake-api + backplane configs | ADR 0001 | Partial | Temporary preview (claim within 60m): `https://dealerhire-platform-web.grizzled-rosehip.workers.dev/health`, `https://dealerhire-intake-api.grizzled-rosehip.workers.dev/health`, `https://dealerhire-backplane.grizzled-rosehip.workers.dev/health` — all return ok; permanent URLs after claim + `wrangler login` |
| G1-03 | Forced RLS / missing-context denial proven in integration tests | INV-07, INV-08 | Partial | `rls-isolation.test.ts` (missing context, cross-tenant/rooftop, wrong purpose, page_releases + commands isolation); FORCE RLS migrations |
| G1-04 | Synthetic listing → audit → approve → PageRelease → public fetch | INV-14–18 | Partial | put-before-activate via default memory store + `createR2BucketArtifactStore` (unit-tested); `/jobs` prefers content-addressed body + sanitized HTML; live Cloudflare R2 binding still Pending (wrangler commented) |
| G1-05 | PageRelease rollback to prior manifest | INV-15, RC-06 | Partial | `tests/integration/g1-listing-publish.test.ts` (activate v2 → `rollbackPageRelease` → active is v1); activate path now single-active |
| G1-06 | Approval + Command + outbox atomicity; provider call outside txn | INV-19–20 | Partial | `tests/integration/approval-command-outbox.test.ts`; `publishApprovedPage` activates PageRelease only after redeem txn commits |
| G1-07 | Ambiguous timeout → NeedsReconciliation; no blind recreate | INV-21, RC-08 | Partial | Fixtures + resolve; `/ops/reconciliation` board with captions/`aria-live` (`ops-boards.test.ts`) |
| G1-08 | Synthetic envelope accept + queue-down replay converges; no dupes | INV-11–13, RC-03 | Partial | `projectEnvelopeToApplication` + RC-03 drill in `acceptance-envelope.test.ts` (queue-down skip → delayed project, zero dupes); ops drain UI still Pending |
| G1-09 | Inbox dedupe + schema/message N/N−1 compatibility | INV-39 | Partial | Envelope idempotency (G1-08); `src/modules/messaging/inbox.ts` N/N−1 matrix + unit tests; backplane `parseInboxMessage` poison→retry; FORCE RLS migrate:check remains separate |
| G1-10 | Liveness Fresh/ObservedZero/Missing/Stale; abstain vs halt | INV-23 | Partial | `liveness.test.ts` + `/ops/liveness` (caption/`aria-live`) + CLI DB list; seed rows |
| G1-11 | Telemetry contains **zero** applicant PII (synthetic scan) | INV-37 | Partial | `emitSafeEvent` + `pnpm scan:pii` (no `console.*` on intake/worker/telemetry paths; forbidden PII keys); live sink redaction review still Pending |
| G1-12 | Audited ops CLI/page: inspect, DLQ/outbox replay, safe retry | INV-38 | Partial | Outbox + `hiring.dead_letter` DLQ (`ops-dlq.test.ts`); `/ops/recovery`; CLI `dlq:inspect`/`dlq:retry` + outbox replay (signed actor); demo recording still Pending |
| G1-13 | Kill switches for intake and campaigns smoke-tested | INV-51, RC-15–16 | Partial | Durable store + API/CLI + `/ops` status readback/resume form; `kill-switch.test.ts`; secret + signed actor required |
| G1-14 | SBOM, digests, SAST/deps/secrets, rollback target in CI | ADR 0010 | Partial | CI: `pnpm sbom` CycloneDX-ish + provenance (`git:sha` rollback target) + container gitleaks + `pnpm audit` + eslint; **Actions jobs currently fail with 0 steps (billing/minutes — external)**; full SAST/rollback drill still Pending |
| G1-15 | Threat model reviewed for skeleton surfaces | threat-model | Partial | Engineering self-check table in `docs/threat-model.md` (G1 skeleton surfaces); formal owner sign-off still Pending |
| G1-16 | All synthetic data labeled `SYNTHETIC` | partners | Partial | Seed + vertical-slice + demo shells labeled; `pnpm scan:pii` asserts seed/vertical-slice/demo; partner dossier cross-check still Pending |

## Honest Pass gap list (not Pass-ready yet)

| Blocker | Gate IDs | Owner / note |
| --- | --- | --- |
| Permanent Cloudflare account (claim temporary preview; R2 still unsupported on temp accounts) | G1-02, G1-04 | Claim URL printed by `wrangler deploy --temporary`; then Selected R2 |
| Live R2 PageRelease artifact binding (adapter ready; binding not Selected) | G1-04 | Uncomment wrangler `PUBLIC_ARTIFACTS` when bucket Selected |
| Formal threat-model + fixture sign-off | G1-15, G1-16 | Program owner / partners |
| GitHub Actions runners start (jobs fail 0-step; Actions enabled but no logs) | G1-01, G1-14 | External: restore Actions minutes / billing for private repo |
| Ops demo recording / screenshots linked as evidence | G1-12 | Operator walkthrough of `g1-ops-demo-script.md` |
| Green `verify` + integration on `main` CI run linked here | G1-01 | After runners work; workflow hardened 2026-07-29 |

**Engineering advanced (2026-07-29):** G1-09 N/N−1 inbox parser; G1-12 Postgres DLQ + `/ops/recovery`; G1-04 R2 bucket adapter; G0 Status/evidence hygiene; CI SBOM/gitleaks/migrate steps. Remaining Pass blockers are still mostly external (Actions minutes, deploy, R2 Selected, sign-offs, demo recording). **Do not** pull G2 live PII until this list clears or is Waived.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail  

Next: [G2-live-pii.md](./G2-live-pii.md)
