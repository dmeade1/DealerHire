export default function NewListingPage() {
  return (
    <article>
      <h1>New listing</h1>
      <form style={{ display: "grid", gap: 12 }}>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Department
          <select name="department" required>
            <option value="fixed_operations">Fixed operations</option>
            <option value="service">Service</option>
            <option value="parts">Parts</option>
            <option value="sales">Sales</option>
            <option value="fi">F&amp;I</option>
            <option value="administration">Administration</option>
            <option value="leadership">Leadership</option>
          </select>
        </label>
        <label>
          Job family
          <input name="jobFamily" required />
        </label>
        <label>
          Description
          <textarea name="description" required rows={6} />
        </label>
        <fieldset>
          <legend>Approved pay range (required)</legend>
          <label>
            Minimum
            <input name="payMin" type="number" min={1} step="0.01" required />
          </label>
          <label>
            Maximum
            <input name="payMax" type="number" min={1} step="0.01" required />
          </label>
          <label>
            Unit
            <select name="payUnit" required>
              <option value="hour">Hour</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="flat_rate">Flat rate</option>
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Requirement (must include essential function + proxy review)</legend>
          <label>
            Label
            <input name="reqLabel" required />
          </label>
          <label>
            Essential function
            <input name="essentialFunction" required />
          </label>
          <label>
            Business necessity
            <textarea name="businessNecessity" required />
          </label>
          <label>
            <input type="checkbox" name="proxyReviewed" required /> Protected-proxy review completed
          </label>
        </fieldset>
        <p>
          Location type is fixed to <strong>onsite</strong> for beta (remote excluded).
        </p>
        <button type="submit">Save draft &amp; run audit</button>
      </form>
    </article>
  );
}
