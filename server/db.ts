import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncBillingCatalog } from './billing/syncCatalog.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type FormaDb = DatabaseSync

export type UserRow = {
  id: string
  email: string
  password_hash: string
  name: string | null
  created_at: string
  role: string
  auth_provider?: string
  google_sub?: string | null
}

export type SessionRow = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export type ProjectRow = {
  id: string
  user_id: string
  title: string
  payload_json: string
  updated_at: string
  created_at: string
}

export type WalletRow = {
  user_id: string
  balance: number
  updated_at: string
}

export type CreditTransactionRow = {
  id: string
  user_id: string
  kind: string
  amount: number
  balance_after: number
  ref_id: string | null
  meta_json: string | null
  created_at: string
}

export type RateLimitCounterRow = {
  key: string
  count: number
  reset_at: number
}

export type DownloadEntitlementRow = {
  id: string
  user_id: string
  reservation_id: string | null
  granted_at: string
  consumed_at: string | null
  design_key: string | null
}

export type CreditReservationRow = {
  id: string
  user_id: string
  amount: number
  status: string
  operation: string
  client_request_id: string | null
  created_at: string
  finalized_at: string | null
  billing_user_id?: string | null
}

export type CreditBucketRow = {
  id: string
  user_id: string
  bucket_type: string
  balance: number
  expires_at: string | null
  source_ref: string | null
  created_at: string
}

export type SubscriptionPlanRow = {
  id: string
  label: string
  monthly_price: number
  currency: string
  monthly_credits: number
  max_projects: number | null
  max_active_sessions: number | null
  rollover_policy: string
  rollover_max: number
  topup_eligible: number
  enabled: number
  display_order: number
  description: string | null
  unlimited?: number
  created_at: string
  updated_at: string
}

export type SubscriptionRow = {
  id: string
  user_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string | null
  next_renewal_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export type CreditOperationCatalogRow = {
  id: string
  operation_id: string
  display_name: string
  description: string
  credit_cost: number
  category: string
  enabled: number
  refundable: number
  requires_confirmation: number
  free_tier_allowed: number
  created_at: string
  updated_at: string
}

export type CreditCostVersionRow = {
  id: string
  operation_id: string
  credit_cost: number
  effective_from: string
  effective_to: string | null
  created_at: string
}

export type DesignSessionRow = {
  id: string
  project_id: string
  user_id: string
  title: string
  brief_json: string | null
  intent_json: string | null
  status: string
  created_at: string
  updated_at: string
}

export type DesignOperationRow = {
  id: string
  session_id: string
  project_id: string
  user_id: string
  operation_id: string
  credit_cost: number
  cost_version_id: string | null
  reservation_id: string | null
  status: string
  outcome_json: string | null
  feedback_text: string | null
  classified_operation: string | null
  created_at: string
  completed_at: string | null
}

export type LlmCostRecordRow = {
  id: string
  operation_id: string | null
  design_operation_id: string | null
  user_id: string | null
  provider: string | null
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_cost_usd: number | null
  request_id: string | null
  created_at: string
}

export type CreditEventRow = {
  id: string
  user_id: string
  event_type: string
  operation_id: string | null
  reservation_id: string | null
  project_id: string | null
  session_id: string | null
  design_operation_id: string | null
  amount: number | null
  meta_json: string | null
  created_at: string
}

export type RefundRow = {
  id: string
  user_id: string
  reservation_id: string | null
  order_id: string | null
  amount: number
  reason: string
  admin_user_id: string | null
  created_at: string
}

export function defaultDbPath(): string {
  return path.join(__dirname, 'data', 'forma.sqlite')
}

export function openDb(dbPath: string = defaultDbPath()): DatabaseSync {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new DatabaseSync(dbPath)
  try {
    db.exec('PRAGMA journal_mode = WAL')
  } catch {
    /* WAL may be unsupported (e.g. some :memory: / platform cases); skip safely */
  }
  try {
    /*
     * Wait for the write lock instead of refusing.
     *
     * WAL already lets several processes share this file — readers never block, and one writer
     * proceeds at a time. What was missing is patience: without a busy timeout, a process that
     * finds the write lock held throws SQLITE_BUSY *immediately* rather than waiting its turn. On a
     * single process that never happens, so nothing revealed it; run four workers on one box and
     * ordinary contention starts surfacing as errors to customers.
     *
     * Five seconds is far longer than any transaction here, all of which are a handful of indexed
     * statements. If a write ever really waits five seconds, something is wrong and an error is the
     * right answer.
     */
    db.exec('PRAGMA busy_timeout = 5000')
  } catch {
    /* older builds may not expose it; the single-process case is unaffected */
  }
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  seedDefaults(db)
  return db
}

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      ref_id TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created
      ON credit_transactions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS credit_reservations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      operation TEXT NOT NULL,
      client_request_id TEXT,
      created_at TEXT NOT NULL,
      finalized_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_reservations_client_req
      ON credit_reservations(user_id, client_request_id)
      WHERE client_request_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_credit_reservations_user
      ON credit_reservations(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pack_id TEXT NOT NULL,
      credits INTEGER NOT NULL,
      amount_try REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TRY',
      status TEXT NOT NULL,
      iyzico_token TEXT,
      iyzico_payment_id TEXT,
      conversation_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_conversation
      ON payment_orders(conversation_id);

    CREATE INDEX IF NOT EXISTS idx_payment_orders_user
      ON payment_orders(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_payment_orders_token
      ON payment_orders(iyzico_token)
      WHERE iyzico_token IS NOT NULL;

    -- ===== Phase 10 credit economy =====

    -- Credit buckets: sub-ledger that reconciles with wallets.balance.
    -- bucket_type: 'included' (monthly subscription), 'purchased' (top-up), 'bonus' (admin/promo)
    CREATE TABLE IF NOT EXISTS credit_buckets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bucket_type TEXT NOT NULL CHECK (bucket_type IN ('included','purchased','bonus')),
      balance INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      source_ref TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credit_buckets_user
      ON credit_buckets(user_id, bucket_type);

    -- Configurable subscription plans (admin-managed)
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      monthly_price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'TRY',
      monthly_credits INTEGER NOT NULL DEFAULT 0,
      max_projects INTEGER,
      max_active_sessions INTEGER,
      rollover_policy TEXT NOT NULL DEFAULT 'none',
      rollover_max INTEGER NOT NULL DEFAULT 0,
      topup_eligible INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- User subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      status TEXT NOT NULL DEFAULT 'active',
      current_period_start TEXT NOT NULL,
      current_period_end TEXT,
      next_renewal_at TEXT,
      cancelled_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

    -- Configurable credit operation catalog
    CREATE TABLE IF NOT EXISTS credit_operation_catalog (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT NOT NULL,
      credit_cost INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      refundable INTEGER NOT NULL DEFAULT 1,
      requires_confirmation INTEGER NOT NULL DEFAULT 0,
      free_tier_allowed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Credit cost versioning: historical operations preserve cost at execution time
    CREATE TABLE IF NOT EXISTS credit_cost_versions (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL,
      credit_cost INTEGER NOT NULL,
      effective_from TEXT NOT NULL,
      effective_to TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cost_versions_operation
      ON credit_cost_versions(operation_id, effective_from DESC);

    -- Design sessions belong to projects
    CREATE TABLE IF NOT EXISTS design_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      brief_json TEXT,
      intent_json TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_design_sessions_project
      ON design_sessions(project_id, updated_at DESC);

    -- Design operations within sessions
    CREATE TABLE IF NOT EXISTS design_operations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      operation_id TEXT NOT NULL,
      credit_cost INTEGER NOT NULL,
      cost_version_id TEXT,
      reservation_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      outcome_json TEXT,
      feedback_text TEXT,
      classified_operation TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_design_operations_session
      ON design_operations(session_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_design_operations_user
      ON design_operations(user_id, created_at DESC);

    -- Internal LLM cost tracking (admin only, never affects user balance)
    CREATE TABLE IF NOT EXISTS llm_cost_records (
      id TEXT PRIMARY KEY,
      operation_id TEXT,
      design_operation_id TEXT,
      user_id TEXT,
      provider TEXT,
      model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      estimated_cost_usd REAL,
      request_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_llm_cost_records_operation
      ON llm_cost_records(operation_id, created_at DESC);

    -- Structured credit events for analytics/audit
    CREATE TABLE IF NOT EXISTS credit_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      operation_id TEXT,
      reservation_id TEXT,
      project_id TEXT,
      session_id TEXT,
      design_operation_id TEXT,
      amount INTEGER,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_credit_events_user
      ON credit_events(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_credit_events_type
      ON credit_events(event_type, created_at DESC);

    -- Refund records (separate from ledger; ledger entry is the financial record)
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reservation_id TEXT,
      order_id TEXT,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      admin_user_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id, created_at DESC);

    /*
     * What a design purchase actually buys: the right to take one file away.
     *
     * The big charge is for ownership of one artwork, not for the act of clicking download, so the
     * entitlement is a row that is granted when the design is paid for and consumed when a file is
     * taken. Any download without an unconsumed entitlement is a new purchase.
     */
    CREATE TABLE IF NOT EXISTS download_entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reservation_id TEXT,
      granted_at TEXT NOT NULL,
      consumed_at TEXT,
      design_key TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_download_entitlements_open
      ON download_entitlements(user_id, consumed_at);

    /*
     * Rate-limit counters, shared rather than per-process.
     *
     * The limiter kept its buckets in a module-level Map, which is exactly as wide as one process.
     * Behind a load balancer — or simply four worker processes on one box — each granted the full
     * allowance, so the published limit was N times whatever the configuration said. Putting the
     * counters next to the balance they protect makes the limit mean one thing again.
     *
     * key is scope:ip; reset_at is an epoch millisecond, so an expired window is a comparison
     * rather than a scheduled job.
     */
    CREATE TABLE IF NOT EXISTS rate_limit_counters (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON rate_limit_counters(reset_at);
  `)
  try {
    db.exec(`ALTER TABLE subscription_plans ADD COLUMN unlimited INTEGER NOT NULL DEFAULT 0`)
  } catch {
    /* column already exists */
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'`)
  } catch {
    /* column already exists */
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN google_sub TEXT`)
  } catch {
    /* column already exists */
  }
  try {
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL`,
    )
  } catch {
    /* index already exists */
  }
  try {
    db.exec(`ALTER TABLE credit_reservations ADD COLUMN billing_user_id TEXT`)
  } catch {
    /* column already exists */
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      PRIMARY KEY (org_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

    CREATE TABLE IF NOT EXISTS organization_invites (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT NOT NULL COLLATE NOCASE,
      role TEXT NOT NULL DEFAULT 'member',
      token TEXT NOT NULL UNIQUE,
      invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_org_invites_org ON organization_invites(org_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS oauth_states (
      id TEXT PRIMARY KEY,
      next_url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oauth_handoffs (
      id TEXT PRIMARY KEY,
      session_token TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
}

/** Seed default operation catalog, cost versions, and subscription plans if empty. */
export function seedDefaults(db: DatabaseSync): void {
  const now = new Date().toISOString()
  const opCount = (db.prepare(`SELECT COUNT(*) AS n FROM credit_operation_catalog`).get() as { n: number }).n
  if (opCount === 0) {
    const ops = [
      ['brief_generation', 'Brief Oluşturma', 'Tasarım briefini doğal dilden üretir.', 1, 'discovery', 1, 0, 0, 1],
      ['design_exploration', 'Tasarım Keşfi', 'Brieften ilk tasarım adaylarını üretir.', 117, 'discovery', 1, 1, 1, 1],
      ['initial_design', 'İlk Tasarım', 'Proje için ilk tasarımı üretir.', 117, 'creation', 1, 1, 1, 1],
      ['alternative_design', 'Alternatif Tasarım', 'Mevcut brieften kontrollü alternatif üretir.', 3, 'creation', 1, 1, 1, 1],
      ['new_direction', 'Yeni Yön', 'Yaratıcı yönü değiştirerek yeni konsept üretir.', 3, 'creation', 1, 1, 1, 1],
      ['micro_revision', 'Mikro Revizyon', 'Küçük metin/renk/düzeltme değişikliği.', 3, 'revision', 1, 1, 0, 1],
      ['focused_revision', 'Odaklı Revizyon', 'Tek bir alana odaklı revizyon.', 3, 'revision', 1, 1, 0, 1],
      ['structural_revision', 'Yapısal Revizyon', 'Kompozisyon ve hiyerarşiyi değiştirir.', 3, 'revision', 1, 1, 1, 1],
      ['creative_revision', 'Yaratıcı Revizyon', 'Yaratıcı yönü kısmen değiştirir.', 3, 'revision', 1, 1, 1, 1],
      ['full_art_direction_revision', 'Tam Sanat Yönü Revizyonu', 'Tam sanat yönünü yeniden üretir.', 3, 'revision', 1, 1, 1, 1],
      ['typography_refinement', 'Tipografi İyileştirme', 'Tipografi ve font ayarları.', 3, 'refinement', 1, 1, 0, 1],
      ['color_refinement', 'Renk İyileştirme', 'Renk paleti ayarları.', 3, 'refinement', 1, 1, 0, 1],
      ['composition_refinement', 'Kompozisyon İyileştirme', 'Düzen ve kompozisyon ayarları.', 3, 'refinement', 1, 1, 0, 1],
      ['asset_refinement', 'Görsel İyileştirme', 'Hero/görsel öğeleri ayarlar.', 3, 'refinement', 1, 1, 0, 1],
      ['final_refinement', 'Son İyileştirme', 'Üretime hazır son iyileştirme.', 3, 'refinement', 1, 1, 1, 1],
      ['final_export', 'Son Export', 'Üretim-ready export paketi.', 1, 'export', 1, 0, 1, 1],
    ] as const

    const insertOp = db.prepare(
      `INSERT INTO credit_operation_catalog
       (id, operation_id, display_name, description, credit_cost, category, enabled, refundable, requires_confirmation, free_tier_allowed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const insertVersion = db.prepare(
      `INSERT INTO credit_cost_versions
       (id, operation_id, credit_cost, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    )
    for (const op of ops) {
      const id = `cat_${op[0]}`
      insertOp.run(id, op[0], op[1], op[2], op[3], op[4], op[5], op[6], op[7], op[8], now, now)
      insertVersion.run(`ver_${op[0]}_v1`, op[0], op[3], now, now)
    }
  }

  syncBillingCatalog(db)
}
