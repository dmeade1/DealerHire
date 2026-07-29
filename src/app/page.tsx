import Link from "next/link";

export default function HomePage() {
  return (
    <article>
      <h1>DealerHire</h1>
      <p>
        Automotive labor intelligence platform. Beta target: one New York rooftop, English,
        managed subdomain, human candidate review, manual campaign operations, tenant-local
        operational and descriptive analytics.
      </p>
      <ul>
        <li>Candidate AI: shadow-only (invisible to decision-makers)</li>
        <li>Ad API actuation: disabled until separate release gate</li>
        <li>SMS: disabled until communication gate</li>
        <li>All dealership role families must be accepted before live beta</li>
      </ul>
      <p>
        <Link href="/jobs/demo">View demo job posting</Link>
      </p>
    </article>
  );
}
