/**
 * Vector dieline PDF (paths only). Not PDF/X, no ICC, no trap.
 */
import type { DielineModel, Point } from '../../../types'

const PT = 72 / 25.4

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function pathOps(ring: Point[], hMm: number, closePath: boolean): string {
  if (!ring.length) return ''
  const flip = (p: Point) => ({ x: p.x * PT, y: (hMm - p.y) * PT })
  const first = flip(ring[0]!)
  let d = `${first.x.toFixed(3)} ${first.y.toFixed(3)} m`
  for (let i = 1; i < ring.length; i++) {
    const p = flip(ring[i]!)
    d += ` ${p.x.toFixed(3)} ${p.y.toFixed(3)} l`
  }
  if (closePath) d += ' h'
  return d
}

export function buildDielinePdf(model: DielineModel, title = 'FORXA dieline'): string {
  const pad = 10
  const wMm = model.width + pad * 2
  const hMm = model.height + pad * 2
  const W = wMm * PT
  const H = hMm * PT
  const shift = (p: Point): Point => ({ x: p.x + pad, y: p.y + pad })

  const cut = model.cut
    .map((ring) => `${pathOps(ring.map(shift), hMm, true)} S`)
    .join('\n')
  const crease = model.crease
    .map(([a, b]) => `${pathOps([shift(a), shift(b)], hMm, false)} S`)
    .join('\n')

  const content = `q
1 0 0 RG
0.6 w
${cut}
Q
q
0 0 1 RG
0.4 w
[2 1.2] 0 d
${crease}
Q
BT /F1 8 Tf 12 12 Td (${esc(title)} · CUT red · CREASE blue · not PDF/X) Tj ET
`

  const objects: string[] = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
  )
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}
