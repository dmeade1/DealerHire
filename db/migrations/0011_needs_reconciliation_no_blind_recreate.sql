-- Ambiguous provider outcomes stay NeedsReconciliation; block a second active
-- command for the same lever (INV-21 / RC-08 / G1-07).
-- FORCE ROW LEVEL SECURITY

ALTER TABLE hiring.commands FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS hiring.commands_active_conflict_idx;
DROP INDEX IF EXISTS commands_active_conflict_idx;

CREATE UNIQUE INDEX commands_active_conflict_idx
  ON hiring.commands (tenant_id, job_control_version_id, lever)
  WHERE status IN ('queued', 'executing', 'needs_reconciliation');
