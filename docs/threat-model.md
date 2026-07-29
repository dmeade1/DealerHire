# Threat model

Trust boundaries, STRIDE-oriented abuse cases, and mitigations for DealerHire beta architecture. Review before G1 (synthetic) and again before G2 (live PII). Not a substitute for formal pen test or counsel review.

## Trust boundaries

```text
[Applicant browser] 
    |  public HTTPS
[Cloudflare edge: WAF / Turnstile / rate limits]
    |------------------+------------------|
[platform-web]   [intake-api]      (later: copilot-mcp)
    |                 |                      |
    |            [Acceptance envelope]       |
    |                 |                      |
    +----[Hyperdrive]---+----[Queues]----+---+
              |                |             |
        [Managed Postgres] [backplane]   [R2]
              |                |
        [IdP]           [AI Gateway → pinned models]
                        [Email provider]
                        [ATS / Meta / Google]  (beta: limited)
```

| Boundary | Trust assumption | Residual risk |
| --- | --- | --- |
| Cloudflare edge | TLS, WAF, Turnstile configured correctly | Misconfig; bypass tokens |
| Workers runtime | Isolation between tenants via app + RLS | Bug in context propagation |
| Managed IdP | Correct org membership | Token theft; SSO mis-bind |
| Postgres + FORCE RLS | DB roles cannot bypass | Break-glass roles; SQL injection in SECURITY DEFINER |
| Envelope provider | Conditional insert durability | Provider outage; key mismanagement |
| R2 | Private buckets non-public | Signed URL leakage |
| AI Gateway | Pinned routes; no training | Prompt injection; data minimization failure |
| Ad/ATS/email providers | Contractual + technical auth | Webhook forgery; confused deputy |
| Operators / concierge | Least privilege + audit | Insider misuse |
| Dealer reviewers | Trained; primary evidence | Rubber-stamp AI if shadow broken |

## Assets

- Applicant PII and resumes  
- Employment decisions and audit evidence  
- Ad account OAuth tokens and spend authority  
- Policy packs and approval tokens  
- Publication integrity (tampered job/pay disclosures)  
- Tenant isolation / competitive data  
- Availability of intake receipt  

## Abuse cases (STRIDE-ish)

| ID | Category | Abuse case | Impact | Mitigations |
| --- | --- | --- | --- | --- |
| T-01 | Spoofing | Attacker impersonates dealer admin via weak auth | Tenant takeover | Managed IdP; MFA/passwordless; no custom auth; session step-up |
| T-02 | Spoofing | Forged provider webhooks | False spend/ATS state | Signed webhooks; inbox dedupe; reconcile to authoritative read-back |
| T-03 | Tampering | Mutate published pay/disclosures without approval | Legal exposure | Content-addressed artifacts; PageRelease pointer; channel release expiry |
| T-04 | Tampering | Alter approval payload after sign-off | Unauthorized spend/targeting | Effect manifest hash; reapproval on semantic change; one-time token |
| T-05 | Repudiation | Dispute who approved pay/targeting | Audit failure | Versioned approvals; actor + on_behalf_of; tamper-evident audit refs |
| T-06 | Info disclosure | Cross-tenant read via missing RLS context | Mass PII breach | FORCE RLS; reject missing context; isolation tests |
| T-07 | Info disclosure | Applicant PII in logs/analytics | Rights/irreversible leak | PII-free telemetry; admission allowlists; INV-37 |
| T-08 | Info disclosure | Full resume to external LLM | Training/exfil risk | Redaction; pinned routes; InferenceUse; no tools on untrusted content |
| T-09 | Info disclosure | Third-party tags on apply page | Unexpected processors | Default-deny TrackerPolicy; no third-party scripts |
| T-10 | DoS | Flood applications / uploads | Intake outage | WAF, rate limits, Turnstile, body limits, quarantine |
| T-11 | DoS | Exhaust AI/email budgets | Cost / degraded advice | AI Gateway limits; fail closed; kill switches |
| T-12 | Elevation | MCP/service identity substitutes its own scope | Confused deputy | Reauthorize signed human actor/delegation; no DB bindings on MCP |
| T-13 | Elevation | Concierge approves pay/role | Unauthorized employment terms | Role allocation; UI/API authority checks; INV-18 |
| T-14 | Elevation | Bypass shadow AI into reviewer UI | Unnoticed AEDT | Hard UI/API denylist; tests; release gate |
| T-15 | Spoofing / elev. | Magic-link enumeration or fixation | Accountless takeover | Non-secret public ID + hashed rotatable capability; anti-enumeration; step-up |
| T-16 | Tampering | Blind retry creates duplicate campaigns | Spend duplication | NeedsReconciliation; command_id idempotency; INV-21 |
| T-17 | Info disclosure | Cross-tenant benchmarks in beta | Competition / contract | Claim-class enforcement; INV-32 |
| T-18 | Tampering | Malicious resume (malware / prompt injection) | Lateral movement / model abuse | Quarantine scan; inert parsing; output validation; injection evals |
| T-19 | Repudiation / spoof | False “accepted” without envelope | Lost applications | Envelope is sole receipt; acceptance tests |
| T-20 | Elevation | Hostname takeover on future custom domains | Phishing / cookie scope | SaaS activation gate; default-deny host routing (post-beta) |
| T-21 | Info disclosure | Voluntary demographics leak to reviewers | Discrimination risk | Segregated vault; inaccessible to decision-makers/models |
| T-22 | Tampering | Stale policy pack still publishes | Illegal listing | Fail closed; at-use re-evaluation; approval invalidation |

## Control themes

1. **Least privilege + forced tenancy** at DB and app layers.  
2. **Authority binding** (effect manifests, RoleAllocationVersion, AutomationPolicy).  
3. **Durable intake** independent of control-plane DB.  
4. **Fail closed** on missing jurisdiction/authority/freshness.  
5. **Shadow isolation** for candidate AI until counsel-approved gate.  
6. **PII minimization** in logs, models, analytics, and trackers.  
7. **Reconciliation over hope** for external side effects.

## Out of scope for this document

- Full STRIDE per API route (tracked in security review before G2).  
- Physical / Cloudflare corporate risks.  
- Adversarial ML model weights supply chain beyond pinned allowlist + SBOM.

## Review cadence

| Gate | Required |
| --- | --- |
| G1 | Threat model reviewed for skeleton surfaces; isolation/idempotency tests green |
| G2 | Live-PII paths reviewed; zero-PII logging verified; incident tabletop |
| G3 | Residual risks accepted; counsel + security sign-off |
| Post-beta | Revisit for AI live, ad actuation, SMS, custom domains, cross-tenant |

## G1 skeleton surface review (engineering self-check)

Status: **Partial** — engineering walkthrough recorded; formal sign-off still open (G1-15).

| Surface | Primary threats | Evidence / control |
| --- | --- | --- |
| Public apply + intake-api | T-07, T-10, T-19 | Envelope sole receipt; `normalizeG1StructuredPayload`; `emitSafeEvent`; `pnpm scan:pii` runtime no-console |
| RLS tenant context | T-06 | `tests/integration/rls-isolation.test.ts`; FORCE RLS migrations |
| Approval → command → outbox | T-04, T-16 | Effect hash bind; NeedsReconciliation + `resolveNeedsReconciliation` (no blind recreate) |
| PageRelease /jobs | T-03 | Content-addressed manifest; single-active activate; rollback test |
| Ops kill switch / outbox replay | T-12, T-13 | `OPS_CONTROL_SECRET` + signed actor; safe replay refuses create under recon |
| Candidate AI | T-08, T-14 | Shadow-only; no reviewer UI path in G1 |

Residual for G2+: IdP ceiling, live PII logging verification tabletop, webhook forgery drills, counsel review of T-07/T-21.
