# amegh.me

Personal portfolio of Amegh T S, full-stack developer. Plain HTML and CSS, no build step.

## Structure

- `portfolio/` – the live site (deploy this folder)
  - `index.html` – home page, with SEO meta, Open Graph and JSON-LD (WebSite, WebPage, Person)
  - `about.html` – served at `/about`, ProfilePage JSON-LD
  - `work/*.html` – case studies served at `/work/<slug>`, Article + BreadcrumbList JSON-LD
  - `page.css`, `hover.js` – shared styles and heading effect for `/about` and `/work/*`, matching the home page
  - `amegh-ts.webp` – profile photo
  - `favicon.ico`, `icon-192.png`, `icon-512.png`, `site.webmanifest` – icons and manifest
  - `og-image.png` – 1200×630 social preview
  - `favicon.svg`, `apple-touch-icon.png` – icons
  - `robots.txt`, `sitemap.xml`
  - `work.html`, `404.html` – work index and the not-found page (served with a real 404, `noindex`)
  - `_redirects` – 301s from `.html` and trailing-slash URLs to the clean URLs
  - `_headers` – HSTS and other response headers
- `src/index.js` – Worker that runs before the static files and 301s every `http://` or `www.` request to `https://amegh.me/...`, so each page has one address that matches its canonical tag
- `banner/` – LinkedIn banner sources (HTML) and renders (PNG)
- `backup/coming-soon.html` – the previous amegh.me "Coming soon" page

## Run locally

```bash
npx wrangler dev --port 4173
```

This runs Cloudflare's local runtime, so clean URLs like `/about` and `/work/oppam` resolve the same way as in production (`.html` URLs redirect to them). A plain `python3 -m http.server 4173 --directory portfolio` also works, but then you have to add `.html` to subpage URLs.

`about.html` and `work/*.html` are plain static files; edit them directly.

## Deploy (Cloudflare Pages)

Connect this repo, leave the build command empty, and set the build output directory to `portfolio`. Add `amegh.me` as a custom domain.

## SEO rules for new pages

- Canonical tag: absolute `https://amegh.me/<path>`, no trailing slash, no `.html`, no query string. It must match the sitemap `<loc>` and `og:url`.
- Link internally with clean paths (`/about`, `/work/oppam`), never `.html`.
- Add the page to `sitemap.xml` and, if it has `.html`/slash variants, to `_redirects`.
