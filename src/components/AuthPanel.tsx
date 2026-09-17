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

  return (
    <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
      <span className="auth-panel__guest" title="Giriş yapmadan yerel ve sınırsız">
        Misafir · sınırsız yerel
      </span>
      {apiDown && (
        <span className="auth-panel__error auth-panel__error--banner">
          API kapalı — bulut özellikleri durakladı. Yerel kullanım devam eder.
        </span>
      )}
    </div>
  )
}
