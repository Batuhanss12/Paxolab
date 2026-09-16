import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Context, Next } from 'hono'
import type { FormaDb, SessionRow, UserRow } from './db.ts'

const SESSION_DAYS = 30

export type PublicUser = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  auth_provider: string
}

export const OAUTH_PASSWORD_PREFIX = 'oauth:'

export function isOauthPasswordHash(stored: string): boolean {
  return stored.startsWith(OAUTH_PASSWORD_PREFIX)
}

export type AuthVars = {
  Variables: {
    user: PublicUser
    token: string
  }
}

export function newId(): string {
  return randomBytes(16).toString('hex')
}

export function newToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    auth_provider: row.auth_provider ?? 'password',
  }
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Geçerli bir e-posta girin.'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Şifre en az 8 karakter olmalı.'
  }
  return null
}

export function createSession(db: FormaDb, userId: string): string {
  const token = newToken()
  const now = new Date()
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  db.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
  ).run(token, userId, now.toISOString(), expires.toISOString())
  return token
}

export function deleteSession(db: FormaDb, token: string): void {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token)
}

export function userFromToken(db: FormaDb, token: string): PublicUser | null {
  const session = db
    .prepare(`SELECT * FROM sessions WHERE id = ?`)
    .get(token) as SessionRow | undefined
  if (!session) return null
  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token)
    return null
  }
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user_id) as
    | UserRow
    | undefined
  return user ? toPublicUser(user) : null
}

export function bearerToken(c: Context): string | null {
  const header = c.req.header('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  return match?.[1] ?? null
}

export function requireAuth(db: FormaDb) {
  return async (c: Context, next: Next) => {
    const token = bearerToken(c)
    if (!token) {
      return c.json({ error: 'Oturum gerekli.' }, 401)
    }
    const user = userFromToken(db, token)
    if (!user) {
      return c.json({ error: 'Oturum geçersiz veya süresi dolmuş.' }, 401)
    }
    c.set('user', user)
    c.set('token', token)
    await next()
  }
}
