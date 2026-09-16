import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { BottleShape, DesignSpec } from '../types'
import { PERFUME_CYLINDER_PX } from '../engine/label/bottleShape'
import { facePanelId, renderPanelSvg } from '../engine/artwork/renderArtwork'

const BODY_SEGS = 24
const SMALL_SEGS = 16

type BottlePreviewProps = {
  design: DesignSpec
  shape: BottleShape
  onShape: (shape: BottleShape) => void
}

function panelArt(design: DesignSpec, face: 'front' | 'back'): string {
  const panelId = facePanelId(design.dieline, design.artwork, face)
  if (!panelId) return ''
  return renderPanelSvg(design.dieline, design.artwork, panelId, design.palette, { pad: 0, exportFonts: false })
}

function shade(angle: number, light: string, dark: string): string {
  const t = (Math.cos(((angle - 26) * Math.PI) / 180) + 1) / 2
  return t > 0.58 ? light : dark
}

function Ring({
  radius,
  height,
  className,
  light,
  dark,
  segments = SMALL_SEGS,
}: {
  radius: number
  height: number
  className?: string
  light: string
  dark: string
  segments?: number
}) {
  const circ = 2 * Math.PI * radius
  return (
    <div className={`bottle3d__ring ${className ?? ''}`} style={{ height: `${height}px` }}>
      {Array.from({ length: segments }, (_, i) => {
        const angle = (360 / segments) * i
        const segW = Math.ceil(circ / segments) + 1
        return (
          <div
            key={i}
            className="bottle3d__seg"
            style={{
              width: `${segW}px`,
              height: `${height}px`,
              left: `${-segW / 2}px`,
              transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
              background: shade(angle, light, dark),
            }}
          />
        )
      })}
    </div>
  )
}

export function BottlePreview({ design, shape, onShape }: BottlePreviewProps) {
  const { layout, palette: p } = design
  const [rot, setRot] = useState({ x: -12, y: 28 })
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)
  const auto = useRef(true)
  const wrap = design.structureId === 'wrap-label'
  const front = panelArt(design, 'front')
  const back = panelArt(design, 'back')
  const cylinder = shape === 'cylinder'

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (auto.current) setRot((r) => ({ ...r, y: r.y + 0.1 }))
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
    setRot({ x: Math.max(-42, Math.min(18, drag.current.rx - dy * 0.35)), y: drag.current.ry + dx * 0.35 })
  }

  const scale = Math.min(220 / Math.max(layout.widthMm, 1), 280 / Math.max(layout.heightMm, 1))
  const labelW = Math.max(88, Math.round(layout.widthMm * scale))
  const labelH = Math.max(110, Math.round(layout.heightMm * scale))

  const radius = cylinder ? PERFUME_CYLINDER_PX.radius : Math.max(36, Math.round(labelW * 0.28))
  const bodyH = cylinder ? PERFUME_CYLINDER_PX.bodyH : labelH + 28
  const neckH = cylinder ? PERFUME_CYLINDER_PX.neckH : Math.round(bodyH * 0.14)
  const capH = cylinder ? PERFUME_CYLINDER_PX.capH : Math.round(bodyH * 0.1)
  const collarH = cylinder ? PERFUME_CYLINDER_PX.collarH : 0
  const actuatorH = cylinder ? PERFUME_CYLINDER_PX.actuatorH : 0
  const circ = 2 * Math.PI * radius
  const bandH = cylinder ? Math.round(bodyH * 0.56) : labelH
  const bandTop = cylinder ? Math.round(bodyH * 0.22) : 0
  const artW = wrap ? Math.round(circ) : Math.round(cylinder ? circ * 0.42 : labelW)
  const glass = cylinder ? '#c5d5de' : p.paper || '#d9e2e8'
  const glassDark = cylinder ? '#6d8794' : p.muted || '#8aa0ad'
  const metal = '#2a2a2a'
  const metalLite = '#6e6e6e'

  const bottleStyle = {
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
    '--body-h': `${bodyH}px`,
    '--neck-h': `${neckH}px`,
    '--cap-h': `${capH}px`,
    '--collar-h': `${collarH}px`,
    '--actuator-h': `${actuatorH}px`,
    '--radius': `${radius}px`,
    '--label-w': `${labelW}px`,
    '--label-h': `${labelH}px`,
    '--glass': glass,
    '--glass-dark': glassDark,
  } as CSSProperties

  const neckR = Math.round(radius * PERFUME_CYLINDER_PX.neckRatio)
  const capR = Math.round(radius * PERFUME_CYLINDER_PX.capRatio)
  const collarR = Math.round(radius * 0.38)
  const sprayR = 7

  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Sürükleyerek döndür</span>
        <span>{cylinder ? '50–100 ml silindir parfüm' : 'Şişe üzerinde etiket'}</span>
        <div className="bottle-switch" role="group" aria-label="Şişe formu">
          <button
            type="button"
            className={shape === 'cylinder' ? 'is-active' : ''}
            onClick={() => onShape('cylinder')}
          >
            Silindir parfüm
          </button>
          <button type="button" className={shape === 'square' ? 'is-active' : ''} onClick={() => onShape('square')}>
            Kare şişe
          </button>
        </div>
      </div>
      <div className="scene" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }}>
        <div className={`bottle3d bottle3d--${shape}`} style={bottleStyle} data-bottle={shape} data-vessel={cylinder ? 'perfume-50-100' : 'square'}>
          {cylinder ? (
            <>
              <Ring className="bottle3d__ring--actuator" radius={sprayR} height={actuatorH} light={metalLite} dark={metal} />
              <Ring className="bottle3d__ring--cap" radius={capR} height={capH} light={metalLite} dark={metal} />
              <Ring className="bottle3d__ring--neck" radius={neckR} height={neckH} light={glass} dark={glassDark} />
              <Ring className="bottle3d__ring--collar" radius={collarR} height={collarH} light="#c4c4c4" dark="#5a5a5a" />
              <div className="bottle3d__body">
                {Array.from({ length: BODY_SEGS }, (_, i) => {
                  const angle = (360 / BODY_SEGS) * i
                  const segW = Math.ceil(circ / BODY_SEGS) + 1
                  const facing = Math.min(Math.abs(angle), Math.abs(angle - 360))
                  const showArt = Boolean(front && (wrap || facing < 78))
                  const artOffset = wrap ? -i * (segW - 1) : -artW / 2 + segW / 2
                  return (
                    <div
                      key={i}
                      className="bottle3d__seg"
                      style={{
                        width: `${segW}px`,
                        height: `${bodyH}px`,
                        left: `${-segW / 2}px`,
                        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                        background: shade(angle, glass, glassDark),
                      }}
                    >
                      {showArt ? (
                        <div
                          className="bottle3d__seg-art"
                          style={{
                            width: `${artW}px`,
                            height: `${bandH}px`,
                            top: `${bandTop}px`,
                            transform: `translateX(${artOffset}px)`,
                          }}
                          dangerouslySetInnerHTML={{ __html: front }}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
