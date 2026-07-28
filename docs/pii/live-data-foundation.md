# Live-data foundation (G2)

## Implemented in skeleton

| Capability | Location | Status |
| --- | --- | --- |
| Acceptance envelope contract | `src/modules/intake/envelope.ts` | Code complete; needs Hyperdrive integration test |
| Notice/choice hashes atomic with receipt | envelope insert | Code complete |
| Resume pending/quarantined states | `resume_state` enum | Schema + UI copy |
| Magic capability hashing | `access_capabilities` + hashCapability | Code complete |
| Communication auth at enqueue/dispatch | `src/modules/comms/authorization.ts` | Unit tested; SMS denied |
| Tracker default-deny | `src/modules/tracking/policy.ts` | Unit tested |
| DecisionRecord meaningful review | `src/modules/hiring/decisions.ts` | Unit tested |
| Shadow AI sealed outputs | `src/modules/ai/shadow.ts` | Unit tested |
| Zero-PII telemetry rule | docs + Ponytail rule | Policy documented |

## Required before live PII

- [ ] Provider DPAs and envelope encryption with KMS
- [ ] Malware scanning integration
- [ ] Restore / incident drill evidence
- [ ] WCAG manual pass on apply + rights flows
- [ ] Counsel approval of notice copy IDs
- [ ] Synthetic probe + kill-switch wired to durable store

**Gate:** do not accept real applicant PII until [G2-live-pii.md](../gates/G2-live-pii.md) is green.
