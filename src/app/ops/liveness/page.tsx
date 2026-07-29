import {
  advisoryDecision,
  executionDecision,
  listSourceLiveness,
  type LivenessState,
} from "@/modules/liveness/sources";
import { requireActor } from "@/platform/auth/guard";
import { withTenantContext } from "@/platform/db/client";

export default async function LivenessPage() {
  const actor = await requireActor({
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability: "ops.inspect",
  });

  let rows: Awaited<ReturnType<typeof listSourceLiveness>> = [];
  let loadError: string | null = null;
  try {
    const dbActor = { ...actor, purpose: "hiring_operations" as const };
    rows = await withTenantContext(dbActor, (sql) => listSourceLiveness(sql));
  } catch {
    loadError = "Could not load source_liveness for this rooftop.";
    rows = [];
  }

  return (
    <article>
      <h1 id="liveness-heading">Source liveness</h1>
      <p>
        Analytical stale ⇒ abstain. Safety-critical stale/missing ⇒ pause execution. Rows come from{" "}
        <code>hiring.source_liveness</code> for the current rooftop.
      </p>
      <div aria-live="polite" aria-atomic="true">
        {loadError ? <p role="status">{loadError}</p> : null}
        {rows.length === 0 && !loadError ? (
          <p role="status">
            No source_liveness rows yet. Upsert via intake/campaign heartbeats or re-run{" "}
            <code>pnpm db:seed</code>.
          </p>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <table aria-labelledby="liveness-heading">
          <caption>Current source liveness and advise/pause decisions</caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">State</th>
              <th scope="col">Advisory</th>
              <th scope="col">Execution</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const state = row.state as LivenessState;
              return (
                <tr key={row.source_key}>
                  <td>
                    <code>{row.source_key}</code>
                  </td>
                  <td>{state}</td>
                  <td>{advisoryDecision(state)}</td>
                  <td>{executionDecision(state)}</td>
                  <td>
                    <time dateTime={new Date(row.updated_at).toISOString()}>
                      {new Date(row.updated_at).toISOString()}
                    </time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </article>
  );
}
