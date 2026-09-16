import { useCallback, useEffect, useState } from 'react'
import type { AuthUser } from '../api/client'
import { getBalance, listTransactions, type CreditTransaction } from '../api/credits'
import {
  getCreditsBreakdown,
  getSubscription,
  getUsage,
  listMyOrders,
  type CreditsBreakdown,
  type SubscriptionInfo,
  type UsageEntry,
  type PaymentOrderSummary,
} from '../api/billing'
import {
  deleteProject,
  getProject,
  listProjects,
  type ProjectSummary,
} from '../api/projects'
import { getCloudProjectId, setCloudProjectId } from '../projectStore'

type UserDashboardProps = {
  open: boolean
  user: AuthUser
  onClose: () => void
  onOpenBilling: () => void
  onLoadProject?: (projectId: string) => void | Promise<void>
  onBalanceChange?: (balance: number) => void
}

export function UserDashboard({
  open,
  user,
  onClose,
  onOpenBilling,
  onLoadProject,
  onBalanceChange,
}: UserDashboardProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<CreditsBreakdown | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [txs, setTxs] = useState<CreditTransaction[]>([])
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [orders, setOrders] = useState<PaymentOrderSummary[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setError(null)
    void Promise.all([
      getBalance(),
      getCreditsBreakdown().catch(() => null),
      getSubscription().catch(() => null),
      listTransactions(15),
      getUsage(20).catch(() => []),
      listProjects(),
      listMyOrders(10).catch(() => [] as PaymentOrderSummary[]),
    ])
      .then(([bal, brk, sub, transactions, usageList, projectList, orderList]) => {
        setBalance(bal.balance)
        onBalanceChange?.(bal.balance)
        setBreakdown(brk)
        setSubscription(sub?.subscription ?? null)
        setTxs(transactions)
        setUsage(usageList)
        setProjects(projectList)
        setOrders(orderList)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Panel yüklenemedi.')
      })
  }, [onBalanceChange])

  useEffect(() => {
    if (!open) return
    setNote(null)
    refresh()
  }, [open, refresh])

  async function onOpen(id: string) {
    setBusyId(id)
    setError(null)
    setNote(null)
    try {
      await getProject(id)
      await onLoadProject?.(id)
      setNote('Proje stüdyoya yüklendi.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proje açılamadı.')
    } finally {
      setBusyId(null)
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return
    setBusyId(id)
    setError(null)
    try {
      await deleteProject(id)
      if (getCloudProjectId() === id) setCloudProjectId(null)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setNote('Proje silindi.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi.')
    } finally {
      setBusyId(null)
    }
  }

  if (!open) return null

  const roleLabel = user.role === 'admin' ? 'admin' : 'kullanıcı'

  return (
    <div className="dash-overlay" role="presentation" onClick={onClose}>
      <div
        className="dash-panel"
        role="dialog"
        aria-label="Kullanıcı paneli"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-panel__head">
          <strong>Hesabım</strong>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Kapat
          </button>
        </div>

        <section className="dash-section">
          <h3 className="dash-section__title">Profil</h3>
          <dl className="dash-profile">
            <div>
              <dt>E-posta</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Ad</dt>
              <dd>{user.name?.trim() || '—'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{roleLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="dash-section">
          <div className="dash-section__row">
            <h3 className="dash-section__title">
              Kredi bakiyesi{balance !== null ? `: ${balance}` : ''}
            </h3>
            <button type="button" className="ghost-btn" onClick={onOpenBilling}>
              Kredi yükle
            </button>
          </div>
          {breakdown && (
            <div className="dash-buckets">
              <div className="dash-bucket">
                <span className="dash-bucket__label">Aylık dahil</span>
                <span className="dash-bucket__value">{breakdown.buckets.included}</span>
              </div>
              <div className="dash-bucket">
                <span className="dash-bucket__label">Satın alınan</span>
                <span className="dash-bucket__value">{breakdown.buckets.purchased}</span>
              </div>
              <div className="dash-bucket">
                <span className="dash-bucket__label">Bonus</span>
                <span className="dash-bucket__value">{breakdown.buckets.bonus}</span>
              </div>
            </div>
          )}
          {subscription && (
            <div className="dash-subscription">
              <strong>{subscription.planLabel}</strong> planı · {subscription.monthlyCredits} kr/ay
              {subscription.nextRenewalAt && (
                <span className="dash-muted"> · yenileme: {formatDate(subscription.nextRenewalAt)}</span>
              )}
            </div>
          )}
          <ul className="dash-list">
            {txs.length === 0 && <li className="dash-muted">Henüz işlem yok.</li>}
            {txs.map((tx) => (
              <li key={tx.id}>
                <span className="dash-mono">{tx.kind}</span>
                <span className={tx.amount >= 0 ? 'dash-pos' : 'dash-neg'}>
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount}
                </span>
                <span className="dash-muted">{formatDate(tx.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Kullanım</h3>
          <ul className="dash-list">
            {usage.length === 0 && <li className="dash-muted">Henüz tasarım işlemi yok.</li>}
            {usage.slice(0, 10).map((u) => (
              <li key={u.id}>
                <span className="dash-mono">{u.operationId}</span>
                <span className="dash-neg">-{u.creditCost} kr</span>
                <span className="dash-mono">{u.status}</span>
                <span className="dash-muted">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Projeler</h3>
          <ul className="dash-list dash-list--projects">
            {projects.length === 0 && <li className="dash-muted">Kayıtlı proje yok.</li>}
            {projects.map((p) => (
              <li key={p.id}>
                <div className="dash-project__meta">
                  <strong>{p.title}</strong>
                  <span className="dash-muted">{formatDate(p.updated_at)}</span>
                </div>
                <div className="dash-project__actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={busyId !== null}
                    onClick={() => void onOpen(p.id)}
                  >
                    {busyId === p.id ? '…' : 'Aç'}
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={busyId !== null}
                    onClick={() => void onDelete(p.id)}
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-section">
          <h3 className="dash-section__title">Son ödemeler</h3>
          <ul className="dash-list">
            {orders.length === 0 && <li className="dash-muted">Ödeme kaydı yok.</li>}
            {orders.map((o) => (
              <li key={o.id}>
                <span>{o.pack_id}</span>
                <span>
                  {o.credits} kr · {o.amount_try.toFixed(2)} {o.currency}
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
