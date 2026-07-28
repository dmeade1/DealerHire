# Recovery criteria

Pass/fail criteria for restore, replay, reconciliation, and rollback. G1 requires synthetic evidence; G2/G3 require live-path drills without production applicant loss.

## Golden rules

1. **Accepted envelope ⇒ recoverable application** even if R2, scanner, queue, or Postgres projection failed.  
2. **Recovery never requires direct database edits**—audited ops CLI/page only.  
3. **Ambiguous external creates ⇒ NeedsReconciliation**, never blind recreate.  
4. **Worker rollback ≠ full product rollback**—execute publication/schema/provider compensation as needed.  
5. **Kill switches** for intake and campaigns remain usable during incidents.

## Scenario matrix

| ID | Scenario | Success criteria | Max time (beta target) | Evidence |
| --- | --- | --- | --- | --- |
| RC-01 | R2 upload unavailable at apply | Structured receipt issued; resume `PendingUpload`; later upload attaches once | Receipt < 2s path; attach when R2 healthy | E2E + probe |
| RC-02 | Malware scanner unavailable | Receipt issued; resume `Quarantined`; no public/reviewer binary until clean | Same | E2E |
| RC-03 | Ingest queue down / delayed | Receipt still valid; replay from envelope converges; **zero duplicate** applications | Drain per SLO | Replay drill |
| RC-04 | Postgres control plane outage | Public pages still serve via PageRelease; auth may degrade honestly | Page SLO | Chaos/synthetic |
| RC-05 | Hyperdrive pool exhaustion | Alerting; graceful errors; no cross-tenant leakage | Alert < 5 min | Runbook |
| RC-06 | Page bad release | Pointer rollback to prior manifest; cache purge/tombstone | ≤ 5 min | Drill |
| RC-07 | Channel release expired/stale | Intake stopped; tombstone/purge correct | Automatic | Tests |
| RC-08 | Approval/command timeout to provider | No duplicate command; NeedsReconciliation; operator resolve via read-back | Per runbook | Sandbox fixtures |
| RC-09 | DLQ buildup | Audited retry/replay; poison messages quarantined with reason | Age alerts | Ops CLI |
| RC-10 | Postgres regional failover | RPO 0 / RTO ≤ 10 min (provider-dependent); app reconnects | ≤ 10 min | Quarterly drill |
| RC-11 | PITR restore | Restored tenant data integrity; legal hold honored; secrets rotated as needed | Drill-defined | Quarterly |
| RC-12 | Privacy deletion / withdrawal | Future use blocked; lineage resolved; verified completion or legal exception | Per SLA to counsel | Rights E2E |
| RC-13 | Shadow AI pipeline failure | Reviewer path unaffected; no leakage of shadow outputs | Immediate | Isolation tests |
| RC-14 | Email provider outage | Authz decisions retained; retries/suppression correct; no silent “sent” | Honest status | Comms tests |
| RC-15 | Kill switch: intake | New accepts stopped; clear applicant messaging; envelopes in-flight still reconcile | ≤ 2 min | Drill |
| RC-16 | Kill switch: campaigns | New recommendations/commands halted; standing authority paused | ≤ 2 min | Drill |

## Replay convergence checklist

- [ ] Idempotency key prevents duplicate Application rows  
- [ ] Notice/choice hashes on projection match envelope  
- [ ] Resume state machine reaches `Available` or terminal quarantine with operator path  
- [ ] ATS/export not double-sent without inbox dedupe  
- [ ] Analytics admission does not hide applicant from review  
- [ ] Audit trail references envelope id + command ids without raw PII in logs  

## Rollback checklist (release)

- [ ] Prior Worker version identified  
- [ ] Schema N/N−1 compatible (or expand/contract plan)  
- [ ] PageRelease prior manifest verified in R2  
- [ ] Outbox/inbox message versions compatible  
- [ ] Provider compensation owner named if side effects possible  
- [ ] Synthetic probe green post-rollback  

## Drill cadence

| Drill | Cadence | Gate |
| --- | --- | --- |
| Envelope replay | Every G1+ release train | G1 |
| PageRelease rollback | Every publication stack change | G1 |
| Ambiguous command reconciliation | Before any actuation gate work | G1 / ad gate |
| Postgres failover / PITR | Quarterly (and before G3) | G3 |
| Incident tabletop (PII) | Before G2 | G2 |
| Kill switches | Monthly smoke | G1+ |

## Owners

| Area | Owner role |
| --- | --- |
| Intake / envelope | Platform engineering |
| Publication | Platform engineering |
| Commands / campaigns | Platform engineering + concierge |
| Postgres / backups | Platform engineering |
| Rights / legal hold | Platform engineering + counsel + dealer |
| Comms | Platform engineering |

Related: [slos.md](./slos.md), [ADR 0004](./adr/0004-application-acceptance-envelope.md), [ADR 0010](./adr/0010-deployment-observability-rollback.md).
