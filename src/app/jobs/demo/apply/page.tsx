export default function ApplyPage() {
  return (
    <article>
      <h1>Apply — ASE Automotive Technician</h1>
      <p>Accountless application. You will receive a durable receipt after submit.</p>

      <form action="/api/applications" method="post" style={{ display: "grid", gap: 16 }}>
        <input type="hidden" name="jobControlVersionId" value="synthetic-jcv-1" />
        <input type="hidden" name="idempotencyKey" value="" id="idempotencyKey" />

        <fieldset>
          <legend>Contact</legend>
          <label>
            Full name
            <input name="fullName" required autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Work history (manual entry always available)</legend>
          <label>
            Summary
            <textarea name="workHistory" required rows={5} />
          </label>
          <label>
            Resume (optional if storage/scanning unavailable)
            <input name="resume" type="file" accept=".pdf,.doc,.docx" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Notices (separate — not a blanket release)</legend>
          <label>
            <input type="checkbox" name="notice_application_terms" required /> I have read the
            application terms (copy id: notice.app_terms.en.v1)
          </label>
          <label>
            <input type="checkbox" name="notice_privacy" required /> I have read the privacy notice
            at collection (copy id: notice.privacy.en.v1)
          </label>
          <label>
            <input type="checkbox" name="perm_email_transactional" defaultChecked /> Send me
            transactional email about this application
          </label>
          <label>
            <input type="checkbox" name="perm_recruiting_optional" /> Optional: contact me about
            other roles (not required to apply)
          </label>
        </fieldset>

        <p>
          Need an accommodation or non-AI alternative?{" "}
          <a href="/jobs/demo/apply/accommodation">Request accommodation</a>
        </p>

        <button type="submit">Submit application</button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('idempotencyKey').value =
              (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
          `,
        }}
      />
    </article>
  );
}
