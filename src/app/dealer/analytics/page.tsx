export default function AnalyticsPage() {
  return (
    <article>
      <h1>Analytics</h1>
      <p>
        Tenant-local · role-scoped · operational/descriptive only. Business views show reconciled
        freshness. No cross-tenant first-party benchmarks. No causal language.
      </p>
      <section>
        <h2>Listing</h2>
        <p>Freshness: daily reconciled</p>
      </section>
      <section>
        <h2>Campaign</h2>
        <p>Spend associated with / allocated to jobs — not “lift” or “caused”.</p>
      </section>
      <section>
        <h2>Funnel</h2>
        <p>Application → review → start. Clock: JobControl approval → confirmed start.</p>
      </section>
      <section>
        <h2>Recruiter</h2>
        <p>Workload and response timing.</p>
      </section>
      <section>
        <h2>Compliance</h2>
        <p>Notices, permissions, decision audit evidence.</p>
      </section>
      <section>
        <h2>Quality</h2>
        <p>Qualified hire = rubric confirmed + start.</p>
      </section>
      <section>
        <h2>Platform ops</h2>
        <p>Freshness: near-real-time health · intake, queues, reconciliation.</p>
      </section>
    </article>
  );
}
