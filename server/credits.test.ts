import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { CREDIT_COSTS, STARTING_CREDITS } from './credits.ts'

describe('Phase 7 credit metering', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `forma-credits-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
    )
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

  async function register(email = 'credits@forma.test') {
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name: 'Credits' }),
    })
    expect(reg.status).toBe(201)
    const body = await json(reg)
    const token = String(body.token)
    const user = body.user as { id: string; email: string }
    return {
      token,
      user,
      auth: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  }

  it('register → balance STARTING → reserve generate → balance-3 → commit', async () => {
    const { auth } = await register()

    const bal = await app.request('/api/credits/balance', { headers: auth })
    expect(bal.status).toBe(200)
    const balBody = await json(bal)
    expect(balBody.balance).toBe(STARTING_CREDITS)
    expect(balBody.currency).toBe('credits')

    const reserve = await app.request('/api/credits/reserve', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ operation: 'generate', clientRequestId: 'attempt-1' }),
    })
    expect(reserve.status).toBe(200)
    const reserveBody = await json(reserve)
    expect(reserveBody.amount).toBe(CREDIT_COSTS.generate)
    expect(reserveBody.balance).toBe(STARTING_CREDITS - CREDIT_COSTS.generate)
    expect(typeof reserveBody.reservationId).toBe('string')

    const mid = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(mid.balance).toBe(47)

    const commit = await app.request('/api/credits/commit', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserveBody.reservationId }),
    })
    expect(commit.status).toBe(200)
    const commitBody = await json(commit)
    expect(commitBody.status).toBe('committed')
    expect(commitBody.balance).toBe(47)

    const txs = await json(await app.request('/api/credits/transactions?limit=10', { headers: auth }))
    const kinds = (txs.transactions as { kind: string }[]).map((t) => t.kind)
    expect(kinds).toContain('grant')
    expect(kinds).toContain('reserve')
    expect(kinds).toContain('commit')
  })

  it('refund path restores balance', async () => {
    const { auth } = await register('refund@forma.test')

    const reserve = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'revise' }),
      }),
    )
    expect(reserve.amount).toBe(CREDIT_COSTS.revise)
    expect(reserve.balance).toBe(STARTING_CREDITS - CREDIT_COSTS.revise)

    const refund = await app.request('/api/credits/refund', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserve.reservationId, reason: 'engine_fail' }),
    })
    expect(refund.status).toBe(200)
    const refundBody = await json(refund)
    expect(refundBody.status).toBe('refunded')
    expect(refundBody.balance).toBe(STARTING_CREDITS)

    const bal = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(bal.balance).toBe(STARTING_CREDITS)
  })

  it('insufficient funds → 402', async () => {
    const { auth, user } = await register('poor@forma.test')
    // drain wallet via sequential reserves until near zero, then force 402
    db.prepare(`UPDATE wallets SET balance = 2, updated_at = ? WHERE user_id = ?`).run(
      new Date().toISOString(),
      user.id,
    )

    const reserve = await app.request('/api/credits/reserve', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ operation: 'generate' }),
    })
    expect(reserve.status).toBe(402)
    const body = await json(reserve)
    expect(String(body.error)).toMatch(/yetersiz/i)
  })

  it('double commit → 409; double refund → 409', async () => {
    const { auth } = await register('double@forma.test')
    const reserve = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'generate' }),
      }),
    )

    const c1 = await app.request('/api/credits/commit', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserve.reservationId }),
    })
    expect(c1.status).toBe(200)

    const c2 = await app.request('/api/credits/commit', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserve.reservationId }),
    })
    expect(c2.status).toBe(409)

    const reserve2 = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'generate' }),
      }),
    )
    const r1 = await app.request('/api/credits/refund', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserve2.reservationId }),
    })
    expect(r1.status).toBe(200)
    const r2 = await app.request('/api/credits/refund', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ reservationId: reserve2.reservationId }),
    })
    expect(r2.status).toBe(409)
  })

  it('idempotent reserve on clientRequestId; sequential double reserve races safely', async () => {
    const { auth } = await register('idem@forma.test')

    const a = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'generate', clientRequestId: 'same-attempt' }),
      }),
    )
    const b = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'generate', clientRequestId: 'same-attempt' }),
      }),
    )
    expect(a.reservationId).toBe(b.reservationId)
    expect(b.idempotent).toBe(true)

    const bal = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(bal.balance).toBe(STARTING_CREDITS - CREDIT_COSTS.generate)

    // sequential second distinct reserve
    const c = await json(
      await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ operation: 'revise', clientRequestId: 'attempt-2' }),
      }),
    )
    expect(c.balance).toBe(STARTING_CREDITS - CREDIT_COSTS.generate - CREDIT_COSTS.revise)
    expect(c.amount).toBe(CREDIT_COSTS.revise)
  })

  it('admin adjust works; non-admin forbidden', async () => {
    const { auth, user } = await register('adminish@forma.test')
    const denied = await app.request('/api/credits/adjust', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ userId: user.id, amount: 10, reason: 'bonus' }),
    })
    expect(denied.status).toBe(403)

    db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(user.id)
    const ok = await app.request('/api/credits/adjust', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ userId: user.id, amount: 10, reason: 'bonus' }),
    })
    expect(ok.status).toBe(200)
    const body = await json(ok)
    expect(body.balance).toBe(STARTING_CREDITS + 10)
  })
})
