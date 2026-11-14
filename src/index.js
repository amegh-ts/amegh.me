// Runs before every static asset so each page has exactly one public address:
// https://amegh.me/<path>. Any http:// or www. request gets a permanent (301)
// redirect, which stops Google from indexing duplicates such as
// http://amegh.me/ ("Alternative page with proper canonical tag").
const CANONICAL_HOST = "amegh.me";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // Leave local dev (localhost, 127.0.0.1) and workers.dev previews alone.
    const isSiteHost = host === CANONICAL_HOST || host.endsWith("." + CANONICAL_HOST);

    if (isSiteHost) {
      // Cloudflare sets cf-visitor to the scheme the visitor used; fall back to the URL.
      const visitor = request.headers.get("cf-visitor");
      const isHttp = visitor ? visitor.includes('"scheme":"http"') : url.protocol === "http:";

      if (isHttp || host !== CANONICAL_HOST) {
        url.protocol = "https:";
        url.hostname = CANONICAL_HOST;
        url.port = "";
        return Response.redirect(url.toString(), 301);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
