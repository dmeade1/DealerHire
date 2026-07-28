import { ROLE_CATALOG, betaBlockedReason } from "@/modules/roles/catalog";

export default function DealerListingsPage() {
  const block = betaBlockedReason();
  return (
    <article>
      <h1>Listings</h1>
      {block ? (
        <p role="status" style={{ border: "1px solid #a60", padding: 12 }}>
          {block}
        </p>
      ) : (
        <p role="status">All role families accepted — publication enabled.</p>
      )}

      <h2>Role validation progress</h2>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Job family</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ROLE_CATALOG.map((r) => (
            <tr key={`${r.department}-${r.jobFamily}`}>
              <td>{r.department}</td>
              <td>{r.jobFamily}</td>
              <td>{r.validationStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Create listing</h2>
      <p>
        Guided authoring requires approved min/max pay range, requirement versions with proxy
        review, and dealer HR owner approval before publication.
      </p>
      <a href="/dealer/listings/new">New listing</a>
    </article>
  );
}
