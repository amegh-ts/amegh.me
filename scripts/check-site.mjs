// Checks the built site in dist/ before it can merge: SEO tags, structured data,
// links, sitemap, redirects and duplicate content. Run after `npm run build`.
// Exits with code 1 on any error. No dependencies.
import fs from "node:fs";
import path from "node:path";
import { pages, SITE, person } from "../site/pages.js";

const DIST = path.resolve("dist");
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

const fileOf = (route) => path.join(DIST, route === "/" ? "index.html" : route.slice(1) + ".html");
const urlOf = (route) => (route === "/" ? `${SITE}/` : SITE + route);
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const metas = (html) => [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]);
const meta = (html, key) => {
  const tag = metas(html).find((t) => attr(t, "name") === key || attr(t, "property") === key);
  return tag ? attr(tag, "content") : undefined;
};
const text = (html) =>
  html
    .replace(/<(script|style|head)[^>]*>[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

const html = {};
const ids = {};
for (const route of Object.keys(pages)) {
  const f = fileOf(route);
  if (!fs.existsSync(f)) {
    err(route, `missing built file ${path.relative(DIST, f)}`);
    continue;
  }
  html[route] = fs.readFileSync(f, "utf8");
  ids[route] = new Set([...html[route].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

const titles = new Map();
const descriptions = new Map();

for (const [route, p] of Object.entries(pages)) {
  const h = html[route];
  if (!h) continue;

  // Layout markers must all be replaced.
  if (h.includes("<!-- @")) err(route, "layout marker left in output (<!-- @... -->)");

  // Title and description.
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = meta(h, "description");
  if (!title) err(route, "no <title>");
  else if (title.length > 60) err(route, `title is ${title.length} chars (max 60): ${title}`);
  if (!desc) err(route, "no meta description");
  else if (!p.noindex && (desc.length < 70 || desc.length > 160)) err(route, `description is ${desc.length} chars (want 70-160)`);
  if (!p.noindex) {
    if (titles.has(title)) err(route, `same title as ${titles.get(title)}`);
    if (descriptions.has(desc)) err(route, `same description as ${descriptions.get(desc)}`);
    titles.set(title, route);
    descriptions.set(desc, route);
  }

  // Indexing, canonical, social tags.
  const robots = meta(h, "robots");
  const canonical = (h.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
  if (p.noindex) {
    if (!/noindex/.test(robots || "")) err(route, "noindex page without robots noindex");
    if (canonical) err(route, "noindex page must not have a canonical");
  } else {
    if (robots !== "index, follow, max-image-preview:large") err(route, `robots is "${robots}"`);
    if (canonical !== urlOf(route)) err(route, `canonical is ${canonical}, expected ${urlOf(route)}`);
    if (meta(h, "og:url") !== urlOf(route)) err(route, `og:url is ${meta(h, "og:url")}, expected ${urlOf(route)}`);
  }
  for (const k of ["og:type", "og:title", "og:description", "og:image", "og:image:alt", "twitter:card", "twitter:title", "twitter:image"]) {
    if (!meta(h, k)) err(route, `missing ${k}`);
  }
  if (p.kind === "case") {
    for (const k of ["article:published_time", "article:modified_time", "article:author"]) if (!meta(h, k)) err(route, `missing ${k}`);
    if (meta(h, "article:modified_time") && !ISO.test(meta(h, "article:modified_time"))) err(route, "article:modified_time is not ISO 8601 with time zone");
  }

  // Performance rules from the README.
  if (!h.includes('rel="preload" href="/fonts/bricolage-grotesque-latin.woff2"')) err(route, "missing font preload");
  if (!h.includes('type="speculationrules"')) err(route, "missing Speculation Rules");
  if (/<link rel="stylesheet"/.test(h)) err(route, "stylesheet link found; CSS should be inlined");
  for (const m of h.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)) err(route, `third-party script ${m[1]}`);
  for (const m of h.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(https?:[^"]+)"/g)) err(route, `third-party stylesheet ${m[1]}`);

  // Headings and images.
  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(route, `${h1s} <h1> elements (want 1)`);
  for (const m of h.matchAll(/<img\s[^>]*>/g)) {
    if (!attr(m[0], "alt")) err(route, `image without alt: ${m[0].slice(0, 80)}`);
    if (!attr(m[0], "width") || !attr(m[0], "height")) err(route, `image without width/height: ${attr(m[0], "src")}`);
  }

  // Structured data.
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!p.noindex && !blocks.length) err(route, "no JSON-LD");
  for (const b of blocks) {
    let data;
    try {
      data = JSON.parse(b[1]);
    } catch (e) {
      err(route, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    const graph = data["@graph"] || [data];
    for (const node of graph) {
      for (const k of ["dateModified", "datePublished", "dateCreated"]) {
        if (node[k] && !ISO.test(node[k])) err(route, `${node["@type"]}.${k} "${node[k]}" is not ISO 8601 with time zone`);
      }
      if (node["@type"] === "Article") {
        for (const k of ["headline", "datePublished", "dateModified", "author", "image"]) if (!node[k]) err(route, `Article missing ${k}`);
        if (node.headline && node.headline.length > 110) err(route, "Article headline over 110 chars");
      }
      if (node["@type"] === "BreadcrumbList") {
        const last = node.itemListElement.at(-1);
        if (last.item !== urlOf(route)) err(route, `breadcrumb ends at ${last.item}, expected ${urlOf(route)}`);
      }
    }
    const people = graph.flatMap((n) => [n, n.mainEntity].filter(Boolean)).filter((n) => n["@type"] === "Person" && n.sameAs);
    for (const pp of people) {
      if (pp.name !== person.name) err(route, `Person name is ${pp.name}`);
      if (JSON.stringify(pp.sameAs) !== JSON.stringify(person.sameAs)) err(route, "Person sameAs differs from site/pages.js");
    }
  }

  // Internal links, anchors and assets.
  for (const m of h.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const [p2, frag] = href.split("#");
    const target = p2 === "" ? route : p2;
    if (p2.endsWith(".html") || (p2.length > 1 && p2.endsWith("/"))) err(route, `link to non-clean URL ${href}`);
    if (pages[target]) {
      if (frag && !ids[target]?.has(frag)) err(route, `link to missing anchor ${href}`);
    } else if (!fs.existsSync(path.join(DIST, p2))) err(route, `broken link ${href}`);
  }
  for (const m of h.matchAll(/\s(?:src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith("/") && !fs.existsSync(path.join(DIST, u))) err(route, `missing asset ${u}`);
    }
  }
}

// Every indexable page reachable from the home page.
const seen = new Set(["/"]);
const queue = ["/"];
while (queue.length) {
  const r = queue.shift();
  for (const m of (html[r] || "").matchAll(/\shref="(\/[^"#]*)/g)) {
    const t = m[1] || "/";
    if (pages[t] && !seen.has(t)) {
      seen.add(t);
      queue.push(t);
    }
  }
}
for (const [route, p] of Object.entries(pages)) if (!p.noindex && !seen.has(route)) err(route, "not reachable by links from the home page");

// Every case study links to every other case study, /work and /about.
const caseRoutes = Object.keys(pages).filter((r) => pages[r].kind === "case");
for (const r of caseRoutes) {
  const links = new Set([...(html[r] || "").matchAll(/\shref="(\/[^"#]*)/g)].map((m) => m[1]));
  for (const t of [...caseRoutes.filter((c) => c !== r), "/work", "/about"]) if (!links.has(t)) err(r, `does not link to ${t}`);
}

// Duplicate content: the same sentence (9+ words) on more than one indexable page.
const where = new Map();
for (const [route, p] of Object.entries(pages)) {
  if (p.noindex || !html[route]) continue;
  for (const line of new Set(text(html[route]))) {
    if (line.split(" ").length < 9) continue;
    if (!where.has(line)) where.set(line, []);
    where.get(line).push(route);
  }
}
for (const [line, routes] of where) if (routes.length > 1) err(routes.join(", "), `duplicate text: "${line.slice(0, 90)}"`);

// Thin pages.
for (const [route, p] of Object.entries(pages)) {
  if (p.noindex || !html[route]) continue;
  const words = text(html[route]).join(" ").split(" ").length;
  if (words < 250) warn(route, `only ${words} words`);
}

// sitemap.xml, robots.txt, llms.txt, _redirects, _headers.
const read = (f) => (fs.existsSync(path.join(DIST, f)) ? fs.readFileSync(path.join(DIST, f), "utf8") : null);
const sitemap = read("sitemap.xml");
if (!sitemap) err("sitemap.xml", "missing");
else {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const want = Object.entries(pages).filter(([, p]) => !p.noindex).map(([r]) => urlOf(r)).sort();
  if (JSON.stringify(locs) !== JSON.stringify(want)) err("sitemap.xml", `lists ${locs.join(" ")}; expected ${want.join(" ")}`);
}
const robotsTxt = read("robots.txt");
if (!robotsTxt) err("robots.txt", "missing");
else if (!robotsTxt.includes(`Sitemap: ${SITE}/sitemap.xml`)) err("robots.txt", "no Sitemap line");
if (!read("llms.txt")) err("llms.txt", "missing");
const redirects = read("_redirects") || "";
for (const route of Object.keys(pages)) {
  if (route === "/" || pages[route].noindex) continue;
  for (const from of [`${route}.html`, `${route}/`]) {
    if (!new RegExp(`^${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+${route}\\s+301`, "m").test(redirects)) err("_redirects", `no 301 from ${from} to ${route}`);
  }
}
if (!/\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(read("_headers") || "")) err("_headers", "no immutable cache rule for /assets/*");
for (const f of ["og-image.png", "favicon.ico", "favicon.svg", "apple-touch-icon.png", "site.webmanifest", "fonts/bricolage-grotesque-latin.woff2", "404.html"]) {
  if (!read(f) && !fs.existsSync(path.join(DIST, f))) err(f, "missing from dist");
}

for (const w of warnings) console.log(`::warning::${w}`);
if (errors.length) {
  for (const e of errors) console.log(`::error::${e}`);
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`Site check passed: ${Object.keys(pages).length} pages, ${warnings.length} warning(s)`);
