import type { PublicJobView } from "@/modules/publication/public-read";
import { sanitizeJobBodyHtml } from "@/modules/publication/safe-html";

export function PublicJobArticle(props: { job: PublicJobView | null; slug: string }) {
  const { job, slug } = props;
  const applyHref = `/jobs/${slug}/apply`;

  if (!job) {
    return (
      <article>
        <h1>Job unavailable</h1>
        <p>
          No active PageRelease for this listing yet. Publish via the synthetic G1 path
          (audit → approve → redeem → activate) to populate this page.
        </p>
        <p style={{ fontSize: 14, color: "#444" }}>
          Platform: DealerHire (service provider/processor). SYNTHETIC skeleton only.
        </p>
      </article>
    );
  }

  const safeBody = sanitizeJobBodyHtml(job.bodyHtml);

  return (
    <article>
      <h1>{job.title}</h1>
      <p>
        <strong>Pay:</strong> {job.payDisclosure}
      </p>
      {safeBody ? <div dangerouslySetInnerHTML={{ __html: safeBody }} /> : null}
      <p>
        <a href={applyHref}>Apply now</a>
      </p>
      <p style={{ fontSize: 14, color: "#444" }}>
        Employer: North Atlantic Motors Group (synthetic design partner for engineering only).
        Platform: DealerHire (service provider/processor). Release{" "}
        <code>{job.contentAddress.slice(0, 12)}</code>
        {job.artifactKey ? (
          <>
            {" "}
            · artifact <code>{job.artifactKey}</code>
          </>
        ) : null}
      </p>
    </article>
  );
}
