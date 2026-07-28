# Information architecture — beta

**Version:** 0.1 · **Date:** 2026-07-28  
Four planes: **Public jobs**, **Applicant self-service**, **Dealer control plane**, **Internal ops**. Navigation is role-filtered; default-deny hides links the actor cannot use.

**Host (beta):** `https://{partner}.jobs.dealerhire.example` (managed subdomain; final hostname TBD).  
**Locale:** `en` only.

---

## 1. Site map — Public jobs (`purpose:publication`)

```text
/                                           → Rooftop careers home (optional)
/jobs                                       → Job index (published only)
/jobs/{jobSlug}                             → Job detail (PageRelease)
/jobs/{jobSlug}/apply                       → Start application (GET)
/legal/privacy                              → Privacy notice (versioned)
/legal/application-terms                    → Application terms
/accessibility                              → Accessibility + accommodation entry
/healthz                                    → Public liveness (no PII)
```

**Notes:**
- Only content-addressed artifacts referenced by current `PageRelease`.
- No third-party scripts on `/apply`, `/accessibility`, or rights routes.
- Closed/expired jobs: tombstone page, CTA disabled.

---

## 2. Site map — Applicant self-service (`purpose:subject`)

Accountless; capability via public application ID + magic-link.

```text
/applications/receipt/{applicationPublicId}   → Receipt (limited)
/a/{capabilityToken}                          → Magic-link landing (rotatable)
/a/{capabilityToken}/status                   → Application status
/a/{capabilityToken}/correct                  → Correction (step-up)
/a/{capabilityToken}/privacy                  → Privacy request (step-up)
/a/{capabilityToken}/accommodation            → Accommodation request
/a/{capabilityToken}/notices                  → Notices shown at apply (read-only)
/apply/resume-upload/{token}                  → Resume retry for PendingUpload
```

**Hidden from applicants:** review notes, other candidates, analytics, AI, demos vault, ops.

---

## 3. Site map — Dealer control plane (`purpose:hiring` + `publication`)

Authenticated via managed IdP (passwordless/MFA).

```text
/app                                          → Home / attention inbox
/app/jobs                                     → Job list
/app/jobs/new                                 → Create listing
/app/jobs/import                              → Import batch
/app/jobs/{jobId}                             → Job overview
/app/jobs/{jobId}/edit                        → Draft editor
/app/jobs/{jobId}/requirements                → Requirements versions
/app/jobs/{jobId}/compensation                → Pay range + structure
/app/jobs/{jobId}/rubric                      → Qualification rubric
/app/jobs/{jobId}/audit                       → Audit findings
/app/jobs/{jobId}/approvals                   → Approval + effect manifest
/app/jobs/{jobId}/release                     → PageRelease controls
/app/jobs/{jobId}/campaigns                   → Campaign plan + CSV
/app/jobs/{jobId}/analytics                   → Listing-scoped analytics
/app/applications                             → Applicant queue (neutral order)
/app/applications/{applicationId}             → Evidence matrix + DecisionRecord
/app/applications/{applicationId}/milestones  → Hiring milestones
/app/hiring-cases                             → Cases / starts
/app/campaigns                                → All campaigns + reconcile
/app/campaigns/import                         → CSV import wizard
/app/ats                                      → ATS connections + mappings
/app/ats/deliveries                           → Delivery / ExportReceipt log
/app/analytics                                → Tenant analytics hub
/app/analytics/funnel                         → Funnel
/app/analytics/recruiters                     → Recruiter ops
/app/analytics/compliance                     → Notice/consent evidence (no demos)
/app/analytics/quality                        → Quality / qualified hire
/app/settings/members                         → Members & roles
/app/settings/brand                           → Brand site (managed host)
/app/settings/operating-facts                 → Legal/operating facts
/app/settings/delegations                     → Dealer-granted delegations
/app/settings/notices                         → Notice versions (read/preview)
/app/support                                  → Business-hours support
```

---

## 4. Site map — Internal ops (`purpose:platform`)

```text
/ops                                          → Ops home
/ops/tenants                                  → Tenant switcher (delegated)
/ops/tenants/{tenantId}/delegation            → Active delegation banner source
/ops/recovery                                 → Inspect / replay / DLQ
/ops/recovery/envelopes/{envelopeId}          → Envelope inspect
/ops/recovery/reconciliation                  → NeedsReconciliation board
/ops/kill-switches                            → Intake / campaign pauses
/ops/liveness                                 → Source Fresh/Missing/Stale
/ops/privacy-cases                            → Escalated privacy requests
/ops/platform-health                          → Intake/integration health
```

**Not in beta IA:** MCP copilot console, cross-tenant benchmark explorer, SMS console, custom hostname activator.

---

## 5. Role-filtered navigation

| Nav item | APP | HM | REV | HR | ADM | CON | REC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public jobs | Y | Y | Y | Y | Y | Y | Y |
| Applicant self-service | Y | — | — | — | — | — | — |
| Attention inbox | — | Y | Y | Y | Y | Y | — |
| Jobs / editor | — | Y | — | Y | Y | Y | — |
| Approvals | — | — | — | Y | — | view* | — |
| Applications / matrix | — | limited | Y | Y | — | Y | — |
| Campaigns / CSV | — | — | — | Y | Y | Y | — |
| ATS | — | — | — | Y | Y | Y | Y |
| Analytics hub | — | limited | limited | Y | Y | Y | Y |
| Members / brand / facts | — | — | — | Y | Y | — | — |
| Ops recovery | — | — | — | — | — | limited | Y |
| Kill switches | — | — | — | — | — | — | Y |

\* Concierge may view pending approvals but cannot complete HR-only approve actions.

---

## 6. Attention inbox information architecture

Home `/app` aggregates **actionable** items only:

1. Jobs blocked on audit hard blockers  
2. Approvals waiting on HR  
3. Applications waiting on review (age)  
4. ATS deliveries in NeedsReconciliation  
5. Campaign sources Stale / Missing  
6. Operating facts incomplete (fail-closed)

Each item links to the single screen that clears it. No vanity dashboards above the fold.

---

## 7. Object model → URL binding

| Domain record | Primary route |
| --- | --- |
| `PageRelease` / public job | `/jobs/{jobSlug}` |
| `ListingRevision` / draft | `/app/jobs/{jobId}/edit` |
| `JobControlVersion` | `/app/jobs/{jobId}/approvals` |
| `ApplicationAcceptanceEnvelope` | `/applications/receipt/...` + ops envelope |
| `Application` / HiringCase | `/app/applications/{applicationId}` |
| `DecisionRecord` | same + milestones |
| `ImportBatch` (ads/ATS) | `/app/campaigns/import`, `/app/ats/deliveries` |
| `PrivacyRequest` | applicant privacy + `/ops/privacy-cases` |

---

## 8. Cross-linking rules

- Public job → Apply (same release hash).  
- Receipt → Status / Correct / Privacy / Accommodation.  
- Evidence matrix → JobControlVersion rubric (read-only pin).  
- Approval → Public preview URL (pre-pointer and post-pointer).  
- Analytics tiles → underlying reconcile/liveness drill-down, never to another tenant.

---

## 9. IA acceptance checks

- [ ] Every P0 screen in [screen-form-inventory.md](./screen-form-inventory.md) maps to a route above.  
- [ ] No nav item appears for a role lacking capability ([capability-matrix.md](./capability-matrix.md)).  
- [ ] Applicant sensitive routes require capability token; step-up on correct/privacy.  
- [ ] Ops and dealer planes do not share cookies/cache across host purposes unsafely.  
- [ ] Spanish or custom-domain routes absent from beta sitemap.
