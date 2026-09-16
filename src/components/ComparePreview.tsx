import { studioFaceLabel } from '../engine/studio/faceCaption'
import { renderFrontSvg } from '../engine/artwork/renderArtwork'
import { artworkFromDocument } from '../engine/document'

type ComparePreviewProps = {
  current: DesignSpec
  previous?: DesignSpec
}

function DesignCard({ design, label }: { design: DesignSpec; label: string }) {
  return (
    <article className="compare-card">
      <header>
        <span>{label}</span>
        <strong>Rev {design.revision}</strong>
      </header>
      <div
        className="compare-card__art"
        dangerouslySetInnerHTML={{
          __html: renderFrontSvg(design.dieline, artworkFromDocument(design.document), design.palette),
        }}
      />
      <small>
        {studioFaceLabel(design)}
      </small>
    </article>
  )
}

export function ComparePreview({ current, previous }: ComparePreviewProps) {
  return (
    <div className="compare-grid">
      {previous ? <DesignCard design={previous} label="Önceki" /> : <div className="compare-empty">Karşılaştırma için bir varyasyon üretin.</div>}
      <DesignCard design={current} label="Güncel" />
    </div>
  )
}
