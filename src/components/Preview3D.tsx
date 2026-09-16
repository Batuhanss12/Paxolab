import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import type { Attachment, BottleShape, DesignSpec } from '../types'
import { monogram } from '../engine/artwork/copy'
import { facePanelId, renderPanelSvg, type BoxFace } from '../engine/artwork/renderArtwork'
import { recommendBottleShape } from '../engine/label/bottleShape'
import { BottlePreview } from './BottlePreview'

type Preview3DProps = {
  design: DesignSpec
  attachments: Attachment[]
  bottleShape?: BottleShape | null
  onBottleShape?: (shape: BottleShape) => void
}

function faceArt(design: DesignSpec, face: BoxFace): string {
  const panelId = facePanelId(design.dieline, design.artwork, face)
  if (!panelId) return ''
  return renderPanelSvg(design.dieline, design.artwork, panelId, design.palette, { pad: 0, exportFonts: false })
}

function Face({
  face,
  art,
  fallback,
  style,
}: {
  face: BoxFace
  art: string
  fallback: ReactNode
  style: CSSProperties
}) {
  if (art) {
    return (
      <div
        className={`face face--${face} face--art`}
        style={style}
        data-face={face}
        dangerouslySetInnerHTML={{ __html: art }}
      />
    )
  }
  return (
    <div className={`face face--${face}`} style={style} data-face={face}>
      {fallback}
    </div>
  )
}

export function Preview3D({ design, attachments, bottleShape, onBottleShape }: Preview3DProps) {
  if (design.kind === 'label') {
    const shape = bottleShape ?? recommendBottleShape(design.brief)
    return <BottlePreview design={design} shape={shape} onShape={(next) => onBottleShape?.(next)} />
  }
  return <CartonPreview3D design={design} attachments={attachments} />
}

function CartonPreview3D({ design, attachments }: { design: DesignSpec; attachments: Attachment[] }) {
  const { palette: p, copy, overrides, layout } = design
  const [rot, setRot] = useState({ x: -18, y: 32 })
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)
  const auto = useRef(true)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (auto.current) setRot((r) => ({ ...r, y: r.y + 0.12 }))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  function down(e: PointerEvent<HTMLDivElement>) {
    auto.current = false
    drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    setRot({ x: drag.current.rx - dy * 0.35, y: drag.current.ry + dx * 0.35 })
  }

  const logo = attachments.find((a) => a.kind === 'logo') ?? attachments[0]
  const mark = monogram(copy.brand)
  const scale = Math.min(280 / Math.max(layout.widthMm, 1), 320 / Math.max(layout.heightMm, 1))
  const widthPx = Math.max(120, Math.round(layout.widthMm * scale))
  const heightPx = Math.max(150, Math.round(layout.heightMm * scale))
  const depthPx = Math.max(18, Math.min(96, Math.round((layout.depthMm || 28) * scale)))
  const boxStyle = {
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
    '--box-w': `${widthPx}px`,
    '--box-h': `${heightPx}px`,
    '--box-d': `${depthPx}px`,
  } as CSSProperties
  const front = faceArt(design, 'front')
  const back = faceArt(design, 'back')
  const right = faceArt(design, 'right')
  const left = faceArt(design, 'left')
  const top = faceArt(design, 'top')
  const bottom = faceArt(design, 'bottom')

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Sürükleyerek döndür</span>
        <span>Tuck / tepsi hacmi</span>
      </div>
      <div className="scene" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }}>
        <div
          className="box3d"
          data-preview="carton"
          style={boxStyle}
        >
          <Face
            face="front"
            art={front}
            style={{ background: p.bg, color: p.fg, borderColor: p.accent }}
            fallback={
              <>
                {logo ? (
                  <img src={logo.dataUrl} alt="" className="face__logo" style={{ transform: `scale(${overrides.logoScale})` }} />
                ) : (
                  <span className="face__mono" style={{ color: p.accent, transform: `scale(${overrides.logoScale})` }}>
                    {mark}
                  </span>
                )}
                <strong>{copy.brand}</strong>
                <em>{copy.product}</em>
                <small style={{ color: p.muted }}>{copy.tagline}</small>
              </>
            }
          />
          <Face
            face="back"
            art={back}
            style={{ background: p.paper, color: p.muted }}
            fallback={
              <>
                <p>{copy.ingredients}</p>
                {copy.warnings && <p className="face__warn">{copy.warnings}</p>}
              </>
            }
          />
          <Face face="right" art={right} style={{ background: p.accent }} fallback={null} />
          <Face face="left" art={left} style={{ background: p.paper }} fallback={null} />
          <Face face="top" art={top} style={{ background: p.fg }} fallback={null} />
          <Face face="bottom" art={bottom} style={{ background: '#050505' }} fallback={null} />
        </div>
      </div>
    </div>
  )
}
