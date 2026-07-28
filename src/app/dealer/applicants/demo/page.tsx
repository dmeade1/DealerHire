export default function ApplicantReviewPage() {
  return (
    <article>
      <h1>Evidence matrix — app_demo_001</h1>
      <p role="note">
        Manual/primary-evidence path is authoritative. Shadow AI outputs are not displayed.
      </p>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Evidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Diagnose vehicle faults</td>
            <td>Applicant work history paragraph 2</td>
            <td>unknown until reviewer verifies</td>
          </tr>
          <tr>
            <td>ASE certification</td>
            <td>Not provided</td>
            <td>unknown (absence ≠ gap label for AI)</td>
          </tr>
        </tbody>
      </table>

      <form style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <label>
          <input type="checkbox" name="primaryEvidenceReviewed" required /> I reviewed the primary
          application/resume evidence
        </label>
        <label>
          Independent rationale
          <textarea name="rationale" required rows={4} />
        </label>
        <label>
          Disposition
          <select name="disposition" required>
            <option value="advance">Advance</option>
            <option value="hold">Hold</option>
            <option value="decline">Decline</option>
          </select>
        </label>
        <button type="submit">Record decision</button>
      </form>
    </article>
  );
}
