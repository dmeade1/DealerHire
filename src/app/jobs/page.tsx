import Link from "next/link";

/**
 * Public jobs index skeleton (SCR-PUB-01). Slugs are hard-mapped for G1.
 */
export default function JobsIndexPage() {
  return (
    <article>
      <h1>Open roles</h1>
      <p>SYNTHETIC public listings for the DealerHire walking skeleton.</p>
      <ul>
        <li>
          <Link href="/jobs/demo">ASE Automotive Technician (demo)</Link>
        </li>
      </ul>
    </article>
  );
}
