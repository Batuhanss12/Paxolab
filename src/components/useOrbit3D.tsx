import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type OrbitOpts = {
  restX?: number
  restY?: number
  speed?: number
  tilt?: [number, number]
}

export function useOrbit3D(opts: OrbitOpts = {}) {
  const restX = opts.restX ?? -16
  const restY = opts.restY ?? 28
  const cruise = opts.speed ?? 0.78
  const tilt = opts.tilt
  const [rot, setRot] = useState({ x: restX, y: restY })
  const [spinning, setSpinning] = useState(false)
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)
  const spinningRef = useRef(false)
  const speed = useRef(0)
  const clock = useRef(0)

  useEffect(() => {
    spinningRef.current = spinning
    if (spinning) speed.current = Math.max(speed.current, 0.12)
  }, [spinning])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const dragging = drag.current != null
      const target = spinningRef.current && !dragging ? cruise : 0
      speed.current += (target - speed.current) * (target > speed.current ? 0.055 : 0.14)
      if (speed.current < 0.01 && !target) speed.current = 0
      if (speed.current > 0) {
        clock.current += 1
        const showX = restX + Math.sin(clock.current * 0.02) * 6.2
        setRot((r) => ({
          x: dragging ? r.x : r.x + (showX - r.x) * 0.045,
          y: r.y + speed.current,
        }))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cruise, restX])

  const down = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [rot.x, rot.y],
  )

  const move = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      let x = drag.current.rx - dy * 0.35
      if (tilt) x = Math.max(tilt[0], Math.min(tilt[1], x))
      setRot({ x, y: drag.current.ry + dx * 0.35 })
    },
    [tilt],
  )

  const up = useCallback(() => {
    drag.current = null
  }, [])

  const toggle = useCallback(() => setSpinning((on) => !on), [])

  return { rot, spinning, toggle, down, move, up }
}

export function OrbitToggle({ spinning, onToggle }: { spinning: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`orbit-toggle${spinning ? ' is-active' : ''}`}
      onClick={onToggle}
      aria-pressed={spinning}
    >
      {spinning ? 'Durdur' : 'Döndür'}
    </button>
  )
}
