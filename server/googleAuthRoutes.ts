import type { Hono } from 'hono'
import { userFromToken, type AuthVars } from './auth.ts'
import type { FormaDb } from './db.ts'
import { rateLimit } from './security.ts'
import {
  consumeHandoff,
  consumeOauthState,
  createHandoff,
  createOauthState,
  defaultNextUrl,
  exchangeGoogleCode,
  googleAuthorizeUrl,
  googleStatus,
  isAllowedNextUrl,
  readGoogleConfig,
  signInGoogleUser,
} from './authGoogle.ts'

function setupHtml(): string {
  const status = googleStatus()
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Google OAuth kurulumu</title>
<style>
  body{font-family:system-ui,sans-serif;background:#050505;color:#f5f0e6;max-width:40rem;margin:4rem auto;padding:0 1.5rem;line-height:1.5}
  code{background:#121212;padding:0.15rem 0.4rem;border-radius:4px}
  ol{padding-left:1.2rem}
</style></head><body>
<h1>Google ile giriş henüz açık değil</h1>
<p>Google Cloud Console’da bir OAuth istemcisi oluşturup anahtarları <code>.env</code> dosyasına yazın.</p>
<ol>
  <li>APIs &amp; Services → Credentials → Create OAuth client ID (Web application)</li>
  <li>Authorized JavaScript origins: <code>${status.origins.join('</code>, <code>')}</code></li>
  <li>Authorized redirect URI: <code>${status.redirectUri}</code></li>
  <li><code>GOOGLE_CLIENT_ID</code> ve <code>GOOGLE_CLIENT_SECRET</code> değerlerini kaydedip API’yi yeniden başlatın</li>
</ol>
<p><a href="${defaultNextUrl()}">Siteye dön</a></p>
</body></html>`
}

export function mountGoogleAuth(app: Hono<AuthVars>, db: FormaDb): void {
  app.get('/api/auth/google/status', (c) => c.json(googleStatus()))

  app.get('/api/auth/google', rateLimit('auth'), (c) => {
    const config = readGoogleConfig()
    if (!config) {
      if (c.req.header('accept')?.includes('application/json')) {
        return c.json({ error: 'Google OAuth yapılandırılmamış.', ...googleStatus() }, 503)
      }
      c.header(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      )
      return c.html(setupHtml(), 503)
    }
    const nextRaw = c.req.query('next') ?? defaultNextUrl()
    const nextUrl = isAllowedNextUrl(nextRaw) ? nextRaw : defaultNextUrl()
    const state = createOauthState(db, nextUrl)
    return c.redirect(googleAuthorizeUrl(config, state), 302)
  })

  app.get('/api/auth/google/callback', rateLimit('auth'), async (c) => {
    const err = c.req.query('error')
    const state = c.req.query('state') ?? ''
    const nextFromState = state ? consumeOauthState(db, state) : null
    const nextUrl = nextFromState && isAllowedNextUrl(nextFromState) ? nextFromState : defaultNextUrl()
    const fail = (message: string) => {
      const url = new URL(nextUrl)
      url.searchParams.set('error', message)
      return c.redirect(url.toString(), 302)
    }
    if (err) return fail(err)
    const code = c.req.query('code')
    const config = readGoogleConfig()
    if (!config) return fail('Google OAuth yapılandırılmamış.')
    if (!code) return fail('Google kodu eksik.')
    try {
      const profile = await exchangeGoogleCode(config, code)
      const signed = signInGoogleUser(db, profile)
      const handoff = createHandoff(db, signed.token)
      const url = new URL(nextUrl)
      url.searchParams.set('handoff', handoff)
      return c.redirect(url.toString(), 302)
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'Google girişi başarısız.')
    }
  })

  app.post('/api/auth/handoff', rateLimit('auth'), async (c) => {
    let body: { id?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Geçersiz JSON.' }, 400)
    }
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id) return c.json({ error: 'handoff gerekli.' }, 400)
    const token = consumeHandoff(db, id)
    if (!token) return c.json({ error: 'Oturum kodu geçersiz veya süresi doldu.' }, 401)
    const user = userFromToken(db, token)
    if (!user) return c.json({ error: 'Oturum geçersiz.' }, 401)
    return c.json({ user, token })
  })
}
