/**
 * Google OAuth 2.0 (authorization code). Keys live in env; unset = disabled.
 *
 * Google Cloud Console:
 *  1. APIs & Services → Credentials → Create OAuth client (Web)
 *  2. Authorized JavaScript origins: FORMA_SITE_URL and FORMA_PUBLIC_URL
 *  3. Authorized redirect URI: GOOGLE_REDIRECT_URI (API callback)
 */
import type { FormaDb, UserRow } from './db.ts'
import {
  createSession,
  newId,
  newToken,
  OAUTH_PASSWORD_PREFIX,
  toPublicUser,
  type PublicUser,
} from './auth.ts'
import { createWalletWithGrant } from './credits.ts'
import { corsOrigins } from './security.ts'

export const GOOGLE_OAUTH_HASH = `${OAUTH_PASSWORD_PREFIX}google`

export type GoogleProfile = {
  sub: string
  email: string
  email_verified?: boolean | string
  name?: string
}

export type GoogleOauthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

const STATE_TTL_MS = 10 * 60 * 1000
const HANDOFF_TTL_MS = 2 * 60 * 1000

export function publicApiUrl(): string {
  return (process.env.FORMA_API_PUBLIC_URL ?? 'http://localhost:8787').replace(/\/$/, '')
}

export function defaultSiteUrl(): string {
  return (process.env.FORMA_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

export function googleRedirectUri(): string {
  const fromEnv = (process.env.GOOGLE_REDIRECT_URI ?? '').trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${publicApiUrl()}/api/auth/google/callback`
}

export function readGoogleConfig(): GoogleOauthConfig | null {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, redirectUri: googleRedirectUri() }
}

export function googleStatus(): {
  configured: boolean
  redirectUri: string
  origins: string[]
} {
  return {
    configured: Boolean(readGoogleConfig()),
    redirectUri: googleRedirectUri(),
    origins: [defaultSiteUrl(), (process.env.FORMA_PUBLIC_URL ?? 'http://localhost:5173').replace(/\/$/, '')],
  }
}

function pruneOauthTables(db: FormaDb): void {
  const stateCut = new Date(Date.now() - STATE_TTL_MS).toISOString()
  const handoffCut = new Date(Date.now() - HANDOFF_TTL_MS).toISOString()
  db.prepare(`DELETE FROM oauth_states WHERE created_at < ?`).run(stateCut)
  db.prepare(`DELETE FROM oauth_handoffs WHERE created_at < ?`).run(handoffCut)
}

export function createOauthState(db: FormaDb, nextUrl: string): string {
  pruneOauthTables(db)
  const id = newToken()
  db.prepare(`INSERT INTO oauth_states (id, next_url, created_at) VALUES (?, ?, ?)`).run(
    id,
    nextUrl,
    new Date().toISOString(),
  )
  return id
}

export function consumeOauthState(db: FormaDb, state: string): string | null {
  pruneOauthTables(db)
  const row = db.prepare(`SELECT next_url, created_at FROM oauth_states WHERE id = ?`).get(state) as
    | { next_url: string; created_at: string }
    | undefined
  if (!row) return null
  db.prepare(`DELETE FROM oauth_states WHERE id = ?`).run(state)
  if (Date.now() - new Date(row.created_at).getTime() > STATE_TTL_MS) return null
  return row.next_url
}

export function createHandoff(db: FormaDb, sessionToken: string): string {
  pruneOauthTables(db)
  const id = newToken()
  db.prepare(`INSERT INTO oauth_handoffs (id, session_token, created_at) VALUES (?, ?, ?)`).run(
    id,
    sessionToken,
    new Date().toISOString(),
  )
  return id
}

export function consumeHandoff(db: FormaDb, id: string): string | null {
  pruneOauthTables(db)
  const row = db.prepare(`SELECT session_token, created_at FROM oauth_handoffs WHERE id = ?`).get(id) as
    | { session_token: string; created_at: string }
    | undefined
  if (!row) return null
  db.prepare(`DELETE FROM oauth_handoffs WHERE id = ?`).run(id)
  if (Date.now() - new Date(row.created_at).getTime() > HANDOFF_TTL_MS) return null
  return row.session_token
}

export function isAllowedNextUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    const origin = url.origin
    if (corsOrigins().includes(origin)) return true
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
    return false
  } catch {
    return false
  }
}

export function defaultNextUrl(): string {
  return `${defaultSiteUrl()}/auth/callback`
}

export function googleAuthorizeUrl(config: GoogleOauthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(
  config: GoogleOauthConfig,
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GoogleProfile> {
  const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(tokenBody.error || 'Google token alınamadı.')
  }
  const userRes = await fetchImpl('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
  })
  const profile = (await userRes.json()) as GoogleProfile
  if (!userRes.ok || !profile.sub || !profile.email) {
    throw new Error('Google profili alınamadı.')
  }
  return profile
}

export function upsertGoogleUser(db: FormaDb, profile: GoogleProfile): PublicUser {
  const verified = profile.email_verified === true || profile.email_verified === 'true'
  if (!verified) {
    throw new Error('Google e-posta doğrulanmamış.')
  }
  const email = profile.email.trim().toLowerCase()
  const name = typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : null
  const adminEmail = (process.env.FORMA_ADMIN_EMAIL ?? '').trim().toLowerCase()

  const bySub = db.prepare(`SELECT * FROM users WHERE google_sub = ?`).get(profile.sub) as UserRow | undefined
  if (bySub) {
    if (name && !bySub.name) {
      db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(name, bySub.id)
    }
    return toPublicUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(bySub.id) as UserRow)
  }

  const byEmail = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as UserRow | undefined
  if (byEmail) {
    db.prepare(`UPDATE users SET google_sub = ?, auth_provider = CASE
      WHEN auth_provider = 'password' THEN 'password+google'
      ELSE auth_provider
    END WHERE id = ?`).run(profile.sub, byEmail.id)
    if (name && !byEmail.name) {
      db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(name, byEmail.id)
    }
    return toPublicUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(byEmail.id) as UserRow)
  }

  const id = newId()
  const now = new Date().toISOString()
  const role = adminEmail && email === adminEmail ? 'admin' : 'user'
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, created_at, role, auth_provider, google_sub)
     VALUES (?, ?, ?, ?, ?, ?, 'google', ?)`,
  ).run(id, email, GOOGLE_OAUTH_HASH, name, now, role, profile.sub)
  createWalletWithGrant(db, id)
  return toPublicUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow)
}

export function signInGoogleUser(db: FormaDb, profile: GoogleProfile): { user: PublicUser; token: string } {
  const user = upsertGoogleUser(db, profile)
  const token = createSession(db, user.id)
  return { user, token }
}
