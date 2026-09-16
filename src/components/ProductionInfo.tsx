import { useState } from 'react'
import type { DesignSpec } from '../types'
import { studioProcessSummary } from '../engine/studio/faceCaption'
import { downloadZip } from '../engine/production/exportDoc'
import { RatingBar } from './RatingBar'

type ProductionInfoProps = {
  design: DesignSpec
}

export function ProductionInfo({ design }: ProductionInfoProps) {
  const [exportNote, setExportNote] = useState('')
  const passed = design.preflight.items.filter((i) => i.status === 'pass').length
  const blocked = design.preflight.blocking
  const summary = studioProcessSummary(design)

  function onZip() {
    const ok = downloadZip(design)
    setExportNote(ok ? 'Teslim ZIP indirildi.' : 'ZIP yok — kapı kırmızı.')
  }

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
        <button type="button" className="ghost-btn" onClick={onZip} disabled={!design.preflight.exportOk}>
          Teslim ZIP
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
