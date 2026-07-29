import { PublicJobArticle } from "@/modules/publication/job-page";
import { loadPublicJobBySlug } from "@/modules/publication/public-read";

/** Canonical synthetic partner listing — reads active PageRelease for slug `demo`. */
export default async function DemoJobPage() {
  const job = await loadPublicJobBySlug("demo");
  return <PublicJobArticle job={job} slug="demo" />;
}
