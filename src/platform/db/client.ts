import postgres from "postgres";
import type { ActorContext } from "@/platform/auth/context";
import { assertNotExpired } from "@/platform/auth/context";

export type Sql = ReturnType<typeof postgres>;

let sqlSingleton: Sql | null = null;
let sqlSingletonUrl: string | null = null;

export function getSql(connectionString = process.env.DATABASE_URL): Sql {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  if (sqlSingleton && sqlSingletonUrl !== connectionString) {
    throw new Error(
      "DATABASE_URL mismatch: call closeSql() before switching connection strings (singleton must not silently reuse another DB)",
    );
  }
  if (!sqlSingleton) {
    sqlSingleton = postgres(connectionString, {
      max: 10,
      prepare: false, // transaction pooling / Hyperdrive friendly
    });
    sqlSingletonUrl = connectionString;
  }
  return sqlSingleton;
}

export async function withTenantContext<T>(
  ctx: ActorContext,
  fn: (sql: Sql) => Promise<T>,
  connectionString?: string,
): Promise<T> {
  assertNotExpired(ctx);
  if (!ctx.purpose) throw new Error("missing purpose context");
  if (!ctx.rooftopId) throw new Error("missing rooftop context");
  const rooftopId = ctx.rooftopId;
  const purpose = ctx.purpose;
  const sql = getSql(connectionString);

  return sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${ctx.tenantId}, true)`;
    await tx`select set_config('app.rooftop_id', ${rooftopId}, true)`;
    await tx`select set_config('app.purpose', ${purpose}, true)`;
    await tx`select platform.require_tenant_context()`;
    return fn(tx as unknown as Sql);
  }) as Promise<T>;
}

export async function closeSql(): Promise<void> {
  if (sqlSingleton) {
    await sqlSingleton.end({ timeout: 5 });
    sqlSingleton = null;
    sqlSingletonUrl = null;
  }
}

/**
 * Open a transaction on a root client; if `sql` is already a transaction
 * (e.g. from withTenantContext), run `fn` directly.
 */
export async function runInTransaction<T>(sql: Sql, fn: (tx: Sql) => Promise<T>): Promise<T> {
  if (typeof sql.begin === "function") {
    return sql.begin(async (tx) => fn(tx as unknown as Sql)) as Promise<T>;
  }
  return fn(sql);
}
