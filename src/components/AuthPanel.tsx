import { useCallback, useEffect, useState } from 'react'
import { ApiError, loadAuth, saveAuth, type AuthState, type AuthUser } from '../api/client'
import * as authApi from '../api/auth'
import { getBalance } from '../api/credits'
import { getHealth } from '../api/health'
import { BillingPanel } from './BillingPanel'
import { UserDashboard } from './UserDashboard'
import { AdminDashboard } from './AdminDashboard'

type DashboardView = 'none' | 'user' | 'admin'

type AuthPanelProps = {
  onAuthChange?: (user: AuthUser | null) => void
  compact?: boolean
  /** Bump after reserve/commit/refund so balance refreshes. */
  creditsRefreshKey?: number
  /** Load a cloud project into the studio. */
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
    const parsed = JSON.parse(atob(handoff)) as AuthState
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
  onLoadProject,
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
  const [billingOpen, setBillingOpen] = useState(false)
  const [dashboardView, setDashboardView] = useState<DashboardView>('none')

  useEffect(() => {
    // Legacy marketing ?auth=login|register — strip without opening UI.
    stripQueryParam('auth')
  }, [])

  useEffect(() => {
    onAuthChange?.(user)
  }, [user, onAuthChange])

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
      setDashboardView('none')
      setBillingOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çıkış başarısız.')
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    return (
      <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
        {balance !== null && (
          <button
            type="button"
            className="auth-panel__credits"
            title="Kredi bakiyesi — yüklemek için tıkla"
            onClick={() => setBillingOpen(true)}
          >
            {balance} kr
          </button>
        )}
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setDashboardView('user')
            setBillingOpen(false)
          }}
          title="Hesap paneli"
        >
          Hesabım
        </button>
        {user.role === 'admin' && (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setDashboardView('admin')
              setBillingOpen(false)
            }}
            title="Admin paneli"
          >
            Admin
          </button>
        )}
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setBillingOpen(true)}
          title="Kredi yükle"
        >
          Kredi yükle
        </button>
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
        <BillingPanel
          open={billingOpen}
          onClose={() => setBillingOpen(false)}
          onBalanceChange={(b) => {
            setBalance(b)
            setBillingOpen(false)
          }}
        />
        <UserDashboard
          open={dashboardView === 'user'}
          user={user}
          onClose={() => setDashboardView('none')}
          onOpenBilling={() => {
            setDashboardView('none')
            setBillingOpen(true)
          }}
          onLoadProject={onLoadProject}
          onBalanceChange={setBalance}
        />
        <AdminDashboard
          open={dashboardView === 'admin'}
          onClose={() => setDashboardView('none')}
        />
      </div>
    )
  }

  // Guest: quiet label only — no Giriş / Kayıt (auth lives on marketing site).
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
