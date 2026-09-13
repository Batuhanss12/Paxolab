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
})
