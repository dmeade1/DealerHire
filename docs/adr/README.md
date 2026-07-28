# Architecture Decision Records

This directory records durable architectural decisions for DealerHire. ADRs are the change-control surface for topology, providers, invariants, and release boundaries. Implementation tickets and prototypes must not silently redefine them.

## How to use

1. Read the [system map](../system-map.md) for the conceptual control/evidence model and deployables.
2. Consult the relevant ADR before changing hosting, identity, data planes, intake, publication, commands, AI, tracking, analytics, or operations.
3. Open a new ADR when a decision is irreversible, cross-cutting, or compliance-sensitive. Prefer amending an existing ADR with a dated supersession note over silent drift.
4. Link gates and the [traceability matrix](../traceability-matrix.md) when a decision creates or changes a hard invariant.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `Accepted` | Binding for current implementation |
| `Proposed` | Under review; not yet binding |
| `Superseded` | Replaced by a newer ADR |
| `Deferred` | Explicitly out of beta scope; revisit after named gate |

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](./0001-modular-monolith.md) | Modular monolith on Cloudflare Workers / OpenNext | Accepted |
| [0002](./0002-cloudflare-postgres-topology.md) | Cloudflare edge + managed Postgres/pgvector topology | Accepted |
| [0003](./0003-identity-and-rls.md) | Managed identity and forced tenant/purpose RLS | Accepted |
| [0004](./0004-application-acceptance-envelope.md) | Independent application-acceptance envelope | Accepted |
| [0005](./0005-publication-page-release.md) | Content-addressed publication via PageRelease | Accepted |
| [0006](./0006-command-outbox-actuation.md) | Command ledger, outbox, and deferred ad actuation | Accepted |
| [0007](./0007-candidate-ai-shadow-mode.md) | Candidate AI shadow-only until EmploymentAIUse gate | Accepted |
| [0008](./0008-tracking-and-communications.md) | Default-deny tracking; email-first communications | Accepted |
| [0009](./0009-analytics-claim-classes.md) | Analytics claim classes and tenant-local beta scope | Accepted |
| [0010](./0010-deployment-observability-rollback.md) | Deployment, observability, and rollback model | Accepted |

## Related assurance docs

- [System map](../system-map.md)
- [Data inventory](../data-inventory.md)
- [Purpose / field / retention matrix](../purpose-field-retention-matrix.md)
- [Role allocation](../role-allocation.md)
- [Invariant register](../invariant-register.md)
- [Threat model](../threat-model.md)
- [SLOs](../slos.md)
- [Recovery criteria](../recovery-criteria.md)
- [Provider allowlists](../provider-allowlists.md)
- [Traceability matrix](../traceability-matrix.md)
- [Counsel packet](../counsel-packet.md)
- [Gates](../gates/)

## Writing conventions

- Prefer one decision per ADR; capture consequences and rejected alternatives.
- Name the beta envelope explicitly when a decision is temporary: one NY dealer group/rooftop, English managed subdomain, no live ad actuation, candidate AI shadow-only, all dealership role families validated before beta.
- Provider selections live in [provider-allowlists.md](../provider-allowlists.md) with `SELECTION STATUS`; ADRs bind the architectural constraint, not a forever-vendor promise.
- Legal language here is architecture guidance for retained counsel—not legal advice.
