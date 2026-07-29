import { requireActor } from "@/platform/auth/guard";
import { listApplicantEnvelopes } from "@/modules/hiring/applicants";

export default async function ApplicantsPage() {
  const actor = await requireActor({
    kind: "dealer",
    purpose: "hiring_operations",
    capability: "application.review",
  });

  let rows: Awaited<ReturnType<typeof listApplicantEnvelopes>> = [];
  let loadError: string | null = null;
  try {
    rows = await listApplicantEnvelopes(actor);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "inventory_unavailable";
  }

  return (
    <article>
      <h1>Applicants</h1>
      <p>
        Neutral order. No composite fit score. Candidate AI classifications are shadow-only and not
        shown here. Adverse facts require primary-evidence verification.
      </p>
      <p>
        Tenant <code>{actor.tenantId}</code> · rooftop <code>{actor.rooftopId}</code> · purpose{" "}
        <code>{actor.purpose}</code>
      </p>
      {loadError ? <p role="alert">Inventory unavailable: {loadError}</p> : null}
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4}>
                No acceptance envelopes to list. Inventory is loaded only from durable
                ApplicationAcceptanceEnvelope rows under your tenant context (INV-11).
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.publicApplicationId}>
                <td>{row.publicApplicationId}</td>
                <td>{row.acceptedAt}</td>
                <td>{row.resumeState}</td>
                <td>accepted</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p>
        Demo detail shell (static): <a href="/dealer/applicants/demo">/dealer/applicants/demo</a>
      </p>
    </article>
  );
}
