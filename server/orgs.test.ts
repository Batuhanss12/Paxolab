import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { upsertGoogleUser } from './authGoogle.ts'
import { STARTING_CREDITS } from './credits.ts'

describe('orgs + google auth', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>
  let prevAdmin: string | undefined

  beforeEach(() => {
    prevAdmin = process.env.FORMA_ADMIN_EMAIL
    delete process.env.FORMA_ADMIN_EMAIL
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    dbPath = path.join(
      os.tmpdir(),
      `forma-orgs-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
    )
    db = openDb(dbPath)
    app = createApp(db)
  })

  afterEach(() => {
    if (prevAdmin === undefined) delete process.env.FORMA_ADMIN_EMAIL
    else process.env.FORMA_ADMIN_EMAIL = prevAdmin
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
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name }),
    })
    expect(res.status).toBe(201)
    const body = await json(res)
    const token = String(body.token)
    const user = body.user as { id: string; email: string; role: string }
    return {
      token,
      user,
      auth: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  }

  it('google status is unconfigured without keys', async () => {
    const res = await app.request('/api/auth/google/status')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.configured).toBe(false)
    expect(String(body.redirectUri)).toContain('/api/auth/google/callback')
  })

  it('google start returns 503 without keys', async () => {
    const res = await app.request('/api/auth/google', {
      headers: { Accept: 'application/json' },
    })
    expect(res.status).toBe(503)
  })

  it('upsertGoogleUser creates wallet and blocks password login', async () => {
    const user = upsertGoogleUser(db, {
      sub: 'google-sub-1',
      email: 'google.user@test.local',
      email_verified: true,
      name: 'G User',
    })
    expect(user.email).toBe('google.user@test.local')
    expect(user.auth_provider).toBe('google')
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'google.user@test.local', password: 'secret123' }),
    })
    expect(login.status).toBe(401)
    const body = await json(login)
    expect(String(body.error)).toMatch(/Google/i)
  })

  it('links google sub onto an existing password account', async () => {
    const { user } = await register('link@test.local', 'Link')
    const linked = upsertGoogleUser(db, {
      sub: 'google-sub-link',
      email: 'link@test.local',
      email_verified: true,
      name: 'Link',
    })
    expect(linked.id).toBe(user.id)
    const row = db.prepare(`SELECT google_sub, auth_provider FROM users WHERE id = ?`).get(user.id) as {
      google_sub: string
      auth_provider: string
    }
    expect(row.google_sub).toBe('google-sub-link')
    expect(row.auth_provider).toContain('google')
  })

  it('creates a company, blocks extra seats on Başlangıç, invites after Plus', async () => {
    const owner = await register('owner@org.test', 'Owner')
    const created = await app.request('/api/orgs', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ name: 'North Studio' }),
    })
    expect(created.status).toBe(201)
    const createdBody = await json(created)
    const org = createdBody.organization as { id: string; slug: string; seatLimit: number }
    expect(org.slug).toBe('north-studio')
    expect(org.seatLimit).toBe(1)

    const dup = await app.request('/api/orgs', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ name: 'Second' }),
    })
    expect(dup.status).toBe(409)

    const blocked = await app.request(`/api/orgs/${org.id}/invites`, {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ email: 'mate@org.test', role: 'member' }),
    })
    expect(blocked.status).toBe(402)

    const sub = await app.request('/api/billing/subscribe', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ planId: 'plus' }),
    })
    expect(sub.status).toBe(201)

    const invited = await app.request(`/api/orgs/${org.id}/invites`, {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ email: 'mate@org.test', role: 'member' }),
    })
    expect(invited.status).toBe(201)
    const invite = (await json(invited)).invite as { token: string; email: string }
    expect(invite.email).toBe('mate@org.test')

    const mate = await register('mate@org.test', 'Mate')
    const accept = await app.request(`/api/orgs/invites/${invite.token}/accept`, {
      method: 'POST',
      headers: mate.auth,
    })
    expect(accept.status).toBe(200)

    const detail = await app.request(`/api/orgs/${org.id}`, { headers: mate.auth })
    expect(detail.status).toBe(200)
    const detailBody = await json(detail)
    const members = detailBody.members as { email: string }[]
    expect(members.map((m) => m.email).sort()).toEqual(['mate@org.test', 'owner@org.test'])
  })

  it('agency company members inherit unlimited metering', async () => {
    const owner = await register('agency.owner@org.test', 'AO')
    const created = await app.request('/api/orgs', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ name: 'Agency Co' }),
    })
    const org = (await json(created)).organization as { id: string }
    const sub = await app.request('/api/billing/subscribe', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ planId: 'agency' }),
    })
    expect(sub.status).toBe(201)
    const invited = await app.request(`/api/orgs/${org.id}/invites`, {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ email: 'agency.mate@org.test' }),
    })
    const token = ((await json(invited)).invite as { token: string }).token
    const mate = await register('agency.mate@org.test', 'AM')
    await app.request(`/api/orgs/invites/${token}/accept`, { method: 'POST', headers: mate.auth })

    const bal = await app.request('/api/credits/balance', { headers: mate.auth })
    const balBody = await json(bal)
    expect(balBody.unlimited).toBe(true)

    const reserve = await app.request('/api/credits/reserve', {
      method: 'POST',
      headers: mate.auth,
      body: JSON.stringify({ operation: 'generate' }),
    })
    expect(reserve.status).toBe(200)
    const reserved = await json(reserve)
    expect(reserved.amount).toBe(0)
    expect(getBalanceAfter(db, owner.user.id)).toBe(STARTING_CREDITS)
  })

  it('admin can list companies and cannot drop the last admin', async () => {
    const owner = await register('firm@org.test', 'F')
    await app.request('/api/orgs', {
      method: 'POST',
      headers: owner.auth,
      body: JSON.stringify({ name: 'Listed Co' }),
    })
    db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(owner.user.id)
    const orgs = await app.request('/api/admin/orgs', { headers: owner.auth })
    expect(orgs.status).toBe(200)
    const listed = (await json(orgs)).organizations as { name: string }[]
    expect(listed.some((o) => o.name === 'Listed Co')).toBe(true)

    const demote = await app.request(`/api/admin/users/${owner.user.id}`, {
      method: 'PATCH',
      headers: owner.auth,
      body: JSON.stringify({ role: 'user' }),
    })
    expect(demote.status).toBe(400)
  })
})

function getBalanceAfter(db: FormaDb, userId: string): number {
  return (db.prepare(`SELECT balance FROM wallets WHERE user_id = ?`).get(userId) as { balance: number }).balance
}
