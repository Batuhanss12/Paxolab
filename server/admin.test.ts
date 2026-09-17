import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { STARTING_CREDITS } from './credits.ts'

describe('Phase 9 admin + user orders', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>
  let prevAdminEmail: string | undefined

  beforeEach(() => {
    prevAdminEmail = process.env.FORMA_ADMIN_EMAIL
    delete process.env.FORMA_ADMIN_EMAIL
    dbPath = path.join(
      os.tmpdir(),
      `forma-admin-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
    )
    db = openDb(dbPath)
    app = createApp(db)
  })

  afterEach(() => {
    if (prevAdminEmail === undefined) delete process.env.FORMA_ADMIN_EMAIL
    else process.env.FORMA_ADMIN_EMAIL = prevAdminEmail
    db.close()
    try {
      fs.unlinkSync(dbPath)
      fs.unlinkSync(`${dbPath}-wal`)
      fs.unlinkSync(`${dbPath}-shm`)
    } catch {
      /* ignore */
    }
  })

  async function json(res: Response) {
    return res.json() as Promise<Record<string, unknown>>
  }

  async function register(email: string, name = 'User') {
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name }),
    })
    expect(reg.status).toBe(201)
    const body = await json(reg)
    const token = String(body.token)
    const user = body.user as { id: string; email: string; role: string }
    return {
      token,
      user,
      auth: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  }

  it('admin routes forbidden for normal user', async () => {
    const { auth } = await register('user@forma.test')
    const users = await app.request('/api/admin/users', { headers: auth })
    expect(users.status).toBe(403)
    const stats = await app.request('/api/admin/stats', { headers: auth })
    expect(stats.status).toBe(403)
    const adjust = await app.request('/api/admin/credits/adjust', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ userId: 'x', amount: 1 }),
    })
    expect(adjust.status).toBe(403)
    const orders = await app.request('/api/admin/orders', { headers: auth })
    expect(orders.status).toBe(403)
  })

  it('admin can list users, stats, adjust credits, list orders', async () => {
    const { auth: userAuth, user } = await register('member@forma.test', 'Member')
    db.prepare(`UPDATE users SET role = 'admin' WHERE email = ?`).run('member@forma.test')

    // re-login not needed — role is read from DB on each request via session→user
    const usersRes = await app.request('/api/admin/users', { headers: userAuth })
    expect(usersRes.status).toBe(200)
    const usersBody = await json(usersRes)
    const listed = usersBody.users as { id: string; email: string; balance: number; role: string }[]
    expect(listed.length).toBeGreaterThanOrEqual(1)
    expect(listed.some((u) => u.email === 'member@forma.test')).toBe(true)
    expect(listed.find((u) => u.id === user.id)?.balance).toBe(STARTING_CREDITS)

    const statsRes = await app.request('/api/admin/stats', { headers: userAuth })
    expect(statsRes.status).toBe(200)
    const stats = await json(statsRes)
    expect(stats.users).toBeGreaterThanOrEqual(1)
    expect(stats.projects).toBe(0)
    expect(stats.paidOrders).toBe(0)
    expect(stats.totalCreditsGranted).toBeGreaterThanOrEqual(STARTING_CREDITS)

    const adjust = await app.request('/api/admin/credits/adjust', {
      method: 'POST',
      headers: userAuth,
      body: JSON.stringify({ userId: user.id, amount: 25, reason: 'phase9-test' }),
    })
    expect(adjust.status).toBe(200)
    const adjBody = await json(adjust)
    expect(adjBody.balance).toBe(STARTING_CREDITS + 25)
    expect(adjBody.amount).toBe(25)

    // create a pending order via checkout mock path
    const checkout = await app.request('/api/billing/checkout', {
      method: 'POST',
      headers: userAuth,
      body: JSON.stringify({ packId: 'pack_50' }),
    })
    expect(checkout.status).toBe(200)

    const ordersRes = await app.request('/api/admin/orders?limit=10', { headers: userAuth })
    expect(ordersRes.status).toBe(200)
    const ordersBody = await json(ordersRes)
    expect((ordersBody.orders as unknown[]).length).toBeGreaterThanOrEqual(1)

    const myOrders = await app.request('/api/billing/orders', { headers: userAuth })
    expect(myOrders.status).toBe(200)
    const mine = await json(myOrders)
    expect((mine.orders as unknown[]).length).toBeGreaterThanOrEqual(1)
  })

  it('FORMA_ADMIN_EMAIL register becomes admin (case-insensitive)', async () => {
    process.env.FORMA_ADMIN_EMAIL = 'Admin@Forma.Local'
    const { user } = await register('admin@forma.local', 'Boss')
    expect(user.role).toBe('admin')

    const { user: other } = await register('other@forma.test')
    expect(other.role).toBe('user')
  })

  it('admin can load user detail, projects, sessions, subscriptions, events', async () => {
    const member = await register('detail@forma.test', 'Detail')
    db.prepare(`UPDATE users SET role = 'admin' WHERE email = ?`).run('detail@forma.test')
    const headers = member.auth

    const created = await app.request('/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Admin inspect', payload: { ok: true } }),
    })
    expect(created.status).toBe(201)
    const createdBody = await json(created)
    const project = createdBody.project as { id: string }

    const detail = await app.request(`/api/admin/users/${member.user.id}`, { headers })
    expect(detail.status).toBe(200)
    const detailBody = await json(detail)
    expect((detailBody.user as { email: string }).email).toBe('detail@forma.test')
    expect((detailBody.projects as { id: string }[]).some((p) => p.id === project.id)).toBe(true)

    const projects = await app.request('/api/admin/projects', { headers })
    expect(projects.status).toBe(200)
    const projectsBody = await json(projects)
    expect((projectsBody.projects as { id: string }[]).some((p) => p.id === project.id)).toBe(true)

    const projectDetail = await app.request(`/api/admin/projects/${project.id}`, { headers })
    expect(projectDetail.status).toBe(200)
    const projectBody = await json(projectDetail)
    expect((projectBody.owner as { email: string }).email).toBe('detail@forma.test')

    const sessions = await app.request('/api/admin/sessions', { headers })
    expect(sessions.status).toBe(200)
    expect(Array.isArray((await json(sessions)).sessions)).toBe(true)

    const subs = await app.request('/api/admin/subscriptions', { headers })
    expect(subs.status).toBe(200)
    const events = await app.request('/api/admin/events', { headers })
    expect(events.status).toBe(200)
    const ops = await app.request('/api/admin/operations', { headers })
    expect(ops.status).toBe(200)
    const reservations = await app.request('/api/admin/reservations', { headers })
    expect(reservations.status).toBe(200)

    const outsider = await register('outsider@forma.test')
    const forbidden = await app.request('/api/admin/projects', { headers: outsider.auth })
    expect(forbidden.status).toBe(403)
  })

  /**
   * R13 — field-name contracts the admin panel reads directly.
   *
   * The LLM cost table shipped with snake_case field names against a camelCase API and rendered
   * "Invalid Date / $0.0000"; nothing failed because the data was fetched but never displayed.
   * These assertions fail loudly if a response is renamed out from under the panel.
   */
  describe('admin API field contracts (panel reads these names)', () => {
    async function asAdmin(email = 'contract-admin@forma.test') {
      const { auth } = await register(email, 'Contract Admin')
      db.prepare(`UPDATE users SET role = 'admin' WHERE email = ?`).run(email)
      return auth
    }

    it('/users exposes both the personal wallet and the billing wallet', async () => {
      const auth = await asAdmin()
      const body = await json(await app.request('/api/admin/users', { headers: auth }))
      const row = (body.users as Record<string, unknown>[])[0]
      expect(row).toBeTruthy()
      for (const key of ['id', 'email', 'role', 'balance', 'billingUserId', 'billingBalance', 'sharedWallet']) {
        expect(Object.keys(row)).toContain(key)
      }
      // A user with no org bills their own wallet — the panel prints "kendi" for this shape.
      expect(row.sharedWallet).toBe(false)
      expect(row.billingUserId).toBe(row.id)
      expect(row.billingBalance).toBe(row.balance)
    })

    it('/llm-costs is camelCase — the panel formats these two fields', async () => {
      const auth = await asAdmin('contract-llm@forma.test')
      const res = await app.request('/api/admin/llm-costs?limit=5', { headers: auth })
      expect(res.status).toBe(200)
      const body = await json(res)
      expect(Array.isArray(body.costs)).toBe(true)
      db.prepare(
        `INSERT INTO llm_cost_records (id, operation_id, user_id, provider, model, input_tokens, output_tokens, estimated_cost_usd, created_at)
         VALUES ('c1','brief-extract',NULL,'openai','gpt-4o-mini',10,5,0.0012,?)`,
      ).run(new Date().toISOString())
      const after = await json(await app.request('/api/admin/llm-costs?limit=5', { headers: auth }))
      const row = (after.costs as Record<string, unknown>[])[0]
      expect(Object.keys(row)).toContain('estimatedCostUsd')
      expect(Object.keys(row)).toContain('createdAt')
      expect(row.estimatedCostUsd).toBe(0.0012)
      expect(Number.isNaN(new Date(String(row.createdAt)).getTime())).toBe(false)
    })

    it('/plans and /orgs/:id carry the fields the admin screens render', async () => {
      const auth = await asAdmin('contract-plans@forma.test')
      const plans = await json(await app.request('/api/admin/plans', { headers: auth }))
      const plan = (plans.plans as Record<string, unknown>[])[0]
      for (const key of ['id', 'label', 'monthlyPrice', 'monthlyCredits', 'enabled']) {
        expect(Object.keys(plan)).toContain(key)
      }

      const owner = await register('org-owner@forma.test', 'Owner')
      const created = await json(
        await app.request('/api/orgs', {
          method: 'POST',
          headers: owner.auth,
          body: JSON.stringify({ name: 'Contract Studio' }),
        }),
      )
      const orgId = String((created.organization as Record<string, unknown>).id)
      const detail = await json(await app.request(`/api/admin/orgs/${orgId}`, { headers: auth }))
      const org = detail.organization as Record<string, unknown>
      for (const key of ['id', 'name', 'slug', 'createdBy', 'createdAt', 'memberCount', 'seatLimit']) {
        expect(Object.keys(org)).toContain(key)
      }
      const member = (detail.members as Record<string, unknown>[])[0]
      for (const key of ['userId', 'email', 'role', 'createdAt']) {
        expect(Object.keys(member)).toContain(key)
      }
    })
  })
})
