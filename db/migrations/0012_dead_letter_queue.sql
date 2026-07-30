-- Audited DLQ for poison / exhausted inbox messages (INV-38, RC-09 / G1-12).
-- FORCE ROW LEVEL SECURITY

CREATE TABLE IF NOT EXISTS hiring.dead_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  source text NOT NULL,
  message_type text NOT NULL,
  schema_version integer,
  payload jsonb NOT NULL,
  reason text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  quarantined_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  CONSTRAINT dead_letter_attempts_nonneg CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS dead_letter_open_idx
  ON hiring.dead_letter (tenant_id, rooftop_id, quarantined_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE hiring.dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.dead_letter FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON hiring.dead_letter;

CREATE POLICY tenant_rooftop_purpose ON hiring.dead_letter
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

-- App role grants applied by scripts/migrate.ts ensureAppRole (role may not exist yet here).
