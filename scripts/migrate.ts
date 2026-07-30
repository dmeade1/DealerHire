import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "./load-env";

loadEnvFile();

const APP_USER = process.env.DB_APP_USER ?? "dealerhire_app";
const APP_PASSWORD = process.env.DB_APP_PASSWORD ?? "dealerhire_app";

function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\n]*/g, "");
}

function assertsForceRls(file: string, sql: string): void {
  const body = stripSqlComments(sql);
  if (!/\bALTER\s+TABLE\b[\s\S]*?\bFORCE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(body)) {
    console.error(
      `${file} must contain a real ALTER TABLE … FORCE ROW LEVEL SECURITY statement (comments do not count)`,
    );
    process.exit(1);
  }
}

async function ensureAppRole(sqlClient: {
  unsafe: (query: string) => Promise<unknown>;
}): Promise<void> {
  await sqlClient.unsafe(`
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
  console.log(`App role ready: ${APP_USER} (NOSUPERUSER NOBYPASSRLS)`);
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const dir = path.join(process.cwd(), "db/migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.error("No migrations found");
    process.exit(1);
  }

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    assertsForceRls(file, sql);
    console.log(`${checkOnly ? "CHECK" : "OK"} ${file} (${sql.length} bytes)`);
  }

  if (checkOnly) {
    console.log(
      "Migration FORCE RLS check passed (static ALTER … FORCE ROW LEVEL SECURITY). " +
        "Inbox message N/N−1 is covered by src/modules/messaging/inbox.test.ts (G1-09), not this script.",
    );
    return;
  }

  const connectionString = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL_ADMIN or DATABASE_URL is required to apply migrations");
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const sqlClient = postgres(connectionString, { max: 1 });
  try {
    await sqlClient.unsafe(`
      create schema if not exists platform;
      create table if not exists platform.schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    for (const file of files) {
      const applied = await sqlClient<
        { id: string }[]
      >`select id from platform.schema_migrations where id = ${file}`;
      if (applied.length > 0) {
        console.log(`Skip ${file} (already applied)`);
        continue;
      }

      const body = await readFile(path.join(dir, file), "utf8");
      console.log(`Applying ${file}...`);
      await sqlClient.unsafe(body);
      await sqlClient`
        insert into platform.schema_migrations (id) values (${file})
        on conflict (id) do nothing
      `;
    }

    await ensureAppRole(sqlClient);
    console.log("Migrations applied.");
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
