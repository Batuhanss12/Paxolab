/**
 * What the money actually buys.
 *
 * Two different things are being sold and they are priced two orders of magnitude apart:
 *
 *   exploration — seeing what is possible. Every generating click costs, and that is the point:
 *                 a control that costs nothing is a control the customer stops reading.
 *   ownership   — taking one production file away. Priced like the design itself, because that is
 *                 what it is. Paying for a design includes one, so the first download of what you
 *                 just bought is already covered.
 *
 * Billing is the one place where being wrong is not a rendering artefact, so this drives the HTTP
 * surface and watches the balance rather than trusting any internal state.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, type FormaDb } from './db.ts'
import { CREDIT_COSTS, STARTING_CREDITS } from './credits.ts'
import { DOWNLOAD_COST, INITIAL_DESIGN_COST } from './billing/plansCatalog.ts'

describe('download entitlement — a design purchase includes one file', () => {
  let db: FormaDb
  let dbPath: string
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `forma-dl-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
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
      body: JSON.stringify({ email: `dl-${Math.random().toString(16).slice(2)}@forma.test`, password: 'secret123', name: 'DL' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { token: string }
    return { Authorization: `Bearer ${body.token}`, 'Content-Type': 'application/json' }
  }

  async function reserve(auth: Record<string, string>, operation: 'generate' | 'revise', id: string) {
    const res = await app.request('/api/credits/reserve', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ operation, clientRequestId: id }),
    })
    return { status: res.status, body: (await res.json()) as Record<string, unknown> }
  }

  async function quote(auth: Record<string, string>) {
    const res = await app.request('/api/credits/download/quote', { headers: auth })
    return (await res.json()) as { cost: number; covered: boolean; entitlements: number; balance: number }
  }

  async function download(auth: Record<string, string>, designKey = 'design-a') {
    const res = await app.request('/api/credits/download', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ designKey }),
    })
    return { status: res.status, body: (await res.json()) as Record<string, unknown> }
  }

  async function balance(auth: Record<string, string>) {
    const res = await app.request('/api/credits/balance', { headers: auth })
    return Number((await res.json() as { balance: number }).balance)
  }

  it('a fresh account holds no entitlement, so a download is quoted at full price', async () => {
    const auth = await register()
    const q = await quote(auth)
    expect(q.entitlements).toBe(0)
    expect(q.covered).toBe(false)
    expect(q.cost).toBe(DOWNLOAD_COST)
  })

  it('paying for a design covers its first download', async () => {
    const auth = await register()
    await reserve(auth, 'generate', 'a1')
    const q = await quote(auth)
    expect(q.entitlements, 'design purchase grants one').toBe(1)
    expect(q.cost).toBe(0)

    const afterDesign = await balance(auth)
    const dl = await download(auth)
    expect(dl.status).toBe(200)
    expect(dl.body.charged).toBe(0)
    expect(await balance(auth), 'the covered download is free').toBe(afterDesign)
  })

  it('the second download is a fresh purchase', async () => {
    const auth = await register()
    await reserve(auth, 'generate', 'a1')
    await download(auth, 'design-a')
    expect((await quote(auth)).cost, 'entitlement is spent').toBe(DOWNLOAD_COST)

    // The starting grant cannot cover a second one, which is the honest outcome: taking a second
    // file away is another purchase, and an empty wallet says so instead of quietly allowing it.
    const second = await download(auth, 'design-b')
    expect(second.status).toBe(402)
  })

  it('revisions do not hand out download rights', async () => {
    // Exploration is not ownership. If a revision granted one, a customer could revise once and
    // take the file for the price of a tweak.
    const auth = await register()
    await reserve(auth, 'revise', 'r1')
    await reserve(auth, 'revise', 'r2')
    expect((await quote(auth)).entitlements).toBe(0)
    expect((await quote(auth)).cost).toBe(DOWNLOAD_COST)
  })

  it('a download charge is priced like the design it takes away', () => {
    expect(DOWNLOAD_COST).toBe(INITIAL_DESIGN_COST)
  })

  it('the starting grant covers exactly one design, its revision and its file', async () => {
    const auth = await register()
    expect(await balance(auth)).toBe(STARTING_CREDITS)
    await reserve(auth, 'generate', 'a1')
    await reserve(auth, 'revise', 'r1')
    const dl = await download(auth)
    expect(dl.body.charged, 'the included file costs nothing further').toBe(0)
    expect(await balance(auth)).toBe(STARTING_CREDITS - CREDIT_COSTS.generate - CREDIT_COSTS.revise)
  })

  it('one account’s entitlement cannot be spent by another', async () => {
    const a = await register()
    const b = await register()
    await reserve(a, 'generate', 'a1')
    expect((await quote(a)).entitlements).toBe(1)
    expect((await quote(b)).entitlements, 'B holds nothing A bought').toBe(0)
  })

  it('the download endpoint requires a signed-in account', async () => {
    const res = await app.request('/api/credits/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designKey: 'x' }),
    })
    expect(res.status).toBe(401)
  })
})
