import type { DielineModel, Point } from '../../types'

function pair(code: number, value: string | number): string {
  return `${code}\n${value}\n`
}

function line(layer: string, a: Point, b: Point): string {
  return `${pair(0, 'LINE')}${pair(8, layer)}${pair(10, a.x)}${pair(20, -a.y)}${pair(11, b.x)}${pair(21, -b.y)}`
}

function polyline(layer: string, points: Point[]): string {
  const vertices = points.map((point) => `${pair(10, point.x)}${pair(20, -point.y)}`).join('')
  return `${pair(0, 'LWPOLYLINE')}${pair(8, layer)}${pair(90, points.length)}${pair(70, 1)}${vertices}`
}

/** CUT = closed LWPOLYLINE (flag 70=1) per dieline.cut ring (outlineUnion / panel polys). CREASE = LINE. */
export function buildDielineDxf(dieline: DielineModel): string {
  const cut = dieline.cut.map((ring) => polyline('CUT', ring)).join('')
  const crease = dieline.crease.map(([a, b]) => line('CREASE', a, b)).join('')
  const perf = (dieline.perf ?? [])
    .flatMap((ring) => {
      if (ring.length === 2) return [line('PERF', ring[0]!, ring[1]!)]
      const segs: string[] = []
      for (let i = 0; i < ring.length - 1; i++) segs.push(line('PERF', ring[i]!, ring[i + 1]!))
      return segs
    })
    .join('')
  return `${pair(0, 'SECTION')}${pair(2, 'HEADER')}${pair(9, '$INSUNITS')}${pair(70, 4)}${pair(0, 'ENDSEC')}${pair(0, 'SECTION')}${pair(2, 'ENTITIES')}${cut}${crease}${perf}${pair(0, 'ENDSEC')}${pair(0, 'EOF')}`
}
