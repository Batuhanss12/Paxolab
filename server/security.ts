/**
 * Launch hardening helpers (Phase 10).
 *
 * In-memory rate limits are per-process. They are NOT safe as the only
 * control on multi-instance / multi-replica production — use a shared
 * store (Redis, etc.) or an edge limiter there.
 */
import type { Context, MiddlewareHandler } from 'hono'

const SECRET_KEY_RE = /password|passwd|secret|token|authorization|api[_-]?key|cookie|iyzi/i

export const DEFAULT_AUTH_RATE_PER_MIN = 20
export const DEFAULT_CHECKOUT_RATE_PER_MIN = 30
export const DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024
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

/** In-memory per-key counters. Single-process only — see file header. */
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
 * Per-IP limiter. `auth` is a shared bucket for login + register.
 * `checkout` is its own bucket.
 */
export function rateLimit(scope: 'auth' | 'checkout'): MiddlewareHandler {
  return async (c, next) => {
    if (isRateLimitDisabled()) {
      await next()
      return
    }
    const limit = scope === 'auth' ? authRatePerMinute() : checkoutRatePerMinute()
    const ip = clientIp(c)
    const result = checkRateLimit(`${scope}:${ip}`, limit)
    if (!result.ok) {
      c.header('Retry-After', String(result.retryAfterSec))
      return c.json({ error: RATE_LIMIT_TR }, 429)
    }
    await next()
  }
}

/**
 * API-oriented headers. CSP is JSON-safe and does not execute scripts;
 * the iyzico callback HTML is a meta-refresh + text link (no inline JS).
 */
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('Referrer-Policy', 'no-referrer')
    c.header(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    )
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
