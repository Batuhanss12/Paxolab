import { useState } from 'react'
import { mockComplete } from '../api/billing'
import { loadAuth } from '../api/client'

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
