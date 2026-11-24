# amegh.me

Personal portfolio of Amegh T S, full-stack developer. Static HTML and CSS, built with [Vite](https://vite.dev) and served by Cloudflare Workers.

## Structure

- `site/` – source of the site (Vite root)
  - `index.html`, `about.html`, `work.html`, `work/*.html`, `404.html` – one file per page, holding only that page's content
  - `pages.js` – page data: title, description, breadcrumbs, dates, and the Person details (name, sameAs) used in JSON-LD. Edit here, not in each page.
  - `layout.js` – builds the shared `<head>` (meta, Open Graph, Twitter, icons, JSON-LD), nav, breadcrumbs and footer. Pages mark where they go with `<!-- @head -->`, `<!-- @nav -->`, `<!-- @crumbs -->` and `<!-- @footer -->`.
  - `styles/site.css` – all styles; inlined into every page at build time (no CSS request)
  - `scripts/hover.js` – heading weight effect; bundled to `/assets/hover-<hash>.js`
  - `public/` – copied as-is: fonts, images, icons, `_headers`, `_redirects`, `robots.txt`, `llms.txt`, `site.webmanifest`, `og-image.png`
- `vite.config.js` – multi-page build, clean URLs in dev, CSS inlining and `sitemap.xml` generation
- `dist/` – build output (ignored by git), deployed by Cloudflare
- `src/index.js` – Worker that runs before the static files and 301s every `http://` or `www.` request to `https://amegh.me/...`
- `banner/` – LinkedIn banner sources (HTML) and renders (PNG)
- `backup/coming-soon.html` – the previous amegh.me "Coming soon" page

## Run locally

```bash
npm install
npm run dev
```

Opens http://localhost:8765/ with live reload. Clean URLs (`/about`, `/work/oppam`) work as in production. `npm run build` writes `dist/`; `npm run preview` serves the built site on the same port.

## Deploy (Cloudflare Workers Builds)

`wrangler.jsonc` runs `npm run build` before every deploy and branch preview (`build.command`) and serves `dist/`. Merging to `main` deploys amegh.me.

## Adding or changing a page

1. Add or edit the HTML file in `site/` (copy an existing page for the markers).
2. Add or update its entry in `site/pages.js`, and bump `modified` when the content changes. The sitemap, `dateModified` and `article:modified_time` follow.
3. Update `site/public/llms.txt` if pages, role or stack change.

## SEO rules for new pages

- Canonical tag: absolute `https://amegh.me/<path>`, no trailing slash, no `.html`, no query string. It must match the sitemap `<loc>` and `og:url`.
- Link internally with clean paths (`/about`, `/work/oppam`), never `.html`.
- Add the page to `site/pages.js` (the sitemap is generated from it) and add its `.html`/slash variants to `site/public/_redirects`.
- Write each page's text for that page only. The home page carries short teasers; full details live on /about and the case studies.

## Performance rules

- No third-party requests on page load: fonts and images are served from amegh.me.
- Every page has a Speculation Rules block, so Chrome prerenders internal pages on hover and clicks open instantly.
- Keep the profile photo small where it's displayed small (`amegh-ts-144.webp` with `srcset`).
