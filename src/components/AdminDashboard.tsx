import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  adjustAdminCredits,
  getAdminStats,
  listAdminOrders,
  listAdminUsers,
  type AdminOrder,
  type AdminStats,
  type AdminUser,
} from '../api/admin'

type AdminDashboardProps = {
  open: boolean
  onClose: () => void
}

export function AdminDashboard({ open, onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('10')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setError(null)
    void Promise.all([getAdminStats(), listAdminUsers(), listAdminOrders(30)])
      .then(([s, u, o]) => {
        setStats(s)
        setUsers(u)
        setOrders(o)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Admin paneli yüklenemedi.')
      })
  }, [])

  useEffect(() => {
    if (!open) return
    setNote(null)
    refresh()
  }, [open, refresh])

  async function onAdjust(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNote(null)
    const amt = Number(amount)
    if (!userId.trim() || !Number.isInteger(amt) || amt === 0) {
      setError('userId ve sıfır olmayan tam sayı amount gerekli.')
      setBusy(false)
      return
    }
    try {
      const result = await adjustAdminCredits({
        userId: userId.trim(),
        amount: amt,
        reason: reason.trim() || undefined,
      })
      setNote(`Bakiye güncellendi: ${result.balance} (Δ ${result.amount})`)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlama başarısız.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="dash-overlay" role="presentation" onClick={onClose}>
      <div
        className="dash-panel dash-panel--admin"
        role="dialog"
        aria-label="Admin paneli"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-panel__head">
          <strong>Admin paneli</strong>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Kapat
          </button>
        </div>

        <section className="dash-section">
          <h3 className="dash-section__title">İstatistikler</h3>
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat__n">{stats?.users ?? '—'}</span>
              <span className="dash-stat__l">Kullanıcı</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__n">{stats?.projects ?? '—'}</span>
              <span className="dash-stat__l">Proje</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__n">{stats?.paidOrders ?? '—'}</span>
              <span className="dash-stat__l">Ödenen sipariş</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__n">{stats?.totalCreditsGranted ?? '—'}</span>
              <span className="dash-stat__l">Toplam grant</span>
            </div>
          </div>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Kredi ayarla</h3>
          <form className="dash-adjust" onSubmit={(e) => void onAdjust(e)}>
            <input
              className="auth-panel__input"
              placeholder="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <input
              className="auth-panel__input"
              type="number"
              step={1}
              placeholder="amount (±)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input
              className="auth-panel__input"
              placeholder="Sebep (opsiyonel)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" className="ghost-btn" disabled={busy}>
              {busy ? '…' : 'Uygula'}
            </button>
          </form>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Kullanıcılar</h3>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>E-posta</th>
                  <th>Ad</th>
                  <th>Rol</th>
                  <th>Bakiye</th>
                  <th>Kayıt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td title={u.id}>{u.email}</td>
                    <td>{u.name ?? '—'}</td>
                    <td>{u.role}</td>
                    <td className="dash-mono">{u.balance}</td>
                    <td className="dash-muted">{formatDate(u.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-btn"
                        title="userId kopyala / forma doldur"
                        onClick={() => setUserId(u.id)}
                      >
                        Seç
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Son siparişler</h3>
          <ul className="dash-list">
            {orders.length === 0 && <li className="dash-muted">Sipariş yok.</li>}
            {orders.map((o) => (
              <li key={o.id}>
                <span className="dash-mono" title={o.user_id}>
                  {o.pack_id}
                </span>
                <span>
                  {o.credits} kr · {Number(o.amount_try).toFixed(2)} {o.currency}
                </span>
                <span className="dash-mono">{o.status}</span>
                <span className="dash-muted">{formatDate(o.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>

        {note && <p className="billing-panel__note">{note}</p>}
        {error && <p className="billing-panel__error">{error}</p>}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
