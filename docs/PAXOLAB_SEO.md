# Paxolab SEO — TR (default) + EN

## Relation to studio

| Layer | Tech | Role |
|-------|------|------|
| **Marketing site** | Next.js App Router @ `/workspace/paxolab-site` (port **3000**) | SEO landing, hubs, FAQ, legal; CTAs → studio |
| **Studio (FORMA)** | Vite SPA (Desktop Paxolab / `paxolab-src`, port **5173**) | Auth, brief, generate/revise, credits, billing |

Env bridge:

- Site: `NEXT_PUBLIC_STUDIO_URL` → studio origin
- Site: `NEXT_PUBLIC_SITE_URL` → canonical / sitemap
- Studio stays independent; no monorepo merge required

## Locales

- **TR (default):** root paths, no `/tr` prefix, `<html lang="tr">`
- **EN:** under `/en`, nested layout sets `lang=en` via client helper
- **hreflang:** every page sets `alternates.languages` → `tr-TR`, `en`, `x-default` (x-default = TR)
- **Canonical:** self URL

## Route map (TR ↔ EN)

| TR (default) | EN |
|--------------|-----|
| `/` | `/en` |
| `/ambalaj-tasarimi` | `/en/packaging-design` |
| `/kutu-tasarimi` | `/en/box-design` |
| `/etiket-tasarimi` | `/en/label-design` |
| `/bicki-cizimi` | `/en/dieline` |
| `/kozmetik-ambalaj-tasarimi` | `/en/cosmetic-packaging-design` |
| `/parfum-kutusu-tasarimi` | `/en/perfume-box-design` |
| `/nasil-calisir` | `/en/how-it-works` |
| `/ornekler` | `/en/examples` |
| `/fiyatlandirma` | `/en/pricing` |
| `/sss` | `/en/faq` |
| `/iletisim` | `/en/contact` |
| `/gizlilik` | `/en/privacy` |
| `/kvkk` | `/en/privacy` (shared EN privacy; TR keeps `/kvkk`) |
| `/kullanim-kosullari` | `/en/terms` |

Also: `/robots.txt`, `/sitemap.xml` (TR + EN with language alternates)

## Copy source

- `src/content/tr.ts` — Turkish
- `src/content/en.ts` — English
- `src/content/index.ts` — `getContent(locale)`
- `src/content/types.ts` — shared types
- `src/lib/i18n.ts` — path pairs + hreflang helpers

## Run locally

```bash
# Terminal A — marketing
cd /workspace/paxolab-site && npm run dev

# Terminal B — studio
cd /workspace/paxolab-src && npm run dev
```

## Out of scope

- Backend contact form
- Git commit / push
- Merging studio into Next.js
