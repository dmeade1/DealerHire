import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import {
  ROOFTOP_A,
  ROOFTOP_B,
  TENANT_A,
  TENANT_B,
  actorFor,
  requireIntegrationDb,
  setupIntegrationDb,
  teardownIntegrationDb,
  withTenantContext,
} from "./helpers/db";

describe("G1-03 forced RLS / missing-context denial", () => {
  let requisitionA: string;
  let requisitionB: string;

  beforeAll(async () => {
    const urls = requireIntegrationDb();
    const { adminUrl, appUrl } = await setupIntegrationDb();

    // Seed requisitions as admin (superuser bypasses FORCE RLS for fixture setup).
    const admin = postgres(adminUrl || urls.adminUrl, { max: 1 });
    try {
      const a = await admin<{ id: string }[]>`
        insert into hiring.requisitions (
          tenant_id, rooftop_id, department, job_family, title, status
        ) values (
          ${TENANT_A}, ${ROOFTOP_A}, 'Fixed Ops', 'technician',
          'SYNTHETIC Tech A', 'draft'
        )
        returning id
      `;
      const b = await admin<{ id: string }[]>`
        insert into hiring.requisitions (
          tenant_id, rooftop_id, department, job_family, title, status
        ) values (
          ${TENANT_B}, ${ROOFTOP_B}, 'Fixed Ops', 'technician',
          'SYNTHETIC Tech B', 'draft'
        )
        returning id
      `;
      requisitionA = a[0]!.id;
      requisitionB = b[0]!.id;
    } finally {
      await admin.end({ timeout: 5 });
    }

    // Ensure subsequent withTenantContext uses the app (non-bypass) role.
    process.env.DATABASE_URL = appUrl;
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationDb();
  });

  it("require_tenant_context fails when tenant / rooftop / purpose unset", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    try {
      await expect(
        sql`select platform.require_tenant_context()`,
      ).rejects.toThrow(/missing (tenant|rooftop|purpose) context/i);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("queries without tenant context see zero RLS-protected rows", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    try {
      const rows = await sql<{ id: string }[]>`
        select id from hiring.requisitions
      `;
      expect(rows).toEqual([]);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("tenant A context cannot read tenant B requisitions", async () => {
    const rows = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A),
      async (sql) =>
        sql<{ id: string; title: string }[]>`
          select id, title from hiring.requisitions order by title
        `,
    );

    expect(rows.map((r) => r.id)).toContain(requisitionA);
    expect(rows.map((r) => r.id)).not.toContain(requisitionB);
    expect(rows.every((r) => r.title.includes("SYNTHETIC"))).toBe(true);
  });

  it("tenant B context cannot read tenant A requisitions", async () => {
    const rows = await withTenantContext(
      actorFor(TENANT_B, ROOFTOP_B),
      async (sql) =>
        sql<{ id: string }[]>`
          select id from hiring.requisitions
        `,
    );

    expect(rows.map((r) => r.id)).toContain(requisitionB);
    expect(rows.map((r) => r.id)).not.toContain(requisitionA);
  });

  it("rooftop A cannot read same-tenant rooftop B requisitions", async () => {
    const urls = requireIntegrationDb();
    const admin = postgres(urls.adminUrl, { max: 1 });
    const rooftopA2 = "00000000-0000-4000-8000-000000000022";
    let requisitionA2: string;
    try {
      await admin`
        insert into platform.rooftops (
          id, tenant_id, name, jurisdiction_pack, locality, state_code, remote_jobs_allowed
        ) values (
          ${rooftopA2}, ${TENANT_A}, 'Albany Annex (SYNTHETIC)',
          'us-ny-state', 'Albany', 'NY', false
        )
        on conflict (id) do nothing
      `;
      const rows = await admin<{ id: string }[]>`
        insert into hiring.requisitions (
          tenant_id, rooftop_id, department, job_family, title, status
        ) values (
          ${TENANT_A}, ${rooftopA2}, 'Fixed Ops', 'technician',
          'SYNTHETIC Tech A2', 'draft'
        )
        returning id
      `;
      requisitionA2 = rows[0]!.id;
    } finally {
      await admin.end({ timeout: 5 });
    }

    const fromA = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A),
      async (sql) => sql<{ id: string }[]>`select id from hiring.requisitions`,
    );
    expect(fromA.map((r) => r.id)).toContain(requisitionA);
    expect(fromA.map((r) => r.id)).not.toContain(requisitionA2);

    const fromA2 = await withTenantContext(
      actorFor(TENANT_A, rooftopA2),
      async (sql) => sql<{ id: string }[]>`select id from hiring.requisitions`,
    );
    expect(fromA2.map((r) => r.id)).toContain(requisitionA2);
    expect(fromA2.map((r) => r.id)).not.toContain(requisitionA);
  });

  it("wrong purpose plane cannot read hiring requisitions", async () => {
    const rows = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) => sql<{ id: string }[]>`select id from hiring.requisitions`,
    );
    expect(rows).toEqual([]);
  });

  it("publication_disclosure plane isolates page_releases across tenants", async () => {
    const jcvA = "00000000-0000-4000-8000-00000000000a";
    const pubA = actorFor(TENANT_A, ROOFTOP_A, "publication_disclosure");
    const pubB = actorFor(TENANT_B, ROOFTOP_B, "publication_disclosure");

    const created = await withTenantContext(pubA, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        insert into publication.page_releases (
          tenant_id, rooftop_id, job_control_version_id, locale, manifest,
          content_address, activated_at
        ) values (
          ${TENANT_A}::uuid, ${ROOFTOP_A}::uuid, ${jcvA}::uuid, 'en',
          '{"title":"SYNTHETIC RLS A","synthetic":true}'::jsonb,
          ${`rls-a-${requisitionA}`}, now()
        )
        returning id
      `;
      return rows[0]!.id;
    });

    const fromA = await withTenantContext(pubA, async (sql) =>
      sql<{ id: string }[]>`
        select id from publication.page_releases where id = ${created}::uuid
      `,
    );
    expect(fromA.map((r) => r.id)).toContain(created);

    const fromB = await withTenantContext(pubB, async (sql) =>
      sql<{ id: string }[]>`
        select id from publication.page_releases where id = ${created}::uuid
      `,
    );
    expect(fromB).toEqual([]);

    const wrongPurpose = await withTenantContext(
      actorFor(TENANT_A, ROOFTOP_A, "subject_permission"),
      async (sql) =>
        sql<{ id: string }[]>`
          select id from publication.page_releases where id = ${created}::uuid
        `,
    );
    expect(wrongPurpose).toEqual([]);
  });

  it("hiring_operations cannot read other-tenant commands", async () => {
    const jcvA = "00000000-0000-4000-8000-00000000000a";
    const hiringA = actorFor(TENANT_A, ROOFTOP_A, "hiring_operations");
    const hiringB = actorFor(TENANT_B, ROOFTOP_B, "hiring_operations");
    const probeKey = `idem-rls-${requisitionA}-${Date.now()}`;

    await withTenantContext(hiringA, async (sql) => {
      await sql`
        update hiring.commands
        set status = 'superseded'
        where tenant_id = ${TENANT_A}::uuid
          and lever = 'rls_probe'
          and status in ('queued', 'executing', 'needs_reconciliation')
      `;
    });

    const commandId = await withTenantContext(hiringA, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        insert into hiring.commands (
          tenant_id, rooftop_id, job_control_version_id, lever, payload_hash, payload,
          status, idempotency_key
        ) values (
          ${TENANT_A}::uuid, ${ROOFTOP_A}::uuid, ${jcvA}::uuid, 'rls_probe',
          ${`hash-rls-${probeKey}`}, '{"synthetic":true}'::jsonb,
          'queued', ${probeKey}
        )
        returning id
      `;
      return rows[0]!.id;
    });

    const fromA = await withTenantContext(hiringA, async (sql) =>
      sql<{ id: string }[]>`select id from hiring.commands where id = ${commandId}::uuid`,
    );
    expect(fromA.map((r) => r.id)).toContain(commandId);

    const fromB = await withTenantContext(hiringB, async (sql) =>
      sql<{ id: string }[]>`select id from hiring.commands where id = ${commandId}::uuid`,
    );
    expect(fromB).toEqual([]);
  });
});
