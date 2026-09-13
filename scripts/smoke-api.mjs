#!/usr/bin/env node
/**
 * Tiny unauthenticated smoke: GET /api/health.
 * Expects the API already running (npm run server).
 *
 *   npm run smoke:api
 */
const base = (
  process.env.FORMA_API_PUBLIC_URL ??
  `http://localhost:${process.env.FORMA_API_PORT ?? process.env.PORT ?? 8787}`
).replace(/\/$/, '')

const url = `${base}/api/health`

let res
try {
  res = await fetch(url)
} catch (err) {
  console.error(`smoke:api FAIL — cannot reach ${url}`)
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

let body
try {
  body = await res.json()
} catch {
  console.error(`smoke:api FAIL — non-JSON ${res.status} from ${url}`)
  process.exit(1)
}

if (!res.ok || !body?.ok || body.db !== 'ok') {
  console.error('smoke:api FAIL', { status: res.status, body })
  process.exit(1)
}

console.log('smoke:api OK', body)
