import { listNeedsReconciliationCommands } from "@/modules/ops/reconciliation";
import { listOutbox } from "@/modules/ops/outbox";
import { requireActor } from "@/platform/auth/guard";
import { withTenantContext } from "@/platform/db/client";

export default async function ReconciliationPage() {
  const actor = await requireActor({
    kind: "ops",
    purpose: ["platform_control", "hiring_operations"],
    capability: "ops.inspect",
  });

  let openCommands: Awaited<ReturnType<typeof listNeedsReconciliationCommands>> = [];
  let recent: Awaited<ReturnType<typeof listOutbox>> = [];
  let loadError: string | null = null;
  try {
    const dbActor = { ...actor, purpose: "hiring_operations" as const };
    [openCommands, recent] = await withTenantContext(dbActor, async (sql) => {
      const commands = await listNeedsReconciliationCommands(sql, { limit: 50 });
      const outbox = await listOutbox(sql, { limit: 10 });
      return [commands, outbox] as const;
    });
  } catch {
    loadError = "Could not load reconciliation board for this rooftop.";
    openCommands = [];
    recent = [];
  }

  const reconEvents = recent.filter((r) => r.event_type === "command.needs_reconciliation");

  return (
    <article>
      <h1 id="recon-heading">Needs reconciliation</h1>
      <p>
        Ambiguous provider outcomes enter NeedsReconciliation. Never blind-retry creation. Use
        provider read-back, then <code>resolveNeedsReconciliation</code> (receipted or superseded).
        Safe outbox replay: <code>pnpm ops outbox:replay --id …</code> (signed actor required;
        refuses create re-dispatch while reconciling).
      </p>

      <div aria-live="polite" aria-atomic="true">
        {loadError ? <p role="status">{loadError}</p> : null}
      </div>

      <h2 id="open-commands-heading">Open commands</h2>
      {openCommands.length === 0 ? (
        <p role="status">
          No commands in <code>needs_reconciliation</code> for this rooftop.
        </p>
      ) : (
        <table aria-labelledby="open-commands-heading">
          <caption>Commands awaiting provider read-back (do not recreate)</caption>
          <thead>
            <tr>
              <th scope="col">Command</th>
              <th scope="col">Lever</th>
              <th scope="col">JCV</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {openCommands.map((cmd) => (
              <tr key={cmd.id}>
                <td>
                  <code>{cmd.id}</code>
                </td>
                <td>{cmd.lever}</td>
                <td>
                  <code>{cmd.job_control_version_id}</code>
                </td>
                <td>
                  <time dateTime={new Date(cmd.created_at).toISOString()}>
                    {new Date(cmd.created_at).toISOString()}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 id="outbox-signals-heading">Recent outbox signals</h2>
      {reconEvents.length === 0 ? (
        <p role="status">
          No <code>command.needs_reconciliation</code> events in the latest inspect window.
        </p>
      ) : (
        <ul aria-labelledby="outbox-signals-heading">
          {reconEvents.map((row) => (
            <li key={row.id}>
              <code>{row.id}</code> — command <code>{row.aggregate_id}</code>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}