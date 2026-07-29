-- Durable kill switches (INV-51); rooftop on outbox/receipts; constrain platform_control.
-- FORCE ROW LEVEL SECURITY

-- ---------------------------------------------------------------------------
-- Kill switches (platform control plane)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform.execution_kill_switches (
  scope text PRIMARY KEY CHECK (scope IN ('intake', 'campaigns', 'all_execution')),
  paused boolean NOT NULL DEFAULT false,
  reason text NOT NULL DEFAULT '',
  actor_subject_ref text NOT NULL DEFAULT 'system',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.kill_switch_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  paused boolean NOT NULL,
  previous_paused boolean,
  reason text NOT NULL,
  actor_subject_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform.execution_kill_switches (scope, paused, reason, actor_subject_ref)
VALUES
  ('intake', false, 'default', 'system'),
  ('campaigns', false, 'default', 'system'),
  ('all_execution', false, 'default', 'system')
ON CONFLICT (scope) DO NOTHING;

ALTER TABLE platform.execution_kill_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.execution_kill_switches FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.kill_switch_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.kill_switch_audit FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON platform.execution_kill_switches;
DROP POLICY IF EXISTS tenant_rooftop_purpose ON platform.kill_switch_audit;

CREATE POLICY platform_control_kill_switches ON platform.execution_kill_switches
  USING (platform.current_purpose() = 'platform_control')
  WITH CHECK (platform.current_purpose() = 'platform_control');

CREATE POLICY platform_control_kill_switch_audit ON platform.kill_switch_audit
  USING (platform.current_purpose() = 'platform_control')
  WITH CHECK (platform.current_purpose() = 'platform_control');

-- ---------------------------------------------------------------------------
-- platform_control is not a god plane — purpose must match the policy plane
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION platform.purpose_allows(plane text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT platform.current_purpose() IS NOT NULL
     AND platform.current_purpose() = plane
$$;

-- ---------------------------------------------------------------------------
-- Rooftop on outbox / actuation receipts (join-bound when backfilling)
-- ---------------------------------------------------------------------------
ALTER TABLE hiring.outbox
  ADD COLUMN IF NOT EXISTS rooftop_id uuid REFERENCES platform.rooftops(id);

UPDATE hiring.outbox o
SET rooftop_id = c.rooftop_id
FROM hiring.commands c
WHERE o.rooftop_id IS NULL
  AND o.aggregate_type = 'command'
  AND o.aggregate_id = c.id;

ALTER TABLE hiring.actuation_receipts
  ADD COLUMN IF NOT EXISTS rooftop_id uuid REFERENCES platform.rooftops(id);

UPDATE hiring.actuation_receipts r
SET rooftop_id = c.rooftop_id
FROM hiring.commands c
WHERE r.rooftop_id IS NULL
  AND r.command_id = c.id;

ALTER TABLE hiring.source_liveness
  ADD COLUMN IF NOT EXISTS rooftop_id uuid REFERENCES platform.rooftops(id);

ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.source_liveness FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON hiring.outbox;
DROP POLICY IF EXISTS tenant_rooftop_purpose ON hiring.actuation_receipts;
DROP POLICY IF EXISTS tenant_rooftop_purpose ON hiring.source_liveness;

CREATE POLICY tenant_rooftop_purpose ON hiring.outbox
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.actuation_receipts
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

-- Tenant-wide liveness (null rooftop) visible only when actor rooftop is set and row is null
-- under hiring_operations — prefer rooftop-scoped rows when present.
CREATE POLICY tenant_rooftop_purpose ON hiring.source_liveness
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('hiring_operations')
    AND (
      platform.row_rooftop_allowed(rooftop_id)
      OR rooftop_id IS NULL
    )
  );
