import { useState } from 'react'
import type { DesignSpec } from '../types'
import { downloadDxf, downloadPng, downloadSvg, downloadZip, printPdf } from '../engine/production/exportDoc'
import { RatingBar } from './RatingBar'

type ProductionInfoProps = {
  design: DesignSpec
}

export function ProductionInfo({ design }: ProductionInfoProps) {
  const [exportNote, setExportNote] = useState('')
  const passed = design.preflight.items.filter((i) => i.status === 'pass').length
  const blocked = design.preflight.blocking

  function onSvg() {
    const ok = downloadSvg(design)
    setExportNote(ok ? 'Combined SVG indirildi.' : 'Dışa aktarma kapalı — çarpışma veya dieline hatası.')
  }
  function onPng() {
    void downloadPng(design, 2).then((ok) => {
      setExportNote(ok ? 'PNG indirildi (2x).' : 'PNG üretilemedi.')
    })
  }
  function onDxf() {
    const ok = downloadDxf(design)
    setExportNote(ok ? 'DXF dieline indirildi.' : 'DXF yok — kapı kırmızı.')
  }
  function onZip() {
    const ok = downloadZip(design)
    setExportNote(ok ? 'ZIP: dieline + artwork + combined + manifest.' : 'ZIP yok — kapı kırmızı.')
  }
  function onPdf() {
    const ok = printPdf(design)
    setExportNote(ok ? 'Yazdır / PDF penceresi açıldı.' : 'PDF yok — kapı kırmızı.')
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
        {design.designPlan?.summaryTr ? `${design.designPlan.summaryTr}. ` : ''}
        {blocked
          ? 'Kapı kırmızı. Çarpışma veya zorunlu eksik varken yeşil işaret yok.'
          : design.overrides.printReady
            ? 'Ön kontrol geçti. 2 mm güvenli + bleed guide (prova). SVG/DXF dışa aktarılır; PDF yazıcı diyaloğu — PDF/X değil.'
            : 'Motor yüzeyi üretti. “baskıya hazırla” → 2 mm prova overlay; fail varsa yeşil olmaz.'}
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
        <button type="button" className="ghost-btn" onClick={onSvg} disabled={!design.preflight.exportOk}>
          SVG indir
        </button>
        <button type="button" className="ghost-btn" onClick={onPng} disabled={!design.preflight.exportOk}>
          PNG indir
        </button>
        <button type="button" className="ghost-btn" onClick={onDxf} disabled={!design.preflight.exportOk}>
          DXF dieline
        </button>
        <button type="button" className="ghost-btn" onClick={onZip} disabled={!design.preflight.exportOk}>
          ZIP (SVG + DXF + manifest)
        </button>
        <button type="button" className="ghost-btn" onClick={onPdf} disabled={!design.preflight.exportOk}>
          Yazdır / PDF
        </button>
        {exportNote && <span className="prod__export-note">{exportNote}</span>}
      </div>

      <dl className="prod__spec">
        <div>
          <dt>Yapı</dt>
          <dd>{design.structureId}</dd>
        </div>
        <div>
          <dt>Şablon</dt>
          <dd>{design.templateId}</dd>
        </div>
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
        {design.designPlan ? (
          <>
            <div>
              <dt>Set</dt>
              <dd>{design.designPlan.variationIndex + 1}</dd>
            </div>
            <div>
              <dt>Hero</dt>
              <dd>{design.designPlan.heroGraphic.family}</dd>
            </div>
            <div>
              <dt>Crop</dt>
              <dd>
                {design.designPlan.artDirection.crop} · {design.designPlan.crop.safeInsets.toFixed(1)} mm
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      <RatingBar designId={design.id} />
    </div>
  )
}
