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

function layer(name: string, color: number, linetype: string): string {
  return `${pair(0, 'LAYER')}${pair(2, name)}${pair(70, 0)}${pair(62, color)}${pair(6, linetype)}`
}

function linetype(name: string, pattern: number[]): string {
  const desc = name === 'DASHED' ? 'Dashed ___ ___' : 'Solid'
  const segs = pattern.map((n) => pair(49, n)).join('')
  return `${pair(0, 'LTYPE')}${pair(2, name)}${pair(70, 0)}${pair(3, desc)}${pair(72, 65)}${pair(73, pattern.length)}${pair(40, pattern.reduce((a, b) => a + Math.abs(b), 0))}${segs}`
}

/**
 * R12-style millimetre DXF with named knife layers.
 * CUT = closed outline (ACI 1 red). CREASE = fold (ACI 5 blue, dashed). PERF = tear (ACI 6 magenta).
 */
export function buildDielineDxf(dieline: DielineModel): string {
  const cut = dieline.cut.filter((ring) => ring.length >= 2).map((ring) => polyline('CUT', ring)).join('')
  const crease = dieline.crease.map(([a, b]) => line('CREASE', a, b)).join('')
  const perf = (dieline.perf ?? [])
    .flatMap((ring) => {
      if (ring.length === 2) return [line('PERF', ring[0]!, ring[1]!)]
      const segs: string[] = []
      for (let i = 0; i < ring.length - 1; i++) segs.push(line('PERF', ring[i]!, ring[i + 1]!))
      return segs
    })
    .join('')
  const header = `${pair(0, 'SECTION')}${pair(2, 'HEADER')}${pair(9, '$INSUNITS')}${pair(70, 4)}${pair(9, '$LUNITS')}${pair(70, 2)}${pair(0, 'ENDSEC')}`
  const tables = `${pair(0, 'SECTION')}${pair(2, 'TABLES')}${pair(0, 'TABLE')}${pair(2, 'LTYPE')}${pair(70, 2)}${linetype('CONTINUOUS', [])}${linetype('DASHED', [6, -3])}${pair(0, 'ENDTAB')}${pair(0, 'TABLE')}${pair(2, 'LAYER')}${pair(70, 3)}${layer('CUT', 1, 'CONTINUOUS')}${layer('CREASE', 5, 'DASHED')}${layer('PERF', 6, 'DASHED')}${pair(0, 'ENDTAB')}${pair(0, 'ENDSEC')}`
  const entities = `${pair(0, 'SECTION')}${pair(2, 'ENTITIES')}${cut}${crease}${perf}${pair(0, 'ENDSEC')}${pair(0, 'EOF')}`
  return `${header}${tables}${entities}`
}
