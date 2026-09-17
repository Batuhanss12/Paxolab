import { useMemo, type CSSProperties } from 'react'
import type { DesignSpec } from '../types'
import { facePanelId, renderPanelSvg } from '../engine/artwork/renderArtwork'
import { OrbitToggle, useOrbit3D } from './useOrbit3D.tsx'

type BottlePreviewProps = {
  design: DesignSpec
}

function panelArt(design: DesignSpec, face: 'front' | 'back'): string {
  const panelId = facePanelId(design.dieline, design.artwork, face)
  if (!panelId) return ''
  return renderPanelSvg(design.dieline, design.artwork, panelId, design.palette, { pad: 0, exportFonts: false })
}

export function BottlePreview({ design }: BottlePreviewProps) {
  const { layout } = design
  const { rot, spinning, toggle, down, move, up } = useOrbit3D({ restX: -12, restY: 28, speed: 0.82, tilt: [-42, 18] })
  const front = useMemo(() => panelArt(design, 'front'), [design])
  const back = useMemo(() => panelArt(design, 'back'), [design])

  const scale = Math.min(220 / Math.max(layout.widthMm, 1), 280 / Math.max(layout.heightMm, 1))
  const labelW = Math.max(88, Math.round(layout.widthMm * scale))
  const labelH = Math.max(110, Math.round(layout.heightMm * scale))
  const bodyH = labelH + 28
  const neckH = Math.round(bodyH * 0.14)
  const capH = Math.round(bodyH * 0.1)
  // The vessel is a mockup, not the artwork: it is the surface the label is *shown on*, and the
  // customer never prints it. Painting it from the design palette made changing the mood look like
  // it had repainted something outside the design — and when the label and the glass landed on
  // neighbouring tones, the label stopped reading as a separate object at all. So the glass is a
  // constant neutral, chosen to sit behind any palette without competing with it.
  const glass = '#dbe3e8'
  const glassDark = '#9fb1bc'

  const bottleStyle = {
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
    '--body-h': `${bodyH}px`,
    '--neck-h': `${neckH}px`,
    '--cap-h': `${capH}px`,
    '--label-w': `${labelW}px`,
    '--label-h': `${labelH}px`,
    '--glass': glass,
    '--glass-dark': glassDark,
  } as CSSProperties

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Sürükleyerek döndür</span>
        <span>Şişe üzerinde etiket</span>
        <OrbitToggle spinning={spinning} onToggle={toggle} />
      </div>
      <div className="scene" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="bottle3d bottle3d--square" style={bottleStyle} data-bottle="square" data-vessel="square">
          <div className="bottle3d__cap" />
          <div className="bottle3d__neck" />
          <div
            className="bottle3d__square"
            style={{
              width: `${Math.round(labelW * 0.92)}px`,
              height: `${labelH}px`,
              '--sq-d': `${Math.round(labelW * 0.42)}px`,
            } as CSSProperties}
          >
            <div className="bottle3d__sq bottle3d__sq--front" dangerouslySetInnerHTML={{ __html: front }} />
            <div
              className="bottle3d__sq bottle3d__sq--back"
              dangerouslySetInnerHTML={{ __html: back || front }}
            />
            <div className="bottle3d__sq bottle3d__sq--right" />
            <div className="bottle3d__sq bottle3d__sq--left" />
          </div>
        </div>
      </div>
    </div>
  )
}
