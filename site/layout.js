// Shared page chrome for every page: <head> (meta, Open Graph, Twitter, icons,
// JSON-LD), main nav, breadcrumbs and footer. Pages place markers where these go:
//   <!-- @head -->  <!-- @nav -->  <!-- @crumbs -->  <!-- @footer -->
import { SITE, person, pages } from "./pages.js";

const OG_IMAGE = `${SITE}/og-image.png`;
const OG_ALT = "Amegh T S, Full-Stack Developer: I build products end-to-end, from database to interface.";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const url = (route) => (route === "/" ? `${SITE}/` : SITE + route);
const authorRef = { "@type": "Person", "@id": person["@id"], name: person.name, url: person.url };

function breadcrumbLd(crumbs, route) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: href ? url(href) : url(route),
    })),
  };
}

function jsonLd(route, p) {
  const graph = [];
  if (p.kind === "home") {
    graph.push(
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: `${SITE}/`,
        name: "Amegh",
        alternateName: person.alternateName,
        inLanguage: "en",
        publisher: { "@id": person["@id"] },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE}/#webpage`,
        url: `${SITE}/`,
        name: p.title,
        dateModified: p.modified,
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": person["@id"] },
        primaryImageOfPage: person.image,
      },
      person
    );
  } else if (p.kind === "about") {
    graph.push(
      {
        "@type": "ProfilePage",
        "@id": `${url(route)}#profilepage`,
        url: url(route),
        name: p.title,
        dateCreated: p.created,
        dateModified: p.modified,
        isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: person,
      },
      breadcrumbLd(p.crumbs, route)
    );
  } else if (p.kind === "work") {
    const cases = Object.entries(pages).filter(([, c]) => c.kind === "case");
    graph.push(
      {
        "@type": "CollectionPage",
        "@id": `${url(route)}#page`,
        url: url(route),
        name: p.title,
        dateModified: p.modified,
        isPartOf: { "@id": `${SITE}/#website` },
        author: authorRef,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: cases.map(([r, c], i) => ({ "@type": "ListItem", position: i + 1, url: url(r), name: c.name })),
        },
      },
      breadcrumbLd(p.crumbs, route)
    );
  } else if (p.kind === "case") {
    graph.push(
      {
        "@type": "Article",
        "@id": `${url(route)}#article`,
        headline: p.title,
        description: p.description,
        url: url(route),
        mainEntityOfPage: url(route),
        datePublished: p.created,
        dateModified: p.modified,
        image: OG_IMAGE,
        author: authorRef,
        publisher: authorRef,
        isPartOf: { "@id": `${SITE}/#website` },
      },
      breadcrumbLd(p.crumbs, route)
    );
  }
  if (!graph.length) return "";
  const data = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
  return `<script type="application/ld+json">\n${data}\n</script>`;
}

function head(route, p) {
  const ogType = p.kind === "home" || p.kind === "about" ? "profile" : p.kind === "case" ? "article" : "website";
  const ogTitle = p.ogTitle || p.title;
  const ogDesc = p.ogDescription || p.description;
  const lines = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    `<meta name="author" content="Amegh T S">`,
    `<meta name="robots" content="${p.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">`,
    p.noindex ? "" : `<link rel="canonical" href="${url(route)}">`,
    ``,
    `<meta property="og:type" content="${ogType}">`,
    p.kind === "case" ? `<meta property="article:published_time" content="${p.created}">` : "",
    p.kind === "case" ? `<meta property="article:modified_time" content="${p.modified}">` : "",
    p.kind === "case" ? `<meta property="article:author" content="${SITE}/about">` : "",
    `<meta property="og:site_name" content="Amegh">`,
    `<meta property="og:locale" content="en_IN">`,
    p.noindex ? "" : `<meta property="og:url" content="${url(route)}">`,
    `<meta property="og:title" content="${esc(ogTitle)}">`,
    `<meta property="og:description" content="${esc(ogDesc)}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(OG_ALT)}">`,
    p.kind === "home" ? `<meta property="profile:first_name" content="Amegh">\n<meta property="profile:last_name" content="T S">` : "",
    ``,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(p.twitterDescription || ogDesc)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    `<meta name="twitter:image:alt" content="${esc(OG_ALT)}">`,
    ``,
    `<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">`,
    `<link rel="icon" href="/favicon.ico" sizes="any">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
    ``,
    jsonLd(route, p),
    `<link rel="preload" href="/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="/styles/site.css">`,
    `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/*.*"}}]},"eagerness":"moderate"}]}</script>`,
  ];
  return lines.filter((l) => l !== "").join("\n");
}

function nav(route) {
  const home = route === "/";
  const items = [
    ["About", "/about"],
    ["Work", home ? "#work" : "/work"],
    ["Experience", home ? "#experience" : "/about#experience"],
    ["Contact", "#contact"],
  ];
  const links = items
    .map(([label, href]) => `<a href="${href}"${href === route ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  return `<div class="nav">\n    <a href="/">Amegh</a>\n    <nav aria-label="Main">${links}</nav>\n  </div>`;
}

function crumbs(p) {
  if (!p.crumbs) return "";
  const items = p.crumbs
    .map(([name, href]) => (href ? `<li><a href="${href}">${name}</a></li>` : `<li aria-current="page">${name}</li>`))
    .join("");
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

function footer(route) {
  const link = route === "/" ? `<a href="/about">About Amegh</a>` : `<a href="/">amegh.me</a>`;
  return `<footer><span>Amegh T S, Kozhikode, Kerala</span>${link}</footer>\n<script type="module" src="/scripts/hover.js"></script>`;
}

export function render(html, route, p) {
  return html
    .replace("<!-- @head -->", head(route, p))
    .replace("<!-- @nav -->", nav(route))
    .replace("<!-- @crumbs -->", crumbs(p))
    .replace("<!-- @footer -->", footer(route));
}
