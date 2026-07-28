# Gate G2 — Live PII foundation

**Purpose:** Permit live personal data in non-production/closed environments and qualify production intake paths—**still closed to public applicants** until G3.  
**Entry:** G1 Pass; counsel packet in progress; envelope + identity + email providers selected (or spike-complete with `Selected` status).  
**Exit:** Security/privacy/accessibility/recovery criteria Pass; counsel approval for live-PII handling.

## Scope

Encrypted `ApplicationAcceptanceEnvelope`; structured/resume receipt; `PendingUpload`/`Quarantined`; notice/authority atomicity; magic-link + step-up; retention/deletion/legal hold; incident handling; accommodation; correction/reconsideration; equivalent non-AI path; transactional email authz; default-deny tracking; candidate AI remains shadow-isolated; WCAG 2.2 AA on critical applicant paths.

## Criteria

| ID | Criterion | INV / doc | Status | Evidence |
| --- | --- | --- | --- | --- |
| G2-01 | G1 remains green on main | G1 | Pending | CI |
| G2-02 | Envelope provider `Selected` with conditional-insert proof | ADR 0004, allowlists | Pending | Spike + config |
| G2-03 | Identity provider `Selected`; MFA/passwordless enforced | ADR 0003 | Pending | IdP config |
| G2-04 | Email provider `Selected`; enqueue+dispatch authz tests | INV-30–31 | Pending | Tests |
| G2-05 | Acceptance tests: envelope sole receipt; notice hashes atomic | INV-11, INV-29 | Pending | E2E |
| G2-06 | R2/scanner degradation paths RC-01–02 | INV-13 | Pending | Chaos E2E |
| G2-07 | Magic-link rotatable; step-up; anti-enumeration; lost-channel path | threat T-15 | Pending | Security tests |
| G2-08 | Rights: correction reruns; deletion/withdrawal lineage; legal hold | purpose matrix | Pending | Rights E2E |
| G2-09 | Zero applicant PII in immutable logs (production-like) | INV-37 | Pending | Log audit |
| G2-10 | No third-party scripts on apply/rights/accommodation; GPC | INV-27–28 | Pending | Automated + manual |
| G2-11 | Shadow AI outputs inaccessible to reviewer/comms/campaigns/analytics APIs | INV-24 | Pending | Isolation tests |
| G2-12 | Raw resumes not sent externally; pinned AI routes only | INV-25 | Pending | Egress review |
| G2-13 | WCAG 2.2 AA evidence on applicant critical path (English) | ADR 0005 | Pending | A11y report |
| G2-14 | Incident tabletop + restore/replay drill with PII-shaped synthetic | recovery-criteria | Pending | Drill notes |
| G2-15 | Threat model re-reviewed for live-PII surfaces | threat-model | Pending | Sign-off |
| G2-16 | Counsel approval for notices + live-PII processing (shadow AI posture) | counsel-packet | Pending | Counsel memo |
| G2-17 | RoleAllocationVersion duties assigned for intake/rights/email | INV-50 | Pending | Matrix |
| G2-18 | Malware quarantine path operational | allowlists §5 | Pending | Test |

## Explicit non-authorizations

Passing G2 does **not** authorize: public beta traffic, live ad actuation, live candidate AI, SMS, custom domains, cross-tenant analytics, or incomplete role-family launch.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering | | | |
| Security / privacy review | | | |
| Counsel | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail  

Next: [G3-beta-ready.md](./G3-beta-ready.md)
