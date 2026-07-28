# Gate — Ad actuation release

**Purpose:** Permit live Meta/Google API actuation of approved distribution commands.  
**Entry:** G3 beta operating with stable manual/CSV reconciliation; provider API access approved; sandbox command path proven.  
**Default:** **No live actuation** (ADR 0006) until every criterion Passes.

Independent of candidate-AI gate.

## Hard preconditions

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| AD-01 | Dealer-owned Meta/Google accounts connected; billing remains on dealer | Pending | Account audit |
| AD-02 | Provider API / verification approval obtained | Pending | Partner portals |
| AD-03 | Read-only OAuth reconciliation proven against authoritative platform read-back | Pending | Reconcile report |
| AD-04 | Sandbox: approval token + Command + outbox atomic; provider call outside txn | INV-19–20 | Pending | Tests |
| AD-05 | Sandbox: idempotent `command_id`; ambiguous create → NeedsReconciliation | INV-21 | Pending | Fixtures |
| AD-06 | Effect manifest human-visible diff matches adapter semantics exactly | Pending | Review fixtures |
| AD-07 | Employment-ad compiler enforced (Meta special category; Google restrictions) | Pending | Policy tests |
| AD-08 | Defaults remain off: applicant retargeting, customer lists, protected proxies, person-level hire optimization | Pending | Config review |
| AD-09 | Explicit dealer `AutomationPolicy` or exact-payload approval for allowed action types; spend increases / new legal copy / targeting changes require human approval | Pending | Policy docs |
| AD-10 | Kill switch + fail-safe pause on stale budget/auth/connection | INV-23, INV-51 | Pending | Drill |
| AD-11 | Concierge delegation cannot exceed dealer authority | INV-18 | Pending | Authz tests |
| AD-12 | Causal analytics still blocked unless AnalysisContract + ActuationReceipt | INV-33 | Pending | Analytics tests |
| AD-13 | Counsel / advertising policy review current | Pending | Memo |
| AD-14 | Runbooks for compensation of partial failures | RC-08 | Pending | Runbook |
| AD-15 | Partner executive approval to enable actuation on rooftop | Pending | Written OK |

## Allowed actuation (initial)

After Pass, enable only low-risk actions scoped by `AutomationPolicy` (e.g. pause within bounds, rotate pre-approved creative hashes, lower pacing). **Still require exact-payload human approval** for launches, spend increases, new creative/legal copy, targeting changes, payment changes, destructive actions, and policy exceptions.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Concierge ops | | | |
| Counsel / ad policy | | | |
| Dealer account owner | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail · ☐ Remain manual/CSV  

Related: [ADR 0006](../adr/0006-command-outbox-actuation.md), [recovery-criteria.md](../recovery-criteria.md).
