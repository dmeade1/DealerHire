/** Optional Workers entry for OpenNext/custom host routing. Next.js owns most web routes. */

const platformWeb = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "platform-web" });
    }
    return new Response("DealerHire platform-web — use Next.js app routes", { status: 200 });
  },
};

export default platformWeb;
