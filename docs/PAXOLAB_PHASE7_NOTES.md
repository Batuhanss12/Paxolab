# Paxolab Phase 7 — Credit Metering

## What was built

Reliable credit wallet around design generation for **logged-in** users. Guests remain free/unlimited local (no metering); UI shows “Misafir · sınırsız yerel”.

| Area | Details |
|------|---------|
| DB | `wallets`, `credit_transactions`, `credit_reservations` (+ unique partial index on `client_request_id`) |
| Grant | On `POST /api/auth/register` → wallet + **50** credit `grant` tx |
| Costs | `generate` = 3, `revise` = 2 (`export_zip` = 1 constant stub only; no endpoint) |
| Pattern | Atomic **reserve** (debit now) → **commit** (ledger note, amount 0) or **refund** (credit back) |
| Race | `BEGIN IMMEDIATE` SQLite transactions; idempotent reserve via `clientRequestId` |
| Admin | `POST /api/credits/adjust` if `user.role === 'admin'` |
| Frontend | Balance in `AuthPanel`; `App.runGenerate` reserves when logged in |
| Stack | Still `node:sqlite` / `DatabaseSync` — **no better-sqlite3**, no Stripe/iyzico |

### Tables

- `wallets` — `user_id` PK FK users, `balance`, `updated_at`
- `credit_transactions` — kinds: `grant` | `reserve` | `commit` | `refund` | `adjust`
- `credit_reservations` — status: `pending` | `committed` | `refunded`; optional `client_request_id`

### Routes (auth required)

- `GET /api/credits/balance` → `{ balance, currency: 'credits' }`
- `GET /api/credits/transactions?limit=`
- `POST /api/credits/reserve` `{ operation: 'generate'|'revise', clientRequestId? }` → `{ reservationId, amount, balance }` (402 if insufficient)
- `POST /api/credits/commit` `{ reservationId }` (409 if already finalized)
- `POST /api/credits/refund` `{ reservationId, reason? }`
- `POST /api/credits/adjust` admin only `{ userId, amount, reason }`

### Frontend flow

1. Logged-in `runGenerate`: `clientRequestId = uid()` attempt id
2. `reserve` (`revise` if previous design exists, else `generate`)
3. On **402**: show “Krediniz yetersiz”, abort generation
4. On engine success → `commit`; on throw → `refund`
5. Guests: unchanged path (no reserve)

## How to run / test

```bash
cd /workspace/paxolab-src
npm install
npm run test:server   # includes credits.test.ts
npm test              # engine / SPA
```

## NOT included (later)

- Stripe / iyzico / top-ups (Phase 8)
- Paid plans / invoices
- Soft holds that do not debit until commit (current model debits on reserve)
- Git commit / push

## Files touched

- `server/db.ts`, `server/credits.ts`, `server/app.ts`, `server/credits.test.ts`
- `src/api/credits.ts`, `src/App.tsx`, `src/appState.ts`
- `src/components/AuthPanel.tsx`, `Landing.tsx`, `Workspace.tsx`, `src/index.css`
- `README.md`, `/workspace/paxolab-phase7-notes.md`
