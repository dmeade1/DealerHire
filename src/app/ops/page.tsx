export default function OpsPage() {
  return (
    <article>
      <h1>Operations &amp; recovery</h1>
      <p>
        Audited recovery surface. Direct database edits are forbidden. Business-hours support with
        emergency kill switches that persist to Postgres and return readback state.
      </p>
      <ul>
        <li>
          <a href="/ops/liveness">Source liveness</a>
        </li>
        <li>
          <a href="/ops/reconciliation">Needs reconciliation</a>
        </li>
      </ul>

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
          <button type="submit">Arm kill switch (durable)</button>
        </form>
        <p>
          Readback requires header <code>X-Ops-Control-Secret</code> (or Bearer) matching{" "}
          <code>OPS_CONTROL_SECRET</code>.
        </p>
      </section>

      <p>
        CLI: <code>pnpm ops kill-switch --scope intake --reason &quot;…&quot;</code>
      </p>
    </article>
  );
}
