# Deploy

## Why there are two apps and not one

The question is a fair one — three processes in development looks like three problems in
production. It is two deployables, and the split is deliberate:

| | what it is | why it is not merged |
|---|---|---|
| **site** (`site/`, Next) | marketing pages, account, pricing, SEO routes | Needs server rendering, metadata, sitemaps and permanent redirects. That is what Next is for. |
| **studio + API** (`src/` + `server/`) | the design tool and the service behind it | A canvas application has no SEO value and gains nothing from SSR; it wants a big client bundle and fast local iteration. |

Putting the studio inside Next would mean paying SSR complexity for a page that renders nothing on
the server. Putting the site inside the Vite SPA would mean giving up the SEO the marketing pages
exist for. So they stay apart.

**The studio and the API do not stay apart.** In production one process serves both.

## The production shape

```
  api.example.com  →  node server/index.ts     ← serves /api/*  AND  the built studio
  example.com      →  next start (site/)
```

Two deployables. Build and run:

```bash
npm run build          # studio → ./dist
npm run server         # API + studio on one origin
npm run build:site     # site → site/.next
npm --prefix site start
```

### Why studio and API share an origin

The studio calls the API with **relative** paths (`fetch('/api/…')`). In development the Vite dev
server proxies `/api` to port 8787. In production there is no Vite, so `/api` resolves against
whatever origin served the static files.

`server/index.ts` therefore serves `./dist` when it exists. Same origin by construction: no reverse
proxy has to be configured correctly for the product to work, and the studio's requests need no
CORS entry at all. Deploying the studio to a CDN *instead* would work only if that CDN also proxies
`/api` to the API host — possible, but it is one more thing that fails silently, and it fails after
the customer has paid.

## Environment

The same three URLs are named once per app. All three must agree.

| what | server | site (Next) | studio (Vite) |
|---|---|---|---|
| marketing site | `FORMA_SITE_URL` | `NEXT_PUBLIC_SITE_URL` | `VITE_SITE_URL` |
| studio | `FORMA_PUBLIC_URL` | `NEXT_PUBLIC_STUDIO_URL` | — its own origin |
| API | `FORMA_API_PUBLIC_URL` | `NEXT_PUBLIC_API_URL` | — relative `/api` |

The server's two public URLs are not decoration: `FORMA_PUBLIC_URL` and `FORMA_SITE_URL` are the
CORS allow-list (`corsOrigins()` in `server/security.ts`) and the iyzico callback base. A production
origin missing from them means the site cannot reach the API and payments cannot come back.

When studio and API share an origin, `FORMA_PUBLIC_URL` is that shared origin.

## Things that were found by trying it

Both of these work in development and fail only once the studio is built, which is why they are
written down rather than left to be discovered.

- **The API's CSP blocked the studio's own bundle.** `default-src 'none'` is correct for JSON and
  fatal for an application: the page loaded, the title appeared, the body stayed empty.
  `securityHeaders()` now picks a policy per path — strict for `/api/*`, scoped to the origin for
  everything else. The studio's policy allows `'unsafe-inline'` styles and Google Fonts because the
  engine emits `<style>` inside its SVG and the on-screen faces load webfonts. Exported production
  files embed a local subset instead, so the export path needs neither.
- **A hardcoded `http://localhost:3000`** had been written into a "top up credits" link. All
  cross-app links go through `src/api/urls.ts` now.

## Known constraints before scaling past one instance

Neither blocks launch; both are load-bearing assumptions worth knowing.

- **SQLite, single writer.** `server/data/forma.sqlite` via `node:sqlite`. Fine for one API
  process. Two processes against one file will fight over writes.
- **The rate limiter is in-process.** `server/security.ts` keeps counters in memory, so N instances
  give N times the allowance. `.env.example` has said so all along.
