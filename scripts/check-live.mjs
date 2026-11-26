// Checks the live site after a deploy: waits until amegh.me serves the pages
// in dist/ (built from the same commit), then checks status codes, redirects,
// headers, sitemap and structured data. Usage:
//   node scripts/check-live.mjs [base-url]      (default https://amegh.me)
// Env: LIVE_WAIT_SECONDS (default 600) – how long to wait for the deploy.
import fs from "node:fs";
import path from "node:path";
import { pages } from "../site/pages.js";

const BASE = (process.argv[2] || "https://amegh.me").replace(/\/$/, "");
const HOST = new URL(BASE).host;
const WAIT = Number(process.env.LIVE_WAIT_SECONDS || 600);
const DIST = path.resolve("dist");
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fileOf = (route) => path.join(DIST, route === "/" ? "index.html" : route.slice(1) + ".html");

// Cloudflare can inject scripts (bot detection, email obfuscation) before </body>.
const CF_SCRIPT = /<script>\(function\(\)\{function c\(\)\{[\s\S]*?challenge-platform[\s\S]*?<\/script>/g;
const normalise = (h) => h.replace(CF_SCRIPT, "").replace(/\s+$/, "");

const get = (url, opts = {}) => fetch(url, { redirect: "manual", headers: { "user-agent": "amegh.me-deploy-check" }, ...opts });

// 1. Wait for the new build to be live. Compare every page, not just the
// home page: a release may change only some pages.
const routes = Object.keys(pages).filter((r) => !pages[r].noindex);
const want = Object.fromEntries(routes.map((r) => [r, normalise(fs.readFileSync(fileOf(r), "utf8"))]));
const stale = async () => {
  const out = [];
  for (const r of routes) {
    const res = await get(BASE + r).catch(() => null);
    const body = res ? await res.text() : "";
    if (res?.status !== 200 || normalise(body) !== want[r]) out.push(r);
  }
  return out;
};
const start = Date.now();
for (;;) {
  const left = await stale();
  if (!left.length) break;
  if ((Date.now() - start) / 1000 > WAIT) {
    console.log(`::error::still not live after ${WAIT}s: ${left.join(", ")}`);
    process.exit(1);
  }
  await sleep(15000);
}
console.log(`Live after ${Math.round((Date.now() - start) / 1000)}s`);

// 2. Every page: 200, HTML, same as the build.
let injected = false;
for (const [route, p] of Object.entries(pages)) {
  if (p.noindex) continue;
  const res = await get(BASE + route);
  const body = await res.text();
  if (res.status !== 200) err(`${route}: status ${res.status}`);
  if (!(res.headers.get("content-type") || "").includes("text/html")) err(`${route}: content-type ${res.headers.get("content-type")}`);
  if (normalise(body) !== normalise(fs.readFileSync(fileOf(route), "utf8"))) err(`${route}: live HTML differs from the build`);
  if (CF_SCRIPT.test(body)) injected = true;
  CF_SCRIPT.lastIndex = 0;
  if (!res.headers.get("strict-transport-security")) err(`${route}: no Strict-Transport-Security header`);
}
if (injected) warn("Cloudflare injects its JavaScript detections script (/cdn-cgi/challenge-platform) into pages. Turn it off: Security > Bots > JavaScript detections (#46).");

// 3. Not-found pages return a real 404.
const nf = await get(`${BASE}/this-page-does-not-exist`);
if (nf.status !== 404) err(`unknown path returns ${nf.status}, expected 404`);
const nfBody = await nf.text();
if (!nfBody.includes('content="noindex, follow"')) err("404 page is missing robots noindex");

// 4. One address per page: 301s to the clean https URL.
const expect301 = async (from, to) => {
  const res = await get(from);
  const loc = res.headers.get("location");
  if (res.status !== 301 || loc !== to) err(`${from} -> ${res.status} ${loc || ""}, expected 301 ${to}`);
};
if (BASE === "https://amegh.me") {
  await expect301("http://amegh.me/about", "https://amegh.me/about");
  await expect301("https://www.amegh.me/work", "https://amegh.me/work");
}
for (const route of Object.keys(pages)) {
  if (route === "/" || pages[route].noindex) continue;
  for (const from of [`${route}.html`, `${route}/`]) {
    const res = await get(BASE + from);
    const loc = res.headers.get("location") || "";
    if (res.status !== 301 || !(loc === route || loc === BASE + route)) err(`${from} -> ${res.status} ${loc}, expected 301 ${route}`);
  }
}

// 5. Supporting files and headers.
const sm = await get(`${BASE}/sitemap.xml`);
if (sm.status !== 200 || !(sm.headers.get("content-type") || "").includes("xml")) err(`sitemap.xml: ${sm.status} ${sm.headers.get("content-type")}`);
else if ((await sm.text()) !== fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8")) err("sitemap.xml differs from the build");
const rb = await get(`${BASE}/robots.txt`);
if (rb.status !== 200 || !(await rb.text()).includes("Sitemap:")) err("robots.txt missing or has no Sitemap line");
const llms = await get(`${BASE}/llms.txt`);
if (llms.status !== 200 || !/noindex/.test(llms.headers.get("x-robots-tag") || "")) err("llms.txt missing or not noindex");
const asset = (fs.readFileSync(fileOf("/"), "utf8").match(/src="(\/assets\/[^"]+)"/) || [])[1];
if (asset) {
  const a = await get(BASE + asset);
  if (a.status !== 200 || !(a.headers.get("cache-control") || "").includes("immutable")) err(`${asset}: ${a.status}, cache-control ${a.headers.get("cache-control")}`);
}
const font = await get(`${BASE}/fonts/bricolage-grotesque-latin.woff2`);
if (font.status !== 200) err(`font: ${font.status}`);

for (const w of warnings) console.log(`::warning::${w}`);
if (errors.length) {
  for (const e of errors) console.log(`::error::${e}`);
  console.log(`\n${HOST}: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`${HOST}: live check passed, ${warnings.length} warning(s)`);
