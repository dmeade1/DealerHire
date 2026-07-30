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
| G1-01 | Clean-clone install, lint, typecheck, unit tests pass | — | **Pass** | Local `pnpm verify`; CI on `main`: https://github.com/dmeade1/DealerHire/actions/runs/30504876138 (`verify` + `integration`) |
| G1-02 | Preview deploy of platform-web + intake-api + backplane configs | ADR 0001 | Partial | Temp preview (claim ≤60m): `https://dealerhire-platform-web.misty-warlock.workers.dev/health`, `https://dealerhire-intake-api.misty-warlock.workers.dev/health`, `https://dealerhire-backplane.misty-warlock.workers.dev/health` — all return ok (2026-07-30); permanent after claim + `wrangler login` |
| G1-03 | Forced RLS / missing-context denial proven in integration tests | INV-07, INV-08 | **Pass** | `rls-isolation.test.ts` + FORCE RLS migrations; green on main CI 30504876138 |
| G1-04 | Synthetic listing → audit → approve → PageRelease → public fetch | INV-14–18 | Partial | put-before-activate + `createR2BucketArtifactStore` unit-tested; `/jobs` reader; **live R2 binding still Pending** (needs claimed CF account — R2 unsupported on temp accounts) |
| G1-05 | PageRelease rollback to prior manifest | INV-15, RC-06 | **Pass** | `g1-listing-publish.test.ts` activate v2 → rollback → v1; green on main CI |
| G1-06 | Approval + Command + outbox atomicity; provider call outside txn | INV-19–20 | **Pass** | `approval-command-outbox.test.ts`; `publishApprovedPage` post-commit activate; green on main CI |
| G1-07 | Ambiguous timeout → NeedsReconciliation; no blind recreate | INV-21, RC-08 | **Pass** | Fixtures + resolve + `/ops/reconciliation`; green on main CI |
| G1-08 | Synthetic envelope accept + queue-down replay converges; no dupes | INV-11–13, RC-03 | **Pass** | Envelope project + `ops-drain.test.ts` + `/ops/drain` + CLI; evidence `docs/gates/evidence/g1-ops-demo-transcript.json` (drain-list ok @ d846427) |
| G1-09 | Inbox dedupe + schema/message N/N−1 compatibility | INV-39 | **Pass** | Envelope idempotency + `messaging/inbox` N/N−1 unit tests + backplane parse; green in CI verify |
| G1-10 | Liveness Fresh/ObservedZero/Missing/Stale; abstain vs halt | INV-23 | **Pass** | `liveness.test.ts` + `/ops/liveness` + CLI; green on main CI |
| G1-11 | Telemetry contains **zero** applicant PII (synthetic scan) | INV-37 | **Pass** | `emitSafeEvent` fail-closed + `pnpm scan:pii` green on main CI; G1 sink is stdout JSON only (no third-party log sink Selected yet — platform sink remains post-G1) |
| G1-12 | Audited ops CLI/page: inspect, DLQ/outbox replay, safe retry | INV-38 | **Pass** | Outbox + DLQ + `/ops/recovery` + drain; full CLI walkthrough in `docs/gates/evidence/g1-ops-demo-transcript.json` (all steps ok @ d846427) |
| G1-13 | Kill switches for intake and campaigns smoke-tested | INV-51, RC-15–16 | **Pass** | Durable store + API/CLI + `/ops`; `kill-switch.test.ts`; green on main CI |
| G1-14 | SBOM, digests, SAST/deps/secrets, rollback target in CI | ADR 0010 | **Pass** | Main CI https://github.com/dmeade1/DealerHire/actions/runs/30539921727 (SBOM + gitleaks + audit + eslint + rollback drill) + CodeQL https://github.com/dmeade1/DealerHire/actions/runs/30539921743 |
| G1-15 | Threat model reviewed for skeleton surfaces | threat-model | Partial | Engineering attestation in `docs/threat-model.md` (2026-07-30); formal owner/security sign-off still Pending |
| G1-16 | All synthetic data labeled `SYNTHETIC` | partners | Partial | Seed/demos + `pnpm scan:pii` asserts dossier `SYNTHETIC` + `NO LIVE PARTNER SELECTED`; program owner cross-check sign-off still Pending |

## Honest Pass gap list (not Pass-ready yet)

| Blocker | Gate IDs | Owner / note |
| --- | --- | --- |
| Claim permanent Cloudflare account (temp account Misty Warlock) | G1-02, G1-04 | Claim URL from latest `wrangler deploy --temporary` (chat); then Selected R2 |
| Live R2 `PUBLIC_ARTIFACTS` Selected + uncomment wrangler binding | G1-04 | Permanent CF account (R2 not on temp accounts) |
| Formal threat-model + fixture sign-off | G1-15, G1-16 | Program owner / security — checklist below |

**Do not** pull G2 live PII until this list clears or is Waived.

## Sign-off

### Owner checklist (G1-15 / G1-16)

Confirm each item, then fill the table:

1. [ ] Read `docs/threat-model.md` § “G1 skeleton surface review” — accept engineering attestation or list residuals.
2. [ ] Confirm `docs/partners/ny-design-partner-dossier.md` remains `SYNTHETIC` + `NO LIVE PARTNER SELECTED`.
3. [ ] Confirm no live applicant PII in repo fixtures/seeds (rely on `pnpm scan:pii` + spot check).
4. [ ] Accept G1-02/G1-04 remaining as Partial until Cloudflare account claimed + R2 Selected (or Waive with dated note).

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | Attestation recorded in threat-model (2026-07-30); reaffirm on merge of this gate |
| Program owner | | | |
| Security (optional G1) | | | |

**Gate result:** ☐ Pass · ☐ Fail · ☐ Conditional (CF/R2 Partial accepted)

Next: [G2-live-pii.md](./G2-live-pii.md)
