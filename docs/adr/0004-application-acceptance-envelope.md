# ADR 0004: Independent application-acceptance envelope

- **Status:** Accepted (interim store amended 2026-07-28)
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [0002](./0002-cloudflare-postgres-topology.md), [recovery criteria](../recovery-criteria.md), [gates G2](../gates/G2-live-pii.md), [provider allowlists](../provider-allowlists.md)

## Context

Application intake must give applicants a durable receipt even when R2, malware scanning, queues, or Postgres projections are degraded. Treating queue publish or object upload as “accepted” creates false-success and lost-application modes.

## Decision

- Intake runs on a dedicated **`intake-api` Worker** with no dependency on Next.js, AI, Meta/Google, ATSs, or the control-plane database request path.
- The sole acceptance authority is a successful **conditional insert** into an independently durable **`ApplicationAcceptanceEnvelope`**.
- A client-visible idempotency / application ID is created; receipt is returned only after envelope insert succeeds.
- The envelope carries structured form data, job/control release, exact notice and choice hashes, jurisdiction snapshot, timestamps, communication authority, resume state/hash, and idempotency key—encrypted at rest per provider design.
- **Queue publication is non-gating.** Reconciliation scans accepted envelopes until PostgreSQL, R2, and integration projections confirm.
- Neither R2 upload, queue send, Turnstile success alone, nor a Postgres projection constitutes acceptance.
- If R2 or scanning is unavailable: accept structured application, issue receipt, mark resume `PendingUpload` or `Quarantined`; do not discard the application.
- Quarantine resumes until malware scanning completes; preserve original file; allow manual entry when parsing fails.
- Turnstile failure/unavailability uses risk-based quarantine/escalation—not silent applicant loss.

### Envelope provider constraint

Select the independent envelope provider in Phase 0 (see [provider-allowlists.md](../provider-allowlists.md)). Candidates include **Durable Object** (strongly consistent single-key conditional insert) or **R2 + D1** (object + metadata conditional write). The architectural requirement is independence from the control-plane Postgres request path and conditional-insert semantics.

### Interim store (G1 only) — amendment

Until the independent provider is **Selected** and proven under failure:

- **G1 interim receipt store** is PostgreSQL `subject.application_acceptance_envelopes` via `acceptApplication` / `issueAcceptanceReceipt`.
- This satisfies INV-11 *conditional-insert receipt semantics* for the walking skeleton and synthetic drills.
- It does **not** satisfy the independence requirement for live applicant PII.
- **G2 entry is blocked** until either (a) Durable Object or R2+D1 is Selected with spike evidence, or (b) an explicit counsel/architecture waiver records why Postgres remains the envelope authority under control-plane DB failure modes.
- `ACCEPTANCE_ENVELOPE_BINDING=local` encoding is not encryption; KMS-backed encryption remains a G2 hard gate.

## Consequences

- Acceptance tests must prove envelope insert is the only receipt point and that notice/choice authority travels atomically with the application.
- Replay must converge without duplicate applications.
- Four-nines intake is an engineering target dependent on envelope + edge evidence—not a beta contract (see [slos.md](../slos.md)).

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Postgres insert as receipt | Couples intake to control-plane DB; weaker during DB incidents |
| Queue message as receipt | At-least-once / loss / delay ambiguity |
| R2 object existence as receipt | Weaker conditional semantics; scanning outages |
| Soft-fail discard on scanner outage | Applicant loss; unacceptable |
