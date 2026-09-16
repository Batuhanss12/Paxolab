import { Hono } from 'hono'
import { getBalance } from './credits.ts'
import { userHasUnlimitedDesigns } from './credit/subscriptions.ts'
import type { AuthVars, PublicUser } from './auth.ts'
import { requireAuth } from './auth.ts'
import type { FormaDb } from './db.ts'
import {
  acceptInvite,
  createOrganization,
  getOrganization,
  inviteMember,
  listInvites,
  listMembers,
  listOrgsForUser,
  orgUsage,
  OrgError,
  removeMember,
  renameOrganization,
  requireMembership,
  revokeInvite,
} from './orgs.ts'

export function asOrgHttp(err: unknown): { error: string; status: 400 | 402 | 403 | 404 | 409 | 410 } | null {
  if (err instanceof OrgError) {
    return { error: err.message, status: err.status as 400 | 402 | 403 | 404 | 409 | 410 }
  }
  return null
}

export function createOrgRoutes(db: FormaDb) {
  const orgs = new Hono<AuthVars>()
  orgs.use('*', requireAuth(db))

  orgs.get('/', (c) => {
    const user = c.get('user') as PublicUser
    return c.json({ organizations: listOrgsForUser(db, user.id) })
  })

  orgs.post('/', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { name?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    try {
      const organization = createOrganization(db, user.id, body.name ?? '')
      return c.json({ organization }, 201)
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.post('/invites/:token/accept', (c) => {
    const user = c.get('user') as PublicUser
    try {
      const organization = acceptInvite(db, user.id, c.req.param('token'))
      return c.json({ organization })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.get('/:id', (c) => {
    const user = c.get('user') as PublicUser
    const orgId = c.req.param('id')
    try {
      const role = requireMembership(db, orgId, user.id)
      const org = getOrganization(db, orgId)
      if (!org) return c.json({ error: 'Firma bulunamadı.' }, 404)
      const members = listMembers(db, orgId)
      const invites = listInvites(db, orgId)
      const orgsForUser = listOrgsForUser(db, user.id)
      const summary = orgsForUser.find((o) => o.id === orgId)
      const billingBalance = getBalance(db, org.createdBy)
      const unlimited = userHasUnlimitedDesigns(db, org.createdBy)
      return c.json({
        organization: summary ?? { ...org, role },
        members,
        invites: invites.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          token: inv.token,
        })),
        billing: {
          ownerUserId: org.createdBy,
          balance: billingBalance,
          unlimited,
        },
      })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.patch('/:id', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { name?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    try {
      const organization = renameOrganization(db, c.req.param('id'), user.id, body.name ?? '')
      return c.json({ organization })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.post('/:id/invites', async (c) => {
    const user = c.get('user') as PublicUser
    let body: { email?: string; role?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    try {
      const invite = inviteMember(db, c.req.param('id'), user.id, body.email ?? '', body.role ?? 'member')
      return c.json({ invite }, 201)
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.delete('/:id/invites/:inviteId', (c) => {
    const user = c.get('user') as PublicUser
    try {
      revokeInvite(db, c.req.param('id'), user.id, c.req.param('inviteId'))
      return c.json({ ok: true })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.delete('/:id/members/:userId', (c) => {
    const user = c.get('user') as PublicUser
    try {
      removeMember(db, c.req.param('id'), user.id, c.req.param('userId'))
      return c.json({ ok: true })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  orgs.get('/:id/usage', (c) => {
    const user = c.get('user') as PublicUser
    try {
      requireMembership(db, c.req.param('id'), user.id)
      const limitRaw = c.req.query('limit')
      const limit = limitRaw ? Number(limitRaw) : 40
      return c.json({ usage: orgUsage(db, c.req.param('id'), Number.isFinite(limit) ? limit : 40) })
    } catch (err) {
      const mapped = asOrgHttp(err)
      if (mapped) return c.json({ error: mapped.error }, mapped.status)
      throw err
    }
  })

  return orgs
}
