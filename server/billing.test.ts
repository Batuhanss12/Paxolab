import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { STARTING_CREDITS } from './credits.ts'
import { CREDIT_PACKS, PLANS } from './billing/catalog.ts'

describe('Phase 8 billing (mock)', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>
  let savedEnv: Record<string, string | undefined>

  beforeEach(() => {
    savedEnv = {
      IYZI_API_KEY: process.env.IYZI_API_KEY,
      IYZI_SECRET_KEY: process.env.IYZI_SECRET_KEY,
    }
    delete process.env.IYZI_API_KEY
    delete process.env.IYZI_SECRET_KEY

    dbPath = path.join(
      os.tmpdir(),
      `forma-billing-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
    )
    db = openDb(dbPath)
    app = createApp(db)
  })

  afterEach(() => {
    if (savedEnv.IYZI_API_KEY === undefined) delete process.env.IYZI_API_KEY
    else process.env.IYZI_API_KEY = savedEnv.IYZI_API_KEY
    if (savedEnv.IYZI_SECRET_KEY === undefined) delete process.env.IYZI_SECRET_KEY
    else process.env.IYZI_SECRET_KEY = savedEnv.IYZI_SECRET_KEY

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

  async function register(email = 'billing@forma.test') {
    const reg = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name: 'Billing' }),
    })
    expect(reg.status).toBe(201)
    const body = await json(reg)
    const token = String(body.token)
    return {
      token,
      user: body.user as { id: string; email: string },
      auth: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  }

  it('GET packs and plans', async () => {
    const packsRes = await app.request('/api/billing/packs')
    expect(packsRes.status).toBe(200)
    const packsBody = await json(packsRes)
    const packs = packsBody.packs as { id: string; credits: number; priceTry: number }[]
    expect(packs).toHaveLength(CREDIT_PACKS.length)
    expect(packs.map((p) => p.id)).toEqual(['pack_50', 'pack_150', 'pack_400'])
    expect(packs.find((p) => p.id === 'pack_50')?.credits).toBe(50)
    expect(packs.find((p) => p.id === 'pack_50')?.priceTry).toBe(99)

    const plansRes = await app.request('/api/billing/plans')
    expect(plansRes.status).toBe(200)
    const plansBody = await json(plansRes)
    const plans = plansBody.plans as { id: string; monthlyCredits: number; displayOnly: boolean }[]
    expect(plans).toHaveLength(PLANS.length)
    expect(plans.find((p) => p.id === 'pro')?.monthlyCredits).toBe(200)
    expect(plans.find((p) => p.id === 'pro')?.displayOnly).toBe(true)
  })

  it('mock checkout → complete → balance increases; double complete no double grant', async () => {
    const { auth } = await register()

    const bal0 = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(bal0.balance).toBe(STARTING_CREDITS)

    const checkout = await app.request('/api/billing/checkout', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ packId: 'pack_150' }),
    })
    expect(checkout.status).toBe(200)
    const checkoutBody = await json(checkout)
    expect(checkoutBody.mode).toBe('mock')
    expect(checkoutBody.orderId).toBeTruthy()
    expect(String(checkoutBody.paymentPageUrl)).toContain(
      `/billing/mock-pay?orderId=${checkoutBody.orderId}`,
    )

    const complete = await app.request('/api/billing/mock/complete', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ orderId: checkoutBody.orderId }),
    })
    expect(complete.status).toBe(200)
    const completeBody = await json(complete)
    expect(completeBody.ok).toBe(true)
    expect(completeBody.alreadyPaid).toBe(false)
    expect(completeBody.balance).toBe(STARTING_CREDITS + 150)

    const bal1 = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(bal1.balance).toBe(STARTING_CREDITS + 150)

    const again = await app.request('/api/billing/mock/complete', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ orderId: checkoutBody.orderId }),
    })
    expect(again.status).toBe(200)
    const againBody = await json(again)
    expect(againBody.alreadyPaid).toBe(true)
    expect(againBody.creditsGranted).toBe(0)
    expect(againBody.balance).toBe(STARTING_CREDITS + 150)

    const bal2 = await json(await app.request('/api/credits/balance', { headers: auth }))
    expect(bal2.balance).toBe(STARTING_CREDITS + 150)

    const txs = await json(await app.request('/api/credits/transactions?limit=20', { headers: auth }))
    const purchaseGrants = (
      txs.transactions as { kind: string; amount: number; meta: { reason?: string } | null }[]
    ).filter((t) => t.kind === 'grant' && t.meta?.reason === 'purchase')
    expect(purchaseGrants).toHaveLength(1)
    expect(purchaseGrants[0].amount).toBe(150)
  })

  it('checkout rejects unknown pack', async () => {
    const { auth } = await register('badpack@forma.test')
    const res = await app.request('/api/billing/checkout', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ packId: 'nope' }),
    })
    expect(res.status).toBe(400)
  })

  it('mock complete requires auth and ownership', async () => {
    const a = await register('owner@forma.test')
    const b = await register('other@forma.test')
    const checkout = await json(
      await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: a.auth,
        body: JSON.stringify({ packId: 'pack_50' }),
      }),
    )
    const stolen = await app.request('/api/billing/mock/complete', {
      method: 'POST',
      headers: b.auth,
      body: JSON.stringify({ orderId: checkout.orderId }),
    })
    expect(stolen.status).toBe(403)
  })
})
