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

## Running more than one instance

### Several processes on one host — supported

This is the realistic first step (four workers on one box, `pm2 -i 4`, Node cluster). Two things
had to change for it, and both were measured rather than assumed.

- **The rate limit is counted in the database**, not in each process's memory. It used to be a
  module-level `Map`, so every worker granted the full allowance and the published limit was
  silently multiplied by the worker count. `checkRateLimitShared()` counts inside
  `BEGIN IMMEDIATE`, so two workers arriving together serialise instead of both finding room.
  `server/sharedRateLimit.test.ts` drives two app instances over one database file and asserts the
  fifth request is refused whichever instance receives it.
- **SQLite waits for the write lock instead of refusing it.** WAL already allowed several processes
  to share the file, but without a busy timeout a process that found the lock held threw
  `SQLITE_BUSY` immediately. Measured with three processes each attempting 400 transactions:
  **277 of 1200 succeeded** — a 77% failure rate, invisible on a single process. With
  `PRAGMA busy_timeout = 5000`: 1200 of 1200, zero busy errors.

### Several hosts — not yet

SQLite is one file on one filesystem, so multiple *machines* need a different database. That is a
project, not a setting, and the reason is worth stating plainly before anyone schedules it:

`node:sqlite` is **synchronous**. `db.prepare(…).get()` returns a row; it does not return a promise.
Postgres drivers are asynchronous, so every one of the **165 `db.prepare` call sites across 13
server files** would become `await`, and `async` would cascade outward through the credit ledger,
auth and every route handler. Twelve `BEGIN IMMEDIATE` transactions would need rewriting as well.

None of that is hard; all of it is in the part of the system where a bug costs a customer money. It
is worth doing when traffic demands more than one host, and worth doing on its own, with the credit
tests as the net — not folded into a release.

Until then: one API host, as many worker processes on it as the box will carry, and the site scaled
freely because it is stateless.

### Durability note

WAL is on with the default `synchronous = FULL`. `NORMAL` is the usual WAL pairing and measurably
faster, at the cost of losing the last commits if the host loses power. That is a decision about
the ledger, so it has not been made here.
