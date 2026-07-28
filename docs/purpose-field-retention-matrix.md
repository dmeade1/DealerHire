# Purpose / field / audience / retention matrix

Allowlisted purposes and representative fields. Default is **deny** for any field/purpose/audience combination not listed. Counsel confirms retention floors for the selected NY/NYC nexus before G2/G3.

Legend:

- **Audience:** `Applicant` · `DealerReviewer` · `DealerHR` · `DealerAdmin` · `ConciergeOp` · `PlatformOps` · `System` · `Analytics` · `ExternalModel` · `ATS`
- **Retention key:** `R-Hire` statutory hiring floor · `R-Notice` notice/permission proof · `R-Cmd` command/audit · `R-Ops` short ops · `R-Vec` vector/source aligned · `R-Hold` legal hold overrides delete

## Purpose catalog

| Purpose ID | Description | Plane | Beta |
| --- | --- | --- | --- |
| `P-Apply` | Receive and store application for a job | Subject / hiring | Yes |
| `P-Review` | Human primary-evidence review | Hiring | Yes |
| `P-Comm-Tx` | Transactional email about application | Subject / hiring | Yes |
| `P-Comm-SMS` | SMS about application | Subject / hiring | Gated off |
| `P-Publish` | Public job page / channel disclosure | Publication | Yes |
| `P-Campaign-Ops` | Manual campaign + CSV reconciliation | Hiring | Yes |
| `P-ATS` | Export/handoff to ATS | Hiring | Yes |
| `P-Rights` | Privacy / correction / accommodation | Subject | Yes |
| `P-AI-Shadow` | Shadow extraction (no decision use) | Platform | Yes (invisible) |
| `P-AI-Live` | Regulated employment AI use | Hiring | Gated off |
| `P-Analytics-Ops` | Tenant-local operational health | Platform | Yes |
| `P-Analytics-Desc` | Tenant-local descriptive reporting | Platform | Yes |
| `P-Analytics-XT` | Cross-tenant intelligence | Platform | Deferred |
| `P-Compliance-Demo` | Voluntary demographic compliance analysis | Subject (vault) | Segregated |
| `P-Export-Ext` | External data/reference export | Subject | Deferred |

## Matrix (representative)

| Field / record | Allowed purposes | Audiences | Retention | Prohibited |
| --- | --- | --- | --- | --- |
| Applicant name, email, phone | `P-Apply`, `P-Review`, `P-Comm-Tx`, `P-ATS`, `P-Rights` | Dealer\*, ConciergeOp (delegated), ATS, System | `R-Hire` | Logs; ExternalModel raw; Analytics raw; `P-Analytics-XT` |
| Resume bytes | `P-Apply`, `P-Review`, `P-Rights` | DealerReviewer, DealerHR, System | `R-Hire` / R2 lifecycle | ExternalModel raw; third-party scripts |
| Redacted skill evidence | `P-AI-Shadow` (beta); `P-AI-Live` (gated) | System; ExternalModel (pinned route only) | `R-Hire` / InferenceUse | Reviewer UI in beta; campaigns; analytics consumers |
| Notice text hash + NoticeReceipt | `P-Apply`, `P-Rights`, `P-AI-Live` | Applicant, System, counsel export | `R-Notice` | Collapsing into single consent bit |
| PermissionGrant (email/SMS/marketing) | `P-Comm-Tx`, `P-Comm-SMS`, optional marketing | System | `R-Notice` until withdrawn + proof window | Condition of apply |
| DataUseAuthority | All processing purposes | System | `R-Notice` / `R-Hire` | Implied from receipt alone |
| JobControlVersion / pay range | `P-Publish`, `P-Review`, `P-Campaign-Ops`, `P-Analytics-Desc` | Public (published fields), Dealer\*, ConciergeOp | `R-Hire` | AI inventing pay |
| RequirementVersion | `P-Publish`, `P-Review` | Public (job-related), Dealer\* | `R-Hire` | Unreviewed protected proxies |
| PageRelease / creative hashes | `P-Publish` | Public, System | Publication + audit window | Mixing tenants/versions |
| Command / effect manifest / ActuationReceipt | `P-Campaign-Ops` | DealerAdmin, ConciergeOp, PlatformOps | `R-Cmd` | Effect learning without receipt |
| CSV spend / delivery imports | `P-Campaign-Ops`, `P-Analytics-Desc` | Dealer\*, ConciergeOp, Analytics | `R-Cmd` | Causal “lift” claims |
| Shadow AI classifications | `P-AI-Shadow` only | System only | Deletable InferenceUse | Reviewer, comms, campaigns, beta analytics |
| Voluntary demographics | `P-Compliance-Demo` | Segregated compliance role only | Counsel floor | Decision-makers; models; inference |
| Accommodation request | `P-Rights`, `P-Review` (need-to-know) | DealerHR / designated, System | `R-Hire` | Marketing; models; vectors as substitute |
| Magic-link capability hash | `P-Apply`, `P-Rights` | System, Applicant (via channel) | Rotating; short-lived | Enumeration oracles |
| Tracker events (allowlisted) | `P-Analytics-Ops`, `P-Analytics-Desc` | Analytics, System | `R-Ops` / admission policy | App tokens; fingerprinting; apply-page third parties |
| Vector embedding + metadata | Retrieval under source purpose | System | `R-Vec` with source deletion | Protected attrs; consent-as-embedding |
| Y90 supervisory outcome | Future aggregate employer/process analysis only | Restricted analytics | `R-Hire` | Candidate feature; current spend/pay/disposition |
| Provider refresh tokens | `P-Campaign-Ops` (post read-only/actuation gates) | System | Secret rotation policy | Logs; MCP; client |

\*Dealer audiences are role-scoped (HR / reviewer / admin) per authorization matrix.

## Cross-plane projection rules

1. Copy only allowlisted fields for an explicit purpose ID.  
2. Retain lineage: source, subject, purpose, authority, audience, version, retention.  
3. Recheck current authority on every inference, embedding, retrieval, disclosure, communication, and decision-support use.  
4. Withdrawal / privacy request: block future permission-based use immediately; resolve lineage; revoke grants; quarantine unsafe artifacts; verified completion or documented legal exception.

## Change control

- New fields require matrix rows before production writes.
- New purposes require ADR or matrix amendment plus counsel if personal data or employment decisions are involved.
- Traceability: [traceability-matrix.md](./traceability-matrix.md).
