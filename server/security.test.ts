import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import {
  BODY_TOO_LARGE_TR,
  RATE_LIMIT_TR,
  checkRateLimit,
  redactSecrets,
  resetRateLimitMap,
} from './security.ts'

describe('security helpers', () => {
  beforeEach(() => {
    resetRateLimitMap()
  })

  it('redactSecrets hides password, token, and iyzico keys', () => {
    const out = redactSecrets({
      email: 'a@b.co',
      password: 'super-secret',
      token: 'abc123',
      IYZI_SECRET_KEY: 'xyz',
      nested: { authorization: 'Bearer x', ok: true },
    }) as Record<string, unknown>
    expect(out.email).toBe('a@b.co')
    expect(out.password).toBe('[redacted]')
    expect(out.token).toBe('[redacted]')
    expect(out.IYZI_SECRET_KEY).toBe('[redacted]')
    expect((out.nested as { authorization: string; ok: boolean }).authorization).toBe(
      '[redacted]',
    )
    expect((out.nested as { ok: boolean }).ok).toBe(true)
  })

  it('checkRateLimit returns 429-equivalent after threshold', () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit('unit:ip', 20).ok).toBe(true)
    }
    const blocked = checkRateLimit('unit:ip', 20)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })
})

describe('Phase 10 API hardening', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {
      FORMA_RATE_LIMIT_DISABLED: process.env.FORMA_RATE_LIMIT_DISABLED,
      FORMA_RATE_LIMIT_AUTH: process.env.FORMA_RATE_LIMIT_AUTH,
      FORMA_RATE_LIMIT_CHECKOUT: process.env.FORMA_RATE_LIMIT_CHECKOUT,
      FORMA_MAX_BODY_BYTES: process.env.FORMA_MAX_BODY_BYTES,
    }
    process.env.FORMA_RATE_LIMIT_DISABLED = '1'
    delete process.env.FORMA_RATE_LIMIT_AUTH
    delete process.env.FORMA_RATE_LIMIT_CHECKOUT
    delete process.env.FORMA_MAX_BODY_BYTES
    resetRateLimitMap()

    dbPath = path.join(
      os.tmpdir(),
      `forma-sec-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
    )
    db = openDb(dbPath)
    app = createApp(db)
  })

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    resetRateLimitMap()
    try {
      db.close()
    } catch {
      /* already closed in a test */
    }
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

  it('health includes db ok and time', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.ok).toBe(true)
    expect(body.service).toBe('forma-api')
    expect(body.db).toBe('ok')
    expect(typeof body.time).toBe('string')
    expect(String(body.time).length).toBeGreaterThan(10)
  })

  it('health reports db error after close', async () => {
    db.close()
    const res = await app.request('/api/health')
    expect(res.status).toBe(503)
    const body = await json(res)
    expect(body.ok).toBe(false)
    expect(body.db).toBe('error')
    expect(body.service).toBe('forma-api')
  })

  it('sets security headers on API responses', async () => {
    const res = await app.request('/api/health')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
    const csp = res.headers.get('Content-Security-Policy') ?? ''
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('rate limit returns 429 after threshold', async () => {
    process.env.FORMA_RATE_LIMIT_DISABLED = ''
    delete process.env.FORMA_RATE_LIMIT_DISABLED
    process.env.FORMA_RATE_LIMIT_AUTH = '3'
    resetRateLimitMap()

    const hit = () =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@forma.test', password: 'whatever1' }),
      })

    for (let i = 0; i < 3; i++) {
      const res = await hit()
      expect(res.status).toBe(401)
    }
    const blocked = await hit()
    expect(blocked.status).toBe(429)
    const body = await json(blocked)
    expect(body.error).toBe(RATE_LIMIT_TR)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
  })

  it('FORMA_RATE_LIMIT_DISABLED=1 bypasses limiter', async () => {
    process.env.FORMA_RATE_LIMIT_DISABLED = '1'
    process.env.FORMA_RATE_LIMIT_AUTH = '2'
    resetRateLimitMap()

    for (let i = 0; i < 5; i++) {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@forma.test', password: 'whatever1' }),
      })
      expect(res.status).toBe(401)
    }
  })

  it('rejects absurd JSON bodies with 413', async () => {
    process.env.FORMA_MAX_BODY_BYTES = '64'
    app = createApp(db)
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200) }),
    })
    expect(res.status).toBe(413)
    const body = await json(res)
    expect(body.error).toBe(BODY_TOO_LARGE_TR)
  })
})
