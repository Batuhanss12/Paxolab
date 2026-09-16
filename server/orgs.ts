/**
 * Company (firma) workspaces: members, seats, invites, shared billing.
 * Billing wallet is the owner's when the company has an active plan.
 */
import type { FormaDb } from './db.ts'
import { newId, newToken, validateEmail } from './auth.ts'
import { getActiveSubscription, getPlan } from './credit/subscriptions.ts'

export type OrgRole = 'owner' | 'admin' | 'member'

export type Organization = {
  id: string
  name: string
  slug: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type OrgMember = {
  userId: string
  email: string
  name: string | null
  role: OrgRole
  createdAt: string
}

export type OrgInvite = {
  id: string
  email: string
  role: Exclude<OrgRole, 'owner'>
  token: string
  invitedBy: string
  createdAt: string
  expiresAt: string
}

export type OrgSummary = Organization & {
  role: OrgRole
  memberCount: number
  seatLimit: number
  planId: string | null
  planLabel: string | null
  unlimited: boolean
}

export class OrgError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'OrgError'
  }
}

/** Seats included with the owner's active plan. No plan → owner only. */
export const PLAN_SEATS: Record<string, number> = {
  baslangic: 1,
  plus: 3,
  pro: 8,
  studio: 15,
  agency: 50,
}

const INVITE_DAYS = 7

function nowIso(): string {
  return new Date().toISOString()
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return base || 'firma'
}

function uniqueSlug(db: FormaDb, name: string): string {
  const base = slugify(name)
  let slug = base
  let n = 2
  while (db.prepare(`SELECT id FROM organizations WHERE slug = ?`).get(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}

function asRole(value: string): OrgRole {
  if (value === 'owner' || value === 'admin' || value === 'member') return value
  throw new OrgError(400, 'Geçersiz rol.')
}

export function seatsForPlan(planId: string | null): number {
  if (!planId) return 1
  return PLAN_SEATS[planId] ?? 1
}

export function ownerSeatInfo(db: FormaDb, ownerUserId: string): {
  planId: string | null
  planLabel: string | null
  unlimited: boolean
  seatLimit: number
} {
  const sub = getActiveSubscription(db, ownerUserId)
  if (!sub) {
    return { planId: null, planLabel: null, unlimited: false, seatLimit: 1 }
  }
  const plan = getPlan(db, sub.planId)
  return {
    planId: sub.planId,
    planLabel: plan?.label ?? sub.planId,
    unlimited: Boolean(plan?.unlimited),
    seatLimit: seatsForPlan(sub.planId),
  }
}

export function getOrganization(db: FormaDb, orgId: string): Organization | null {
  const row = db
    .prepare(`SELECT * FROM organizations WHERE id = ?`)
    .get(orgId) as
    | {
        id: string
        name: string
        slug: string
        created_by: string
        created_at: string
        updated_at: string
      }
    | undefined
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function getMembership(
  db: FormaDb,
  orgId: string,
  userId: string,
): { role: OrgRole } | null {
  const row = db
    .prepare(`SELECT role FROM organization_members WHERE org_id = ? AND user_id = ?`)
    .get(orgId, userId) as { role: string } | undefined
  if (!row) return null
  return { role: asRole(row.role) }
}

export function requireMembership(
  db: FormaDb,
  orgId: string,
  userId: string,
  roles?: OrgRole[],
): OrgRole {
  const membership = getMembership(db, orgId, userId)
  if (!membership) throw new OrgError(403, 'Bu firmaya erişiminiz yok.')
  if (roles && !roles.includes(membership.role)) {
    throw new OrgError(403, 'Bu işlem için yetkiniz yok.')
  }
  return membership.role
}

export function listMembers(db: FormaDb, orgId: string): OrgMember[] {
  const rows = db
    .prepare(
      `SELECT m.user_id AS userId, u.email, u.name, m.role, m.created_at AS createdAt
       FROM organization_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.org_id = ?
       ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, m.created_at ASC`,
    )
    .all(orgId) as OrgMember[]
  return rows.map((r) => ({ ...r, role: asRole(r.role) }))
}

export function listInvites(db: FormaDb, orgId: string): OrgInvite[] {
  const now = nowIso()
  const rows = db
    .prepare(
      `SELECT id, email, role, token, invited_by AS invitedBy, created_at AS createdAt, expires_at AS expiresAt
       FROM organization_invites
       WHERE org_id = ? AND accepted_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC`,
    )
    .all(orgId, now) as OrgInvite[]
  return rows
}

export function memberCount(db: FormaDb, orgId: string): number {
  return (db.prepare(`SELECT COUNT(*) AS n FROM organization_members WHERE org_id = ?`).get(orgId) as { n: number }).n
}

function toSummary(db: FormaDb, org: Organization, role: OrgRole): OrgSummary {
  const seats = ownerSeatInfo(db, org.createdBy)
  return {
    ...org,
    role,
    memberCount: memberCount(db, org.id),
    seatLimit: seats.seatLimit,
    planId: seats.planId,
    planLabel: seats.planLabel,
    unlimited: seats.unlimited,
  }
}

export function listOrgsForUser(db: FormaDb, userId: string): OrgSummary[] {
  const rows = db
    .prepare(
      `SELECT o.id, o.name, o.slug, o.created_by, o.created_at, o.updated_at, m.role
       FROM organization_members m
       JOIN organizations o ON o.id = m.org_id
       WHERE m.user_id = ?
       ORDER BY o.created_at DESC`,
    )
    .all(userId) as {
    id: string
    name: string
    slug: string
    created_by: string
    created_at: string
    updated_at: string
    role: string
  }[]
  return rows.map((row) =>
    toSummary(
      db,
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      asRole(row.role),
    ),
  )
}

/** Owned org first, otherwise first membership. */
export function getPrimaryOrgForUser(db: FormaDb, userId: string): OrgSummary | null {
  const orgs = listOrgsForUser(db, userId)
  return orgs.find((o) => o.role === 'owner') ?? orgs[0] ?? null
}

/**
 * Who pays for this user's design work.
 * Members of a company with an active plan share the owner's wallet.
 */
export function resolveBillingUserId(db: FormaDb, userId: string): string {
  const org = getPrimaryOrgForUser(db, userId)
  if (!org) return userId
  if (org.createdBy === userId) return userId
  const sub = getActiveSubscription(db, org.createdBy)
  if (!sub) return userId
  return org.createdBy
}

export function createOrganization(db: FormaDb, userId: string, nameRaw: string): OrgSummary {
  const name = nameRaw.trim()
  if (name.length < 2) throw new OrgError(400, 'Firma adı en az 2 karakter olmalı.')
  if (name.length > 80) throw new OrgError(400, 'Firma adı çok uzun.')
  const owned = db
    .prepare(`SELECT org_id FROM organization_members WHERE user_id = ? AND role = 'owner'`)
    .get(userId) as { org_id: string } | undefined
  if (owned) throw new OrgError(409, 'Zaten bir firmanın sahibisiniz.')

  const id = newId()
  const now = nowIso()
  const slug = uniqueSlug(db, name)
  db.exec('BEGIN')
  try {
    db.prepare(
      `INSERT INTO organizations (id, name, slug, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, name, slug, userId, now, now)
    db.prepare(
      `INSERT INTO organization_members (org_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)`,
    ).run(id, userId, now)
    db.exec('COMMIT')
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
  const org = getOrganization(db, id)
  if (!org) throw new OrgError(500, 'Firma oluşturulamadı.')
  return toSummary(db, org, 'owner')
}

export function renameOrganization(db: FormaDb, orgId: string, userId: string, nameRaw: string): OrgSummary {
  requireMembership(db, orgId, userId, ['owner', 'admin'])
  const name = nameRaw.trim()
  if (name.length < 2) throw new OrgError(400, 'Firma adı en az 2 karakter olmalı.')
  const org = getOrganization(db, orgId)
  if (!org) throw new OrgError(404, 'Firma bulunamadı.')
  db.prepare(`UPDATE organizations SET name = ?, updated_at = ? WHERE id = ?`).run(name, nowIso(), orgId)
  return toSummary(db, { ...org, name, updatedAt: nowIso() }, getMembership(db, orgId, userId)!.role)
}

export function inviteMember(
  db: FormaDb,
  orgId: string,
  actorId: string,
  emailRaw: string,
  roleRaw: string,
): OrgInvite {
  requireMembership(db, orgId, actorId, ['owner', 'admin'])
  const emailErr = validateEmail(emailRaw)
  if (emailErr) throw new OrgError(400, emailErr)
  const email = emailRaw.trim().toLowerCase()
  const role = asRole(roleRaw === 'admin' ? 'admin' : 'member')
  if (role === 'owner') throw new OrgError(400, 'Sahip rolü davet edilemez.')

  const org = getOrganization(db, orgId)
  if (!org) throw new OrgError(404, 'Firma bulunamadı.')
  const seats = ownerSeatInfo(db, org.createdBy)
  const pending =
    (db.prepare(
      `SELECT COUNT(*) AS n FROM organization_invites WHERE org_id = ? AND accepted_at IS NULL AND expires_at > ?`,
    ).get(orgId, nowIso()) as { n: number }).n
  if (memberCount(db, orgId) + pending >= seats.seatLimit) {
    throw new OrgError(402, `Koltuk limiti doldu (${seats.seatLimit}). Planı yükseltin.`)
  }

  const existingUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as { id: string } | undefined
  if (existingUser && getMembership(db, orgId, existingUser.id)) {
    throw new OrgError(409, 'Bu kişi zaten firmanın üyesi.')
  }

  db.prepare(`DELETE FROM organization_invites WHERE org_id = ? AND email = ? AND accepted_at IS NULL`).run(
    orgId,
    email,
  )
  const now = nowIso()
  const expires = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const invite: OrgInvite = {
    id: newId(),
    email,
    role,
    token: newToken(),
    invitedBy: actorId,
    createdAt: now,
    expiresAt: expires,
  }
  db.prepare(
    `INSERT INTO organization_invites (id, org_id, email, role, token, invited_by, created_at, expires_at, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
  ).run(invite.id, orgId, email, role, invite.token, actorId, now, expires)
  return invite
}

export function revokeInvite(db: FormaDb, orgId: string, actorId: string, inviteId: string): void {
  requireMembership(db, orgId, actorId, ['owner', 'admin'])
  const result = db
    .prepare(`DELETE FROM organization_invites WHERE id = ? AND org_id = ? AND accepted_at IS NULL`)
    .run(inviteId, orgId)
  if (result.changes === 0) throw new OrgError(404, 'Davet bulunamadı.')
}

export function acceptInvite(db: FormaDb, userId: string, token: string): OrgSummary {
  const row = db
    .prepare(`SELECT * FROM organization_invites WHERE token = ?`)
    .get(token) as
    | {
        id: string
        org_id: string
        email: string
        role: string
        expires_at: string
        accepted_at: string | null
      }
    | undefined
  if (!row) throw new OrgError(404, 'Davet geçersiz.')
  if (row.accepted_at) throw new OrgError(409, 'Davet zaten kullanılmış.')
  if (new Date(row.expires_at).getTime() < Date.now()) throw new OrgError(410, 'Davetin süresi dolmuş.')

  const user = db.prepare(`SELECT email FROM users WHERE id = ?`).get(userId) as { email: string } | undefined
  if (!user || user.email.trim().toLowerCase() !== row.email.trim().toLowerCase()) {
    throw new OrgError(403, 'Davet bu hesabın e-postasına gönderildi.')
  }
  if (getMembership(db, row.org_id, userId)) {
    throw new OrgError(409, 'Zaten bu firmanın üyesisiniz.')
  }

  const org = getOrganization(db, row.org_id)
  if (!org) throw new OrgError(404, 'Firma bulunamadı.')
  const seats = ownerSeatInfo(db, org.createdBy)
  if (memberCount(db, row.org_id) >= seats.seatLimit) {
    throw new OrgError(402, 'Koltuk limiti doldu.')
  }

  const now = nowIso()
  db.exec('BEGIN')
  try {
    db.prepare(
      `INSERT INTO organization_members (org_id, user_id, role, created_at) VALUES (?, ?, ?, ?)`,
    ).run(row.org_id, userId, row.role, now)
    db.prepare(`UPDATE organization_invites SET accepted_at = ? WHERE id = ?`).run(now, row.id)
    db.exec('COMMIT')
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  }
  return toSummary(db, org, asRole(row.role))
}

export function removeMember(db: FormaDb, orgId: string, actorId: string, targetUserId: string): void {
  requireMembership(db, orgId, actorId, ['owner', 'admin'])
  const target = getMembership(db, orgId, targetUserId)
  if (!target) throw new OrgError(404, 'Üye bulunamadı.')
  if (target.role === 'owner') throw new OrgError(400, 'Firma sahibi çıkarılamaz.')
  const actor = getMembership(db, orgId, actorId)!
  if (actor.role === 'admin' && target.role === 'admin' && actorId !== targetUserId) {
    throw new OrgError(403, 'Yöneticiler başka yöneticiyi çıkaramaz.')
  }
  db.prepare(`DELETE FROM organization_members WHERE org_id = ? AND user_id = ?`).run(orgId, targetUserId)
}

export function orgUsage(db: FormaDb, orgId: string, limit = 40): {
  userId: string
  email: string
  operationId: string
  creditCost: number
  status: string
  createdAt: string
}[] {
  const members = listMembers(db, orgId)
  if (members.length === 0) return []
  const ids = members.map((m) => m.userId)
  const placeholders = ids.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT d.user_id AS userId, u.email, d.operation_id AS operationId, d.credit_cost AS creditCost,
              d.status, d.created_at AS createdAt
       FROM design_operations d
       JOIN users u ON u.id = d.user_id
       WHERE d.user_id IN (${placeholders})
       ORDER BY d.created_at DESC
       LIMIT ?`,
    )
    .all(...ids, limit) as {
    userId: string
    email: string
    operationId: string
    creditCost: number
    status: string
    createdAt: string
  }[]
  return rows
}

export function listAllOrganizations(db: FormaDb): OrgSummary[] {
  const rows = db
    .prepare(`SELECT id FROM organizations ORDER BY created_at DESC`)
    .all() as { id: string }[]
  return rows
    .map((r) => getOrganization(db, r.id))
    .filter((o): o is Organization => Boolean(o))
    .map((org) => toSummary(db, org, 'owner'))
}
