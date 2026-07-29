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
});
