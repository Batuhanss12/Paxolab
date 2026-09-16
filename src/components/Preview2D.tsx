import { studioFaceLabel } from '../engine/studio/faceCaption'
import { renderFrontSvg } from '../engine/artwork/composeArtwork'
import { artworkFromDocument } from '../engine/document'

type Preview2DProps = {
  design: DesignSpec
  attachments: Attachment[]
  onDims: (dims: DimensionsMm) => void
}

export function Preview2D({ design, onDims }: Preview2DProps) {
  const isLabel = design.kind === 'label'
  const dims: DimensionsMm = {
    L: design.layout.widthMm,
    W: design.layout.depthMm,
    H: design.layout.heightMm,
  }
  const svg = renderFrontSvg(design.dieline, artworkFromDocument(design.document), design.palette)

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Rev {design.revision}</span>
        {design.designPlan || design.studio ? <span>{studioFaceLabel(design)}</span> : null}
        <span>{design.artwork.language}</span>
        {design.overrides.printReady && !design.preflight.blocking && <span className="pill">Baskı kapısı açık</span>}
        <div className="dim-strip" aria-label="Ölçü">
          <span className="dim-strip__label">Ölçü</span>
          <label>
            L
            <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
          </label>
          {!isLabel && (
            <label>
              W
              <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
            </label>
          )}
          <label>
            H
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
