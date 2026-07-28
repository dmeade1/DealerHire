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
| G1-01 | Clean-clone install, lint, typecheck, unit tests pass | — | Pending | CI link |
| G1-02 | Preview deploy of platform-web + intake-api + backplane configs | ADR 0001 | Pending | Deploy URLs / logs |
| G1-03 | Forced RLS / missing-context denial proven in integration tests | INV-07, INV-08 | Pending | Test report |
| G1-04 | Synthetic listing → audit → approve → PageRelease → public fetch | INV-14–18 | Pending | E2E |
| G1-05 | PageRelease rollback to prior manifest | INV-15, RC-06 | Pending | Drill note |
| G1-06 | Approval + Command + outbox atomicity; provider call outside txn | INV-19–20 | Pending | Transaction tests |
| G1-07 | Ambiguous timeout → NeedsReconciliation; no blind recreate | INV-21, RC-08 | Pending | Fixture test |
| G1-08 | Synthetic envelope accept + queue-down replay converges; no dupes | INV-11–13, RC-03 | Pending | Replay drill |
| G1-09 | Inbox dedupe + schema/message N/N−1 compatibility | INV-39 | Pending | CI migration check |
| G1-10 | Liveness Fresh/ObservedZero/Missing/Stale; abstain vs halt | INV-23 | Pending | Unit/integration |
| G1-11 | Telemetry contains **zero** applicant PII (synthetic scan) | INV-37 | Pending | Log scan |
| G1-12 | Audited ops CLI/page: inspect, DLQ/outbox replay, safe retry | INV-38 | Pending | Demo recording / script |
| G1-13 | Kill switches for intake and campaigns smoke-tested | INV-51, RC-15–16 | Pending | Drill |
| G1-14 | SBOM, digests, SAST/deps/secrets, rollback target in CI | ADR 0010 | Pending | CI artifacts |
| G1-15 | Threat model reviewed for skeleton surfaces | threat-model | Pending | Sign-off |
| G1-16 | All synthetic data labeled `SYNTHETIC` | partners | Pending | Fixture review |

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail  

Next: [G2-live-pii.md](./G2-live-pii.md)
