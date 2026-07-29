export default function UnauthorizedPage() {
  return (
    <article>
      <h1>401 Unauthorized</h1>
      <p>
        Provide signed headers <code>x-dh-actor</code> and <code>x-dh-actor-sig</code>, or for local
        G1 only set <code>ALLOW_UNSIGNED_SYNTHETIC_ACTOR=true</code> (never in production).
      </p>
    </article>
  );
}
