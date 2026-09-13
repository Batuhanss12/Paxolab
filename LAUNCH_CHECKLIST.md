# FORMA launch checklist

Practical pre-launch items. Tick before any public or paid traffic.

## Engine

- [ ] `npm test` — motor / SPA tests green
- [ ] Optional smokes from `scripts/` (`h0-smoke`, `brain-smoke`, `studio-smoke`, sector/style) if you changed artwork
- [ ] Generate + revise a box and a label end-to-end in the UI
- [ ] Preflight / export SVG + print-PDF still honest (no invented barcode)

## Auth + cloud projects

- [ ] Register (password ≥ 8) → session persists after refresh
- [ ] Login / logout / `GET /api/auth/me`
- [ ] Guest stays local-only (`forma.project.v1`) — no credit metering
- [ ] Signed-in: create, reopen, delete a cloud project

## Credits

- [ ] New user starts at **50** credits
- [ ] `generate` = 3, `revise` = 2 (reserve → commit / refund)
- [ ] Insufficient credits → 402, no silent charge
- [ ] Admin adjust (`POST /api/admin/credits/adjust` or **Admin** panel)

## Billing (iyzico sandbox — no new providers)

- [ ] Empty `IYZI_API_KEY` / `IYZI_SECRET_KEY` → **mock** checkout + `mock/complete`
- [ ] Sandbox keys set → checkout opens iyzico form; callback hits `FORMA_API_PUBLIC_URL`
- [ ] `FORMA_PUBLIC_URL` matches the real SPA origin (CORS + success/fail redirect)
- [ ] Paid order grants credits **once** (replay / double callback is idempotent)
- [ ] Never point `IYZI_BASE_URL` at production unless you intend live charges

## Admin

- [ ] `FORMA_ADMIN_EMAIL` set; register that email → `role=admin`
- [ ] **Admin** panel: stats, users, credit adjust, recent orders
- [ ] Non-admin gets 403 on `/api/admin/*`

## SQLite backups

- [ ] Know the path: `server/data/forma.sqlite` (WAL: also `*-wal` / `*-shm`)
- [ ] Copy the file(s) while the API is **stopped**, or use `VACUUM INTO 'backup.sqlite'`
- [ ] Store a dated copy off-box before first real users
- [ ] Restore drill once: stop API, replace file, start, `GET /api/health` → `db: ok`

## API hardening (Phase 10)

- [ ] `GET /api/health` → `{ ok, service, db: 'ok', time }`
- [ ] `npm run smoke:api` against the running server
- [ ] Security headers present (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP)
- [ ] Rate limits on login/register (20/min) and checkout (30/min) — **in-memory, single process only**
- [ ] `FORMA_RATE_LIMIT_DISABLED=1` only in tests / local hammering, never public prod
- [ ] `.env` is not committed; `.env.example` lists every key
- [ ] Node ≥ 22.5 (`node:sqlite`)

## Do not

- [ ] Do not start the SEO / marketing-site epic from this checklist
- [ ] Do not add another payment provider
- [ ] Do not log passwords, session tokens, or iyzico secrets
