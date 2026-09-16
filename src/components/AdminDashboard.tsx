import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  adjustAdminCredits,
  getAdminStats,
  getBillingOverview,
  listAdminOrders,
  listAdminUsers,
  getAdminUserCredits,
  getAdminUserLedger,
  listAdminPlans,
  listAdminOperations,
  patchAdminOperation,
  type AdminOrder,
  type AdminStats,
  type AdminUser,
  type AdminBillingOverview,
  type AdminUserCredits,
  type AdminLedgerEntry,
  type AdminPlan,
  type AdminOperation,
} from '../api/admin'

type AdminDashboardProps = {
  open: boolean
  onClose: () => void
}

export function AdminDashboard({ open, onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [overview, setOverview] = useState<AdminBillingOverview | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [operations, setOperations] = useState<AdminOperation[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUserCredits | null>(null)
  const [userLedger, setUserLedger] = useState<AdminLedgerEntry[]>([])
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('10')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setError(null)
    void Promise.all([
      getAdminStats(),
      getBillingOverview().catch(() => null),
      listAdminUsers(),
      listAdminOrders(30),
      listAdminPlans().catch(() => []),
      listAdminOperations().catch(() => []),
    ])
      .then(([s, ov, u, o, pl, ops]) => {
        setStats(s)
        setOverview(ov)
        setUsers(u)
        setOrders(o)
        setPlans(pl)
        setOperations(ops)
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

  async function onSelectUser(id: string) {
    setUserId(id)
    setBusy(true)
    setError(null)
    try {
      const [credits, ledger] = await Promise.all([
        getAdminUserCredits(id),
        getAdminUserLedger(id, 50),
      ])
      setSelectedUser(credits)
      setUserLedger(ledger)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı detayı yüklenemedi.')
    } finally {
      setBusy(false)
    }
  }

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
      if (selectedUser) void onSelectUser(userId.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlama başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onPatchOperationCost(op: AdminOperation, newCost: number) {
    setBusy(true)
    try {
      await patchAdminOperation(op.operationId, { creditCost: newCost })
      setNote(`${op.operationId} maliyeti ${newCost} kr olarak güncellendi.`)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operasyon güncellenemedi.')
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

        {overview && (
          <section className="dash-section">
            <h3 className="dash-section__title">Faturalama özeti</h3>
            <div className="dash-stats">
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.activeSubscriptions}</span>
                <span className="dash-stat__l">Aktif abonelik</span>
              </div>
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.creditsConsumed}</span>
                <span className="dash-stat__l">Tüketilen kredi</span>
              </div>
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.creditsPurchased}</span>
                <span className="dash-stat__l">Satın alınan</span>
              </div>
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.topupRevenue.toFixed(0)} ₺</span>
                <span className="dash-stat__l">Top-up gelir</span>
              </div>
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.subscriptionRevenue.toFixed(0)} ₺</span>
                <span className="dash-stat__l">Abonelik gelir</span>
              </div>
              <div className="dash-stat">
                <span className="dash-stat__n">{overview.failedOperations}</span>
                <span className="dash-stat__l">Başarısız işlem</span>
              </div>
            </div>
            {overview.llmCosts.totalRecords > 0 && (
              <p className="dash-muted">
                LLM maliyet: ${overview.llmCosts.totalCostUsd.toFixed(4)} ·
                {overview.llmCosts.totalInputTokens + overview.llmCosts.totalOutputTokens} token
              </p>
            )}
          </section>
        )}

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
                        title="Detayları gör / forma doldur"
                        onClick={() => void onSelectUser(u.id)}
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedUser && (
          <section className="dash-section">
            <h3 className="dash-section__title">
              Kullanıcı detayı: {selectedUser.user.email}
            </h3>
            <div className="dash-buckets">
              <div className="dash-bucket">
                <span className="dash-bucket__label">Bakiye</span>
                <span className="dash-bucket__value">{selectedUser.balance}</span>
              </div>
              <div className="dash-bucket">
                <span className="dash-bucket__label">Dahil</span>
                <span className="dash-bucket__value">{selectedUser.buckets.included}</span>
              </div>
              <div className="dash-bucket">
                <span className="dash-bucket__label">Satın</span>
                <span className="dash-bucket__value">{selectedUser.buckets.purchased}</span>
              </div>
              <div className="dash-bucket">
                <span className="dash-bucket__label">Bonus</span>
                <span className="dash-bucket__value">{selectedUser.buckets.bonus}</span>
              </div>
            </div>
            {selectedUser.subscription && (
              <p className="dash-muted">
                Abonelik: {selectedUser.subscription.planId} ({selectedUser.subscription.status})
              </p>
            )}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Miktar</th>
                    <th>Bakiye sonrası</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {userLedger.slice(0, 20).map((l) => (
                    <tr key={l.id}>
                      <td className="dash-mono">{l.kind}</td>
                      <td className={l.amount >= 0 ? 'dash-pos' : 'dash-neg'}>
                        {l.amount >= 0 ? '+' : ''}{l.amount}
                      </td>
                      <td className="dash-mono">{l.balanceAfter}</td>
                      <td className="dash-muted">{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {operations.length > 0 && (
          <section className="dash-section">
            <h3 className="dash-section__title">Operasyon maliyetleri</h3>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Operasyon</th>
                    <th>Kategori</th>
                    <th>Maliyet</th>
                    <th>Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => (
                    <tr key={op.operationId}>
                      <td>{op.displayName}</td>
                      <td className="dash-muted">{op.category}</td>
                      <td>
                        <input
                          type="number"
                          defaultValue={op.creditCost}
                          className="dash-input--mini"
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (Number.isInteger(v) && v !== op.creditCost) {
                              void onPatchOperationCost(op, v)
                            }
                          }}
                        />
                      </td>
                      <td>{op.enabled ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {plans.length > 0 && (
          <section className="dash-section">
            <h3 className="dash-section__title">Planlar</h3>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Etiket</th>
                    <th>Aylık kredi</th>
                    <th>Fiyat</th>
                    <th>Rollover</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td className="dash-mono">{p.id}</td>
                      <td>{p.label}</td>
                      <td>{p.monthlyCredits}</td>
                      <td>{p.monthlyPrice} {p.currency}</td>
                      <td className="dash-muted">{p.rolloverPolicy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
