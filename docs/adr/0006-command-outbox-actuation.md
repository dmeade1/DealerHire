# ADR 0006: Command ledger, outbox, and deferred ad actuation

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [gates/ad-actuation-release.md](../gates/ad-actuation-release.md), [invariant register](../invariant-register.md), [0009](./0009-analytics-claim-classes.md)

## Context

Campaign distribution must preserve employer authority, idempotency, and reconciliable evidence. Autonomous or in-transaction provider calls create ambiguous money/audience effects and unsafe learning signals. The first live beta must not actuate Meta/Google changes via API.

## Decision

### Authority path

```text
Job/control reference → recommendation → employer authority or AutomationPolicy
  → deterministic arbiter / command ledger → execution → ActuationReceipt
  → observation / reconciliation
```

- The controller is a **domain function**, not an autonomous service.
- Platform may actuate **approved distribution only**. Role design, pay, recruiting ops, offers, and employment decisions remain employer-owned.
- Approval is bound to a canonical server-generated **effect manifest** and human-visible diff. Any semantic transformation after approval requires reapproval.
- Atomically redeem the approval token and insert the uniquely keyed **`Command`** plus **outbox** record in one PostgreSQL transaction.
- Call providers **outside** that transaction using `command_id` as Workflow/provider idempotency key.
- Command ledger enforces: one active conflicting command per `tenant/job/lever`, unique recommendation/control version and payload hash, supersession, expiry, shared limits, and policy re-evaluation at execution.
- Provider acknowledgement or authoritative source read-back becomes **`ActuationReceipt`**. Intent without a receipt is ineligible for effect learning.
- Ambiguous outcomes enter **`NeedsReconciliation`** and are never blindly recreated.
- Stale analytical evidence → advisory **abstention**. Stale budget/authorization/connection/execution state → fail-safe **pause**.

### Beta actuation posture

- **No live ad-platform API actuation in beta.**
- Dealers or explicitly delegated operators launch/change campaigns in Meta/Google.
- Import signed/manual CSV spend, delivery, audience, and placement read-backs.
- Read-only OAuth connections only after provider approval and reconciliation tests.
- Build and test the command design with **synthetic/sandbox** commands first.
- Live API actuation requires the separate [ad-actuation-release](../gates/ad-actuation-release.md) gate plus explicit dealer standing `AutomationPolicy`.

### Employment-ad policy (compiler)

- Meta: Employment Special Ad Category and restricted audience controls.
- Google: no prohibited US/Canada demographic or ZIP narrowing for employment.
- Disable applicant retargeting, customer-list audiences, protected-trait proxies, and person-level hire optimization by default.

## Consequences

- Manual beta ops still use normal commands, approvals, and audit trails—never silent spreadsheet/DB edits.
- Causal analytics cannot claim lift without confirmed actuation receipts (ADR 0009).
- Concierge operators may execute distribution only within explicit delegation.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Live Meta/Google actuation in beta | Provider approval + effect risk before reconciliation maturity |
| Provider call inside DB transaction | Long locks; ambiguous timeout handling |
| Blind create-retry after timeout | Duplicate campaigns/spend |
| Autonomous agent spend increases | Violates employer authority model |
