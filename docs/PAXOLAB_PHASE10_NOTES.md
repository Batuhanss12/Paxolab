# Paxolab Phase 10 — QA / PERFORMANCE / LAUNCH HARDENING

## What was built

Practical launch hardening on the existing Hono + `node:sqlite` API. No new payment providers, no SEO/marketing site.

| Area | Details |
|------|---------|
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, API CSP `default-src 'none'; frame-ancestors 'none'; base-uri 'none'` (safe for iyzico callback HTML: meta-refresh + link, no scripts) |
| Rate limit | In-memory per IP. Shared **20/min** on `/api/auth/login` + `/api/auth/register`; **30/min** on `/api/billing/checkout`. 429 + TR message + `Retry-After`. Map hard-cleared every 10 min. **Not for multi-instance prod.** |
| Health | `GET /api/health` → `{ ok, service, db: 'ok'\|'error', time }` via `SELECT 1`; 503 if DB fails |
| Body limit | Hono `bodyLimit` (default 2 MiB, `FORMA_MAX_BODY_BYTES`); 413 TR |
| Secrets | `server/security.ts` — `redactSecrets` / `safeLog`; `.env.example` lists all keys |
| Frontend | AuthPanel pings health on load (and every 20s); friendly TR banner if API down |
| Scripts | `npm run test:all`, `npm run smoke:api` |
| CORS | Allow-list also includes `FORMA_PUBLIC_URL` (was localhost-only — would break a real deploy) |

Bypass for tests: `FORMA_RATE_LIMIT_DISABLED=1` (set in `vitest.server.config.ts`). Phase 10 tests unset it to assert 429.

## How to run / test

```bash
cd /workspace/paxolab-src
npm install
npm run test:all      # engine/SPA then server
npm run test:server   # API only
npm run smoke:api     # needs API already up (`npm run server`)
```

## NOT included

- Multi-instance / Redis rate limiter
- New payment providers
- SEO / marketing site
- Git commit / push

## Files touched

- `server/security.ts`, `server/security.test.ts`, `server/app.ts`, `server/index.ts`, `server/app.test.ts`
- `src/api/health.ts`, `src/components/AuthPanel.tsx`, `src/index.css`
- `scripts/smoke-api.mjs`, `vitest.server.config.ts`, `package.json`
- `.env.example`, `README.md`, `LAUNCH_CHECKLIST.md`
- `/workspace/paxolab-phase10-notes.md`
