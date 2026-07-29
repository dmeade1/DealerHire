export default function ApplicantsPage() {
  return (
    <article>
      <h1>Applicants</h1>
      <p>
        Neutral order. No composite fit score. Candidate AI classifications are shadow-only and not
        shown here. Adverse facts require primary-evidence verification.
      </p>
      <table>
        <thead>
          <tr>
            <th>Application</th>
            <th>Received</th>
            <th>Resume</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4}>
              No acceptance envelopes to list yet. Inventory is loaded only from durable
              ApplicationAcceptanceEnvelope rows (INV-11) — demo placeholders are not shown.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Demo detail shell (static): <a href="/dealer/applicants/demo">/dealer/applicants/demo</a>
      </p>
    </article>
  );
}
