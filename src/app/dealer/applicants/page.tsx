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
            <td>
              <a href="/dealer/applicants/demo">app_demo_001</a>
            </td>
            <td>2026-07-28</td>
            <td>pending_upload</td>
            <td>received</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
