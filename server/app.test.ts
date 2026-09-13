import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'

describe('FORMA API', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `forma-test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
    db = openDb(dbPath)
    app = createApp(db)
  })

  afterEach(() => {
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

  it('health ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.ok).toBe(true)
  })

  it('register → login → create project → get → me', async () => {
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@forma.test',
        password: 'secret123',
        name: 'Demo',
      }),
    })
    expect(reg.status).toBe(201)
    const regBody = await json(reg)
    expect((regBody.user as { email: string }).email).toBe('demo@forma.test')
    expect(typeof regBody.token).toBe('string')
    expect(String(regBody.token).length).toBeGreaterThanOrEqual(64)

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@forma.test', password: 'secret123' }),
    })
    expect(login.status).toBe(200)
    const loginBody = await json(login)
    const token = String(loginBody.token)
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const me = await app.request('/api/auth/me', { headers: auth })
    expect(me.status).toBe(200)
    const meBody = await json(me)
    expect((meBody.user as { email: string }).email).toBe('demo@forma.test')

    const created = await app.request('/api/projects', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        title: 'Serum kutusu',
        payload: { version: 1, state: { phase: 'workspace' } },
      }),
    })
    expect(created.status).toBe(201)
    const createdBody = await json(created)
    const project = createdBody.project as { id: string; title: string; payload: { version: number } }
    expect(project.title).toBe('Serum kutusu')
    expect(project.payload.version).toBe(1)

    const got = await app.request(`/api/projects/${project.id}`, { headers: auth })
    expect(got.status).toBe(200)
    const gotBody = await json(got)
    expect((gotBody.project as { id: string }).id).toBe(project.id)

    const list = await app.request('/api/projects', { headers: auth })
    expect(list.status).toBe(200)
    const listBody = await json(list)
    expect((listBody.projects as unknown[]).length).toBe(1)
  })

  it('rejects short password and unauthorized project access', async () => {
    const bad = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co', password: 'short' }),
    })
    expect(bad.status).toBe(400)

    const denied = await app.request('/api/projects')
    expect(denied.status).toBe(401)
  })
})
