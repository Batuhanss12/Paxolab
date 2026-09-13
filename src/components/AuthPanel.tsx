import { useEffect, useState, type FormEvent } from 'react'
import { loadAuth, type AuthUser } from '../api/client'
import * as authApi from '../api/auth'
import { getBalance } from '../api/credits'

type Mode = 'idle' | 'login' | 'register'

type AuthPanelProps = {
  onAuthChange?: (user: AuthUser | null) => void
  compact?: boolean
  /** Bump after reserve/commit/refund so balance refreshes. */
  creditsRefreshKey?: number
}

export function AuthPanel({ onAuthChange, compact = true, creditsRefreshKey = 0 }: AuthPanelProps) {
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth()?.user ?? null)
  const [mode, setMode] = useState<Mode>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const effectiveBalance = user ? balance : null

  useEffect(() => {
    onAuthChange?.(user)
  }, [user, onAuthChange])

  useEffect(() => {
    let cancelled = false
    if (!loadAuth()?.token) {
      return
    }
    void getBalance()
      .then((b) => {
        if (!cancelled) setBalance(b.balance)
      })
      .catch(() => {
        if (!cancelled) setBalance(null)
      })
    return () => {
      cancelled = true
    }
  }, [user, creditsRefreshKey])

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çıkış başarısız.')
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    return (
      <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
        {effectiveBalance !== null && (
          <span className="auth-panel__credits" title="Kredi bakiyesi">
            {effectiveBalance} kr
          </span>
        )}
        <span className="auth-panel__email" title={user.email}>
          {user.email}
        </span>
        <button type="button" className="ghost-btn" onClick={() => void onLogout()} disabled={busy}>
          Çıkış
        </button>
        {error && <span className="auth-panel__error">{error}</span>}
      </div>
    )
  }

  if (mode === 'idle') {
    return (
      <div className={`auth-panel ${compact ? 'auth-panel--compact' : ''}`}>
        <span className="auth-panel__guest" title="Giriş yapmadan yerel ve sınırsız">
          Misafir · sınırsız yerel
        </span>
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
    </form>
  )
}
