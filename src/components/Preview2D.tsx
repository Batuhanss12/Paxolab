import type { Attachment, DesignSpec, DimensionsMm } from '../types'
import { studioFaceLabel, studioLanguageCaption } from '../engine/studio/faceCaption'
import { facePanelId, renderFrontSvg, renderPanelSvg } from '../engine/artwork/renderArtwork'
import { artworkFromDocument } from '../engine/document'
import { useState } from 'react'

type Preview2DProps = {
  design: DesignSpec
  attachments: Attachment[]
  onDims: (dims: DimensionsMm) => void
}

export function Preview2D({ design, onDims }: Preview2DProps) {
  const isLabel = design.kind === 'label'
  const [labelFace, setLabelFace] = useState<'front' | 'back'>('front')
  const dims: DimensionsMm = {
    L: design.layout.widthMm,
    W: design.layout.depthMm,
    H: design.layout.heightMm,
  }
  const artwork = artworkFromDocument(design.document)
  const svg = isLabel
    ? (() => {
        const panelId = facePanelId(design.dieline, design.artwork, labelFace)
        return panelId
          ? renderPanelSvg(design.dieline, design.artwork, panelId, design.palette, { pad: 6, exportFonts: true })
          : renderFrontSvg(design.dieline, artwork, design.palette)
      })()
    : renderFrontSvg(design.dieline, artwork, design.palette)
  const languageCaption = studioLanguageCaption(design)

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Rev {design.revision}</span>
        {design.designPlan || design.studio ? <span>{studioFaceLabel(design)}</span> : null}
        {languageCaption ? <span>{languageCaption}</span> : null}
        {isLabel && (
          <div className="label-face-toggle" role="group" aria-label="Etiket yüzü">
            <button type="button" className={labelFace === 'front' ? 'is-active' : ''} onClick={() => setLabelFace('front')}>
              Ön
            </button>
            <button type="button" className={labelFace === 'back' ? 'is-active' : ''} onClick={() => setLabelFace('back')}>
              Arka
            </button>
          </div>
        )}
        {design.overrides.printReady && !design.preflight.blocking && <span className="pill">Baskı kapısı açık</span>}
        <div className="dim-strip" aria-label="Ölçü">
          <span className="dim-strip__label">Ölçü</span>
          <label>
            {isLabel ? 'En' : 'L'}
            <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
          </label>
          {!isLabel && (
            <label>
              W
              <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
            </label>
          )}
          <label>
            {isLabel ? 'Boy' : 'H'}
            <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
          </label>
          <span className="dim-strip__unit">mm</span>
        </div>
      </div>
      <div className="preview-stage__canvas">
        <div
          className={`art-svg ${isLabel ? 'art-svg--label' : ''}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  )
}
