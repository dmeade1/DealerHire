import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import type { ActorContext } from "@/platform/auth/context";
import { closeSql, withTenantContext, type Sql } from "@/platform/db/client";

export const TENANT_A = "00000000-0000-4000-8000-000000000001";
export const ROOFTOP_A = "00000000-0000-4000-8000-000000000002";
export const TENANT_B = "00000000-0000-4000-8000-000000000011";
export const ROOFTOP_B = "00000000-0000-4000-8000-000000000012";

const APP_USER = "dealerhire_app";
const APP_PASSWORD = "dealerhire_app";

function adminUrl(): string {
  const url = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL (or DATABASE_URL_ADMIN) is required for integration tests. Start Postgres with: docker compose up -d postgres",
    );
  }
  return url;
}

function appUrlFromAdmin(admin: string): string {
  if (process.env.DATABASE_URL_APP) return process.env.DATABASE_URL_APP;
  const u = new URL(admin);
  u.username = APP_USER;
  u.password = APP_PASSWORD;
  return u.toString();
}

export function requireIntegrationDb(): {
  adminUrl: string;
  appUrl: string;
} {
  const admin = adminUrl();
  return { adminUrl: admin, appUrl: appUrlFromAdmin(admin) };
}

async function applyMigrations(admin: Sql): Promise<void> {
  await admin.unsafe(`
    create schema if not exists platform;
    create table if not exists platform.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const dir = path.join(process.cwd(), "db/migrations");
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const applied = await admin<{ id: string }[]>`
      select id from platform.schema_migrations where id = ${file}
    `;
    if (applied.length > 0) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    await admin.unsafe(body);
    await admin`
      insert into platform.schema_migrations (id) values (${file})
      on conflict (id) do nothing
    `;
  }
}

async function ensureAppRole(admin: Sql, appUrl: string): Promise<void> {
  await admin.unsafe(`
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = '${APP_USER}') then
        create role ${APP_USER} login password '${APP_PASSWORD}' nosuperuser nobypassrls;
      end if;
    end
    $$;

    grant usage on schema platform, hiring, subject, publication, measurement to ${APP_USER};
    grant select, insert, update, delete on all tables in schema platform, hiring, subject, publication, measurement to ${APP_USER};
    grant usage, select on all sequences in schema platform, hiring, subject, publication, measurement to ${APP_USER};
    grant execute on all functions in schema platform to ${APP_USER};

    alter default privileges in schema platform grant select, insert, update, delete on tables to ${APP_USER};
    alter default privileges in schema hiring grant select, insert, update, delete on tables to ${APP_USER};
    alter default privileges in schema subject grant select, insert, update, delete on tables to ${APP_USER};
    alter default privileges in schema publication grant select, insert, update, delete on tables to ${APP_USER};
    alter default privileges in schema measurement grant select, insert, update, delete on tables to ${APP_USER};
  `);

  // Prove the app role is not a superuser / BYPASSRLS (otherwise G1-03 is vacuous).
  const app = postgres(appUrl, { max: 1 });
  try {
    const rows = await app<{
      rolsuper: boolean;
      rolbypassrls: boolean;
    }[]>`
      select rolsuper, rolbypassrls
      from pg_roles
      where rolname = current_user
    `;
    if (!rows[0] || rows[0].rolsuper || rows[0].rolbypassrls) {
      throw new Error(
        `integration app role must be NOSUPERUSER NOBYPASSRLS; got ${JSON.stringify(rows[0])}`,
      );
    }
  } finally {
    await app.end({ timeout: 5 });
  }
}

async function seedTenants(admin: Sql): Promise<void> {
  const seedA = await readFile(
    path.join(process.cwd(), "db/seed/synthetic-tenant.sql"),
    "utf8",
  );
  await admin.unsafe(seedA);

  await admin`
    insert into platform.dealer_groups (id, name, status)
    values (${TENANT_B}, 'Cross-Tenant Probe Group (SYNTHETIC)', 'active')
    on conflict (id) do nothing
  `;
  await admin`
    insert into platform.rooftops (
      id, tenant_id, name, jurisdiction_pack, locality, state_code, remote_jobs_allowed
    )
    values (
      ${ROOFTOP_B},
      ${TENANT_B},
      'Buffalo Probe Rooftop (SYNTHETIC)',
      'us-ny-state',
      'Buffalo',
      'NY',
      false
    )
    on conflict (id) do nothing
  `;
}

export async function setupIntegrationDb(): Promise<{
  adminUrl: string;
  appUrl: string;
}> {
  const { adminUrl: adminConnection, appUrl } = requireIntegrationDb();
  const admin = postgres(adminConnection, { max: 1 });
  try {
    await applyMigrations(admin);
    await ensureAppRole(admin, appUrl);
    await seedTenants(admin);
  } finally {
    await admin.end({ timeout: 5 });
  }
  process.env.DATABASE_URL_ADMIN ??= adminConnection;
  process.env.DATABASE_URL = appUrl;
  await closeSql();
  // Shared local DB: clear active command blockers so file order cannot poison INV-21 indexes.
  await supersedeActiveCommands({ tenantId: TENANT_A, rooftopId: ROOFTOP_A });
  await supersedeActiveCommands({ tenantId: TENANT_B, rooftopId: ROOFTOP_B });
  return { adminUrl: adminConnection, appUrl };
}

export async function teardownIntegrationDb(): Promise<void> {
  await closeSql();
}

export function actorFor(
  tenantId: string,
  rooftopId: string,
  purpose: ActorContext["purpose"] = "hiring_operations",
): ActorContext {
  return {
    actorSubjectRef: "synthetic:integration-tester",
    tenantId,
    rooftopId,
    purpose,
    role: "system",
    capabilities: ["*"],
    sessionId: "integration-session",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

/** Supersede active commands so re-runs are not blocked by INV-21 / unique indexes. */
export async function supersedeActiveCommands(input: {
  tenantId: string;
  rooftopId: string;
  levers?: string[];
}): Promise<void> {
  await withTenantContext(
    actorFor(input.tenantId, input.rooftopId, "hiring_operations"),
    async (sql) => {
      if (input.levers?.length) {
        await sql`
          update hiring.commands
          set status = 'superseded'
          where tenant_id = ${input.tenantId}::uuid
            and status in ('queued', 'executing', 'needs_reconciliation')
            and lever in ${sql(input.levers)}
        `;
        return;
      }
      await sql`
        update hiring.commands
        set status = 'superseded'
        where tenant_id = ${input.tenantId}::uuid
          and status in ('queued', 'executing', 'needs_reconciliation')
      `;
    },
  );
}

export { withTenantContext };
export type { Sql };
