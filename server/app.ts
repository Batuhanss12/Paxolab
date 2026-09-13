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

export function createApp(db: FormaDb): Hono<AppEnv> {
  const app = new Hono<AppEnv>()

  app.use(
    '*',
    cors({
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
      ],
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )

  app.get('/api/health', (c) => c.json({ ok: true, service: 'forma-api' }))

  app.post('/api/auth/register', async (c) => {
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
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, created_at, role) VALUES (?, ?, ?, ?, ?, 'user')`,
    ).run(id, email, password_hash, name, now)

    createWalletWithGrant(db, id)

    const user = toPublicUser(
      db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow,
    )
    const token = createSession(db, id)
    return c.json({ user, token }, 201)
  })

  app.post('/api/auth/login', async (c) => {
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
        : 'FORMA projesi'
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
        : existing?.title ?? 'FORMA projesi'
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

  return app
}
