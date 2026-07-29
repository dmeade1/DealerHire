import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "./load-env";

loadEnvFile();

async function main() {
  const connectionString = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL_ADMIN or DATABASE_URL is required");
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const sql = postgres(connectionString, { max: 1 });
  try {
    const body = await readFile(
      path.join(process.cwd(), "db/seed/synthetic-tenant.sql"),
      "utf8",
    );
    await sql.unsafe(body);
    console.log("Synthetic tenant seed applied.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
