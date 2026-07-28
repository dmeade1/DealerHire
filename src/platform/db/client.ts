import postgres from "postgres";
import type { ActorContext } from "@/platform/auth/context";
import { assertNotExpired } from "@/platform/auth/context";

export type Sql = ReturnType<typeof postgres>;

let sqlSingleton: Sql | null = null;

export function getSql(connectionString = process.env.DATABASE_URL): Sql {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  if (!sqlSingleton) {
    sqlSingleton = postgres(connectionString, {
      max: 10,
      prepare: false, // transaction pooling / Hyperdrive friendly
    });
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
  const sql = getSql(connectionString);

  return sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${ctx.tenantId}, true)`;
    await tx`select set_config('app.purpose', ${ctx.purpose}, true)`;
    if (ctx.rooftopId) {
      await tx`select set_config('app.rooftop_id', ${ctx.rooftopId}, true)`;
    }
    await tx`select platform.require_tenant_context()`;
    return fn(tx as unknown as Sql);
  }) as Promise<T>;
}

export async function closeSql(): Promise<void> {
  if (sqlSingleton) {
    await sqlSingleton.end({ timeout: 5 });
    sqlSingleton = null;
  }
}
