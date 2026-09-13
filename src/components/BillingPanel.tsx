import { useCallback, useEffect, useState } from 'react'
import {
  checkout,
  listPacks,
  listPlans,
  mockComplete,
  type CreditPack,
  type PlanMeta,
} from '../api/billing'
import { loadAuth } from '../api/client'

type BillingPanelProps = {
  open: boolean
  onClose: () => void
  onBalanceChange?: (balance: number) => void
}

export function BillingPanel({ open, onClose, onBalanceChange: _onBalanceChange }: BillingPanelProps) {
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [plans, setPlans] = useState<PlanMeta[]>([])
  const [busyPack, setBusyPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(() => {
    void Promise.all([listPacks(), listPlans()])
      .then(([p, pl]) => {
        setPacks(p)
        setPlans(pl)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Paketler yüklenemedi.')
      })
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setNote(null)
    load()
  }, [open, load])

  async function onBuy(pack: CreditPack) {
    if (!loadAuth()?.token) {
      setError('Kredi yüklemek için giriş yapın.')
      return
    }
    setBusyPack(pack.id)
    setError(null)
    setNote(null)
    try {
      const result = await checkout(pack.id)
      if (result.mode === 'mock') {
        // Same-tab mock pay page (no network / no real charge)
        window.location.assign(result.paymentPageUrl)
        return
      }
      window.open(result.paymentPageUrl, '_blank', 'noopener,noreferrer')
      setNote('Ödeme sayfası açıldı. Tamamlayınca bakiyeniz güncellenir.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başlatılamadı.')
    } finally {
      setBusyPack(null)
    }
  }

  if (!open) return null

  return (
    <div className="billing-panel" role="dialog" aria-label="Kredi yükle">
      <div className="billing-panel__head">
        <strong>Kredi yükle</strong>
        <button type="button" className="ghost-btn" onClick={onClose}>
          Kapat
        </button>
      </div>

      <p className="billing-panel__hint">
        iyzico sandbox / mock — gerçek ücret alınmaz. Anahtar yoksa mock ödeme kullanılır.
      </p>

      <ul className="billing-panel__packs">
        {packs.map((pack) => (
          <li key={pack.id} className="billing-panel__pack">
            <div>
              <div className="billing-panel__pack-label">{pack.label}</div>
              <div className="billing-panel__pack-price">
                {pack.priceTry.toFixed(2)} TRY
              </div>
            </div>
            <button
              type="button"
              className="ghost-btn billing-panel__buy"
              disabled={busyPack !== null}
              onClick={() => void onBuy(pack)}
            >
              {busyPack === pack.id ? '…' : 'Kredi yükle'}
            </button>
          </li>
        ))}
      </ul>

      <div className="billing-panel__plans">
        <div className="billing-panel__plans-title">Planlar (bilgi)</div>
        <ul>
          {plans.map((plan) => (
            <li key={plan.id}>
              <strong>{plan.label}</strong> — {plan.monthlyCredits} kr/ay
              {plan.priceTry > 0 ? ` · ${plan.priceTry} TRY` : ''}
              {plan.displayOnly ? ' · yakında' : ''}
              <div className="billing-panel__plan-desc">{plan.description}</div>
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
