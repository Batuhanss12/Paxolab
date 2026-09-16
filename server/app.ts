import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  createSession,
  deleteSession,
  hashPassword,
  isOauthPasswordHash,
  newId,
  requireAuth,
  toPublicUser,
  validateEmail,
  validatePassword,
  verifyPassword,
  type AuthVars,
  type PublicUser,
} from './auth.ts'
import { mountGoogleAuth } from './googleAuthRoutes.ts'
import { createOrgRoutes } from './orgRoutes.ts'
import { getOrganization, listAllOrganizations, listMembers, resolveBillingUserId } from './orgs.ts'
import type { FormaDb, ProjectRow, UserRow } from './db.ts'
import {
  adjustCredits,
  commitReservation,
  createWalletWithGrant,
  CreditsError,
  getBalance,
  listTransactions,
  refundReservation,
  reserveCredits,
  reserveCreditsForCatalog,
  costForCatalog,
  type MeteredOperation,
} from './credits.ts'
import { CREDIT_PACKS } from './billing/catalog.ts'
import { SUBSCRIPTION_PLANS } from './billing/plansCatalog.ts'
import {
  createPendingOrder,
  fulfillPaidOrder,
  getOrder,
  listOrdersForUser,
  listRecentOrders,
  markOrderFailed,
  OrderError,
  resolvePackOrThrow,
  setOrderToken,
} from './billing/orders.ts'
import {
  hasIyzicoKeys,
  iyzicoCheckoutInitialize,
  iyzicoCheckoutRetrieve,
  publicApiUrl,
  publicFrontendUrl,
} from './billing/iyzico.ts'
import {
  listOperations,
  resolveOperation,
  updateOperationCost,
  updateOperationMeta,
  type OperationDef,
} from './credit/catalog.ts'
import { bucketSummary, listBuckets, reconcileCheck } from './credit/buckets.ts'
import { classifyFeedback, classifyOperation, toLegacyOperation } from './credit/classify.ts'
import {
  createSession as createDesignSession,
  listSessions,
  getSession,
  recordOperation,
  startOperation,
  completeOperation,
  failOperation,
  listOperations as listSessionOperations,
  listUserOperations,
  projectUsage,
} from './credit/sessions.ts'
import {
  listPlans,
  listAllPlans,
  getPlan,
  getActiveSubscription,
  activateSubscription,
  cancelSubscription,
  renewSubscription,
  upsertPlan,
  userHasUnlimitedDesigns,
} from './credit/subscriptions.ts'
import { recordLlmCost, listLlmCosts, llmCostSummary } from './credit/llmCost.ts'
import { recordEvent, listUserEvents } from './credit/events.ts'
import { bodyLimit } from 'hono/body-limit'
import {
  BODY_TOO_LARGE_TR,
  corsOriginChecker,
  maxBodyBytes,
  rateLimit,
  securityHeaders,
} from './security.ts'

export type AppEnv = AuthVars

function projectSummary(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    updated_at: row.updated_at,
    created_at: row.created_at,
  }
}

function projectFull(row: ProjectRow) {
  let payload: unknown = null
  try {
    payload = JSON.parse(row.payload_json)
  } catch {
    payload = null
  }
  return {
    ...projectSummary(row),
    payload,
  }
}

function asCreditsHttp(err: unknown): { error: string; status: 400 | 402 | 403 | 404 | 409 } | null {
  if (err instanceof CreditsError) {
    return { error: err.message, status: err.status as 400 | 402 | 403 | 404 | 409 }
  }
  return null
}

function asBillingHttp(err: unknown): { error: string; status: 400 | 402 | 403 | 404 | 409 } | null {
  if (err instanceof OrderError || err instanceof CreditsError) {
    return { error: err.message, status: err.status as 400 | 402 | 403 | 404 | 409 }
  }
  return null
}

export function createApp(db: FormaDb): Hono<AppEnv> {
  const app = new Hono<AppEnv>()

  app.use(
    '*',
    cors({
      origin: corsOriginChecker,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )

  app.use('*', securityHeaders())
  app.use(
    '*',
    bodyLimit({
      maxSize: maxBodyBytes(),
      onError: (c) => c.json({ error: BODY_TOO_LARGE_TR }, 413),
    }),
  )

  app.get('/api/health', (c) => {
    let dbStatus: 'ok' | 'error' = 'ok'
    try {
      db.prepare('SELECT 1').get()
    } catch {
      dbStatus = 'error'
    }
    const ok = dbStatus === 'ok'
    return c.json(
      {
        ok,
        service: 'forma-api',
        db: dbStatus,
        time: new Date().toISOString(),
      },
      ok ? 200 : 503,
    )
  })

  app.post('/api/auth/register', rateLimit('auth'), async (c) => {
    let body: { email?: string; password?: string; name?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const emailErr = validateEmail(body.email ?? '')
    if (emailErr) return c.json({ error: emailErr }, 400)
    const passErr = validatePassword(body.password ?? '')
    if (passErr) return c.json({ error: passErr }, 400)

    const email = (body.email ?? '').trim().toLowerCase()
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email)
    if (existing) return c.json({ error: 'Bu e-posta zaten kayıtlı.' }, 409)

    const id = newId()
    const now = new Date().toISOString()
    const password_hash = hashPassword(body.password!)
    const adminEmail = (process.env.FORMA_ADMIN_EMAIL ?? '').trim().toLowerCase()
    const role = adminEmail && email === adminEmail ? 'admin' : 'user'
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, created_at, role) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, email, password_hash, name, now, role)

    createWalletWithGrant(db, id)

    const user = toPublicUser(
      db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow,
    )
    const token = createSession(db, id)
    return c.json({ user, token }, 201)
  })

  app.post('/api/auth/login', rateLimit('auth'), async (c) => {
    let body: { email?: string; password?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    if (!email || !password) {
      return c.json({ error: 'E-posta ve şifre gerekli.' }, 400)
    }
    const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as UserRow | undefined
    if (!row) {
      return c.json({ error: 'E-posta veya şifre hatalı.' }, 401)
    }
    if (isOauthPasswordHash(row.password_hash) && row.auth_provider === 'google') {
      return c.json({ error: 'Bu hesap Google ile giriş yapıyor.' }, 401)
    }
    if (!verifyPassword(password, row.password_hash)) {
      return c.json({ error: 'E-posta veya şifre hatalı.' }, 401)
    }
    const token = createSession(db, row.id)
    return c.json({ user: toPublicUser(row), token })
  })

  app.post('/api/auth/logout', requireAuth(db), (c) => {
    deleteSession(db, c.get('token'))
    return c.json({ ok: true })
  })

  app.get('/api/auth/me', requireAuth(db), (c) => {
    return c.json({ user: c.get('user') as PublicUser })
  })

  mountGoogleAuth(app, db)
  app.route('/api/orgs', createOrgRoutes(db))

  const projects = new Hono<AppEnv>()
  projects.use('*', requireAuth(db))

  projects.get('/', (c) => {
    const user = c.get('user') as PublicUser
    const rows = db
      .prepare(
        `SELECT id, user_id, title, payload_json, updated_at, created_at FROM projects
         WHERE user_id = ? ORDER BY updated_at DESC`,
      )
      .all(user.id) as ProjectRow[]
    return c.json({ projects: rows.map(projectSummary) })
  })

  projects.get('/:id', (c) => {
    const user = c.get('user') as PublicUser
    const row = db
      .prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`)
      .get(c.req.param('id'), user.id) as ProjectRow | undefined
    if (!row) return c.json({ error: 'Proje bulunamadı.' }, 404)
    return c.json({ project: projectFull(row) })
  })

  projects.post('/', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { title?: string; payload?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const id = newId()
    const now = new Date().toISOString()
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : 'Grapxor projesi'
    const payload_json = JSON.stringify(body.payload ?? {})
    db.prepare(
      `INSERT INTO projects (id, user_id, title, payload_json, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, user.id, title, payload_json, now, now)
    const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as ProjectRow
    return c.json({ project: projectFull(row) }, 201)
  })

  projects.put('/:id', async (c) => {
    const user = c.get('user') as PublicUser
    const id = c.req.param('id')
    let body: { title?: string; payload?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const now = new Date().toISOString()
    const existing = db
      .prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`)
      .get(id, user.id) as ProjectRow | undefined

    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : existing?.title ?? 'Grapxor projesi'
    const payload_json =
      body.payload !== undefined
        ? JSON.stringify(body.payload)
        : existing?.payload_json ?? '{}'

    if (existing) {
      db.prepare(
        `UPDATE projects SET title = ?, payload_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      ).run(title, payload_json, now, id, user.id)
    } else {
      db.prepare(
        `INSERT INTO projects (id, user_id, title, payload_json, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, user.id, title, payload_json, now, now)
    }
    const row = db
      .prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`)
      .get(id, user.id) as ProjectRow
    return c.json({ project: projectFull(row) })
  })

  projects.delete('/:id', (c) => {
    const user = c.get('user') as PublicUser
    const result = db
      .prepare(`DELETE FROM projects WHERE id = ? AND user_id = ?`)
      .run(c.req.param('id'), user.id)
    if (result.changes === 0) return c.json({ error: 'Proje bulunamadı.' }, 404)
    return c.json({ ok: true })
  })

  app.route('/api/projects', projects)

  const credits = new Hono<AppEnv>()
  credits.use('*', requireAuth(db))

  credits.get('/balance', (c) => {
    const user = c.get('user') as PublicUser
    const billingUserId = resolveBillingUserId(db, user.id)
    return c.json({
      balance: getBalance(db, billingUserId),
      personalBalance: getBalance(db, user.id),
      currency: 'credits',
      unlimited: userHasUnlimitedDesigns(db, billingUserId),
      billingUserId,
    })
  })

  credits.get('/transactions', (c) => {
    const user = c.get('user') as PublicUser
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 50
    const rows = listTransactions(db, user.id, Number.isFinite(limit) ? limit : 50)
    return c.json({
      transactions: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount,
        balance_after: row.balance_after,
        ref_id: row.ref_id,
        meta: row.meta_json
          ? (() => {
              try {
                return JSON.parse(row.meta_json)
              } catch {
                return null
              }
            })()
          : null,
        created_at: row.created_at,
      })),
    })
  })

  credits.post('/reserve', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { operation?: string; clientRequestId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const operation = body.operation
    if (operation !== 'generate' && operation !== 'revise') {
      return c.json({ error: "operation 'generate' veya 'revise' olmalı." }, 400)
    }
    try {
      const result = reserveCredits(
        db,
        user.id,
        operation as MeteredOperation,
        body.clientRequestId ?? null,
      )
      return c.json({
        reservationId: result.reservationId,
        amount: result.amount,
        balance: result.balance,
        operation: result.operation,
        idempotent: result.idempotent,
      })
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  credits.post('/commit', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { reservationId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.reservationId || typeof body.reservationId !== 'string') {
      return c.json({ error: 'reservationId gerekli.' }, 400)
    }
    try {
      const result = commitReservation(db, user.id, body.reservationId)
      return c.json(result)
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  credits.post('/refund', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { reservationId?: string; reason?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.reservationId || typeof body.reservationId !== 'string') {
      return c.json({ error: 'reservationId gerekli.' }, 400)
    }
    try {
      const result = refundReservation(db, user.id, body.reservationId, body.reason ?? null)
      return c.json(result)
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  credits.post('/adjust', async (c) => {
    const user = c.get('user') as PublicUser
    if (user.role !== 'admin') {
      return c.json({ error: 'Yalnızca admin.' }, 403)
    }
    let body: { userId?: string; amount?: number; reason?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.userId || typeof body.userId !== 'string') {
      return c.json({ error: 'userId gerekli.' }, 400)
    }
    if (typeof body.amount !== 'number') {
      return c.json({ error: 'amount gerekli.' }, 400)
    }
    try {
      const result = adjustCredits(db, user.id, body.userId, body.amount, body.reason ?? null)
      return c.json(result)
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })


  app.route('/api/credits', credits)

  // ---- Phase 10 credit economy ----

  // Operation catalog (public, no auth needed for listing)
  app.get('/api/billing/operations', (c) => {
    const ops = listOperations(db)
    return c.json({
      operations: ops.map((op) => ({
        operationId: op.operationId,
        displayName: op.displayName,
        description: op.description,
        creditCost: op.creditCost,
        category: op.category,
        enabled: op.enabled,
        refundable: op.refundable,
        requiresConfirmation: op.requiresConfirmation,
        freeTierAllowed: op.freeTierAllowed,
      })),
    })
  })

  // Quote: get cost for an operation before reserving
  app.post('/api/design/operations/quote', requireAuth(db), async (c) => {
    let body: { operation?: string; feedback?: string; hasPriorDesign?: boolean }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }

    let operationId = body.operation
    let classified = null as null | { operationId: string; confidence: number; rationale: string; matchedKeywords: string[] }

    // If feedback is provided, classify it
    if (!operationId && typeof body.feedback === 'string') {
      const result = classifyOperation(body.feedback, body.hasPriorDesign ?? false)
      classified = {
        operationId: result.operationId,
        confidence: result.confidence,
        rationale: result.rationale,
        matchedKeywords: result.matchedKeywords,
      }
      operationId = result.operationId
    }

    if (!operationId) {
      return c.json({ error: 'operation veya feedback gerekli.' }, 400)
    }

    try {
      const def = resolveOperation(db, operationId)
      return c.json({
        operationId: def.operationId,
        displayName: def.displayName,
        description: def.description,
        creditCost: def.creditCost,
        category: def.category,
        refundable: def.refundable,
        requiresConfirmation: def.requiresConfirmation,
        classified,
      })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Operasyon bulunamadı.' }, 400)
    }
  })

  // Classify feedback (no cost, no reservation)
  app.post('/api/design/operations/classify', requireAuth(db), async (c) => {
    let body: { feedback?: string; hasPriorDesign?: boolean }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (typeof body.feedback !== 'string') {
      return c.json({ error: 'feedback gerekli.' }, 400)
    }
    const result = classifyOperation(body.feedback, body.hasPriorDesign ?? false)
    return c.json({
      operationId: result.operationId,
      confidence: result.confidence,
      rationale: result.rationale,
      matchedKeywords: result.matchedKeywords,
      legacyOperation: toLegacyOperation(result.operationId),
    })
  })

  // Catalog-based reserve (Phase 10)
  app.post('/api/design/operations/reserve', requireAuth(db), async (c) => {
    const user = c.get('user') as PublicUser
    let body: {
      operation?: string
      clientRequestId?: string
      projectId?: string
      sessionId?: string
      feedbackText?: string
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.operation) {
      return c.json({ error: 'operation gerekli.' }, 400)
    }
    try {
      const result = reserveCreditsForCatalog(
        db,
        user.id,
        body.operation,
        body.clientRequestId ?? null,
        {
          projectId: body.projectId,
          sessionId: body.sessionId,
          feedbackText: body.feedbackText,
        },
      )
      return c.json({
        reservationId: result.reservationId,
        amount: result.amount,
        balance: result.balance,
        operationId: result.catalogOperationId,
        costVersionId: result.costVersionId,
        idempotent: result.idempotent,
      })
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  // Commit (reuse existing /api/credits/commit — works for both legacy and catalog)

  // Release/refund (reuse existing /api/credits/refund)

  // Balance breakdown with buckets
  app.get('/api/billing/credits', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const balance = getBalance(db, user.id)
    const summary = bucketSummary(db, user.id)
    const sub = getActiveSubscription(db, user.id)
    return c.json({
      balance,
      currency: 'credits',
      buckets: summary,
      subscription: sub
        ? {
            planId: sub.planId,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            nextRenewalAt: sub.nextRenewalAt,
          }
        : null,
    })
  })

  // Subscription endpoints
  app.get('/api/billing/subscription', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const sub = getActiveSubscription(db, user.id)
    if (!sub) return c.json({ subscription: null })
    const plan = getPlan(db, sub.planId)
    return c.json({
      subscription: {
        id: sub.id,
        planId: sub.planId,
        planLabel: plan?.label ?? sub.planId,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        nextRenewalAt: sub.nextRenewalAt,
        cancelledAt: sub.cancelledAt,
        monthlyCredits: plan?.monthlyCredits ?? 0,
      },
    })
  })

  app.post('/api/billing/subscribe', requireAuth(db), async (c) => {
    const user = c.get('user') as PublicUser
    let body: { planId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.planId) {
      return c.json({ error: 'planId gerekli.' }, 400)
    }
    try {
      const sub = activateSubscription(db, user.id, body.planId)
      return c.json({ subscription: sub }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Abonelik başlatılamadı.' }, 400)
    }
  })

  app.post('/api/billing/cancel', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const sub = cancelSubscription(db, user.id)
    if (!sub) return c.json({ error: 'Aktif abonelik bulunamadı.' }, 404)
    return c.json({ subscription: sub })
  })

  // Usage: user's design operations
  app.get('/api/billing/usage', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 50
    const ops = listUserOperations(db, user.id, Number.isFinite(limit) ? limit : 50)
    return c.json({
      usage: ops.map((op) => ({
        id: op.id,
        sessionId: op.sessionId,
        projectId: op.projectId,
        operationId: op.operationId,
        creditCost: op.creditCost,
        status: op.status,
        feedbackText: op.feedbackText,
        classifiedOperation: op.classifiedOperation,
        createdAt: op.createdAt,
        completedAt: op.completedAt,
      })),
    })
  })

  // Full ledger (user's credit transactions)
  app.get('/api/billing/ledger', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 100
    const rows = listTransactions(db, user.id, Number.isFinite(limit) ? limit : 100)
    return c.json({
      ledger: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount,
        balanceAfter: row.balance_after,
        refId: row.ref_id,
        meta: row.meta_json ? (() => { try { return JSON.parse(row.meta_json) } catch { return null } })() : null,
        createdAt: row.created_at,
      })),
    })
  })

  // Design sessions
  app.get('/api/projects/:projectId/sessions', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const projectId = c.req.param('projectId')
    // Verify project ownership
    const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`).get(projectId, user.id)
    if (!project) return c.json({ error: 'Proje bulunamadı.' }, 404)
    const sessions = listSessions(db, projectId)
    return c.json({ sessions })
  })

  app.post('/api/projects/:projectId/sessions', requireAuth(db), async (c) => {
    const user = c.get('user') as PublicUser
    const projectId = c.req.param('projectId')
    const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`).get(projectId, user.id)
    if (!project) return c.json({ error: 'Proje bulunamadı.' }, 404)
    let body: { title?: string; brief?: unknown; intent?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const session = createDesignSession(db, projectId, user.id, body.title ?? 'Yeni oturum', body.brief, body.intent)
    return c.json({ session }, 201)
  })

  app.get('/api/projects/:projectId/sessions/:sessionId/operations', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const projectId = c.req.param('projectId')
    const sessionId = c.req.param('sessionId')
    const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`).get(projectId, user.id)
    if (!project) return c.json({ error: 'Proje bulunamadı.' }, 404)
    const ops = listSessionOperations(db, sessionId)
    return c.json({ operations: ops })
  })

  // Project usage analytics
  app.get('/api/projects/:projectId/usage', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const projectId = c.req.param('projectId')
    const project = db.prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`).get(projectId, user.id)
    if (!project) return c.json({ error: 'Proje bulunamadı.' }, 404)
    const usage = projectUsage(db, projectId)
    return c.json({ usage })
  })

  // Record LLM cost (internal, called by design engine)
  app.post('/api/internal/llm-cost', requireAuth(db), async (c) => {
    let body: {
      operationId?: string
      designOperationId?: string
      provider?: string
      model?: string
      inputTokens?: number
      outputTokens?: number
      estimatedCostUsd?: number
      requestId?: string
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const user = c.get('user') as PublicUser
    const record = recordLlmCost(db, {
      operationId: body.operationId,
      designOperationId: body.designOperationId,
      userId: user.id,
      provider: body.provider,
      model: body.model,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      estimatedCostUsd: body.estimatedCostUsd,
      requestId: body.requestId,
    })
    return c.json({ record }, 201)
  })

  // ---- Phase 8 billing (iyzico sandbox + mock) ----
  app.get('/api/billing/packs', (c) => {
    return c.json({
      packs: CREDIT_PACKS.map((p) => ({
        id: p.id,
        credits: p.credits,
        priceTry: p.priceTry,
        label: p.label,
        currency: p.currency,
      })),
    })
  })

  app.get('/api/billing/plans', (c) => {
    const plans = listPlans(db)
    return c.json({
      plans: plans.map((p) => ({
        id: p.id,
        label: p.label,
        monthlyCredits: p.monthlyCredits,
        priceTry: p.monthlyPrice,
        displayOnly: false,
        description: p.description ?? '',
        currency: p.currency,
        rolloverPolicy: p.rolloverPolicy,
        unlimited: p.unlimited,
        unitPriceTry: SUBSCRIPTION_PLANS.find((row) => row.id === p.id)?.unitPriceTry ??
          (p.monthlyCredits > 0 ? Math.round((p.monthlyPrice / p.monthlyCredits) * 100) / 100 : null),
      })),
    })
  })

  app.get('/api/billing/orders', requireAuth(db), (c) => {
    const user = c.get('user') as PublicUser
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 20
    const rows = listOrdersForUser(db, user.id, Number.isFinite(limit) ? limit : 20)
    return c.json({
      orders: rows.map((row) => ({
        id: row.id,
        pack_id: row.pack_id,
        credits: row.credits,
        amount_try: row.amount_try,
        currency: row.currency,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        paid_at: row.paid_at,
      })),
    })
  })

  app.post('/api/billing/checkout', rateLimit('checkout'), requireAuth(db), async (c) => {
    const user = c.get('user') as PublicUser
    let body: { packId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.packId || typeof body.packId !== 'string') {
      return c.json({ error: 'packId gerekli.' }, 400)
    }
    let pack
    try {
      pack = resolvePackOrThrow(body.packId)
    } catch (err) {
      const mapped = asBillingHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }

    const order = createPendingOrder(db, user.id, pack)
    const useIyzico = hasIyzicoKeys()

    if (!useIyzico) {
      return c.json({
        orderId: order.id,
        paymentPageUrl: `/billing/mock-pay?orderId=${encodeURIComponent(order.id)}`,
        token: null,
        mode: 'mock' as const,
      })
    }

    const callbackUrl = `${publicApiUrl()}/api/billing/iyzico/callback`
    const priceStr = pack.priceTry.toFixed(2)
    const nameParts = (user.name ?? user.email.split('@')[0] ?? 'FORMA').trim().split(/\s+/)
    const buyerName = nameParts[0] || 'FORMA'
    const buyerSurname = nameParts.slice(1).join(' ') || 'User'
    const contactName = `${buyerName} ${buyerSurname}`.trim()

    try {
      const init = await iyzicoCheckoutInitialize({
        conversationId: order.conversation_id,
        price: priceStr,
        paidPrice: priceStr,
        basketId: `B${order.id.slice(0, 16)}`,
        callbackUrl,
        buyer: {
          id: user.id,
          name: buyerName,
          surname: buyerSurname,
          email: user.email,
          identityNumber: '11111111111',
          registrationAddress: 'FORMA sandbox',
          ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
          city: 'Istanbul',
          country: 'Turkey',
        },
        billingAddress: {
          contactName,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'FORMA sandbox',
        },
        basketItems: [
          {
            id: pack.id,
            name: pack.label,
            category1: 'Credits',
            itemType: 'VIRTUAL',
            price: priceStr,
          },
        ],
      })

      if (init.status !== 'success' || !init.token || !init.paymentPageUrl) {
        markOrderFailed(db, order.id)
        return c.json(
          { error: init.errorMessage || 'iyzico ödeme formu başlatılamadı.' },
          502,
        )
      }

      setOrderToken(db, order.id, init.token)
      return c.json({
        orderId: order.id,
        paymentPageUrl: init.paymentPageUrl,
        token: init.token,
        mode: 'iyzico' as const,
      })
    } catch (err) {
      markOrderFailed(db, order.id)
      const message = err instanceof Error ? err.message : 'iyzico hatası'
      return c.json({ error: message }, 502)
    }
  })

  app.post('/api/billing/mock/complete', requireAuth(db), async (c) => {
    if (hasIyzicoKeys()) {
      return c.json({ error: 'Mock ödeme yalnızca anahtar yokken kullanılabilir.' }, 403)
    }
    const user = c.get('user') as PublicUser
    let body: { orderId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.orderId || typeof body.orderId !== 'string') {
      return c.json({ error: 'orderId gerekli.' }, 400)
    }
    const order = getOrder(db, body.orderId)
    if (!order) return c.json({ error: 'Sipariş bulunamadı.' }, 404)
    if (order.user_id !== user.id) return c.json({ error: 'Sipariş bu kullanıcıya ait değil.' }, 403)

    try {
      const result = fulfillPaidOrder(db, order.id, { expectedUserId: user.id, paymentId: 'mock' })
      return c.json({
        ok: true,
        orderId: result.order.id,
        status: result.order.status,
        balance: result.balance,
        creditsGranted: result.granted ? result.order.credits : 0,
        alreadyPaid: result.alreadyPaid,
        mode: 'mock',
      })
    } catch (err) {
      const mapped = asBillingHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  app.post('/api/billing/iyzico/callback', async (c) => {
    const front = publicFrontendUrl()
    const successUrl = `${front}/?billing=success`
    const failUrl = `${front}/?billing=fail`

    let token = ''
    const contentType = c.req.header('content-type') ?? ''
    try {
      if (contentType.includes('application/json')) {
        const body = await c.req.json()
        token = String(body.token ?? '')
      } else {
        const body = await c.req.parseBody()
        token = String(body.token ?? '')
      }
    } catch {
      token = ''
    }

    if (!token) {
      if (c.req.header('accept')?.includes('application/json')) {
        return c.json({ error: 'token gerekli', redirect: failUrl }, 400)
      }
      return c.redirect(failUrl, 302)
    }

    if (!hasIyzicoKeys()) {
      // Should not happen in mock mode; still fail safely
      return c.redirect(failUrl, 302)
    }

    try {
      // Find order by stored token
      const order = db
        .prepare(`SELECT * FROM payment_orders WHERE iyzico_token = ?`)
        .get(token) as { id: string; conversation_id: string; status: string } | undefined

      const conversationId = order?.conversation_id ?? ''
      const retrieved = await iyzicoCheckoutRetrieve(conversationId, token)
      const paymentOk =
        retrieved.status === 'success' &&
        String(retrieved.paymentStatus ?? '').toUpperCase() === 'SUCCESS'

      if (!paymentOk || !order) {
        if (order && order.status === 'pending') {
          markOrderFailed(db, order.id)
        }
        if (c.req.header('accept')?.includes('application/json')) {
          return c.json({
            ok: false,
            error: retrieved.errorMessage || 'Ödeme başarısız',
            redirect: failUrl,
          })
        }
        return c.html(
          `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${failUrl}"></head><body>Ödeme başarısız. <a href="${failUrl}">Devam</a></body></html>`,
        )
      }

      if (order.status === 'pending' || order.status === 'paid') {
        fulfillPaidOrder(db, order.id, {
          paymentId: retrieved.paymentId ? String(retrieved.paymentId) : null,
        })
      }

      if (c.req.header('accept')?.includes('application/json')) {
        return c.json({ ok: true, redirect: successUrl })
      }
      return c.html(
        `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${successUrl}"></head><body>Ödeme alındı. <a href="${successUrl}">Devam</a></body></html>`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'callback hatası'
      if (c.req.header('accept')?.includes('application/json')) {
        return c.json({ ok: false, error: message, redirect: failUrl }, 500)
      }
      return c.html(
        `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${failUrl}"></head><body>Hata. <a href="${failUrl}">Devam</a></body></html>`,
      )
    }
  })


  // ---- Phase 9 admin ----
  const admin = new Hono<AppEnv>()
  admin.use('*', requireAuth(db))
  admin.use('*', async (c, next) => {
    const user = c.get('user') as PublicUser
    if (user.role !== 'admin') {
      return c.json({ error: 'Yalnızca admin.' }, 403)
    }
    await next()
  })

  admin.get('/users', (c) => {
    const q = (c.req.query('q') ?? '').trim().toLowerCase()
    const rows = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.created_at, u.auth_provider,
                COALESCE(w.balance, 0) AS balance
         FROM users u
         LEFT JOIN wallets w ON w.user_id = u.id
         ORDER BY u.created_at DESC`,
      )
      .all() as {
      id: string
      email: string
      name: string | null
      role: string
      created_at: string
      auth_provider: string | null
      balance: number
    }[]
    const users = rows
      .filter((r) => {
        if (!q) return true
        return (
          r.email.toLowerCase().includes(q) ||
          (r.name ?? '').toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        )
      })
      .map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        created_at: r.created_at,
        auth_provider: r.auth_provider ?? 'password',
        balance: r.balance,
      }))
    return c.json({ users })
  })

  admin.get('/stats', (c) => {
    const users = (db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number }).n
    const projects = (db.prepare(`SELECT COUNT(*) AS n FROM projects`).get() as { n: number }).n
    const paidOrders = (
      db.prepare(`SELECT COUNT(*) AS n FROM payment_orders WHERE status = 'paid'`).get() as {
        n: number
      }
    ).n
    const grantsRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM credit_transactions WHERE kind = 'grant'`,
      )
      .get() as { total: number }
    const organizations = (db.prepare(`SELECT COUNT(*) AS n FROM organizations`).get() as { n: number }).n
    return c.json({
      users,
      projects,
      paidOrders,
      totalCreditsGranted: grantsRow.total,
      organizations,
    })
  })

  admin.post('/credits/adjust', async (c) => {
    const adminUser = c.get('user') as PublicUser
    let body: { userId?: string; amount?: number; reason?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.userId || typeof body.userId !== 'string') {
      return c.json({ error: 'userId gerekli.' }, 400)
    }
    if (typeof body.amount !== 'number') {
      return c.json({ error: 'amount gerekli.' }, 400)
    }
    try {
      const result = adjustCredits(
        db,
        adminUser.id,
        body.userId,
        body.amount,
        body.reason ?? null,
      )
      return c.json(result)
    } catch (err) {
      const mapped = asCreditsHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  admin.patch('/users/:id', async (c) => {
    const adminUser = c.get('user') as PublicUser
    const targetId = c.req.param('id')
    let body: { role?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (body.role !== 'admin' && body.role !== 'user') {
      return c.json({ error: "role 'admin' veya 'user' olmalı." }, 400)
    }
    const target = db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(targetId) as
      | { id: string; role: string }
      | undefined
    if (!target) return c.json({ error: 'Kullanıcı bulunamadı.' }, 404)
    if (target.role === 'admin' && body.role === 'user') {
      const admins = (db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).get() as { n: number }).n
      if (admins <= 1) {
        return c.json({ error: 'Son admin düşürülemez.' }, 400)
      }
      if (targetId === adminUser.id) {
        return c.json({ error: 'Kendi admin rolünüzü kaldıramazsınız.' }, 400)
      }
    }
    db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(body.role, targetId)
    const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as UserRow
    return c.json({ user: toPublicUser(row) })
  })

  admin.get('/orgs', (c) => {
    return c.json({ organizations: listAllOrganizations(db) })
  })

  admin.get('/orgs/:id', (c) => {
    const org = getOrganization(db, c.req.param('id'))
    if (!org) return c.json({ error: 'Firma bulunamadı.' }, 404)
    const summary = listAllOrganizations(db).find((o) => o.id === org.id)
    return c.json({
      organization: summary ?? org,
      members: listMembers(db, org.id),
    })
  })

  admin.get('/orders', (c) => {
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 50
    const rows = listRecentOrders(db, Number.isFinite(limit) ? limit : 50)
    return c.json({
      orders: rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        pack_id: row.pack_id,
        credits: row.credits,
        amount_try: row.amount_try,
        currency: row.currency,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        paid_at: row.paid_at,
      })),
    })
  })

  // ---- Phase 10 admin endpoints ----

  // Billing overview / dashboard
  admin.get('/billing/overview', (c) => {
    const users = (db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number }).n
    const activeSubs = (db.prepare(`SELECT COUNT(*) AS n FROM subscriptions WHERE status = 'active'`).get() as { n: number }).n
    const creditsIssued = (db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM credit_transactions WHERE amount > 0 AND kind IN ('grant','subscription_grant','bonus_grant','manual_admin_adjustment')`)
      .get() as { total: number }).total
    const creditsConsumed = (db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM credit_transactions WHERE amount < 0 AND kind IN ('reserve','reservation','commit')`)
      .get() as { total: number }).total
    const creditsPurchased = (db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM credit_transactions WHERE kind = 'grant' AND meta_json LIKE '%"reason":"purchase"%'`)
      .get() as { total: number }).total
    const creditsRefunded = (db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM credit_transactions WHERE kind = 'refund'`)
      .get() as { total: number }).total
    const topupRevenue = (db
      .prepare(`SELECT COALESCE(SUM(amount_try), 0) AS total FROM payment_orders WHERE status = 'paid'`)
      .get() as { total: number }).total
    const subRevenue = (db
      .prepare(`SELECT COALESCE(SUM(p.monthly_price), 0) AS total FROM subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.status = 'active'`)
      .get() as { total: number }).total
    const failedOps = (db
      .prepare(`SELECT COUNT(*) AS n FROM design_operations WHERE status = 'failed'`)
      .get() as { n: number }).n
    const llmSummary = llmCostSummary(db)

    return c.json({
      users,
      activeSubscriptions: activeSubs,
      creditsIssued,
      creditsConsumed: Math.abs(creditsConsumed),
      creditsPurchased,
      creditsRefunded,
      topupRevenue,
      subscriptionRevenue: subRevenue,
      failedOperations: failedOps,
      creditUtilization: creditsIssued > 0 ? Math.abs(creditsConsumed) / creditsIssued : 0,
      llmCosts: llmSummary,
    })
  })

  // User detail with credit breakdown
  admin.get('/users/:id/credits', (c) => {
    const userId = c.req.param('id')
    const userRow = db.prepare(`SELECT id, email, name, role, created_at FROM users WHERE id = ?`).get(userId)
    if (!userRow) return c.json({ error: 'Kullanıcı bulunamadı.' }, 404)
    const balance = getBalance(db, userId)
    const summary = bucketSummary(db, userId)
    const sub = getActiveSubscription(db, userId)
    return c.json({
      user: userRow,
      balance,
      buckets: summary,
      subscription: sub
        ? {
            planId: sub.planId,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
    })
  })

  // User ledger (full transaction history)
  admin.get('/users/:id/ledger', (c) => {
    const userId = c.req.param('id')
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 200
    const rows = listTransactions(db, userId, Number.isFinite(limit) ? limit : 200)
    return c.json({
      ledger: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount,
        balanceAfter: row.balance_after,
        refId: row.ref_id,
        meta: row.meta_json ? (() => { try { return JSON.parse(row.meta_json) } catch { return null } })() : null,
        createdAt: row.created_at,
      })),
    })
  })

  // Plan management
  admin.get('/plans', (c) => {
    return c.json({ plans: listAllPlans(db) })
  })

  admin.post('/plans', async (c) => {
    let body: { id?: string; label?: string; monthlyPrice?: number; monthlyCredits?: number; maxProjects?: number; maxActiveSessions?: number; rolloverPolicy?: string; rolloverMax?: number; topupEligible?: boolean; enabled?: boolean; displayOrder?: number; description?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    if (!body.id) return c.json({ error: 'id gerekli.' }, 400)
    try {
      const plan = upsertPlan(db, body.id, {
        label: body.label,
        monthlyPrice: body.monthlyPrice,
        monthlyCredits: body.monthlyCredits,
        maxProjects: body.maxProjects,
        maxActiveSessions: body.maxActiveSessions,
        rolloverPolicy: body.rolloverPolicy as 'none' | 'partial' | 'full',
        rolloverMax: body.rolloverMax,
        topupEligible: body.topupEligible,
        enabled: body.enabled,
        displayOrder: body.displayOrder,
        description: body.description,
      })
      return c.json({ plan }, 201)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Plan güncellenemedi.' }, 400)
    }
  })

  admin.patch('/plans/:id', async (c) => {
    const planId = c.req.param('id')
    let body: Partial<{ label: string; monthlyPrice: number; monthlyCredits: number; maxProjects: number; maxActiveSessions: number; rolloverPolicy: string; rolloverMax: number; topupEligible: boolean; enabled: boolean; displayOrder: number; description: string }>
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    try {
      const plan = upsertPlan(db, planId, body)
      return c.json({ plan })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Plan güncellenemedi.' }, 400)
    }
  })

  // Credit operation catalog management
  admin.get('/credit-operations', (c) => {
    return c.json({ operations: listOperations(db) })
  })

  admin.patch('/credit-operations/:id', async (c) => {
    const operationId = c.req.param('id')
    let body: { creditCost?: number; displayName?: string; description?: string; enabled?: boolean; refundable?: boolean; requiresConfirmation?: boolean; freeTierAllowed?: boolean }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    try {
      if (body.creditCost !== undefined) {
        updateOperationCost(db, operationId, body.creditCost)
      }
      const updated = updateOperationMeta(db, operationId, {
        displayName: body.displayName,
        description: body.description,
        enabled: body.enabled,
        refundable: body.refundable,
        requiresConfirmation: body.requiresConfirmation,
        freeTierAllowed: body.freeTierAllowed,
      })
      return c.json({ operation: updated })
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Operasyon güncellenemedi.' }, 400)
    }
  })

  // LLM cost records (internal analytics)
  admin.get('/llm-costs', (c) => {
    const limitRaw = c.req.query('limit')
    const limit = limitRaw ? Number(limitRaw) : 100
    return c.json({ costs: listLlmCosts(db, Number.isFinite(limit) ? limit : 100) })
  })

  // Renew a subscription (manual trigger for testing)
  admin.post('/subscriptions/:id/renew', (c) => {
    const subId = c.req.param('id')
    try {
      const result = renewSubscription(db, subId)
      return c.json(result)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Yenileme başarısız.' }, 400)
    }
  })

  function adminLimit(raw: string | undefined, fallback = 100): number {
    const n = raw ? Number(raw) : fallback
    return Number.isFinite(n) ? Math.min(Math.max(1, Math.floor(n)), 500) : fallback
  }

  admin.get('/users/:id', (c) => {
    const userId = c.req.param('id')
    const userRow = db
      .prepare(
        `SELECT id, email, name, role, created_at, auth_provider FROM users WHERE id = ?`,
      )
      .get(userId) as
      | { id: string; email: string; name: string | null; role: string; created_at: string; auth_provider: string | null }
      | undefined
    if (!userRow) return c.json({ error: 'Kullanıcı bulunamadı.' }, 404)
    const balance = getBalance(db, userId)
    const summary = bucketSummary(db, userId)
    const sub = getActiveSubscription(db, userId)
    const plan = sub ? getPlan(db, sub.planId) : undefined
    const projects = db
      .prepare(
        `SELECT id, title, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC`,
      )
      .all(userId) as { id: string; title: string; created_at: string; updated_at: string }[]
    const reservations = db
      .prepare(
        `SELECT id, amount, status, operation, created_at, finalized_at FROM credit_reservations
         WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      )
      .all(userId) as {
      id: string
      amount: number
      status: string
      operation: string
      created_at: string
      finalized_at: string | null
    }[]
    return c.json({
      user: {
        ...userRow,
        auth_provider: userRow.auth_provider ?? 'password',
      },
      balance,
      buckets: summary,
      reservedCredits: reservations
        .filter((r) => r.status === 'pending' || r.status === 'reserved')
        .reduce((sum, r) => sum + r.amount, 0),
      subscription: sub
        ? {
            id: sub.id,
            planId: sub.planId,
            planLabel: plan?.label ?? sub.planId,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            monthlyCredits: plan?.monthlyCredits ?? 0,
          }
        : null,
      projects,
      reservations,
      ledger: listTransactions(db, userId, 50).map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount,
        balanceAfter: row.balance_after,
        createdAt: row.created_at,
      })),
      orders: listOrdersForUser(db, userId, 30).map((row) => ({
        id: row.id,
        pack_id: row.pack_id,
        credits: row.credits,
        amount_try: row.amount_try,
        currency: row.currency,
        status: row.status,
        created_at: row.created_at,
      })),
      operations: listUserOperations(db, userId, 50),
    })
  })

  admin.get('/projects', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const rows = db
      .prepare(
        `SELECT p.id, p.user_id, p.title, p.created_at, p.updated_at, u.email AS ownerEmail
         FROM projects p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.updated_at DESC
         LIMIT ?`,
      )
      .all(limit) as {
      id: string
      user_id: string
      title: string
      created_at: string
      updated_at: string
      ownerEmail: string
    }[]
    return c.json({ projects: rows })
  })

  admin.get('/projects/:id', (c) => {
    const id = c.req.param('id')
    const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as ProjectRow | undefined
    if (!row) return c.json({ error: 'Proje bulunamadı.' }, 404)
    const owner = db
      .prepare(`SELECT id, email, name, role FROM users WHERE id = ?`)
      .get(row.user_id) as { id: string; email: string; name: string | null; role: string } | undefined
    return c.json({
      project: { ...projectFull(row), userId: row.user_id },
      owner: owner ?? null,
      sessions: listSessions(db, id),
      usage: projectUsage(db, id),
    })
  })

  admin.get('/sessions', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const rows = db
      .prepare(
        `SELECT s.id, s.project_id, s.user_id, s.title, s.status, s.created_at, s.updated_at,
                u.email AS ownerEmail, p.title AS projectTitle
         FROM design_sessions s
         JOIN users u ON u.id = s.user_id
         JOIN projects p ON p.id = s.project_id
         WHERE s.status != 'deleted'
         ORDER BY s.updated_at DESC
         LIMIT ?`,
      )
      .all(limit) as {
      id: string
      project_id: string
      user_id: string
      title: string
      status: string
      created_at: string
      updated_at: string
      ownerEmail: string
      projectTitle: string
    }[]
    return c.json({ sessions: rows })
  })

  admin.get('/sessions/:id', (c) => {
    const session = getSession(db, c.req.param('id'))
    if (!session) return c.json({ error: 'Oturum bulunamadı.' }, 404)
    const owner = db
      .prepare(`SELECT id, email, name FROM users WHERE id = ?`)
      .get(session.userId) as { id: string; email: string; name: string | null } | undefined
    return c.json({
      session,
      owner: owner ?? null,
      operations: listSessionOperations(db, session.id),
    })
  })

  admin.get('/subscriptions', (c) => {
    const rows = db
      .prepare(
        `SELECT s.id, s.user_id, s.plan_id, s.status, s.current_period_start, s.current_period_end,
                s.next_renewal_at, s.cancelled_at, s.created_at, s.updated_at,
                u.email AS ownerEmail, p.label AS planLabel, p.monthly_credits AS monthlyCredits,
                p.monthly_price AS monthlyPrice
         FROM subscriptions s
         JOIN users u ON u.id = s.user_id
         JOIN subscription_plans p ON p.id = s.plan_id
         ORDER BY s.updated_at DESC`,
      )
      .all() as Record<string, unknown>[]
    return c.json({ subscriptions: rows })
  })

  admin.get('/reservations', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const status = (c.req.query('status') ?? '').trim()
    const rows = status
      ? (db
          .prepare(
            `SELECT r.id, r.user_id, r.amount, r.status, r.operation, r.created_at, r.finalized_at, u.email AS ownerEmail
             FROM credit_reservations r
             JOIN users u ON u.id = r.user_id
             WHERE r.status = ?
             ORDER BY r.created_at DESC
             LIMIT ?`,
          )
          .all(status, limit) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT r.id, r.user_id, r.amount, r.status, r.operation, r.created_at, r.finalized_at, u.email AS ownerEmail
             FROM credit_reservations r
             JOIN users u ON u.id = r.user_id
             ORDER BY r.created_at DESC
             LIMIT ?`,
          )
          .all(limit) as Record<string, unknown>[])
    return c.json({ reservations: rows })
  })

  admin.get('/events', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const type = (c.req.query('type') ?? '').trim()
    const rows = type
      ? (db
          .prepare(
            `SELECT e.id, e.user_id, e.event_type, e.operation_id, e.reservation_id, e.project_id,
                    e.session_id, e.amount, e.created_at, u.email AS ownerEmail
             FROM credit_events e
             JOIN users u ON u.id = e.user_id
             WHERE e.event_type = ?
             ORDER BY e.created_at DESC
             LIMIT ?`,
          )
          .all(type, limit) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT e.id, e.user_id, e.event_type, e.operation_id, e.reservation_id, e.project_id,
                    e.session_id, e.amount, e.created_at, u.email AS ownerEmail
             FROM credit_events e
             JOIN users u ON u.id = e.user_id
             ORDER BY e.created_at DESC
             LIMIT ?`,
          )
          .all(limit) as Record<string, unknown>[])
    return c.json({ events: rows })
  })

  admin.get('/operations', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const rows = db
      .prepare(
        `SELECT o.id, o.session_id, o.project_id, o.user_id, o.operation_id, o.credit_cost, o.status,
                o.feedback_text, o.classified_operation, o.created_at, o.completed_at,
                u.email AS ownerEmail
         FROM design_operations o
         JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Record<string, unknown>[]
    return c.json({ operations: rows })
  })

  admin.get('/refunds', (c) => {
    const limit = adminLimit(c.req.query('limit'), 200)
    const rows = db
      .prepare(
        `SELECT r.id, r.user_id, r.reservation_id, r.order_id, r.amount, r.reason, r.admin_user_id, r.created_at,
                u.email AS ownerEmail
         FROM refunds r
         JOIN users u ON u.id = r.user_id
         ORDER BY r.created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Record<string, unknown>[]
    return c.json({ refunds: rows })
  })

  app.route('/api/admin', admin)

  return app
}
