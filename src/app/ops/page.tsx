export default function OpsPage() {
  return (
    <article>
      <h1>Operations &amp; recovery</h1>
      <p>
        Audited recovery surface. Direct database edits are forbidden. Business-hours support with
        emergency kill switches.
      </p>
      <ul>
        <li>
          <a href="/ops/liveness">Source liveness</a>
        </li>
        <li>
          <a href="/ops/reconciliation">Needs reconciliation</a>
        </li>
        <li>
          <form action="/api/ops/kill-switch" method="post">
            <button type="submit">Emergency pause (execution)</button>
          </form>
        </li>
      </ul>
      <p>
        CLI: <code>pnpm ops --help</code>
      </p>
    </article>
  );
}
