import Link from "next/link";
import { readKillSwitches } from "@/modules/ops/kill-switch";
import { mintSignedActor, requireActor } from "@/platform/auth/guard";

export default async function OpsPage() {
  // Layout already gated; re-resolve so the form can carry a short-lived signed actor
  // (browsers cannot set x-dh-actor on native form posts).
  const actor = await requireActor({
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability: "ops.inspect",
  });
  let token = "";
  let signature = "";
  try {
    ({ token, signature } = mintSignedActor(actor));
  } catch {
    // Local unsigned synthetic path may lack CAPABILITY_SECRET; POST falls back to synthetic ops actor.
  }

  let switches: Awaited<ReturnType<typeof readKillSwitches>> = [];
  try {
    if (process.env.DATABASE_URL && process.env.OPS_CONTROL_SECRET) {
      switches = await readKillSwitches();
    }
  } catch {
    switches = [];
  }

  return (
    <article>
      <h1>Operations &amp; recovery</h1>
      <p>
        Audited recovery surface. Direct database edits are forbidden. Business-hours support with
        emergency kill switches that persist to Postgres and return readback state.
      </p>
      <ul>
        <li>
          <Link href="/ops/liveness">Source liveness</Link>
        </li>
        <li>
          <Link href="/ops/reconciliation">Needs reconciliation</Link>
        </li>
        <li>
          <Link href="/ops/recovery">Inspect / DLQ / outbox</Link>
        </li>
      </ul>

      <section aria-labelledby="kill-status-heading">
        <h2 id="kill-status-heading">Kill-switch status</h2>
        {switches.length === 0 ? (
          <p>
            No durable status loaded (set <code>DATABASE_URL</code> + <code>OPS_CONTROL_SECRET</code>{" "}
            for readback). Default: all scopes unpaused.
          </p>
        ) : (
          <ul>
            {switches.map((s) => (
              <li key={s.scope}>
                <strong>{s.scope}</strong>: {s.paused ? "PAUSED" : "clear"}
                {s.reason ? ` — ${s.reason}` : ""}{" "}
                <span style={{ fontSize: 14, color: "#444" }}>
                  (updated {s.updatedAt})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="kill-switch-heading">
        <h2 id="kill-switch-heading">Emergency pause</h2>
        <form action="/api/ops/kill-switch" method="post" style={{ display: "grid", gap: 12, maxWidth: 420 }}>
          <label>
            Scope
            <select name="scope" required defaultValue="all_execution">
              <option value="intake">Intake</option>
              <option value="campaigns">Campaigns</option>
              <option value="all_execution">All execution</option>
            </select>
          </label>
          <label>
            Reason (required)
            <input name="reason" required maxLength={500} placeholder="Incident / drill reason" />
          </label>
          <label>
            Ops control secret
            <input
              name="opsControlSecret"
              type="password"
              required
              autoComplete="current-password"
              placeholder="OPS_CONTROL_SECRET"
            />
          </label>
          <input type="hidden" name="paused" value="true" />
          <input type="hidden" name="actorToken" value={token} />
          <input type="hidden" name="actorSignature" value={signature} />
          <button type="submit">Arm kill switch (durable)</button>
        </form>
        <form action="/api/ops/kill-switch" method="post" style={{ display: "grid", gap: 12, maxWidth: 420, marginTop: 16 }}>
          <input type="hidden" name="scope" value="all_execution" />
          <input type="hidden" name="paused" value="false" />
          <input type="hidden" name="actorToken" value={token} />
          <input type="hidden" name="actorSignature" value={signature} />
          <label>
            Resume reason
            <input name="reason" required maxLength={500} placeholder="Clear pause reason" />
          </label>
          <label>
            Ops control secret
            <input
              name="opsControlSecret"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit">Resume all execution</button>
        </form>
        <p>
          HTTP kill-switch requires <code>OPS_CONTROL_SECRET</code> plus a signed ops actor (
          <code>x-dh-actor</code> / <code>x-dh-actor-sig</code>, or the form-minted token fields).
          Local skeleton browsing may use <code>ALLOW_UNSIGNED_SYNTHETIC_ACTOR=true</code>.
        </p>
      </section>

      <p>
        CLI: <code>pnpm ops kill-switch --scope intake --reason &quot;…&quot;</code> (requires{" "}
        <code>DATABASE_URL</code> and <code>OPS_CONTROL_SECRET</code>).
      </p>
    </article>
  );
}
