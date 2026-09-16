import { useCallback, useEffect, useState } from 'react'
import {
  listPlans,
  mockComplete,
  getSubscription,
  subscribe,
  cancelSubscription,
  type PlanMeta,
  type SubscriptionInfo,
} from '../api/billing'
import { loadAuth } from '../api/client'

type BillingPanelProps = {
  open: boolean
  onClose: () => void
  onBalanceChange?: (balance: number) => void
}

export function BillingPanel({ open, onClose, onBalanceChange: _onBalanceChange }: BillingPanelProps) {
  const [plans, setPlans] = useState<PlanMeta[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(() => {
    void Promise.all([listPlans(), getSubscription().catch(() => null)])
      .then(([pl, sub]) => {
        setPlans(pl)
        setSubscription(sub?.subscription ?? null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Planlar yüklenemedi.')
      })
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setNote(null)
    load()
  }, [open, load])

  async function onSubscribe(planId: string) {
    setBusyPlan(planId)
    setError(null)
    setNote(null)
    try {
      const result = await subscribe(planId)
      setSubscription(result.subscription)
      setNote(`${result.subscription.planLabel} planı aktif edildi.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik başlatılamadı.')
    } finally {
      setBusyPlan(null)
    }
  }

  async function onCancel() {
    setBusyPlan('cancel')
    setError(null)
    setNote(null)
    try {
      const result = await cancelSubscription()
      setSubscription(result.subscription)
      setNote('Abonelik iptal edildi.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal başarısız.')
    } finally {
      setBusyPlan(null)
    }
  }

  if (!open) return null

  return (
    <div className="billing-panel" role="dialog" aria-label="Planlar">
      <div className="billing-panel__head">
        <strong>Planlar</strong>
        <button type="button" className="ghost-btn" onClick={onClose}>
          Kapat
        </button>
      </div>

      <p className="billing-panel__hint">
        Aylık abonelik. İlk tasarım 117 kredi, revizyon ve değişiklik 3 kredi.
      </p>

      {subscription && (
        <div className="billing-panel__subscription">
          <div className="billing-panel__sub-info">
            <strong>{subscription.planLabel}</strong> · {subscription.monthlyCredits} kr/ay
            {subscription.status === 'cancelled' && ' · iptal edildi'}
          </div>
          {subscription.status === 'active' && (
            <button
              type="button"
              className="ghost-btn"
              disabled={busyPlan !== null}
              onClick={() => void onCancel()}
            >
              {busyPlan === 'cancel' ? '…' : 'İptal et'}
            </button>
          )}
        </div>
      )}

      <div className="billing-panel__plans">
        <div className="billing-panel__plans-title">Planlar</div>
        <ul>
          {plans.map((plan) => (
            <li key={plan.id} className="billing-panel__plan">
              <div>
                <strong>{plan.label}</strong> —{' '}
                {plan.unlimited
                  ? 'sınırsız tasarım'
                  : `${plan.monthlyCredits} kr/ay`}
                {plan.priceTry > 0 ? ` · ${plan.priceTry} TL` : ' · ücretsiz'}
                {plan.unitPriceTry ? ` · ${plan.unitPriceTry.toFixed(2)} TL/kr` : ''}
                {plan.displayOnly ? ' · yakında' : ''}
                <div className="billing-panel__plan-desc">{plan.description}</div>
              </div>
              {!plan.displayOnly && (
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={busyPlan !== null}
                  onClick={() => void onSubscribe(plan.id)}
                >
                  {busyPlan === plan.id ? '…' : subscription?.planId === plan.id ? 'Aktif' : 'Seç'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {note && <p className="billing-panel__note">{note}</p>}
      {error && <p className="billing-panel__error">{error}</p>}
    </div>
  )
}

/** Standalone mock pay page when user lands on /billing/mock-pay?orderId=… */
export function MockPayPage({
  orderId,
  onDone,
}: {
  orderId: string
  onDone: (balance: number) => void
}) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function complete() {
    if (!loadAuth()?.token) {
      setStatus('err')
      setMessage('Giriş gerekli.')
      return
    }
    setStatus('busy')
    try {
      const done = await mockComplete(orderId)
      setStatus('ok')
      setMessage(
        done.alreadyPaid
          ? 'Zaten ödenmişti.'
          : `Ödeme tamam · bakiye ${done.balance}`,
      )
      onDone(done.balance)
      window.setTimeout(() => {
        window.history.replaceState({}, '', '/?billing=success')
        window.location.href = '/?billing=success'
      }, 600)
    } catch (err) {
      setStatus('err')
      setMessage(err instanceof Error ? err.message : 'Başarısız')
    }
  }

  return (
    <div className="mock-pay">
      <h1>Mock ödeme</h1>
      <p>Sipariş: {orderId}</p>
      <p>Gerçek ücret alınmaz. Onaylayınca kredi cüzdanınıza eklenir.</p>
      <button
        type="button"
        className="ghost-btn"
        disabled={status === 'busy' || status === 'ok'}
        onClick={() => void complete()}
      >
        {status === 'busy' ? 'İşleniyor…' : 'Ödemeyi tamamla (mock)'}
      </button>
      {message && <p className={status === 'err' ? 'billing-panel__error' : 'billing-panel__note'}>{message}</p>}
    </div>
  )
}
