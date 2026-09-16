import { type CSSProperties } from 'react'
import { OrbitToggle, useOrbit3D } from './useOrbit3D.tsx'

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
  const { rot, spinning, toggle, down, move, up } = useOrbit3D({ restX: -18, restY: 32, speed: 0.7 })
  const isLabel = kind === 'label'

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
        <OrbitToggle spinning={spinning} onToggle={toggle} />
      </div>
      <div className="scene scene--shell" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
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
