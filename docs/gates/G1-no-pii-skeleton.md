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
| G1-02 | Preview deploy of platform-web + intake-api + backplane configs | ADR 0001 | Pending | Wrangler configs present (`wrangler.toml`, `wrangler.intake.toml`, `wrangler.backplane.toml`); blocked on Cloudflare/CI billing / deploy credentials — no preview URLs yet |
| G1-03 | Forced RLS / missing-context denial proven in integration tests | INV-07, INV-08 | Partial | `rls-isolation.test.ts` (missing context, cross-tenant/rooftop, wrong purpose, page_releases + commands isolation); FORCE RLS migrations |
| G1-04 | Synthetic listing → audit → approve → PageRelease → public fetch | INV-14–18 | Partial | put-before-activate via default artifact store; `/jobs` prefers content-addressed body + sanitized HTML; live Cloudflare R2 still Pending |
| G1-05 | PageRelease rollback to prior manifest | INV-15, RC-06 | Partial | `tests/integration/g1-listing-publish.test.ts` (activate v2 → `rollbackPageRelease` → active is v1); activate path now single-active |
| G1-06 | Approval + Command + outbox atomicity; provider call outside txn | INV-19–20 | Partial | `tests/integration/approval-command-outbox.test.ts`; `publishApprovedPage` activates PageRelease only after redeem txn commits |
| G1-07 | Ambiguous timeout → NeedsReconciliation; no blind recreate | INV-21, RC-08 | Partial | Fixtures + resolve; `/ops/reconciliation` board with captions/`aria-live` (`ops-boards.test.ts`) |
| G1-08 | Synthetic envelope accept + queue-down replay converges; no dupes | INV-11–13, RC-03 | Partial | `projectEnvelopeToApplication` + RC-03 drill in `acceptance-envelope.test.ts` (queue-down skip → delayed project, zero dupes); ops drain UI still Pending |
| G1-09 | Inbox dedupe + schema/message N/N−1 compatibility | INV-39 | Partial | `pnpm db:migrate:check` in `pnpm verify` / CI; envelope idempotency key dedupe proven in G1-08 tests; N/N−1 message matrix still Pending |
| G1-10 | Liveness Fresh/ObservedZero/Missing/Stale; abstain vs halt | INV-23 | Partial | `liveness.test.ts` + `/ops/liveness` (caption/`aria-live`) + CLI DB list; seed rows |
| G1-11 | Telemetry contains **zero** applicant PII (synthetic scan) | INV-37 | Partial | `emitSafeEvent` + `pnpm scan:pii` (no `console.*` on intake/worker/telemetry paths; forbidden PII keys); live sink redaction review still Pending |
| G1-12 | Audited ops CLI/page: inspect, DLQ/outbox replay, safe retry | INV-38 | Partial | Inspect via OPS_CONTROL_SECRET; replay needs signed actor (break-glass emergency-only); demo recording still Pending |
| G1-13 | Kill switches for intake and campaigns smoke-tested | INV-51, RC-15–16 | Partial | Durable store + API/CLI + `/ops` status readback/resume form; `kill-switch.test.ts`; secret + signed actor required |
| G1-14 | SBOM, digests, SAST/deps/secrets, rollback target in CI | ADR 0010 | Partial | CI: SBOM + provenance digest + gitleaks + blocking `pnpm audit --audit-level=high`; full SAST/rollback drill still Pending |
| G1-15 | Threat model reviewed for skeleton surfaces | threat-model | Partial | Engineering self-check table in `docs/threat-model.md` (G1 skeleton surfaces); formal owner sign-off still Pending |
| G1-16 | All synthetic data labeled `SYNTHETIC` | partners | Partial | Seed + vertical-slice + demo shells labeled; `pnpm scan:pii` asserts seed/vertical-slice/demo; partner dossier cross-check still Pending |

## Honest Pass gap list (not Pass-ready yet)

| Blocker | Gate IDs | Owner / note |
| --- | --- | --- |
| Preview deploy URLs for web + intake + backplane | G1-02 | External: Cloudflare/CI billing / deploy credentials |
| Live R2 PageRelease artifact binding (not memory spike) | G1-04 | Engineering when binding Selected |
| Formal threat-model + fixture sign-off | G1-15, G1-16 | Program owner / partners |
| CI SAST/secrets + rollback drill evidence | G1-14 | CI / ops |
| Ops demo recording / screenshots linked as evidence | G1-12 | Operator walkthrough of `g1-ops-demo-script.md` |
| Green `verify` + integration on `main` CI run linked here | G1-01 | Push/PR once ready |

**Loop stop (2026-07-29):** Remaining Pass blockers are external (deploy/billing), Selected bindings (live R2), owner sign-off, CI SAST/demo recording, and a green CI run on `main`. No further continuous engineering ticks without those inputs. **Do not** pull G2 live PII until this list clears or is Waived.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail  

Next: [G2-live-pii.md](./G2-live-pii.md)
