// Vite multi-page build for amegh.me.
//
// site/*.html and site/work/*.html are the pages. Each page keeps only its own
// content; the shared head (meta, Open Graph, JSON-LD), nav, breadcrumbs and
// footer come from site/layout.js, driven by the page data in site/pages.js.
// Static files (fonts, images, _headers, _redirects, robots.txt, llms.txt)
// live in site/public and are copied as they are. sitemap.xml is generated.
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages, SITE } from "./site/pages.js";
import { render } from "./site/layout.js";

const root = fileURLToPath(new URL("./site", import.meta.url));

// "/work/oppam.html" -> "/work/oppam", "/index.html" -> "/"
const routeOf = (file) => {
  const rel = "/" + path.relative(root, file).split(path.sep).join("/");
  return rel === "/index.html" ? "/" : rel.replace(/\.html$/, "");
};

const htmlInputs = Object.fromEntries(
  Object.keys(pages).map((route) => {
    const rel = route === "/" ? "index.html" : route.slice(1) + ".html";
    return [rel.replace(/\.html$/, "").replace(/\//g, "-"), path.join(root, rel)];
  })
);

// Fills the <!-- @head -->, <!-- @nav -->, <!-- @crumbs --> and <!-- @footer --> markers.
function layout() {
  return {
    name: "amegh-layout",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const route = routeOf(ctx.filename);
        const page = pages[route];
        if (!page) throw new Error(`No entry in site/pages.js for ${route}`);
        return render(html, route, page);
      },
    },
  };
}

// Serves clean URLs (/about, /work/oppam) in dev and preview, like Cloudflare does.
function cleanUrls() {
  const rewrite = (req, _res, next) => {
    const [p, q = ""] = req.url.split("?");
    if (p !== "/" && !path.extname(p)) {
      const clean = p.replace(/\/$/, "");
      if (fs.existsSync(path.join(root, clean + ".html"))) req.url = clean + ".html" + (q ? "?" + q : "");
    }
    next();
  };
  return {
    name: "amegh-clean-urls",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

// Inlines the (small) stylesheet into every page so there is no render-blocking
// CSS request, and writes sitemap.xml from site/pages.js.
function finish() {
  return {
    name: "amegh-finish",
    enforce: "post",
    apply: "build",
    generateBundle(_opts, bundle) {
      const css = Object.values(bundle).filter((f) => f.type === "asset" && f.fileName.endsWith(".css"));
      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".html")) continue;
        let html = String(file.source);
        for (const c of css) {
          const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${c.fileName.replace(/\./g, "\\.")}"[^>]*>`);
          html = html.replace(tag, `<style>${String(c.source).trim()}</style>`);
        }
        file.source = html;
      }
      for (const c of css) delete bundle[c.fileName];

      const urls = Object.entries(pages)
        .filter(([, p]) => !p.noindex)
        .map(([route, p]) => `  <url>\n    <loc>${SITE}${route === "/" ? "/" : route}</loc>\n    <lastmod>${p.modified.slice(0, 10)}</lastmod>\n  </url>`)
        .join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  root,
  publicDir: "public",
  appType: "mpa",
  plugins: [layout(), cleanUrls(), finish()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: htmlInputs },
  },
  server: { port: 8765, host: true },
  preview: { port: 8765, host: true },
});
