# Paxolab local SEO package

Date: 2026-09-13  
Scope: marketing Next.js site at `/workspace/paxolab-site`  
No live domain, no git commit, no invented search volumes.

## What changed

### 1. Service FAQ type
- `src/content/types.ts`: optional `faqs?: FaqItem[]` on `ServicePage` (`FaqItem = { q, a }`).
- `ui.faqTitle` added for the on-page FAQ heading (TR/EN).
- `src/content/index.ts` re-exports `FaqItem`.

### 2. FAQs on every service (TR + EN)
Each of the 11 service hubs now has 4–5 visible FAQs in `tr.ts` / `en.ts`.

| Hub (TR slug) | FAQ count |
|---------------|-----------|
| ambalaj-tasarimi | 4 |
| kutu-tasarimi | 4 |
| etiket-tasarimi | 4 |
| bicki-cizimi | 4 |
| kozmetik-ambalaj-tasarimi | 4 |
| parfum-kutusu-tasarimi | 4 |
| **gida-ambalaj-tasarimi** | 5 |
| **serum-krem-kutusu-tasarimi** | 5 |
| **ai-ambalaj-tasarimi** | 5 |
| **baskiya-hazir-dieline** | 5 |
| **etiket-mi-kutu-mu** | 5 |

Answers stay factual about Paxolab / FORMA:
- FORMA is a **vector design engine**, not an image-gen model.
- Flow: chat/brief → dieline + vector artwork.
- Marketing site informs; production happens in the **studio** (CTA).
- No invented metrics, volumes, rankings, or “guaranteed press-ready / PDF/X” claims.
- Legal/INCI/food copy stays the brand’s responsibility.
- Credits/pricing point at the existing pricing page + studio billing.

### 3. ServicePageView
`src/components/ServicePage.tsx`:
- Renders a FAQ block (`details`/`summary`, same pattern as `FaqView`) when `data.faqs` is present.
- Emits `faqJsonLd(data.faqs)` via `JsonLd` alongside existing `serviceJsonLd`.

### 4. OG images
`src/lib/seo.ts`:
- `pageMetadata` accepts optional `ogImage?: string` (path under `public/`).
- Default remains `/og-default.svg`.
- If no explicit `ogImage`, a small slug map serves `/og/${slug}.svg` for home + the five new hubs (TR and EN slugs). Other pages keep the default.
- Service `page.tsx` files were **not** individually edited; they already call `pageMetadata` with `path`, so OG resolves automatically.

Static SVGs (title text in SVG, named by slug):

```
public/og/home.svg
public/og/gida-ambalaj-tasarimi.svg
public/og/serum-krem-kutusu-tasarimi.svg
public/og/ai-ambalaj-tasarimi.svg
public/og/baskiya-hazir-dieline.svg
public/og/etiket-mi-kutu-mu.svg
public/og/food-packaging-design.svg
public/og/serum-cream-box-design.svg
public/og/what-is-ai-packaging-design.svg
public/og/print-ready-dieline.svg
public/og/label-vs-box.svg
```

No large OG system; 11 small SVGs matching the existing `og-default.svg` palette.

### 5. Internal links
Five new hubs now include **≥2 other new hubs** plus **≥2 classic hubs** where relevant.

| Page | Related (intent) |
|------|------------------|
| gida | ambalaj, etiket (classic) + etiket-mi-kutu-mu, baskiya-hazir-dieline (new) |
| serum-krem | kozmetik, kutu (classic) + etiket-mi-kutu-mu, baskiya-hazir-dieline (new) |
| ai-ambalaj | nasil-calisir + ambalaj, bicki (classic) + baskiya-hazir, etiket-mi-kutu-mu (new) |
| baskiya-hazir | bicki, kutu (classic) + ai-ambalaj, etiket-mi-kutu-mu (new) |
| etiket-mi-kutu-mu | etiket, kutu (classic) + gida, serum-krem (new) |

Older hubs updated where natural:
- **ambalaj** → gida (food vertical)
- **kutu** → serum-krem + etiket-mi-kutu-mu
- **etiket** → already had etiket-mi-kutu-mu; added gida
- **bicki** → already pointed at baskiya-hazir (dieline ↔ print-ready)
- **kozmetik** → already pointed at serum-krem
- **parfüm** → serum-krem (sibling vertical)

EN twins use the matching `/en/…` paths.

### 6. Build
`npm run build` in `/workspace/paxolab-site` — **success** (Next.js 16.3.5 turbopack, 44 static routes). TypeScript clean.

### 7. Pack
Changed site files: `/workspace/paxolab-seo-local.tar`  
Paths inside the tar are relative to the site root (`src/…`, `public/og/…`).

## Files touched

```
src/content/types.ts
src/content/tr.ts
src/content/en.ts
src/content/index.ts
src/components/ServicePage.tsx
src/lib/seo.ts
public/og/*.svg  (11 files)
```

## Out of scope (as requested)
- Live domain / production URL
- Git commit / GitHub PR / CloudAgent
- Invented search volumes or rankings
- Backend contact form

## Spoke OG SVGs (2026-09-13)
Added 30 spoke OG SVGs under site/public/og and extended OG_SLUGS in src/lib/seo.ts.


## Breadcrumbs (2026-09-13)
BreadcrumbList JSON-LD + visible nav on ServicePageView. Spokes: Home � parent hub � page. Hubs: Home � page.


## HowTo JSON-LD (2026-09-13)
HowTo schema on: bicki-cizimi, baskiya-hazir-dieline, svg-dieline-matbaaya-nasil-verilir, tuck-end-dieline-okuma, ambalaj-preflight-checklist, forma-vektor-motoru-nasil-calisir (+ EN twins). Wired via ServicePageView when howto is set.


## Brand restore (2026-09-13)
Restored brand Paxolab + engine FORMA + merhaba@paxolab.com after accidental Forxa copy from site mirror. Auth storage key -> paxolab.site.auth.v1.


## Meta titles + examples (2026-09-13)
Short meta titles enriched. Examples expanded to 8 cards with links. See META_TITLE_AUDIT.md.

