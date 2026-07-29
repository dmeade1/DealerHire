-- Close remaining single-column applications → envelope edge.
-- Idempotent: safe after partial 0007 applies that omitted this FK.

ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'envelopes_tenant_id_id_key'
  ) THEN
    ALTER TABLE subject.application_acceptance_envelopes
      ADD CONSTRAINT envelopes_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
END
$$;

ALTER TABLE subject.applications DROP CONSTRAINT IF EXISTS applications_envelope_id_fkey;
ALTER TABLE subject.applications DROP CONSTRAINT IF EXISTS applications_tenant_envelope_fkey;
ALTER TABLE subject.applications
  ADD CONSTRAINT applications_tenant_envelope_fkey
    FOREIGN KEY (tenant_id, envelope_id)
    REFERENCES subject.application_acceptance_envelopes (tenant_id, id);
