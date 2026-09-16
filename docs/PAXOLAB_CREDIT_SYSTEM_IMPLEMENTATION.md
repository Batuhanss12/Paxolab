# Paxolab Credit, Subscription, Billing & Design Usage Economy

## Implementation Report — Phase 10

This document describes the production-grade credit, subscription, billing, and design usage economy implemented for Paxolab. The system is fully integrated into the existing Paxolab architecture — authentication, projects, design engine, billing, and admin panels — and is not a parallel or mock system.

---

## 1. Architecture

```
USER PANEL ↔ BACKEND API ↔ DATABASE ↔ DESIGN WORKFLOW ↔ CREDIT LEDGER ↔ PAYMENT ↔ ADMIN PANEL
```

The credit economy connects to the existing Paxolab stack:

- **Auth**: Reuses `server/auth.ts` (users, sessions, bearer tokens, admin role).
- **Projects**: Reuses `server/projects.ts` and the `projects` table.
- **Design engine**: The deterministic SVG/design engine is untouched. Credits are reserved before generation and committed/refunded after.
- **Billing**: Reuses `server/billing/` (iyzico, mock payment, orders, catalog). Top-up credits are granted only after successful payment.
- **Database**: Extends `server/db.ts` with new Phase 10 tables while preserving all existing tables.

### New modules

| Module | Path | Responsibility |
|--------|------|---------------|
| Catalog | `server/credit/catalog.ts` | Operation definitions, cost versioning, legacy mapping |
| Buckets | `server/credit/buckets.ts` | Source sub-ledger, consumption policy, expiry |
| Classify | `server/credit/classify.ts` | Revision classification from natural language |
| Sessions | `server/credit/sessions.ts` | Design sessions and operations records |
| Subscriptions | `server/credit/subscriptions.ts` | Plans, activation, monthly grants, rollover |
| LLM Cost | `server/credit/llmCost.ts` | Internal AI cost tracking (admin only) |
| Events | `server/credit/events.ts` | Structured analytics/audit events |
| Index | `server/credit/index.ts` | Re-exports |

---

## 2. Database Model

### Existing tables (preserved)

- `users`, `sessions`, `projects`
- `wallets` (authoritative total balance)
- `credit_transactions` (immutable ledger)
- `credit_reservations`
- `payment_orders`

### New Phase 10 tables

#### `credit_buckets`
Source sub-ledger. Reconciles with `wallets.balance`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Bucket ID |
| `user_id` | TEXT FK | User |
| `bucket_type` | TEXT | `included`, `purchased`, or `bonus` |
| `balance` | INTEGER | Current balance in this bucket |
| `expires_at` | TEXT | Expiry timestamp (nullable) |
| `source_ref` | TEXT | Origin reference (subscription ID, order ID, etc.) |
| `created_at` | TEXT | Creation timestamp |

#### `subscription_plans`
Admin-managed plan configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Plan ID (`free`, `starter`, `professional`, `studio`) |
| `label` | TEXT | Display label |
| `monthly_price` | INTEGER | Monthly price in TRY |
| `currency` | TEXT | Currency code |
| `monthly_credits` | INTEGER | Monthly included credits |
| `max_projects` | INTEGER | Project limit (nullable) |
| `max_active_sessions` | INTEGER | Session limit (nullable) |
| `rollover_policy` | TEXT | `none`, `partial`, or `full` |
| `rollover_max` | INTEGER | Max rollover credits |
| `topup_eligible` | INTEGER | Can purchase top-ups |
| `enabled` | INTEGER | Active flag |
| `display_order` | INTEGER | Sort order |
| `description` | TEXT | Description |

#### `subscriptions`
User subscription records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Subscription ID |
| `user_id` | TEXT FK | User |
| `plan_id` | TEXT FK | Plan |
| `status` | TEXT | `active`, `cancelled`, `expired`, `past_due` |
| `current_period_start` | TEXT | Period start |
| `current_period_end` | TEXT | Period end |
| `next_renewal_at` | TEXT | Next renewal |
| `cancelled_at` | TEXT | Cancellation timestamp |
| `created_at` / `updated_at` | TEXT | Timestamps |

#### `credit_operation_catalog`
Versioned operation definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Row ID |
| `operation_id` | TEXT | Stable operation ID |
| `display_name` | TEXT | User-facing label |
| `description` | TEXT | Description |
| `credit_cost` | INTEGER | Current credit cost |
| `category` | TEXT | `discovery`, `creation`, `revision`, `refinement`, `export` |
| `enabled` | INTEGER | Active flag |
| `refundable` | INTEGER | Refundable on failure |
| `requires_confirmation` | INTEGER | Requires user confirmation |
| `free_tier_allowed` | INTEGER | Available on free tier |

#### `credit_cost_versions`
Historical cost records for audit.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Version ID |
| `operation_id` | TEXT | Operation |
| `credit_cost` | INTEGER | Cost at this version |
| `effective_from` | TEXT | Start date |
| `effective_to` | TEXT | End date (null = current) |

#### `design_sessions`
Design workflow containers within projects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Session ID |
| `project_id` | TEXT FK | Project |
| `user_id` | TEXT FK | User |
| `title` | TEXT | Session title |
| `brief_json` | TEXT | Serialized brief |
| `intent_json` | TEXT | Serialized intent |
| `status` | TEXT | `active`, `archived`, `deleted` |

#### `design_operations`
Individual design operation records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Operation record ID |
| `session_id` | TEXT FK | Design session |
| `project_id` | TEXT FK | Project |
| `user_id` | TEXT FK | User |
| `operation_id` | TEXT | Catalog operation ID |
| `credit_cost` | INTEGER | Cost at execution time |
| `cost_version_id` | TEXT | Historical cost version |
| `reservation_id` | TEXT | Credit reservation |
| `status` | TEXT | `pending`, `running`, `completed`, `failed`, `cancelled` |
| `outcome_json` | TEXT | Operation outcome |
| `feedback_text` | TEXT | User feedback |
| `classified_operation` | TEXT | Classified operation type |

#### `llm_cost_records`
Internal AI cost tracking (admin only, never shown to users).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Record ID |
| `operation_id` | TEXT | Operation |
| `design_operation_id` | TEXT | Design operation |
| `user_id` | TEXT | User |
| `provider` | TEXT | AI provider |
| `model` | TEXT | Model name |
| `input_tokens` | INTEGER | Input tokens |
| `output_tokens` | INTEGER | Output tokens |
| `estimated_cost_usd` | REAL | Estimated cost |
| `request_id` | TEXT | Request ID |

#### `credit_events`
Structured analytics/audit events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Event ID |
| `user_id` | TEXT | User |
| `event_type` | TEXT | Event type |
| `operation_id` | TEXT | Operation |
| `reservation_id` | TEXT | Reservation |
| `project_id` | TEXT | Project |
| `session_id` | TEXT | Session |
| `design_operation_id` | TEXT | Design operation |
| `amount` | INTEGER | Credit amount |
| `meta_json` | TEXT | Additional metadata |

#### `refunds`
Refund records (ledger remains financial source of truth).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Refund ID |
| `user_id` | TEXT | User |
| `reservation_id` | TEXT | Reservation |
| `order_id` | TEXT | Payment order |
| `amount` | INTEGER | Refund amount |
| `reason` | TEXT | Reason |
| `admin_user_id` | TEXT | Admin (if manual) |

---

## 3. API Model

### Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/billing/operations` | List all operations |
| GET | `/api/billing/packs` | List credit packs |
| GET | `/api/billing/plans` | List subscription plans |

### Authenticated user endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/design/operations/quote` | Get cost for an operation |
| POST | `/api/design/operations/classify` | Classify feedback to operation |
| POST | `/api/design/operations/reserve` | Reserve credits for catalog operation |
| POST | `/api/credits/reserve` | Reserve credits (legacy) |
| POST | `/api/credits/commit` | Commit reservation |
| POST | `/api/credits/refund` | Release/refund reservation |
| GET | `/api/billing/credits` | Balance + bucket breakdown + subscription |
| GET | `/api/billing/subscription` | Current subscription |
| POST | `/api/billing/subscribe` | Activate subscription |
| POST | `/api/billing/cancel` | Cancel subscription |
| GET | `/api/billing/usage` | Design operation history |
| GET | `/api/billing/ledger` | Credit transaction ledger |
| GET | `/api/projects/:id/sessions` | List design sessions |
| POST | `/api/projects/:id/sessions` | Create design session |
| GET | `/api/projects/:id/sessions/:sid/operations` | List session operations |
| GET | `/api/projects/:id/usage` | Project usage analytics |
| POST | `/api/internal/llm-cost` | Record LLM cost (internal) |

### Admin endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/billing/overview` | Billing dashboard |
| GET | `/api/admin/users/:id/credits` | User credit breakdown |
| GET | `/api/admin/users/:id/ledger` | User ledger |
| GET | `/api/admin/plans` | List all plans |
| POST | `/api/admin/plans` | Create/update plan |
| PATCH | `/api/admin/plans/:id` | Update plan |
| GET | `/api/admin/credit-operations` | List operations |
| PATCH | `/api/admin/credit-operations/:id` | Update operation cost/metadata |
| GET | `/api/admin/llm-costs` | LLM cost records |
| POST | `/api/admin/subscriptions/:id/renew` | Renew subscription |

---

## 4. Wallet Behavior

- Every user has one authoritative `wallets` row with a single `balance`.
- The `credit_buckets` table is a sub-ledger that tracks credit sources separately.
- **Invariant**: `SUM(credit_buckets.balance) == wallets.balance` at all times.
- Starting grant (50 credits) creates a `bonus` bucket.
- Subscription grants create `included` buckets with expiry.
- Top-up purchases create `purchased` buckets.
- Admin adjustments create `bonus` buckets (positive) or debit from buckets (negative).

---

## 5. Reservation Behavior

Flow: **RESERVE → EXECUTE → COMMIT or RELEASE**

1. **Reserve**: Verify balance → debit wallet → debit from buckets (consumption policy) → create reservation → ledger entry.
2. **Execute**: Design engine runs (unchanged).
3. **Commit**: Mark reservation as committed → ledger note (amount 0, funds already debited).
4. **Release/Refund**: Mark reservation as refunded → credit wallet → refund to buckets → ledger entry.

Reservations are idempotent via `client_request_id`. Duplicate requests return the existing reservation.

---

## 6. Operation Catalog

Seeded operations (see `server/db.ts` `seedDefaults`):

| Operation ID | Display Name | Cost | Category |
|-------------|-------------|------|----------|
| `brief_generation` | Brief Oluşturma | 1 | discovery |
| `design_exploration` | Tasarım Keşfi | 5 | discovery |
| `initial_design` | İlk Tasarım | 5 | creation |
| `alternative_design` | Alternatif Tasarım | 4 | creation |
| `new_direction` | Yeni Yön | 7 | creation |
| `micro_revision` | Mikro Düzeltme | 1 | refinement |
| `color_refinement` | Renk İyileştirme | 2 | refinement |
| `typography_refinement` | Tipografi İyileştirme | 2 | refinement |
| `composition_refinement` | Kompozisyon İyileştirme | 2 | refinement |
| `asset_refinement` | Görsel İyileştirme | 2 | refinement |
| `focused_revision` | Odaklı Revizyon | 3 | revision |
| `structural_revision` | Yapısal Revizyon | 4 | revision |
| `creative_revision` | Yaratıcı Revizyon | 5 | revision |
| `full_art_direction_revision` | Tam Sanat Yönü | 7 | revision |
| `final_export` | Final Export | 1 | export |

Legacy mapping: `generate` → `initial_design`, `revise` → `focused_revision`, `export_zip` → `final_export`.

---

## 7. Cost Versioning

- Each cost change creates a new `credit_cost_versions` row and closes the previous one.
- Historical operations preserve their `cost_version_id` — old operations are never recalculated with new prices.
- Admin can update costs via `PATCH /api/admin/credit-operations/:id`.

---

## 8. Subscription Model

### Plans (seeded)

| Plan | Price | Monthly Credits | Rollover |
|------|-------|----------------|----------|
| Free | 0 TRY | 50 | none |
| Starter | 199 TRY | 150 | partial (50 max) |
| Professional | 399 TRY | 400 | partial (100 max) |
| Studio | 999 TRY | 1200 | full |

### Activation flow

1. User subscribes via `POST /api/billing/subscribe`.
2. Existing active subscription is cancelled.
3. New subscription record created with 30-day period.
4. Monthly credits granted to `included` bucket with expiry = period end.
5. Wallet balance updated.
6. Ledger entry created (`subscription_grant`).

### Renewal

- `renewSubscription()` handles rollover based on plan policy.
- Expired included credits are removed.
- New monthly credits granted.
- Rollover credits (if any) added as new included bucket.

---

## 9. Top-up Flow

1. User selects a credit pack.
2. `POST /api/billing/checkout` creates a `payment_orders` record.
3. If iyzico keys present: redirect to iyzico checkout.
4. If no keys: mock payment page.
5. On payment success: `fulfillPaidOrder()` grants credits to `purchased` bucket.
6. **Idempotent**: duplicate payment events do not grant duplicate credits (checked via `ref_id`).
7. Failed payments never grant credits.

---

## 10. Credit Buckets & Consumption Policy

Consumption order (deterministic, single source of truth in `debitFromBuckets`):

1. Expiring bonus credits (earliest expiry first)
2. Expiring included credits (earliest expiry first)
3. Non-expiring bonus credits
4. Included credits (no expiry)
5. Purchased credits

This ensures promotional/monthly credits are used before paid credits.

---

## 11. User Panel

The `UserDashboard` component displays real backend state:

- **Balance**: Total credits from `wallets.balance`.
- **Bucket breakdown**: Included, purchased, bonus (from `credit_buckets`).
- **Subscription**: Current plan, status, renewal date.
- **Usage**: Recent design operations (from `design_operations`).
- **Ledger**: Credit transaction history (from `credit_transactions`).
- **Projects**: User's saved projects.
- **Payments**: Recent payment orders.

No fake or display-only balances. All data comes from persisted backend state.

---

## 12. Admin Panel

The `AdminDashboard` component provides:

- **Billing overview**: Active subscriptions, credits issued/consumed/purchased/refunded, revenue, failed operations, LLM costs.
- **User management**: List users with balances, click to view credit breakdown and ledger.
- **Credit adjustments**: Add/remove credits with reason (creates `manual_admin_adjustment` ledger entry).
- **Plan management**: List, create, update subscription plans.
- **Operation management**: List and update operation costs (with cost versioning).
- **LLM costs**: Internal AI cost records (admin only, never shown to users).
- **Orders**: Recent payment orders.

---

## 13. Authorization

- Users can access only their own wallets, projects, sessions, operations, ledger, and payments.
- Admin routes require `role === 'admin'` (enforced via middleware).
- Payment callbacks verify order ownership before completing mock payments.
- Project/session endpoints verify ownership before returning data.
- Existing rate limiting, body limits, and security headers remain intact.

---

## 14. Concurrency Protection

- All credit operations use `BEGIN IMMEDIATE` transactions.
- Wallet debit and bucket debit happen atomically within the same transaction.
- Concurrent reservation attempts are serialized by SQLite's write lock.
- The concurrency test verifies that 20 simultaneous reservation attempts for a user with 50 credits (each costing 3) result in exactly 16 successful and 4 failed (insufficient balance).

---

## 15. Idempotency

- **Reservations**: `client_request_id` prevents duplicate reservations. Same request ID returns the existing reservation.
- **Payments**: `fulfillPaidOrder` checks for existing `grant` transaction with the same `ref_id` (order ID). Duplicate payment events return `alreadyPaid: true` without granting additional credits.
- **Cost versions**: Historical operations preserve their `cost_version_id`.

---

## 16. Revision Classification

The `server/credit/classify.ts` module maps natural-language feedback to catalog operations:

- Keyword-based classification (Turkish + English).
- Priority: cheapest valid operation first.
- Returns operation ID, confidence, matched keywords, and rationale.
- `classifyOperation()` returns `initial_design` if no prior design exists.
- `toLegacyOperation()` maps back to `generate`/`revise` for backward compatibility.

---

## 17. Design Sessions & Operations

- **Sessions**: Belong to projects, track brief and intent.
- **Operations**: Belong to sessions, record operation ID, cost, cost version, reservation, status, outcome, and classified operation.
- **Project usage**: Aggregates credits consumed, reserved, refunded, and operation counts by type.

---

## 18. LLM Cost Tracking

- Internal records of actual AI/infrastructure costs.
- Never shown to users, never affects credit balance.
- Admin-only analytics endpoint.
- Records: provider, model, input/output tokens, estimated cost USD.

---

## 19. Tests

### Server tests (51 total, all passing)

| File | Tests | Description |
|------|-------|-------------|
| `server/app.test.ts` | 3 | API health, auth, projects |
| `server/credits.test.ts` | 6 | Phase 7 credit metering |
| `server/billing.test.ts` | 4 | Phase 8 billing |
| `server/admin.test.ts` | 3 | Phase 9 admin |
| `server/security.test.ts` | 8 | Rate limits, security headers |
| `server/phase10.test.ts` | 27 | Phase 10 credit economy |

### Phase 10 test coverage

- Operation catalog listing and quoting
- Feedback classification
- Credit bucket creation and debit
- Catalog-based reservation
- Idempotency
- Insufficient balance rejection
- Subscription activation, cancellation, status
- Usage and ledger listing
- Design session creation, listing, ownership
- Admin billing overview
- Admin user credits and ledger
- Admin plan and operation management
- Admin credit adjustments (compensating ledger entries)
- Top-up purchase flow (bucket allocation)
- Duplicate payment prevention
- End-to-end user → design → credit → admin flow
- Concurrency protection (overspending prevention)

### Full regression suite

- **485/487 tests pass** across the entire codebase.
- 2 failures are pre-existing engine/catalog test issues (`phase15.test.ts` chat copy, `structureRecommend.test.ts` structure reasons), unrelated to the credit system.
- No regressions introduced by Phase 10.

---

## 20. Known Limitations

1. **Subscription recurring billing**: Renewal is manual (`POST /api/admin/subscriptions/:id/renew`). No automated cron job or external recurring billing integration yet.
2. **iyzico subscription payments**: Only top-up packs use iyzico. Subscription activation is free (no real payment required). Future: integrate iyzico subscription billing.
3. **Design operation integration**: The frontend `App.tsx` still uses the legacy `reserveCredits`/`commitReservation`/`refundReservation` flow. The new catalog-based `reserveCreditsForCatalog` is available via API but not yet wired into the main generation flow.
4. **Bucket reconciliation**: `reconcileCheck()` exists but is not automatically enforced. A migration job should backfill buckets for pre-Phase 10 wallets.
5. **Refund records**: The `refunds` table exists but is not yet populated by the refund flow (refunds use the ledger directly).

---

## 21. Remaining Work

1. **Wire catalog operations into App.tsx**: Replace legacy `generate`/`revise` calls with `reserveCreditsForCatalog` using classified operation IDs.
2. **Backfill buckets**: Create a migration script to initialize buckets for existing wallets that predate Phase 10.
3. **Automated subscription renewal**: Add a cron job or scheduled task to call `renewSubscription` at period end.
4. **iyzico subscription billing**: Integrate iyzico recurring payment for subscription plans.
5. **Refund records**: Populate the `refunds` table alongside ledger entries for richer refund tracking.
6. **Bucket reconciliation enforcement**: Add an assertion or trigger to enforce `SUM(buckets) == wallet.balance`.
7. **Operation confirmation UI**: Surface `requiresConfirmation` operations in the frontend with a confirmation dialog.
8. **Free-tier eligibility**: Enforce `free_tier_allowed` in the reservation flow.
9. **Plan limits**: Enforce `max_projects` and `max_active_sessions` in the project/session creation flow.
