# Role allocation

Working allocation of controller / processor / deployer / AI roles for DealerHire. **Subject to confirmation by retained employment, privacy, and advertising counsel** and binding in a versioned `RoleAllocationVersion` per feature, purpose, tenant, and jurisdiction. Launch is blocked while any duty is unassigned.

## Working allocation (beta)

| Party | Roles | Owns |
| --- | --- | --- |
| **Dealer** (employer) | Controller; deployer (where applicable); employment-decision owner | Role design, requirements, pay facts, qualification rubrics, publication approval, disposition, offers, hire/start confirmation; Meta/Google ad accounts and platform spend; ATS system of hire (as configured) |
| **DealerHire platform** | Contracted processor / service provider; AI developer / provider | Hosting, policy engines, intake envelope, publication infrastructure, shadow AI tooling, analytics tooling, adapters; does **not** substitute for employer authority on role, pay, offer, targeting exceptions, spend increases, or policy exceptions |
| **Concierge operator** (platform staff) | Processor personnel under dealer delegation | May execute distribution and recovery **within explicit delegation**; cannot approve requirements/pay/rubrics or employment decisions |
| **Applicant** | Data subject | Application data, choices, correction/rights requests |
| **Ad platforms / ATS / email / IdP** | Independent controllers or subprocessors per contract | Per DPA / platform terms |

## Duty assignment matrix

| Duty | Primary owner | Platform obligation | Notes |
| --- | --- | --- | --- |
| Employment decision | Dealer | Provide tools; no auto-reject | Trained dealer reviewer + DecisionRecord |
| Job-relatedness / UGESP posture | Dealer (+ counsel) | Enforce requirement versioning & blockers | Platform hard-blocks unreviewed proxies |
| Pay transparency disclosure | Dealer | Require min/max range on publish | AI cannot invent compensation |
| Privacy notice at collection | Dealer controller text; platform delivery | Exact NoticeReceipt | Nexus-specific pack |
| AI-use notice (shadow vs live) | Dealer + platform (developer/provider) | Shadow: no decision influence; Live: EmploymentAIUse gate | Counsel packet |
| AEDT / ADS / ADMT deployer duties | Dealer (working) | Developer/provider documentation & controls | Confirm for NYC if nexus applies |
| Applicant rights (access/correction/deletion) | Dealer controller; platform executes | Lineage, suppression, verified completion | Legal hold exceptions |
| Retention / legal hold | Dealer policy; platform implements | Floors + holds + exports | EEOC/OFCCP + state |
| Incident notification | Per DPA | Detect, contain, notify dealer/counsel | Runbooks |
| Ad account billing | Dealer | No reseller of media spend in beta | SaaS fees separate |
| Campaign employment-ad policy | Dealer as advertiser; platform compiler | Enforce Special Ad Category / Google restrictions | Compiler fail-closed |
| Tracking choices / GPC | Platform implements; dealer notice | Default-deny trackers | ADR 0008 |
| Subprocessors | Platform | Allowlist + DPA flow-down | Provider allowlists |
| Audit / regulator export | Dealer request; platform tooling | Evidence packs | No PII in logs |

## Feature-level RoleAllocationVersion (required before enable)

Each feature enablement binds:

- `feature_id`, `purpose_id`, `tenant_id`, `jurisdiction_pack_id`
- `controller`, `processor`, `deployer` (if AI/ADS), `ai_developer`, `ai_provider`
- Notice, rights, retention, incident, audit, and decision duty assignees
- Effective date / expiry

**Block launch** if any duty is `Unassigned`.

## Beta-specific constraints

- One NY dealer group/rooftop; exact state/local nexus (incl. NYC if applicable) drives first policy pack.
- Remote and multi-state jobs excluded.
- Candidate AI: platform is AI developer/provider in **shadow** mode only until EmploymentAIUse gate.
- Live ad actuation deferred; dealer remains advertiser of record for manual campaigns.

## Explicit non-substitutions

Platform operators and MCP copilots (later) **must not**:

- Approve requirements, compensation, or qualification rubrics in place of dealer HR/authorized owner.
- Issue employment decisions.
- Broaden targeting, increase spend, or grant policy exceptions without exact-payload dealer approval.
- Bypass RLS or purpose checks using service identity in place of the signed human actor.

## Related

- [counsel-packet.md](./counsel-packet.md)
- [ADR 0003](./adr/0003-identity-and-rls.md)
- [ADR 0007](./adr/0007-candidate-ai-shadow-mode.md)
