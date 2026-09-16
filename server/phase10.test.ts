import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.ts'
import { openDb, getDb, type FormaDb } from './db.ts'
import { STARTING_CREDITS } from './credits.ts'
import { INITIAL_DESIGN_COST } from './billing/plansCatalog.ts'
import type { Hono } from 'hono'

let db: FormaDb
let dbPath: string
let app: ReturnType<typeof createApp>

function setupApp() {
  dbPath = path.join(os.tmpdir(), `phase10-test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`)
  process.env.FORMA_DB_PATH = dbPath
  process.env.FORMA_RATE_LIMIT_DISABLED = '1'
  db = openDb(dbPath)
  app = createApp(db)
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function register(appName: ReturnType<typeof createApp>, email: string, password = 'Test1234!', name?: string) {
  const res = await appName.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  expect(res.status).toBe(201)
  const data = await res.json() as { token: string; user: { id: string; role: string } }
  return data
}

async function makeAdmin(appName: ReturnType<typeof createApp>) {
  const reg = await register(appName, 'admin@test.local', 'Admin1234!', 'Admin')
  // Promote to admin directly in DB
  db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(reg.user.id)
  // Re-login to get fresh token with admin role
  const res = await appName.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.local', password: 'Admin1234!' }),
  })
  const data = await res.json() as { token: string; user: { id: string; role: string } }
  return data
}

describe('Phase 10 credit economy', () => {
  beforeEach(() => {
    setupApp()
  })

  afterEach(() => {
    db.close()
    try {
      fs.unlinkSync(dbPath)
      fs.unlinkSync(`${dbPath}-wal`)
      fs.unlinkSync(`${dbPath}-shm`)
    } catch { /* ignore */ }
  })

  describe('Operation catalog', () => {
    it('lists operations publicly', async () => {
      const res = await app.request('/api/billing/operations')
      expect(res.status).toBe(200)
      const data = await res.json() as { operations: { operationId: string }[] }
      expect(data.operations.length).toBeGreaterThan(5)
      const ids = data.operations.map((o) => o.operationId)
      expect(ids).toContain('initial_design')
      expect(ids).toContain('focused_revision')
      expect(ids).toContain('final_export')
    })

    it('quotes an operation cost', async () => {
      const reg = await register(app, 'quote@test.local')
      const res = await app.request('/api/design/operations/quote', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ operation: 'initial_design' }),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { operationId: string; creditCost: number }
      expect(data.operationId).toBe('initial_design')
      expect(data.creditCost).toBeGreaterThan(0)
    })

    it('classifies feedback into an operation', async () => {
      const reg = await register(app, 'classify@test.local')
      const res = await app.request('/api/design/operations/classify', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ feedback: 'renkleri daha canlı yap', hasPriorDesign: true }),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { operationId: string; legacyOperation: string }
      expect(data.operationId).toBe('color_refinement')
      expect(data.legacyOperation).toBe('revise')
    })
  })

  describe('Credit buckets', () => {
    it('creates a bonus bucket on register with starting credits', async () => {
      const reg = await register(app, 'bucket@test.local')
      const res = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as {
        balance: number
        buckets: { included: number; purchased: number; bonus: number; total: number }
      }
      expect(data.balance).toBe(STARTING_CREDITS)
      expect(data.buckets.bonus).toBe(STARTING_CREDITS)
      expect(data.buckets.total).toBe(STARTING_CREDITS)
    })

    it('debit from buckets on reserve follows consumption policy', async () => {
      const reg = await register(app, 'debit@test.local')
      // Reserve a generate (3 credits)
      const res = await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ operation: 'generate' }),
      })
      expect(res.status).toBe(200)
      const reserve = await res.json() as { reservationId: string; balance: number }
      expect(reserve.balance).toBe(STARTING_CREDITS - INITIAL_DESIGN_COST)

      // Check buckets
      const creditsRes = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      const credits = await creditsRes.json() as { buckets: { bonus: number } }
      expect(credits.buckets.bonus).toBe(STARTING_CREDITS - INITIAL_DESIGN_COST)
    })
  })

  describe('Catalog-based reservation', () => {
    it('reserves via catalog operation ID', async () => {
      const reg = await register(app, 'catreserve@test.local')
      const res = await app.request('/api/design/operations/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({
          operation: 'initial_design',
          clientRequestId: 'test-req-1',
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as {
        reservationId: string
        amount: number
        balance: number
        operationId: string
        costVersionId: string | null
      }
      expect(data.operationId).toBe('initial_design')
      expect(data.amount).toBe(117)
      expect(data.balance).toBe(3)
    })

    it('is idempotent with clientRequestId', async () => {
      const reg = await register(app, 'idem@test.local')
      const body = JSON.stringify({
        operation: 'initial_design',
        clientRequestId: 'idem-req-1',
      })
      const res1 = await app.request('/api/design/operations/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body,
      })
      const res2 = await app.request('/api/design/operations/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body,
      })
      const data1 = await res1.json() as { reservationId: string; idempotent: boolean }
      const data2 = await res2.json() as { reservationId: string; idempotent: boolean }
      expect(data1.reservationId).toBe(data2.reservationId)
      expect(data2.idempotent).toBe(true)
    })

    it('rejects insufficient balance', async () => {
      const reg = await register(app, 'insuff@test.local')
      const first = await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ operation: 'generate', clientRequestId: 'exhaust-0' }),
      })
      expect(first.status).toBe(200)
      const res = await app.request('/api/credits/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ operation: 'generate', clientRequestId: 'should-fail' }),
      })
      expect(res.status).toBe(402)
    })
  })

  describe('Subscriptions', () => {
    it('activates a subscription and grants monthly credits', async () => {
      const reg = await register(app, 'sub@test.local')
      // Subscribe to starter plan (150 monthly credits)
      const res = await app.request('/api/billing/subscribe', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ planId: 'baslangic' }),
      })
      expect(res.status).toBe(201)
      const data = await res.json() as { subscription: { planId: string; status: string } }
      expect(data.subscription.planId).toBe('baslangic')
      expect(data.subscription.status).toBe('active')

      // Check balance increased (120 starting + 500 monthly)
      const creditsRes = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      const credits = await creditsRes.json() as {
        balance: number
        buckets: { included: number; bonus: number }
      }
      expect(credits.balance).toBe(620)
      expect(credits.buckets.included).toBe(500)
      expect(credits.buckets.bonus).toBe(120)
    })

    it('cancels a subscription', async () => {
      const reg = await register(app, 'cancel@test.local')
      await app.request('/api/billing/subscribe', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ planId: 'baslangic' }),
      })
      const res = await app.request('/api/billing/cancel', {
        method: 'POST',
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { subscription: { status: string } }
      expect(data.subscription.status).toBe('cancelled')
    })

    it('gets subscription status', async () => {
      const reg = await register(app, 'substatus@test.local')
      const res = await app.request('/api/billing/subscription', {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { subscription: null | { planId: string } }
      expect(data.subscription).toBeNull()
    })
  })

  describe('Usage and ledger', () => {
    it('lists user usage', async () => {
      const reg = await register(app, 'usage@test.local')
      const res = await app.request('/api/billing/usage', {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { usage: unknown[] }
      expect(Array.isArray(data.usage)).toBe(true)
    })

    it('lists user ledger', async () => {
      const reg = await register(app, 'ledger@test.local')
      const res = await app.request('/api/billing/ledger', {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { ledger: { kind: string }[] }
      expect(data.ledger.length).toBeGreaterThan(0)
      // Should have at least the starting grant
      expect(data.ledger.some((l) => l.kind === 'grant')).toBe(true)
    })
  })

  describe('Design sessions', () => {
    it('creates a project and a design session', async () => {
      const reg = await register(app, 'session@test.local')
      // Create a project
      const projRes = await app.request('/api/projects', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'Test Project', payload: { version: 1 } }),
      })
      expect(projRes.status).toBe(201)
      const projBody = await projRes.json() as { project: { id: string } }

      // Create a session
      const sessRes = await app.request(`/api/projects/${projBody.project.id}/sessions`, {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'Test Session', brief: { sector: 'food' } }),
      })
      expect(sessRes.status).toBe(201)
      const sess = await sessRes.json() as { session: { id: string; title: string } }
      expect(sess.session.title).toBe('Test Session')
    })

    it('lists sessions for a project', async () => {
      const reg = await register(app, 'listsess@test.local')
      const projRes = await app.request('/api/projects', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'Test Project 2', payload: { version: 1 } }),
      })
      const projBody = await projRes.json() as { project: { id: string } }
      await app.request(`/api/projects/${projBody.project.id}/sessions`, {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'Session A' }),
      })
      const res = await app.request(`/api/projects/${projBody.project.id}/sessions`, {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { sessions: { id: string; title: string }[] }
      expect(data.sessions.length).toBe(1)
      expect(data.sessions[0].title).toBe('Session A')
    })

    it('rejects access to another user project sessions', async () => {
      const reg1 = await register(app, 'sess1@test.local')
      const reg2 = await register(app, 'sess2@test.local')
      const projRes = await app.request('/api/projects', {
        method: 'POST',
        headers: authHeaders(reg1.token),
        body: JSON.stringify({ title: 'Private Project', payload: { version: 1 } }),
      })
      const projBody = await projRes.json() as { project: { id: string } }
      const res = await app.request(`/api/projects/${projBody.project.id}/sessions`, {
        headers: authHeaders(reg2.token),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('Admin endpoints', () => {
    it('rejects non-admin from admin endpoints', async () => {
      const reg = await register(app, 'user@test.local')
      const res = await app.request('/api/admin/billing/overview', {
        headers: authHeaders(reg.token),
      })
      expect(res.status).toBe(403)
    })

    it('admin can view billing overview', async () => {
      const admin = await makeAdmin(app)
      const res = await app.request('/api/admin/billing/overview', {
        headers: authHeaders(admin.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { users: number; activeSubscriptions: number }
      expect(data.users).toBeGreaterThan(0)
      expect(typeof data.activeSubscriptions).toBe('number')
    })

    it('admin can view user credits with bucket breakdown', async () => {
      const admin = await makeAdmin(app)
      const reg = await register(app, 'adminuser@test.local')
      const res = await app.request(`/api/admin/users/${reg.user.id}/credits`, {
        headers: authHeaders(admin.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as {
        balance: number
        buckets: { included: number; purchased: number; bonus: number }
      }
      expect(data.balance).toBe(STARTING_CREDITS)
      expect(data.buckets.bonus).toBe(STARTING_CREDITS)
    })

    it('admin can view user ledger', async () => {
      const admin = await makeAdmin(app)
      const reg = await register(app, 'ledgeruser@test.local')
      const res = await app.request(`/api/admin/users/${reg.user.id}/ledger`, {
        headers: authHeaders(admin.token),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { ledger: { kind: string }[] }
      expect(data.ledger.length).toBeGreaterThan(0)
    })

    it('admin can list and update plans', async () => {
      const admin = await makeAdmin(app)
      const listRes = await app.request('/api/admin/plans', {
        headers: authHeaders(admin.token),
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json() as { plans: { id: string }[] }
      expect(listData.plans.length).toBeGreaterThan(0)

      // Update a plan
      const patchRes = await app.request('/api/admin/plans/pro', {
        method: 'PATCH',
        headers: authHeaders(admin.token),
        body: JSON.stringify({ monthlyCredits: 250 }),
      })
      expect(patchRes.status).toBe(200)
      const patchData = await patchRes.json() as { plan: { monthlyCredits: number } }
      expect(patchData.plan.monthlyCredits).toBe(250)
    })

    it('admin can list and update credit operations', async () => {
      const admin = await makeAdmin(app)
      const listRes = await app.request('/api/admin/credit-operations', {
        headers: authHeaders(admin.token),
      })
      expect(listRes.status).toBe(200)
      const listData = await listRes.json() as { operations: { operationId: string }[] }
      expect(listData.operations.length).toBeGreaterThan(5)

      // Update operation cost
      const patchRes = await app.request('/api/admin/credit-operations/focused_revision', {
        method: 'PATCH',
        headers: authHeaders(admin.token),
        body: JSON.stringify({ creditCost: 3 }),
      })
      expect(patchRes.status).toBe(200)
      const patchData = await patchRes.json() as { operation: { creditCost: number } }
      expect(patchData.operation.creditCost).toBe(3)
    })

    it('admin adjustment creates compensating ledger entry', async () => {
      const admin = await makeAdmin(app)
      const reg = await register(app, 'adj@test.local')
      const res = await app.request('/api/admin/credits/adjust', {
        method: 'POST',
        headers: authHeaders(admin.token),
        body: JSON.stringify({ userId: reg.user.id, amount: 10, reason: 'test adjustment' }),
      })
      expect(res.status).toBe(200)
      const data = await res.json() as { balance: number }
      expect(data.balance).toBe(STARTING_CREDITS + 10)

      // Check ledger has manual_admin_adjustment
      const ledgerRes = await app.request(`/api/admin/users/${reg.user.id}/ledger`, {
        headers: authHeaders(admin.token),
      })
      const ledger = await ledgerRes.json() as { ledger: { kind: string }[] }
      expect(ledger.ledger.some((l) => l.kind === 'manual_admin_adjustment')).toBe(true)
    })
  })

  describe('Top-up purchase flow', () => {
    it('purchase grants credits to purchased bucket', async () => {
      const reg = await register(app, 'topup@test.local')
      // Checkout a pack
      const checkoutRes = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ packId: 'pack_50' }),
      })
      expect(checkoutRes.status).toBe(200)
      const checkout = await checkoutRes.json() as { orderId: string; mode: string }
      expect(checkout.mode).toBe('mock')

      // Complete mock payment
      const completeRes = await app.request('/api/billing/mock/complete', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ orderId: checkout.orderId }),
      })
      expect(completeRes.status).toBe(200)
      const complete = await completeRes.json() as { balance: number; creditsGranted: number }
      expect(complete.balance).toBe(STARTING_CREDITS + 50) // starting + pack_50
      expect(complete.creditsGranted).toBe(50)

      // Check bucket breakdown
      const creditsRes = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      const credits = await creditsRes.json() as {
        buckets: { purchased: number; bonus: number }
      }
      expect(credits.buckets.purchased).toBe(50)
      expect(credits.buckets.bonus).toBe(STARTING_CREDITS)
    })

    it('duplicate payment does not grant duplicate credits', async () => {
      const reg = await register(app, 'dup@test.local')
      const checkoutRes = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ packId: 'pack_50' }),
      })
      const checkout = await checkoutRes.json() as { orderId: string }

      // Complete twice
      await app.request('/api/billing/mock/complete', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ orderId: checkout.orderId }),
      })
      const secondRes = await app.request('/api/billing/mock/complete', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ orderId: checkout.orderId }),
      })
      const second = await secondRes.json() as { balance: number; alreadyPaid: boolean }
      expect(second.alreadyPaid).toBe(true)
      expect(second.balance).toBe(STARTING_CREDITS + 50)
    })
  })

  describe('Full user → design → credit → admin flow', () => {
    it('end-to-end flow', async () => {
      const admin = await makeAdmin(app)
      const reg = await register(app, 'e2e@test.local', 'Test1234!', 'E2E User')

      // 1. Subscribe to starter (150 credits)
      await app.request('/api/billing/subscribe', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ planId: 'baslangic' }),
      })

      // 2. Check balance (50 + 150 = 200)
      const creditsRes = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      const credits = await creditsRes.json() as { balance: number }
      expect(credits.balance).toBe(STARTING_CREDITS + 500)

      // 3. Create a project
      const projRes = await app.request('/api/projects', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'E2E Project', payload: { version: 1 } }),
      })
      const projBody = await projRes.json() as { project: { id: string } }

      // 4. Create a design session
      const sessRes = await app.request(`/api/projects/${projBody.project.id}/sessions`, {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ title: 'E2E Session', brief: { sector: 'cosmetics' } }),
      })
      const sess = await sessRes.json() as { session: { id: string } }

      // 5. Reserve credits for a design operation (initial_design = 5 credits)
      const reserveRes = await app.request('/api/design/operations/reserve', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({
          operation: 'initial_design',
          clientRequestId: 'e2e-req-1',
          projectId: projBody.project.id,
          sessionId: sess.session.id,
        }),
      })
      expect(reserveRes.status).toBe(200)
      const reserve = await reserveRes.json() as { reservationId: string; balance: number }
      expect(reserve.balance).toBe(STARTING_CREDITS + 500 - INITIAL_DESIGN_COST)

      // 6. Commit the reservation
      const commitRes = await app.request('/api/credits/commit', {
        method: 'POST',
        headers: authHeaders(reg.token),
        body: JSON.stringify({ reservationId: reserve.reservationId }),
      })
      expect(commitRes.status).toBe(200)

      // 7. Check usage
      const usageRes = await app.request('/api/billing/usage', {
        headers: authHeaders(reg.token),
      })
      expect(usageRes.status).toBe(200)

      // 8. Admin can see the user's credits and ledger
      const adminCreditsRes = await app.request(`/api/admin/users/${reg.user.id}/credits`, {
        headers: authHeaders(admin.token),
      })
      expect(adminCreditsRes.status).toBe(200)
      const adminCredits = await adminCreditsRes.json() as { balance: number }
      expect(adminCredits.balance).toBe(STARTING_CREDITS + 500 - INITIAL_DESIGN_COST)

      // 9. Admin can see billing overview
      const overviewRes = await app.request('/api/admin/billing/overview', {
        headers: authHeaders(admin.token),
      })
      expect(overviewRes.status).toBe(200)
      const overview = await overviewRes.json() as { activeSubscriptions: number }
      expect(overview.activeSubscriptions).toBeGreaterThan(0)
    })
  })

  describe('Concurrency protection', () => {
    it('prevents overspending with concurrent reservations', async () => {
      const reg = await register(app, 'concur@test.local')
      // 120 credits, each generate costs 117, so max 1 successful
      const promises: Promise<Response>[] = []
      for (let i = 0; i < 8; i++) {
        promises.push(
          app.request('/api/credits/reserve', {
            method: 'POST',
            headers: authHeaders(reg.token),
            body: JSON.stringify({ operation: 'generate', clientRequestId: `concur-${i}` }),
          }),
        )
      }
      const results = await Promise.all(promises)
      const ok = results.filter((r) => r.status === 200)
      const fail = results.filter((r) => r.status === 402)
      expect(ok.length).toBe(1)
      expect(fail.length).toBe(7)

      const creditsRes = await app.request('/api/billing/credits', {
        headers: authHeaders(reg.token),
      })
      const credits = await creditsRes.json() as { balance: number }
      expect(credits.balance).toBe(STARTING_CREDITS - INITIAL_DESIGN_COST)
    })
  })
})
