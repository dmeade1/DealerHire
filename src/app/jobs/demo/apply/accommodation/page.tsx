export default function AccommodationPage() {
  return (
    <article>
      <h1>Accommodation and non-AI alternative</h1>
      <p>
        You may request a reasonable accommodation or an equivalent manual review path. Using this
        path must not disadvantage your application timing or outcome.
      </p>
      <form style={{ display: "grid", gap: 12 }}>
        <label>
          How can we help?
          <textarea name="request" required rows={6} />
        </label>
        <label>
          Preferred contact
          <input name="contact" required />
        </label>
        <button type="submit">Submit request</button>
      </form>
    </article>
  );
}
