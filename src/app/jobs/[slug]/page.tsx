import { notFound } from "next/navigation";
import { PublicJobArticle } from "@/modules/publication/job-page";
import { loadPublicJobBySlug } from "@/modules/publication/public-read";
import { resolvePublicJobSlug } from "@/modules/publication/slugs";

type Props = { params: Promise<{ slug: string }> };

/**
 * Public job page driven by active PageRelease (G1-04).
 * Static `demo` route coexists for apply nesting; other slugs resolve here.
 */
export default async function PublicJobPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "demo") notFound(); // served by /jobs/demo
  if (!resolvePublicJobSlug(slug)) notFound();

  const job = await loadPublicJobBySlug(slug);
  return <PublicJobArticle job={job} slug={slug} />;
}
