# Paxolab local SEO — ready checklist
**Updated:** 2026-09-14  
**Project only:** `Desktop/Paxolab` (site + docs/seo)

## Done locally (no live URL required)
- [x] Hub pages (classic + 5 new) TR/EN
- [x] 15 spoke pages TR/EN
- [x] FAQ blocks + FAQPage JSON-LD on services
- [x] HowTo JSON-LD on dieline/preflight/FORMA pages
- [x] BreadcrumbList JSON-LD + visible crumbs
- [x] Meta titles enriched (`%s | Paxolab`)
- [x] OG SVGs (~63) for hubs, spokes, utilities
- [x] Examples page: 8 cards with internal links
- [x] Brand: Paxolab / FORMA / merhaba@paxolab.com
- [x] robots.txt disallows crawlers on localhost until production URL
- [x] `public/llms.txt` for answer-engine context
- [x] `scripts/seo-route-smoke.mjs` route file check
- [x] Briefs/backlog under `docs/seo/`

## Blocked until live domain
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production https URL
- [ ] Deploy marketing site
- [ ] Google Search Console + Bing property + sitemap submit
- [ ] Analytics (GA4 / Plausible)
- [ ] Turn on SEO routines (content digest, weekly report, topic watch) after timezone prefs

## Suggested first week after go-live
1. Submit sitemap; request index on top 10 hubs
2. Publish or promote 2–3 spokes already built
3. Connect Search Console export for weekly report routine
4. Re-check robots allows `/` on production host

## Commands
```bash
cd site
npm run build
node scripts/seo-route-smoke.mjs
npm run dev   # http://localhost:3000
```
