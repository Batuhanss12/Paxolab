import { useCallback, useEffect, useState } from 'react'
import type { DesignSpec } from '../types'
import { studioProcessSummary } from '../engine/studio/faceCaption'
import { downloadZip } from '../engine/production/exportDoc'
import { chargeDownload, fetchDownloadQuote, type DownloadQuote } from '../api/credits'
import { loadAuth } from '../api/client'
import { RatingBar } from './RatingBar'

/**
 * Which design this file is. Taking a *different* design away is a separate purchase, so the
 * ledger records what was taken rather than only that something was.
 */
function designKeyOf(design: DesignSpec): string {
  return [design.copy.brand, design.copy.product, design.kind, design.studio?.direction.archetype ?? '', design.designPlan?.variationIndex ?? 0]
    .join('|')
    .slice(0, 200)
}

type ProductionInfoProps = {
  design: DesignSpec
}

export function ProductionInfo({ design }: ProductionInfoProps) {
  const [exportNote, setExportNote] = useState('')
  const [zipping, setZipping] = useState(false)
  const [quote, setQuote] = useState<DownloadQuote | null>(null)
  const signedIn = Boolean(loadAuth()?.token)

  // Quoted up front, never discovered afterwards: this charge is the size of the design itself,
  // and a customer who only finds that out after clicking has been surprised by a large number.
  const refreshQuote = useCallback(() => {
    if (!signedIn) return
    void fetchDownloadQuote().then(setQuote).catch(() => setQuote(null))
  }, [signedIn])

  useEffect(refreshQuote, [refreshQuote])
  const passed = design.preflight.items.filter((i) => i.status === 'pass').length
  const blocked = design.preflight.blocking
  const summary = studioProcessSummary(design)

  async function onZip() {
    if (signedIn && quote && quote.cost > 0) {
      const ok = window.confirm(
        `Bu dosyayı indirmek ${quote.cost} kredi. Bakiyeniz ${quote.balance}.

` +
          'Bir tasarımın ücreti bir dosya indirme hakkı içerir; bu tasarımınkini kullandınız. İndirilsin mi?',
      )
      if (!ok) return
    }
    setZipping(true)
    setExportNote('Yazılar vektöre çevriliyor…')
    try {
      // Charged before the file is built: a wallet that cannot cover it must stop here, not after
      // the customer has already been handed the artwork.
      if (signedIn) {
        const charged = await chargeDownload(designKeyOf(design))
        refreshQuote()
        if (charged.charged > 0) setExportNote(`${charged.charged} kredi düşüldü — dosya hazırlanıyor…`)
      }
      const ok = await downloadZip(design)
      setExportNote(ok ? 'Teslim ZIP indirildi — yazılar outline.' : 'ZIP yok — kapı kırmızı.')
    } catch (err) {
      setExportNote(err instanceof Error && /kredi/i.test(err.message) ? 'Krediniz yetersiz — indirme yapılmadı.' : 'ZIP üretilemedi.')
    } finally {
      setZipping(false)
    }
  }

  const priceLabel = !signedIn || !quote ? '' : quote.cost > 0 ? ` · ${quote.cost} kredi` : ' · dahil'

  return (
    <div className="prod">
      <header className="prod__head">
        <div>
          <p className="eyebrow">Üretim bilgisi</p>
          <h2>
            {design.copy.brand} · {design.copy.product}
          </h2>
        </div>
        <div className="prod__score">
          <strong>{passed}</strong>
          <span>/{design.preflight.items.length} geçti</span>
        </div>
      </header>

      <p className="prod__lead">
        {summary ? `${summary}. ` : ''}
        {blocked
          ? 'Kapı kırmızı. Çarpışma veya zorunlu eksik varken yeşil işaret yok.'
          : design.overrides.printReady
            ? 'Ön kontrol geçti. 3 mm güvenli + 3 mm bleed kılavuz (CUT trim’de). Dieline PDF/X-4 sRGB; trap yok; FOGRA değil.'
            : 'Motor yüzeyi üretti. “baskıya hazırla” → 3 mm prova overlay; fail varsa yeşil olmaz.'}
      </p>

      <ul className="prod__list">
        {design.preflight.items.map((item) => (
          <li key={item.id} className={`is-${item.status}`}>
            <span className="check">
              {item.status === 'pass' ? '●' : item.status === 'fail' ? '×' : item.status === 'na' ? '–' : '○'}
            </span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
          </li>
        ))}
      </ul>

      <div className="prod__actions">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void onZip()}
          disabled={zipping || !design.preflight.exportOk}
        >
          {zipping ? 'Hazırlanıyor…' : `Teslim ZIP${priceLabel}`}
        </button>
        {exportNote && <span className="prod__export-note">{exportNote}</span>}
      </div>

      <dl className="prod__spec">
        <div>
          <dt>Ölçü</dt>
          <dd>
            {design.layout.widthMm} × {design.layout.depthMm || '—'} × {design.layout.heightMm} mm
          </dd>
        </div>
        <div>
          <dt>Barkod</dt>
          <dd>
            {design.copy.barcode || 'yok'}
            {design.brief.barcodeDefaulted ? ' · örnek (GS1 değil)' : ''}
          </dd>
        </div>
      </dl>

      <RatingBar designId={design.id} />
    </div>
  )
}
