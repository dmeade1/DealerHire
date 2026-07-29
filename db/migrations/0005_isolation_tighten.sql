-- Tighten rooftop NOT NULL + tenant-scoped idempotency; close null-rooftop liveness hole.
-- FORCE ROW LEVEL SECURITY
-- Upgrade rule: never silently delete operational evidence — abort if backfill is incomplete.

-- ---------------------------------------------------------------------------
-- Outbox / receipts: rooftop required (abort if orphans remain)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  outbox_orphans integer;
  receipt_orphans integer;
  liveness_orphans integer;
BEGIN
  SELECT count(*) INTO outbox_orphans FROM hiring.outbox WHERE rooftop_id IS NULL;
  SELECT count(*) INTO receipt_orphans FROM hiring.actuation_receipts WHERE rooftop_id IS NULL;
  SELECT count(*) INTO liveness_orphans FROM hiring.source_liveness WHERE rooftop_id IS NULL;

  IF outbox_orphans > 0 OR receipt_orphans > 0 OR liveness_orphans > 0 THEN
    RAISE EXCEPTION
      '0005_isolation_tighten aborted: backfill rooftop_id before upgrade (outbox=%, actuation_receipts=%, source_liveness=%). Quarantine or repair — do not delete operational evidence.',
      outbox_orphans, receipt_orphans, liveness_orphans;
  END IF;
END
$$;

ALTER TABLE hiring.outbox
  ALTER COLUMN rooftop_id SET NOT NULL;

ALTER TABLE hiring.actuation_receipts
  ALTER COLUMN rooftop_id SET NOT NULL;

ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- source_liveness: rooftop-scoped only (no tenant-wide null visibility)
-- ---------------------------------------------------------------------------
ALTER TABLE hiring.source_liveness
  ALTER COLUMN rooftop_id SET NOT NULL;

ALTER TABLE hiring.source_liveness
  DROP CONSTRAINT IF EXISTS source_liveness_tenant_id_source_key_key;

DROP INDEX IF EXISTS source_liveness_tenant_id_source_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS source_liveness_tenant_rooftop_source_uidx
  ON hiring.source_liveness (tenant_id, rooftop_id, source_key);

ALTER TABLE hiring.source_liveness FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON hiring.source_liveness;

CREATE POLICY tenant_rooftop_purpose ON hiring.source_liveness
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

-- ---------------------------------------------------------------------------
-- Idempotency keys are tenant-scoped (prevent cross-tenant collision / squatting)
-- ---------------------------------------------------------------------------
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS application_acceptance_envelopes_idempotency_key_key;

DROP INDEX IF EXISTS application_acceptance_envelopes_idempotency_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS application_acceptance_envelopes_tenant_idempotency_uidx
  ON subject.application_acceptance_envelopes (tenant_id, idempotency_key);

ALTER TABLE hiring.commands
  DROP CONSTRAINT IF EXISTS commands_idempotency_key_key;

DROP INDEX IF EXISTS commands_idempotency_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS commands_tenant_idempotency_uidx
  ON hiring.commands (tenant_id, idempotency_key);

ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.commands FORCE ROW LEVEL SECURITY;
