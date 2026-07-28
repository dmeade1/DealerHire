# Gate G3 — Beta ready

**Purpose:** Open the one-partner New York concierge beta.  
**Entry:** G2 Pass; live design partner `SELECTED`; nexus pack counsel-approved; all dealership role families acceptance evidence complete.  
**Exit:** Partner UAT + counsel + engineering sign-off; no critical security/privacy/a11y/recovery findings.

## Beta envelope (must hold)

| Constraint | Met? |
| --- | --- |
| One NY dealer group + one rooftop | ☐ |
| English; managed platform subdomain | ☐ |
| Remote / multi-state jobs excluded | ☐ |
| Candidate AI shadow-only | ☐ |
| No live ad API actuation; CSV/manual only | ☐ |
| Transactional email on; SMS off | ☐ |
| Tenant-local operational/descriptive analytics only | ☐ |
| Every dealership role family deeply validated | ☐ |

## Criteria

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| G3-01 | Partner dossier SELECTED; readiness checklist complete | Pending | partners/ |
| G3-02 | Exact NY + local/NYC nexus pack effective-dated and counsel-approved | Pending | counsel-packet |
| G3-03 | RoleAllocationVersion complete for all beta features | Pending | role-allocation |
| G3-04 | All-role acceptance matrices: requirements, equivalents, compensation forms, policy tests, renders, dealer-owner approval | Pending | Artifacts |
| G3-05 | Listing → publish → apply → human review → ATS → confirmed start E2E on partner UAT | Pending | UAT script |
| G3-06 | Generic ATS CSV/signed webhook + named connectors #1 and #2 reconciled | Pending | Integration tests |
| G3-07 | Manual Meta/Google + CSV spend/delivery import reconciled; no API actuation enabled | Pending | Import UAT |
| G3-08 | Tenant-local analytics: claim classes labeled; freshness rules; no cross-tenant output | Pending | Analytics tests |
| G3-09 | Metric definitions: qualified hire, clock, cost documented and tested | Pending | Spec + tests |
| G3-10 | Business-hours support + escalation + kill switches documented and drilled | Pending | Runbook |
| G3-11 | Postgres failover/PITR drill evidence for selected provider | Pending | RC-10/11 |
| G3-12 | WCAG 2.2 AA partner UAT on English surfaces | Pending | A11y |
| G3-13 | No open critical items in threat model / security review | Pending | Review |
| G3-14 | Counsel G3 sign-off (notices, tracking, AI shadow, ads, contracts) | Pending | Memo |
| G3-15 | Provider allowlists rows for identity, Postgres, email, envelope, AI pins are `Selected` | Pending | allowlists |
| G3-16 | Traceability matrix updated with evidence links for beta journeys | Pending | traceability |
| G3-17 | G1/G2 criteria still Pass on release candidate | Pending | CI |

## Blocking rules

- **One incomplete role family blocks beta** under the all-role requirement.  
- Unresolved nexus (“somewhere in NY”) blocks.  
- Any path that surfaces candidate AI to reviewers blocks.  
- Any enabled live ad actuator blocks.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Concierge / ops | | | |
| Partner executive / HR sponsor | | | |
| Counsel | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail  

Post-beta independent gates: [candidate-ai-release.md](./candidate-ai-release.md), [ad-actuation-release.md](./ad-actuation-release.md).
