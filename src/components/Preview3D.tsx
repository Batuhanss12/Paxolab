import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Attachment, DesignSpec } from '../types'
import { monogram } from '../engine/artwork/copy'

type Preview3DProps = {
  design: DesignSpec
  attachments: Attachment[]
}

export function Preview3D({ design, attachments }: Preview3DProps) {
  const { palette: p, copy, overrides, kind, layout } = design
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
  const isLabel = kind === 'label'
  const depth = Math.max(16, Math.min(48, layout.depthMm || 28))

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Sürükleyerek döndür</span>
        <span>{isLabel ? 'Etiket hacmi' : 'Tuck / tepsi hacmi'}</span>
      </div>
      <div className="scene" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }}>
        <div
          className={`box3d ${isLabel ? 'box3d--card' : ''}`}
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          <div className="face face--front" style={{ background: p.bg, color: p.fg, borderColor: p.accent }}>
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
          </div>
          <div className="face face--back" style={{ background: p.paper, color: p.muted }}>
            <p>{copy.ingredients}</p>
            {copy.warnings && <p className="face__warn">{copy.warnings}</p>}
          </div>
          <div className="face face--right" style={{ background: p.accent, ['--d' as string]: `${depth}px` }} />
          <div className="face face--left" style={{ background: p.paper }} />
          <div className="face face--top" style={{ background: p.fg }} />
          <div className="face face--bottom" style={{ background: '#050505' }} />
        </div>
      </div>
    </div>
  )
}
