import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  createSession,
  deleteSession,
  hashPassword,
  newId,
  requireAuth,
  toPublicUser,
  validateEmail,
  validatePassword,
  verifyPassword,
  type AuthVars,
  type PublicUser,
} from './auth.ts'
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
  type MeteredOperation,
} from './credits.ts'
import { CREDIT_PACKS, PLANS } from './billing/catalog.ts'
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
import { bodyLimit } from 'hono/body-limit'
import {
  BODY_TOO_LARGE_TR,
  corsOrigins,
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
      origin: corsOrigins(),
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
    if (!row || !verifyPassword(password, row.password_hash)) {
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
    return c.json({ balance: getBalance(db, user.id), currency: 'credits' })
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
    return c.json({
      plans: PLANS.map((p) => ({
        id: p.id,
        label: p.label,
        monthlyCredits: p.monthlyCredits,
        priceTry: p.priceTry,
        displayOnly: p.displayOnly,
        description: p.description,
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
    const rows = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.created_at,
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
      balance: number
    }[]
    return c.json({
      users: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        created_at: r.created_at,
        balance: r.balance,
      })),
    })
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
    return c.json({
      users,
      projects,
      paidOrders,
      totalCreditsGranted: grantsRow.total,
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

  app.route('/api/admin', admin)

  return app
}
