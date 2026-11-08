# amegh.me

Personal portfolio of Amegh T S, full-stack developer. Plain HTML and CSS, no build step.

## Structure

- `portfolio/` – the live site (deploy this folder)
  - `index.html` – the page, with SEO meta, Open Graph and JSON-LD
  - `og-image.png` – 1200×630 social preview
  - `favicon.svg`, `apple-touch-icon.png` – icons
  - `robots.txt`, `sitemap.xml`
- `banner/` – LinkedIn banner sources (HTML) and renders (PNG)
- `backup/coming-soon.html` – the previous amegh.me "Coming soon" page

## Run locally

```bash
python3 -m http.server 4173 --directory portfolio
```

## Deploy (Cloudflare Pages)

Connect this repo, leave the build command empty, and set the build output directory to `portfolio`. Add `amegh.me` as a custom domain.
