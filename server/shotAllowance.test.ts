/**
 * One credit buys one shot, and a shot is six variations.
 *
 * The client signals "another variation of what I already paid for" by reusing the shot's
 * `clientRequestId`. That has to be enforced here rather than trusted, for the ordinary reason: a
 * client that decides its own price is not a price. So this drives the HTTP endpoint and watches
 * the balance, not the internals.
 *
 * Both directions are failures. Charging twice for one shot bills the customer for a click that
 * changed nothing; never charging again hands out unlimited designs to anyone willing to send the
 * same id forever.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { CREDIT_COSTS, SHOT_VARIATIONS, STARTING_CREDITS } from './credits.ts'

describe('shot allowance — a credit buys six variations', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `forma-shot-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
    db = openDb(dbPath)
    app = createApp(db)
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

  async function register() {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `shot-${Math.random().toString(16).slice(2)}@forma.test`, password: 'secret123', name: 'Shot' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { token: string }
    return { Authorization: `Bearer ${body.token}`, 'Content-Type': 'application/json' }
  }

  async function reserve(auth: Record<string, string>, shot: string, variationIndex: number, operation = 'generate') {
    const res = await app.request('/api/credits/reserve', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ operation, clientRequestId: shot, variationIndex }),
    })
    return { status: res.status, body: (await res.json()) as Record<string, unknown> }
  }

  async function balance(auth: Record<string, string>) {
    const res = await app.request('/api/credits/balance', { headers: auth })
    return Number((await res.json() as { balance: number }).balance)
  }

  it(`charges once for ${SHOT_VARIATIONS} variations of the same shot`, async () => {
    const auth = await register()
    const before = await balance(auth)
    expect(before).toBe(STARTING_CREDITS)

    const ids: string[] = []
    for (let v = 0; v < SHOT_VARIATIONS; v++) {
      const { status, body } = await reserve(auth, 'shot-a', v)
      expect(status, `variation ${v}`).toBe(200)
      ids.push(String(body.reservationId))
    }
    // All six are the same reservation — the customer bought one thing.
    expect(new Set(ids).size).toBe(1)
    expect(await balance(auth)).toBe(before - CREDIT_COSTS.generate)
  })

  it('reports how many variations are left', async () => {
    const auth = await register()
    const first = await reserve(auth, 'shot-b', 0)
    expect(first.body.usesLeft).toBe(SHOT_VARIATIONS - 1)
    const third = await reserve(auth, 'shot-b', 2)
    expect(third.body.usesLeft).toBe(SHOT_VARIATIONS - 2)
  })

  it('re-rendering a variation already served is free and does not use the allowance', async () => {
    // This is the copy-edit case: the customer fixes a line of text on a design they are looking
    // at, the face is regenerated, and none of that is a new design.
    const auth = await register()
    await reserve(auth, 'shot-c', 0)
    const before = await balance(auth)
    for (let i = 0; i < 20; i++) {
      const { status, body } = await reserve(auth, 'shot-c', 0)
      expect(status).toBe(200)
      expect(body.usesLeft).toBe(SHOT_VARIATIONS - 1)
    }
    expect(await balance(auth)).toBe(before)
  })

  it(`refuses a ${SHOT_VARIATIONS + 1}th distinct variation instead of giving it away`, async () => {
    const auth = await register()
    for (let v = 0; v < SHOT_VARIATIONS; v++) expect((await reserve(auth, 'shot-d', v)).status).toBe(200)
    const over = await reserve(auth, 'shot-d', SHOT_VARIATIONS)
    expect(over.status).toBe(409)
    expect(String(over.body.error)).toMatch(/varyasyon/i)
  })

  it('a different shot is a different decision and is charged again', async () => {
    // Priced as a revision: the starting grant is exactly one initial design plus one revision, so
    // two `generate` shots cannot both be paid for and the second would fail for lack of funds
    // rather than telling us anything about shot identity.
    const auth = await register()
    const before = await balance(auth)
    const a = await reserve(auth, 'shot-e', 0, 'revise')
    const b = await reserve(auth, 'shot-f', 0, 'revise')
    expect(a.body.reservationId).not.toBe(b.body.reservationId)
    expect(await balance(auth)).toBe(before - CREDIT_COSTS.revise * 2)
  })

  it('one user’s shot id cannot spend against another user’s wallet', async () => {
    const a = await register()
    const b = await register()
    await reserve(a, 'shared-id', 0, 'revise')
    const beforeB = await balance(b)
    await reserve(b, 'shared-id', 0, 'revise')
    expect(await balance(b), 'B was charged for their own shot').toBe(beforeB - CREDIT_COSTS.revise)
  })
})
