import Link from "next/link";
import { listUnprojectedEnvelopes } from "@/modules/intake/drain";
import { requireActor } from "@/platform/auth/guard";
import { withTenantContext } from "@/platform/db/client";

export default async function OpsDrainPage() {
  const actor = await requireActor({
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability: "ops.inspect",
  });

  let pending: Awaited<ReturnType<typeof listUnprojectedEnvelopes>> = [];
  let loadError: string | null = null;
  try {
    const dbActor = { ...actor, purpose: "hiring_operations" as const };
    pending = await withTenantContext(dbActor, (sql) =>
      listUnprojectedEnvelopes(sql, { limit: 50 }),
    );
  } catch {
    loadError = "Could not load envelope drain board for this rooftop.";
  }

  return (
    <article>
      <h1 id="drain-heading">Envelope drain (queue-down)</h1>
      <p>
        RC-03 / G1-08: accepted envelopes without an application row. Drain via{" "}
        <code>pnpm ops drain</code> (projects idempotently — zero duplicate applications). Receipt
        already issued; this board only converges projection.
      </p>
      <p>
        <Link href="/ops">Ops home</Link> · <Link href="/ops/recovery">Recovery</Link>
      </p>

      <div aria-live="polite" aria-atomic="true">
        {loadError ? <p role="status">{loadError}</p> : null}
      </div>

      <h2 id="pending-heading">Unprojected envelopes</h2>
      {pending.length === 0 ? (
        <p role="status">No unprojected envelopes for this rooftop.</p>
      ) : (
        <table aria-labelledby="pending-heading">
          <caption>Accepted envelopes awaiting application projection</caption>
          <thead>
            <tr>
              <th scope="col">Envelope</th>
              <th scope="col">JCV</th>
              <th scope="col">Accepted</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((row) => (
              <tr key={row.id}>
                <td>
                  <code>{row.id}</code>
                </td>
                <td>
                  <code>{row.job_control_version_id}</code>
                </td>
                <td>
                  <time dateTime={new Date(row.accepted_at).toISOString()}>
                    {new Date(row.accepted_at).toISOString()}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
