import { useCallback, useEffect, useState } from 'react'
import type { DesignSpec } from '../types'
import { studioProcessSummary } from '../engine/studio/faceCaption'
import { fetchDeliveryZip, fetchDownloadQuote, type DownloadQuote } from '../api/credits'
import { exportAllowed } from '../engine/production/exportDecision'
import { artworkFromDocument } from '../engine/document'
import { renderFrontSvg } from '../engine/artwork/renderArtwork'
import { rasteriseSvg } from '../engine/llm'
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
  /** Turn the print-ready proof on or off. Absent while a generation is in flight. */
  onProof?: (on: boolean) => void
  busy?: boolean
}

export function ProductionInfo({ design, onProof, busy }: ProductionInfoProps) {
  // The same verdict the exporter uses. Reading `preflight.exportOk` here would enable the button
  // for a design the design gate refuses, and the download would fail with nothing to show for it.
  const canExport = exportAllowed(design)
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
  const proofOn = !!design.overrides.printReady

  /**
   * The file comes from the server.
   *
   * It used to be built here and handed over unconditionally — the credit call happened first, but
   * only because this code chose to make it, so the print files were free to anyone who skipped it.
   * Now the browser asks and the server answers: it recomputes preflight on the design it is sent,
   * builds the bundle, debits the credit and only then returns bytes. Failure at any of those
   * three steps means no file *and* no charge.
   */
  async function onZip() {
    if (!signedIn) return
    if (quote && quote.cost > 0) {
      const ok = window.confirm(
        `Bu dosyayı indirmek ${quote.cost} kredi. Bakiyeniz ${quote.balance}.

` +
          'Bir tasarımın ücreti bir dosya indirme hakkı içerir; bu tasarımınkini kullandınız. İndirilsin mi?',
      )
      if (!ok) return
    }
    setZipping(true)
    setExportNote('Baskı dosyaları hazırlanıyor…')
    try {
      /*
       * A picture of the design, rasterised here because this is where the canvas is. Everything
       * else in the bundle is for a printer; without this the customer cannot show anyone what
       * they made without opening a vector tool. Failure is silent on purpose — a missing preview
       * must never cost someone the print files they paid for.
       */
      const preview = await rasteriseSvg(renderFrontSvg(design.dieline, artworkFromDocument(design.document), design.palette), 1400).catch(
        () => null,
      )
      const { blob, filename } = await fetchDeliveryZip(design, designKeyOf(design), preview)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      refreshQuote()
      setExportNote('Teslim ZIP indirildi — yazılar outline.')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setExportNote(
        /kredi/i.test(message)
          ? 'Krediniz yetersiz — indirme yapılmadı.'
          : /giriş/i.test(message)
            ? 'İndirmek için giriş yapman gerekiyor.'
            : message || 'ZIP üretilemedi.',
      )
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
          : proofOn
            ? 'Ön kontrol geçti. 3 mm güvenli alan ve 3 mm taşma payı kılavuzları çizili. Dieline PDF/X-4 sRGB; trap yok; FOGRA değil.'
            : 'Tasarım hazır. Baskıya hazırlarsan pakete güvenli alan ve taşma payı kılavuzları da girer.'}
      </p>

      {/*
       * The proof state, and the control that changes it.
       *
       * Both used to be missing: `printReady` turned on only by typing "baskıya hazırla" into the
       * chat, and the two bundles — one with proof guides, one without — arrived under the same
       * button with the same label. Now the state is on screen and one click moves it.
       */}
      <div className={`prod__proof ${proofOn ? 'is-on' : ''}`}>
        <div>
          <strong>{proofOn ? 'Baskı provası açık' : 'Baskı provası kapalı'}</strong>
          <small>
            {proofOn
              ? 'Teslim paketindeki prova sayfası güvenli alanı ve taşma payını gösteriyor.'
              : 'Matbaanın beklediği kılavuzlar pakette yok. Açmanı öneririz.'}
          </small>
        </div>
        {onProof && (
          <button type="button" className="ghost-btn" disabled={busy} onClick={() => onProof(!proofOn)}>
            {proofOn ? 'Provayı kaldır' : 'Baskıya hazırla'}
          </button>
        )}
      </div>

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
          disabled={zipping || !canExport || !signedIn}
          title={
            !signedIn
              ? 'Baskı dosyaları hesabına bağlı — giriş yaptıktan sonra indirebilirsin.'
              : canExport
                ? ''
                : 'Yukarıdaki kırmızı kontrol geçilmeden dosya üretilmiyor.'
          }
        >
          {zipping ? 'Hazırlanıyor…' : `Teslim ZIP${priceLabel}`}
        </button>
        {signedIn && !proofOn && canExport && (
          <span className="prod__export-note">Prova kapalı — paket kılavuzsuz iner.</span>
        )}
        {!signedIn && (
          <span className="prod__export-note">
            Tasarımı istediğin kadar deneyebilirsin. Baskı dosyalarını indirmek için sağ üstten giriş yap.
          </span>
        )}
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
