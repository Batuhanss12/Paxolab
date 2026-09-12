import type { Attachment, DesignSpec } from '../types'
import { renderFrontSvg } from '../engine/artwork/composeArtwork'

type Preview2DProps = {
  design: DesignSpec
  attachments: Attachment[]
}

export function Preview2D({ design }: Preview2DProps) {
  const svg = renderFrontSvg(design.dieline, design.artwork, design.palette)
  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Rev {design.revision}</span>
        <span>{design.artwork.language}</span>
        <span>
          {design.kind === 'label'
            ? `${design.layout.widthMm} × ${design.layout.heightMm} mm`
            : `${design.layout.widthMm} × ${design.layout.depthMm} × ${design.layout.heightMm} mm`}
        </span>
        {design.overrides.printReady && !design.preflight.blocking && <span className="pill">Baskı kapısı açık</span>}
      </div>
      <div className="preview-stage__canvas">
        <div
          className={`art-svg ${design.kind === 'label' ? 'art-svg--label' : ''}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  )
}
