import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

type CartonShellProps = {
  widthMm: number
  heightMm: number
  depthMm: number
  kind?: 'box' | 'label'
  caption?: string
  grammar?: string
}

export function CartonShell({
  widthMm,
  heightMm,
  depthMm,
  kind = 'box',
  caption,
  grammar,
}: CartonShellProps) {
  const [rot, setRot] = useState({ x: -18, y: 32 })
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)
  const auto = useRef(true)
  const isLabel = kind === 'label'

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

  const scale = Math.min(180 / Math.max(widthMm, 1), 210 / Math.max(heightMm, 1))
  const widthPx = Math.max(72, Math.round(widthMm * scale))
  const heightPx = Math.max(90, Math.round(heightMm * scale))
  const depthPx = isLabel ? 12 : Math.max(16, Math.min(72, Math.round((depthMm || 28) * scale)))
  const boxStyle = {
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
    '--box-w': `${widthPx}px`,
    '--box-h': `${heightPx}px`,
    '--box-d': `${depthPx}px`,
  } as CSSProperties

  return (
    <div className="carton-shell">
      <div className="carton-shell__meta">
        <strong>{grammar || (isLabel ? 'Etiket' : 'Kutu')}</strong>
        <span>
          {widthMm}×{depthMm || '—'}×{heightMm} mm
        </span>
      </div>
      <div className="scene scene--shell" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }}>
        <div className={`box3d ${isLabel ? 'box3d--card' : ''}`} style={boxStyle}>
          <div className="face face--front" data-face="front">
            <em>Ön</em>
            <small>
              {widthMm}×{heightMm}
            </small>
          </div>
          <div className="face face--back" data-face="back">
            <em>Arka</em>
          </div>
          <div className="face face--right" data-face="right">
            <em>Yan</em>
          </div>
          <div className="face face--left" data-face="left" />
          <div className="face face--top" data-face="top">
            <em>Kapak</em>
          </div>
          <div className="face face--bottom" data-face="bottom" />
        </div>
      </div>
      {caption && <p className="carton-shell__caption">{caption}</p>}
    </div>
  )
}
