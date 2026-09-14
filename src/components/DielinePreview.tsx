import type { DesignSpec } from '../types'
import { artworkMarkup, clipDefs } from '../engine/artwork/composeArtwork'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'
import { artworkFromDocument } from '../engine/document'
import { pressSafeMm } from '../engine/production/pressBoxes'

type DielinePreviewProps = {
  design: DesignSpec
}

export function DielinePreview({ design }: DielinePreviewProps) {
  const labelSet = design.kind === 'label'
  const artwork = artworkFromDocument(design.document)
  const svg = renderDielineSvg(design.dieline, {
    showArtwork: true,
    artworkMarkup: `<defs>${clipDefs(design.dieline)}</defs>${artworkMarkup(artwork)}`,
    safeInsetMm: design.overrides.printReady ? pressSafeMm(design.dieline) : 0,
  })
  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>{labelSet ? 'Etiket seti' : 'Açılım'}</span>
        <span>{labelSet ? 'Ön + Arka' : 'Kesim · kırım · yırtma'}</span>
        <span>
          {design.layout.widthMm} × {design.layout.depthMm || '—'} × {design.layout.heightMm} mm
        </span>
        {design.dieline.consistent ? <span className="pill">Tutarlı</span> : <span className="pill pill--warn">Panel hatası</span>}
      </div>
      <p className="templates__legend preview-stage__legend">
        <span className="templates__swatch templates__swatch--cut">Kesim düz</span>
        <span className="templates__swatch templates__swatch--crease">Kırım kesik</span>
        <span className="templates__swatch templates__swatch--perf">Yırtma</span>
      </p>
      <div className="preview-stage__canvas preview-stage__canvas--wide">
        <div className="dieline-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  )
}
