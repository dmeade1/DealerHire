export default function ReconciliationPage() {
  return (
    <article>
      <h1>Needs reconciliation</h1>
      <p>
        Ambiguous provider outcomes enter NeedsReconciliation. Never blind-retry creation. Use
        source read-back, then attach ActuationReceipt or supersede.
      </p>
      <p>No open reconciliation cases in synthetic skeleton.</p>
    </article>
  );
}
