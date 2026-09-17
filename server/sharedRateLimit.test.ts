/**
 * The limit has to mean one thing however many processes are serving.
 *
 * It did not. The counters lived in a module-level Map, so each process granted the full allowance:
 * behind a load balancer, or four worker processes on one box, the published limit was silently
 * multiplied by the number of workers. A rate limit that scales with your own capacity is not a
 * rate limit.
 *
 * Two independent `createApp` instances over one database file stand in for two processes here —
 * that is precisely the production shape, since what they share is the file and nothing else. The
 * in-memory path is deliberately still covered in `security.test.ts`: it remains correct for a
 * caller with no database, and it is the only place the window arithmetic is tested directly.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { checkRateLimitShared, resetSharedRateLimits, RATE_LIMIT_WINDOW_MS } from './security.ts'

describe('shared rate limit — one allowance across processes', () => {
  let db: FormaDb
  let dbPath: string

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `forma-rl-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
    db = openDb(dbPath)
    resetSharedRateLimits(db)
  })

  afterEach(() => {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(`${dbPath}${suffix}`)
      } catch {
        /* ignore */
      }
    }
  })

  it('counts up to the limit and then denies', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimitShared(db, 'auth:1.2.3.4', 5).ok, `call ${i + 1}`).toBe(true)
    }
    const denied = checkRateLimitShared(db, 'auth:1.2.3.4', 5)
    expect(denied.ok).toBe(false)
    if (!denied.ok) expect(denied.retryAfterSec).toBeGreaterThan(0)
  })

  it('keys are independent, so one address cannot exhaust another', () => {
    for (let i = 0; i < 5; i++) checkRateLimitShared(db, 'auth:1.1.1.1', 5)
    expect(checkRateLimitShared(db, 'auth:1.1.1.1', 5).ok).toBe(false)
    expect(checkRateLimitShared(db, 'auth:2.2.2.2', 5).ok, 'a different IP was punished').toBe(true)
  })

  it('scopes are independent, so login cannot exhaust checkout', () => {
    for (let i = 0; i < 5; i++) checkRateLimitShared(db, 'auth:9.9.9.9', 5)
    expect(checkRateLimitShared(db, 'auth:9.9.9.9', 5).ok).toBe(false)
    expect(checkRateLimitShared(db, 'checkout:9.9.9.9', 5).ok, 'checkout shared the auth bucket').toBe(true)
  })

  it('the window expires, and an expired window is forgotten rather than accumulated', () => {
    const t0 = Date.now()
    for (let i = 0; i < 5; i++) checkRateLimitShared(db, 'auth:8.8.8.8', 5, t0)
    expect(checkRateLimitShared(db, 'auth:8.8.8.8', 5, t0).ok).toBe(false)

    const later = t0 + RATE_LIMIT_WINDOW_MS + 1
    expect(checkRateLimitShared(db, 'auth:8.8.8.8', 5, later).ok, 'the window never reopened').toBe(true)

    // The sweep runs on the same path, so nothing expired should be left behind.
    const stale = db
      .prepare(`SELECT COUNT(*) AS n FROM rate_limit_counters WHERE reset_at <= ?`)
      .get(later) as { n: number }
    expect(stale.n, 'expired rows accumulated').toBe(0)
  })

  it('a second app instance on the same database shares the allowance', async () => {
    // The whole point. Two apps, one file — what two processes behind a balancer actually share.
    delete process.env.FORMA_RATE_LIMIT_DISABLED
    process.env.FORMA_RATE_LIMIT_AUTH = '4'
    try {
      const a = createApp(db)
      const b = createApp(db)
      const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': '5.5.5.5' }
      const attempt = (app: ReturnType<typeof createApp>, n: number) =>
        app.request('/api/auth/login', {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: `nobody-${n}@forma.test`, password: 'wrong-password' }),
        })

      // Four allowed, alternating between the two instances.
      const statuses: number[] = []
      for (let i = 0; i < 4; i++) statuses.push((await attempt(i % 2 === 0 ? a : b, i)).status)
      expect(statuses.every((s) => s !== 429), `spent the allowance early: ${statuses.join(',')}`).toBe(true)

      // The fifth must be refused whichever instance receives it — before this change instance `b`
      // would have had a whole fresh allowance of its own.
      expect((await attempt(b, 98)).status, 'instance B granted a second allowance').toBe(429)
      expect((await attempt(a, 99)).status, 'instance A granted a second allowance').toBe(429)
    } finally {
      delete process.env.FORMA_RATE_LIMIT_AUTH
      process.env.FORMA_RATE_LIMIT_DISABLED = '1'
    }
  })

  it('the refusal tells the caller when to come back', async () => {
    delete process.env.FORMA_RATE_LIMIT_DISABLED
    process.env.FORMA_RATE_LIMIT_AUTH = '1'
    try {
      const app = createApp(db)
      const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': '6.6.6.6' }
      const body = JSON.stringify({ email: 'nobody@forma.test', password: 'wrong-password' })
      await app.request('/api/auth/login', { method: 'POST', headers, body })
      const blocked = await app.request('/api/auth/login', { method: 'POST', headers, body })
      expect(blocked.status).toBe(429)
      expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
    } finally {
      delete process.env.FORMA_RATE_LIMIT_AUTH
      process.env.FORMA_RATE_LIMIT_DISABLED = '1'
    }
  })
})
