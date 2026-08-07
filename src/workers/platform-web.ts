/**
 * Optional Workers entry for OpenNext/custom host routing. Next.js owns most web routes.
 * When PUBLIC_ARTIFACTS is Selected (uncomment wrangler.toml), wire the R2 artifact store.
 */

import { wireArtifactStoreFromEnv } from "@/modules/publication/artifact-store";

export interface Env {
  APP_NAME?: string;
  LOCALE?: string;
  CANDIDATE_AI_MODE?: string;
  AD_ACTUATION_ENABLED?: string;
  /** Selected PageRelease artifact bucket — binding stays commented until R2 Selected. */
  PUBLIC_ARTIFACTS?: R2Bucket;
}

const platformWeb = {
  async fetch(request: Request, env: Env): Promise<Response> {
    wireArtifactStoreFromEnv(env);

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "platform-web",
        artifactStore: env.PUBLIC_ARTIFACTS ? "r2_bucket" : "r2_memory",
      });
    }
    return new Response("DealerHire platform-web — use Next.js app routes", { status: 200 });
  },
};

export default platformWeb;
