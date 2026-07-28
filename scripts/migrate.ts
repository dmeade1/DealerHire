import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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
    if (!sql.includes("FORCE ROW LEVEL SECURITY")) {
      console.error(`${file} must FORCE RLS on tenant-sensitive tables`);
      process.exit(1);
    }
    console.log(`${checkOnly ? "CHECK" : "OK"} ${file} (${sql.length} bytes)`);
  }

  if (checkOnly) {
    console.log("Migration compatibility check passed (static).");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped apply. Static check only.");
    return;
  }

  const postgres = (await import("postgres")).default;
  const sqlClient = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await sqlClient`
      create table if not exists platform.schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `.catch(async () => {
      // platform schema may not exist yet — run first migration raw
    });

    for (const file of files) {
      const body = await readFile(path.join(dir, file), "utf8");
      console.log(`Applying ${file}...`);
      await sqlClient.unsafe(body);
      await sqlClient`
        create table if not exists platform.schema_migrations (
          id text primary key,
          applied_at timestamptz not null default now()
        )
      `;
      await sqlClient`
        insert into platform.schema_migrations (id) values (${file})
        on conflict (id) do nothing
      `;
    }
    console.log("Migrations applied.");
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
