import { requireActor } from "@/platform/auth/guard";

export default async function CampaignsPage() {
  await requireActor({
    kind: "dealer",
    purpose: "hiring_operations",
    // Import path is concierge; dealers with listing.write may view the shell.
    capability: ["campaign.import", "listing.write"],
  });
  return (
    <article>
      <h1>Campaigns</h1>
      <p>
        Beta: dealer/operator launches campaigns in Meta/Google. Platform imports signed/manual CSV
        spend and delivery read-backs. Live API actuation is disabled.
      </p>
      <form style={{ display: "grid", gap: 12 }}>
        <label>
          CSV import
          <input type="file" name="csv" accept=".csv" required />
        </label>
        <label>
          Provider
          <select name="provider" required>
            <option value="meta">Meta</option>
            <option value="google">Google</option>
          </select>
        </label>
        <button type="submit">Import &amp; reconcile</button>
      </form>
      <h2>Recent imports</h2>
      <p>No imports yet.</p>
    </article>
  );
}
