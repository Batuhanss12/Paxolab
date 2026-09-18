import { useCallback, useEffect, useState } from 'react'
import { ApiError, loadAuth, saveAuth, type AuthState, type AuthUser } from '../api/client'
import * as authApi from '../api/auth'
import { getBalance } from '../api/credits'
import { getHealth } from '../api/health'
import { siteUrl } from '../api/urls'

type AuthPanelProps = {
  onAuthChange?: (user: AuthUser | null) => void
  compact?: boolean
  creditsRefreshKey?: number
  onLoadProject?: (projectId: string) => void | Promise<void>
  /** @deprecated Marketing deep-link; ignored — auth lives on the site. */
  initialMode?: 'login' | 'register'
}

function stripQueryParam(key: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has(key)) return
  params.delete(key)
  const next = params.toString()
  const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', url)
}

function tryConsumeHandoff(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const handoff = params.get('handoff')
  if (!handoff) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(handoff)))) as AuthState
    if (parsed?.token && parsed?.user?.email) {
      saveAuth(parsed)
      stripQueryParam('handoff')
      return parsed.user
    }
  } catch {
    /* stay guest quietly */
  }
  stripQueryParam('handoff')
  return null
}

export function AuthPanel({
  onAuthChange,
  compact = true,
  creditsRefreshKey = 0,
}: AuthPanelProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const fromHandoff = tryConsumeHandoff()
    if (fromHandoff) return fromHandoff
    return loadAuth()?.user ?? null
  })
  const [error, setError] = useState<string | null>(null)
  const [apiDown, setApiDown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    stripQueryParam('auth')
  }, [])

  useEffect(() => {
    onAuthChange?.(user)
  }, [user, onAuthChange])

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    if (window.location.hash === '#billing') {
      window.location.href = siteUrl('/hesap/credits')
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function ping() {
      try {
        const h = await getHealth()
        if (!cancelled) setApiDown(!h.ok || h.db === 'error')
      } catch {
        if (!cancelled) setApiDown(true)
      }
    }
    void ping()
    const id = window.setInterval(() => void ping(), 20_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const refreshBalance = useCallback(() => {
    if (!loadAuth()?.token) {
      setBalance(null)
      return
    }
    void getBalance()
      .then((b) => {
        setBalance(b.balance)
        setApiDown(false)
      })
      .catch((err) => {
        setBalance(null)
        if (err instanceof ApiError && err.status === 0) setApiDown(true)
      })
  }, [])

  useEffect(() => {
    if (!user) {
      setBalance(null)
      return
    }
    refreshBalance()
  }, [user, creditsRefreshKey, refreshBalance])

  async function onSubmitAuth() {
    setBusy(true)
    setError(null)
    try {
      const state = mode === 'login'
        ? await authApi.login({ email: email.trim(), password })
        : await authApi.register({ email: email.trim(), password, name: name.trim() || undefined })
      setUser(state.user)
      setFormOpen(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onLogout() {
    setBusy(true)
    setError(null)
    try {
      await authApi.logout()
      setUser(null)
      setBalance(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çıkış başarısız.')
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    const isAdmin = user.role === 'admin'
    return (
      <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
        {balance !== null && (
          <a className="auth-panel__credits" href={siteUrl('/hesap/credits')} title="Kredi paneli">
            {balance} kr
          </a>
        )}
        {isAdmin ? (
          <a className="ghost-btn" href={siteUrl('/admin')} title="Yönetim paneli">
            Yönetim
          </a>
        ) : (
          <a className="ghost-btn" href={siteUrl('/hesap')} title="Müşteri paneli">
            Panel
          </a>
        )}
        <span className="auth-panel__email" title={user.email}>
          {user.email}
        </span>
        <button type="button" className="ghost-btn" onClick={() => void onLogout()} disabled={busy}>
          Çıkış
        </button>
        {error && <span className="auth-panel__error">{error}</span>}
        {apiDown && (
          <span className="auth-panel__error auth-panel__error--banner">
            API kapalı — bakiye ve bulut senkronu durakladı.
          </span>
        )}
      </div>
    )
  }

  /*
   * Signed out, with a way in.
   *
   * This branch used to be a label and nothing else: `api/auth.ts` has had working `register` and
   * `login` all along, and the panel called neither. The only route into an account was a base64
   * `?handoff=` parameter from the marketing site, so a customer who bookmarked the studio was a
   * guest permanently, with no visible remedy — and since the print files are now behind an
   * account, that dead end was also the end of the funnel.
   *
   * The label stays honest too. "Sınırsız yerel" was true when everything was free; what a guest
   * actually gets is unlimited design, and no print files.
   */
  return (
    <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
      <span className="auth-panel__guest" title="Tasarım serbest; baskı dosyaları hesaba bağlı">
        Misafir · tasarım serbest
      </span>
      <button type="button" className="ghost-btn" onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen}>
        Giriş yap
      </button>

      {formOpen && (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmitAuth()
          }}
        >
          <p className="auth-form__title">{mode === 'login' ? 'Hesabına gir' : 'Hesap aç'}</p>
          <label className="auth-form__row">
            <span>E-posta</span>
            <input
              className="auth-form__input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="auth-form__row">
            <span>Parola</span>
            <input
              className="auth-form__input"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === 'register' && (
            <label className="auth-form__row">
              <span>Ad</span>
              <input
                className="auth-form__input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <div className="auth-form__actions">
            <button type="submit" className="auth-form__submit" disabled={busy}>
              {busy ? 'Bir saniye…' : mode === 'login' ? 'Gir' : 'Hesap aç'}
            </button>
            <button
              type="button"
              className="auth-form__switch"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
            >
              {mode === 'login' ? 'Hesabın yok mu? Aç' : 'Hesabın var mı? Gir'}
            </button>
          </div>
          {error && <span className="auth-form__error">{error}</span>}
        </form>
      )}

      {apiDown && (
        <span className="auth-panel__error auth-panel__error--banner">
          API kapalı — giriş ve baskı dosyaları şu an kullanılamıyor. Tasarım yapmaya devam edebilirsin.
        </span>
      )}
    </div>
  )
}
