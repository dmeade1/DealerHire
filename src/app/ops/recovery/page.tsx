import Link from "next/link";
import { listDeadLetters } from "@/modules/ops/dlq";
import { listOutbox } from "@/modules/ops/outbox";
import { requireActor } from "@/platform/auth/guard";
import { withTenantContext } from "@/platform/db/client";

export default async function OpsRecoveryPage() {
  const actor = await requireActor({
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability: "ops.inspect",
  });

  let deadLetters: Awaited<ReturnType<typeof listDeadLetters>> = [];
  let outbox: Awaited<ReturnType<typeof listOutbox>> = [];
  let loadError: string | null = null;
  try {
    const dbActor = { ...actor, purpose: "hiring_operations" as const };
    [deadLetters, outbox] = await withTenantContext(dbActor, async (sql) => {
      const dlq = await listDeadLetters(sql, { limit: 50 });
      const events = await listOutbox(sql, { limit: 25 });
      return [dlq, events] as const;
    });
  } catch {
    loadError = "Could not load recovery board for this rooftop.";
  }

  return (
    <article>
      <h1 id="recovery-heading">Inspect / DLQ / outbox</h1>
      <p>
        Audited recovery (INV-38 / RC-09). Direct database edits are forbidden. Safe retry:{" "}
        <code>pnpm ops dlq:retry --id …</code> or <code>pnpm ops outbox:replay --id …</code>{" "}
        (signed actor required; refuses create re-dispatch under NeedsReconciliation).
      </p>
      <p>
        <Link href="/ops">Ops home</Link> · <Link href="/ops/reconciliation">Reconciliation</Link>
      </p>

      <div aria-live="polite" aria-atomic="true">
        {loadError ? <p role="status">{loadError}</p> : null}
      </div>

      <h2 id="dlq-heading">Dead letter queue</h2>
      {deadLetters.length === 0 ? (
        <p role="status">No open DLQ rows for this rooftop.</p>
      ) : (
        <table aria-labelledby="dlq-heading">
          <caption>Poison / exhausted messages awaiting audited retry</caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Type</th>
              <th scope="col">Reason</th>
              <th scope="col">Attempts</th>
              <th scope="col">Quarantined</th>
            </tr>
          </thead>
          <tbody>
            {deadLetters.map((row) => (
              <tr key={row.id}>
                <td>
                  <code>{row.id}</code>
                </td>
                <td>{row.message_type}</td>
                <td>{row.reason}</td>
                <td>{row.attempts}</td>
                <td>
                  <time dateTime={new Date(row.quarantined_at).toISOString()}>
                    {new Date(row.quarantined_at).toISOString()}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 id="outbox-heading">Recent outbox</h2>
      {outbox.length === 0 ? (
        <p role="status">No outbox events for this rooftop.</p>
      ) : (
        <table aria-labelledby="outbox-heading">
          <caption>Latest outbox events (inspect only on this page)</caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Event</th>
              <th scope="col">Published</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {outbox.map((row) => (
              <tr key={row.id}>
                <td>
                  <code>{row.id}</code>
                </td>
                <td>{row.event_type}</td>
                <td>{row.published_at ? "yes" : "pending"}</td>
                <td>
                  <time dateTime={new Date(row.created_at).toISOString()}>
                    {new Date(row.created_at).toISOString()}
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
