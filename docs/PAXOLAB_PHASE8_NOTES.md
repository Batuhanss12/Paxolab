# Paxolab Phase 8 — IYZICO Credit Top-up

## What was built

Sandbox / mock credit pack purchases. **No real money** when keys are empty (default): mock checkout + `POST /api/billing/mock/complete`. With iyzico sandbox keys, Checkout Form initialize + callback retrieve + idempotent credit grant.

| Area | Details |
|------|---------|
| Catalog | Hardcoded packs `pack_50` / `pack_150` / `pack_400`; plans `free` + `pro` (display-only until Phase 9) |
| DB | `payment_orders` (+ unique `conversation_id`) |
| Credits | `grantPurchaseCredits` / unlocked helper — idempotent on `orderId` (`ref_id`) |
| Mock | No `IYZI_API_KEY`+`IYZI_SECRET_KEY` → `mode:'mock'`, URL `/billing/mock-pay?orderId=…` |
| iyzico | npm `iyzipay` via `createRequire`; CF initialize + retrieve; callback redirects to `/?billing=success\|fail` |
| Frontend | `BillingPanel` TR UI in AuthPanel; `?billing=success` refreshes balance |
| Stack | Still `node:sqlite` — no better-sqlite3 |

### Packs (TRY)

| id | credits | price |
|----|---------|-------|
| pack_50 | 50 | 99.00 |
| pack_150 | 150 | 249.00 |
| pack_400 | 400 | 599.00 |

### Routes

- `GET /api/billing/packs` — public
- `GET /api/billing/plans` — public
- `POST /api/billing/checkout` `{ packId }` — auth → `{ orderId, paymentPageUrl, token, mode }`
- `POST /api/billing/mock/complete` `{ orderId }` — auth, only when keys missing
- `POST /api/billing/iyzico/callback` — public (iyzico posts `token`)

### Idempotency

`fulfillPaidOrder` marks `pending→paid` once and grants via `grantPurchaseCreditsUnlocked`. Repeat callback / mock complete returns `alreadyPaid` without double credit.

## Configure sandbox keys

1. Create a sandbox merchant at [iyzico sandbox](https://sandbox-merchant.iyzipay.com/).
2. Copy API key + secret into `.env` (see `.env.example`):

```bash
IYZI_API_KEY=sandbox-...
IYZI_SECRET_KEY=sandbox-...
IYZI_BASE_URL=https://sandbox-api.iyzipay.com
FORMA_PUBLIC_URL=http://localhost:5173
FORMA_API_PUBLIC_URL=http://localhost:8787
```

3. Restart `npm run server`. Checkout returns `mode:'iyzico'` and a hosted `paymentPageUrl`.
4. Leave keys empty for local/tests — mock path only, zero network charges.

## How to run / test

```bash
cd /workspace/paxolab-src
npm install
npm run test:server   # includes billing.test.ts
npm test              # engine / SPA
```

## NOT included

- Recurring Pro billing engine (Phase 9)
- Production iyzico live keys / real charges
- Invoices / tax
- Git commit / push

## Files touched

- `server/db.ts`, `server/credits.ts`, `server/app.ts`
- `server/billing/catalog.ts`, `iyzico.ts`, `orders.ts`, `server/billing.test.ts`
- `src/api/billing.ts`, `src/components/BillingPanel.tsx`, `AuthPanel.tsx`, `App.tsx`, `index.css`
- `package.json` (+ `iyzipay`), `.env.example`, `README.md`
- `/workspace/paxolab-phase8-notes.md`
