# Paxolab Phase 9 — USER + ADMIN Dashboards

## What was built

Logged-in **user dashboard** and **admin dashboard** (role === `admin`), plus admin APIs and first-admin bootstrap via env email on register.

| Area | Details |
|------|---------|
| User UI | `UserDashboard.tsx` — profil, bakiye + işlemler, projeler (aç/sil), son ödemeler, kredi yükle |
| Admin UI | `AdminDashboard.tsx` — stats cards, kullanıcı tablosu, kredi ayar formu, son siparişler |
| Wiring | Panels/modals from `AuthPanel` (`dashboardView` local state) — minimal App churn; `onLoadProject` → studio |
| Billing | `GET /api/billing/orders` — auth, own orders only |
| Admin API | `/api/admin/*` with `requireAuth` + role check |
| Bootstrap | `FORMA_ADMIN_EMAIL` — register email match (case-insensitive) → `role=admin` |
| Stack | Still `node:sqlite` — no new payment providers |

## Admin bootstrap (dev)

Preferred approach: set in `.env`:

```bash
FORMA_ADMIN_EMAIL=admin@forma.local
```

Then **register** that email (any password ≥ 8). Role is set at insert time. No SQL / bootstrap secret endpoint.

Existing users: promote with SQL if needed (`UPDATE users SET role='admin' WHERE email=…`) — not required for fresh dev.

## Routes

### User

- Existing credits / projects APIs reused by dashboard
- `GET /api/billing/orders?limit=` — own `payment_orders`

### Admin (`requireAuth` + `role === 'admin'`)

- `GET /api/admin/users` — id/email/name/role/created_at + wallet balance
- `GET /api/admin/stats` — users, projects, paidOrders, totalCreditsGranted (sum of `grant` txs)
- `POST /api/admin/credits/adjust` `{ userId, amount, reason }` — wraps `adjustCredits`
- `GET /api/admin/orders?limit=` — recent orders across users

Also still available: `POST /api/credits/adjust` (admin-only, Phase 7).

## How to run / test

```bash
cd /workspace/paxolab-src
npm install
npm run test:server   # includes admin.test.ts
npm test              # engine / SPA
```

UI: giriş → **Hesabım** / (admin) **Admin**. Proje **Aç** stüdyoya yükler.

## NOT included

- Recurring Pro billing engine
- New payment providers
- Bootstrap secret endpoint (`FORMA_BOOTSTRAP_SECRET`) — skipped in favor of email-on-register
- Git commit / push

## Files touched

- `server/app.ts`, `server/billing/orders.ts`, `server/admin.test.ts`
- `src/api/admin.ts`, `src/api/billing.ts`
- `src/components/UserDashboard.tsx`, `AdminDashboard.tsx`, `AuthPanel.tsx`
- `src/components/Landing.tsx`, `Workspace.tsx`, `App.tsx`, `projectStore.ts`, `index.css`
- `.env.example`, `README.md`
- `/workspace/paxolab-phase9-notes.md`
