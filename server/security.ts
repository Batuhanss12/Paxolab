/**
 * Launch hardening helpers (Phase 10).
 *
 * The limiter counts in the database when one is handed to it, so every process sharing that
 * database shares the allowance. The in-memory path remains for callers without a database and for
 * the unit tests, and is per-process by nature — see `checkRateLimit`.
 */
import type { Context, MiddlewareHandler } from 'hono'
import type { FormaDb, RateLimitCounterRow } from './db.ts'

const SECRET_KEY_RE = /password|passwd|secret|token|authorization|api[_-]?key|cookie|iyzi/i

export const DEFAULT_AUTH_RATE_PER_MIN = 20
export const DEFAULT_CHECKOUT_RATE_PER_MIN = 30
export const DEFAULT_ADMIN_RATE_PER_MIN = 120
export const DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024

/**
 * The delivery endpoint carries a whole design, which is larger than any other request the API
 * takes. Measured: a perfume carton serialises to 770 KB, a honey carton 642 KB, a wrap label
 * 332 KB — the thirteen painted panels are most of it. The general 2 MB ceiling would hold today
 * and fail on the first design more elaborate than the ones we measured, so this route gets its
 * own headroom rather than everything getting a looser limit.
 */
export const EXPORT_MAX_BODY_BYTES = 8 * 1024 * 1024

export function exportMaxBodyBytes(): number {
  const n = Number(process.env.FORMA_EXPORT_MAX_BODY_BYTES ?? EXPORT_MAX_BODY_BYTES)
  return Number.isFinite(n) && n > 0 ? n : EXPORT_MAX_BODY_BYTES
}
export const RATE_LIMIT_WINDOW_MS = 60_000
/** Hard-clear the in-memory map this often so it cannot grow forever. */
export const RATE_LIMIT_MAP_RESET_MS = 10 * 60 * 1000

export const RATE_LIMIT_TR =
  'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.'
export const BODY_TOO_LARGE_TR = 'İstek gövdesi çok büyük.'

export function isRateLimitDisabled(): boolean {
  const v = (process.env.FORMA_RATE_LIMIT_DISABLED ?? '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function authRatePerMinute(): number {
  const n = Number(process.env.FORMA_RATE_LIMIT_AUTH ?? DEFAULT_AUTH_RATE_PER_MIN)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_AUTH_RATE_PER_MIN
}

export function checkoutRatePerMinute(): number {
  const n = Number(process.env.FORMA_RATE_LIMIT_CHECKOUT ?? DEFAULT_CHECKOUT_RATE_PER_MIN)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CHECKOUT_RATE_PER_MIN
}

export function adminRatePerMinute(): number {
  const n = Number(process.env.FORMA_RATE_LIMIT_ADMIN ?? DEFAULT_ADMIN_RATE_PER_MIN)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_ADMIN_RATE_PER_MIN
}

export function maxBodyBytes(): number {
  const n = Number(process.env.FORMA_MAX_BODY_BYTES ?? DEFAULT_MAX_BODY_BYTES)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BODY_BYTES
}

export function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const real = c.req.header('x-real-ip')?.trim()
  if (real) return real
  return '127.0.0.1'
}

type Bucket = { count: number; resetAt: number }

/**
 * In-memory per-key counters. One process only — `checkRateLimitShared` is the multi-process path.
 * Kept because a caller without a database still needs a limiter, and the unit tests exercise the
 * window arithmetic here without touching SQLite.
 */
const buckets = new Map<string, Bucket>()
let lastMapReset = Date.now()

export function resetRateLimitMap(): void {
  buckets.clear()
  lastMapReset = Date.now()
}

function maybeResetMap(now: number): void {
  if (now - lastMapReset >= RATE_LIMIT_MAP_RESET_MS) {
    buckets.clear()
    lastMapReset = now
    return
  }
  if (buckets.size > 50_000) {
    buckets.clear()
    lastMapReset = now
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  maybeResetMap(now)
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true }
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }
  existing.count += 1
  return { ok: true }
}

/**
 * The same window, counted in the database so every process shares it.
 *
 * `BEGIN IMMEDIATE` is what makes it a limit rather than a suggestion: two processes arriving at
 * the same moment serialise here, so the allowance cannot be spent twice. Without it each would
 * read the same count, both would find room, and the published limit would quietly double.
 *
 * Expired rows are swept opportunistically — the window is a timestamp comparison, so there is
 * nothing to schedule, and the sweep costs one indexed delete per denied-or-new key.
 */
export function checkRateLimitShared(
  db: FormaDb,
  key: string,
  limit: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  db.exec('BEGIN IMMEDIATE')
  try {
    const row = db
      .prepare(`SELECT key, count, reset_at FROM rate_limit_counters WHERE key = ?`)
      .get(key) as RateLimitCounterRow | undefined

    if (!row || row.reset_at <= now) {
      db.prepare(
        `INSERT INTO rate_limit_counters (key, count, reset_at) VALUES (?, 1, ?)
           ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
      ).run(key, now + RATE_LIMIT_WINDOW_MS)
      db.prepare(`DELETE FROM rate_limit_counters WHERE reset_at <= ?`).run(now)
      db.exec('COMMIT')
      return { ok: true }
    }

    if (row.count >= limit) {
      db.exec('COMMIT')
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((row.reset_at - now) / 1000)) }
    }

    db.prepare(`UPDATE rate_limit_counters SET count = count + 1 WHERE key = ?`).run(key)
    db.exec('COMMIT')
    return { ok: true }
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* already rolled back */
    }
    throw err
  }
}

/** Test/ops helper: forget every shared window. */
export function resetSharedRateLimits(db: FormaDb): void {
  db.prepare(`DELETE FROM rate_limit_counters`).run()
}

/**
 * Per-IP limiter. `auth` is a shared bucket for login + register.
 * `checkout` and `admin` have their own buckets.
 *
 * Pass the database and the allowance is shared across processes; omit it and the counters stay in
 * this process, which is only correct when there is exactly one.
 */
export function rateLimit(scope: 'auth' | 'checkout' | 'admin', db?: FormaDb): MiddlewareHandler {
  return async (c, next) => {
    if (isRateLimitDisabled()) {
      await next()
      return
    }
    const limit =
      scope === 'auth'
        ? authRatePerMinute()
        : scope === 'checkout'
          ? checkoutRatePerMinute()
          : adminRatePerMinute()
    const ip = clientIp(c)
    const key = `${scope}:${ip}`
    const result = db ? checkRateLimitShared(db, key, limit) : checkRateLimit(key, limit)
    if (!result.ok) {
      c.header('Retry-After', String(result.retryAfterSec))
      return c.json({ error: RATE_LIMIT_TR }, 429)
    }
    await next()
  }
}

/**
 * `default-src 'none'` is right for JSON and wrong for an application.
 *
 * This process also serves the built studio in production (see `server/index.ts`), and the strict
 * API policy blocked the studio's own bundle and stylesheet: the page loaded, the title appeared and
 * the body stayed empty. Nothing in development shows it, because there Vite serves the studio and
 * only `/api` reaches this middleware.
 *
 * So the policy follows the response. API paths keep the policy that cannot execute anything; the
 * studio gets one scoped to its own origin. `'unsafe-inline'` for styles is not cosmetic: the
 * engine emits `<style>` inside its SVG markup, and the on-screen faces pull their webfonts from
 * Google (the export path substitutes a local subset, which is why production files are font
 * independent while the preview is not).
 */
const API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"

const STUDIO_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join('; ')

export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('Referrer-Policy', 'no-referrer')
    c.header('Content-Security-Policy', c.req.path.startsWith('/api/') ? API_CSP : STUDIO_CSP)
    await next()
  }
}

export function redactSecrets(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(redactSecrets)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEY_RE.test(k) ? '[redacted]' : redactSecrets(v)
  }
  return out
}

/** Log without leaking passwords, tokens, or iyzico keys. */
export function safeLog(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.log(message, redactSecrets(extra))
    return
  }
  console.log(message)
}

export function corsOrigins(): string[] {
  const base = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
  const extras = [
    (process.env.FORMA_PUBLIC_URL ?? '').trim().replace(/\/$/, ''),
    (process.env.FORMA_SITE_URL ?? '').trim().replace(/\/$/, ''),
  ]
  for (const extra of extras) {
    if (extra && !base.includes(extra)) base.push(extra)
  }
  return base
}

/**
 * Dynamic CORS origin checker — allows any localhost / 127.0.0.1 origin
 * (any port) so browser previews and dev proxies work without config changes.
 * Production origins must be added via FORMA_PUBLIC_URL / FORMA_SITE_URL.
 */
export function corsOriginChecker(origin: string | undefined): string | null {
  if (!origin) return null
  // Allow any localhost / 127.0.0.1 origin in development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin
  // Allow configured production origins
  if (corsOrigins().includes(origin)) return origin
  return null
}
