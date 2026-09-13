import type { DesignSpec } from '../types'
import { artworkMarkup, clipDefs } from '../engine/artwork/composeArtwork'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'
import { artworkFromDocument } from '../engine/document'

type DielinePreviewProps = {
  design: DesignSpec
}

export function DielinePreview({ design }: DielinePreviewProps) {
  const labelSet = design.kind === 'label'
  const artwork = artworkFromDocument(design.document)
  const svg = renderDielineSvg(design.dieline, {
    showArtwork: true,
    artworkMarkup: `<defs>${clipDefs(design.dieline)}</defs>${artworkMarkup(artwork)}`,
    safeInsetMm: design.overrides.printReady ? 2 : 0,
  })
  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>{labelSet ? 'Etiket seti' : design.structureId}</span>
        <span>{labelSet ? 'Ön + Arka' : 'CUT + CREASE'}</span>
        <span>
          {design.layout.widthMm} × {design.layout.depthMm || '—'} × {design.layout.heightMm} mm
        </span>
        {design.dieline.consistent ? <span className="pill">Tutarlı</span> : <span className="pill pill--warn">Panel hatası</span>}
      </div>
      <div className="preview-stage__canvas preview-stage__canvas--wide">
        <div className="dieline-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  )
}
