# Paxolab SEO marketing site (TR + EN)

Next.js App Router + Tailwind marketing site for **Paxolab**. Turkish is the default locale at root (no `/tr` prefix). English lives under `/en`. Design studio (FORMA / Vite) stays in a separate app.

## Ports

| App | Path | Command | Port |
|-----|------|---------|------|
| Marketing site | `paxolab-site/` | `npm run dev` | **3000** |
| Design studio | Desktop Paxolab / `paxolab-src` | Vite `npm run dev` | **5173** |

CTAs open the studio via `NEXT_PUBLIC_STUDIO_URL` (default `http://localhost:5173`).

## Setup

```bash
cd /workspace/paxolab-site
cp .env.example .env.local   # optional
npm install
npm run dev                  # http://localhost:3000
```

Build:

```bash
npm run build
npm start
```

## Env

See `.env.example`:

- `NEXT_PUBLIC_SITE_URL` — canonical / sitemap base (default `http://localhost:3000`)
- `NEXT_PUBLIC_STUDIO_URL` — studio CTA target (default `http://localhost:5173`)

## Content / i18n

- `src/content/tr.ts` — Turkish (default)
- `src/content/en.ts` — English
- `src/content/index.ts` — `getContent('tr' | 'en')`
- `src/lib/i18n.ts` — TR↔EN path pairs, hreflang helpers

See `/workspace/PAXOLAB_SEO.md` for the full bilingual route map.
