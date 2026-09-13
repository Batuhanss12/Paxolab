import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, loadAuth, type AuthUser } from '../api/client'
import * as authApi from '../api/auth'
import { getBalance } from '../api/credits'
import { getHealth } from '../api/health'
import { BillingPanel } from './BillingPanel'
import { UserDashboard } from './UserDashboard'
import { AdminDashboard } from './AdminDashboard'

type Mode = 'idle' | 'login' | 'register'
type DashboardView = 'none' | 'user' | 'admin'

type AuthPanelProps = {
  onAuthChange?: (user: AuthUser | null) => void
  compact?: boolean
  /** Bump after reserve/commit/refund so balance refreshes. */
  creditsRefreshKey?: number
  /** Load a cloud project into the studio. */
  onLoadProject?: (projectId: string) => void | Promise<void>
}

export function AuthPanel({
  onAuthChange,
  compact = true,
  creditsRefreshKey = 0,
  onLoadProject,
}: AuthPanelProps) {
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth()?.user ?? null)
  const [mode, setMode] = useState<Mode>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [apiDown, setApiDown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [billingOpen, setBillingOpen] = useState(false)
  const [dashboardView, setDashboardView] = useState<DashboardView>('none')

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

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        const state = await authApi.register({ email, password, name: name || undefined })
        setUser(state.user)
      } else {
        const state = await authApi.login({ email, password })
        setUser(state.user)
      }
      setMode('idle')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
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
      setMode('idle')
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

  if (mode === 'idle') {
    return (
      <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
        <span className="auth-panel__guest" title="Giriş yapmadan yerel ve sınırsız">
          Misafir · sınırsız yerel
        </span>
        {apiDown && (
          <span className="auth-panel__error auth-panel__error--banner">
            API kapalı — giriş ve kayıt çalışmaz. Yerel kullanım devam eder.
          </span>
        )}
        <button type="button" className="ghost-btn" onClick={() => setMode('login')}>
          Giriş
        </button>
        <button type="button" className="ghost-btn" onClick={() => setMode('register')}>
          Kayıt
        </button>
      </div>
    )
  }

  return (
    <form
      className={`auth-panel auth-panel--form ${compact ? 'auth-panel--compact' : ''}`}
      onSubmit={(e) => void submit(e)}
    >
      {mode === 'register' && (
        <input
          className="auth-panel__input"
          type="text"
          placeholder="Ad (opsiyonel)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      )}
      <input
        className="auth-panel__input"
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        className="auth-panel__input"
        type="password"
        placeholder="Şifre (min 8)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
      />
      <button type="submit" className="ghost-btn" disabled={busy}>
        {mode === 'register' ? 'Kayıt ol' : 'Giriş yap'}
      </button>
      <button
        type="button"
        className="ghost-btn"
        onClick={() => {
          setMode('idle')
          setError(null)
        }}
        disabled={busy}
      >
        İptal
      </button>
      {error && <span className="auth-panel__error">{error}</span>}
      {apiDown && !error && (
        <span className="auth-panel__error auth-panel__error--banner">
          API kapalı — giriş ve kayıt çalışmaz. Yerel kullanım devam eder.
        </span>
      )}
    </form>
  )
}
