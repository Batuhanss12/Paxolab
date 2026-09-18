/**
 * PDF/X-4:2010 vector dieline.
 * sRGB IEC61966-2.1 OutputIntent. DeviceRGB technical CUT/CREASE/PERF.
 * TrimBox = net. BleedBox = net + solver bleed (3 mm). Trap = false.
 * Not FOGRA/CMYK, not veraPDF-certified here, no trap.
 */
import type { DielineModel, Point } from '../../../types'
import { buildSrgbIcc, iccToAsciiHex, SRGB_OUTPUT_CONDITION } from '../../production/icc/srgbIcc'
import { PRESS_MEDIA_PAD_MM, pressBleedMm } from '../../production/pressBoxes'

const PT = 72 / 25.4

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Latin-1 bytes. Blob/ZIP must not UTF-8 the binary header or xref offsets break. */
export function encodePdfBytes(pdf: string): Uint8Array {
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}

function pathOps(ring: Point[], pageHMm: number, closePath: boolean): string {
  if (!ring.length) return ''
  const flip = (p: Point) => ({ x: p.x * PT, y: (pageHMm - p.y) * PT })
  const first = flip(ring[0]!)
  let d = `${first.x.toFixed(3)} ${first.y.toFixed(3)} m`
  for (let i = 1; i < ring.length; i++) {
    const p = flip(ring[i]!)
    d += ` ${p.x.toFixed(3)} ${p.y.toFixed(3)} l`
  }
  if (closePath) d += ' h'
  return d
}

function boxPts(xMm: number, yMm: number, wMm: number, hMm: number, pageHMm: number): string {
  const x0 = xMm * PT
  const y0 = (pageHMm - yMm - hMm) * PT
  const x1 = (xMm + wMm) * PT
  const y1 = (pageHMm - yMm) * PT
  return `[${x0.toFixed(2)} ${y0.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}]`
}

function md5ish(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0')
  return (hex + hex + hex + hex).slice(0, 32)
}

function xmpPacket(title: string, idHex: string): string {
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
    xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/"
    xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEsc(title)}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>Grapxor</rdf:li></rdf:Seq></dc:creator>
   <xmp:CreatorTool>Grapxor dieline</xmp:CreatorTool>
   <pdf:Producer>Grapxor</pdf:Producer>
   <pdf:Trapped>False</pdf:Trapped>
   <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
   <xmpMM:DocumentID>uuid:${idHex}</xmpMM:DocumentID>
   <xmpMM:InstanceID>uuid:${idHex}</xmpMM:InstanceID>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`
}

export function buildDielinePdf(model: DielineModel, title = 'Grapxor dieline'): string {
  const bleedMm = pressBleedMm(model)
  const mediaPad = PRESS_MEDIA_PAD_MM
  const origin = mediaPad + bleedMm
  const pageWMm = model.width + origin * 2
  const pageHMm = model.height + origin * 2
  const shift = (p: Point): Point => ({ x: p.x + origin, y: p.y + origin })

  const trim = boxPts(origin, origin, model.width, model.height, pageHMm)
  const bleed = boxPts(mediaPad, mediaPad, model.width + bleedMm * 2, model.height + bleedMm * 2, pageHMm)
  const media = `[0 0 ${(pageWMm * PT).toFixed(2)} ${(pageHMm * PT).toFixed(2)}]`

  const cut = model.cut.map((ring) => `${pathOps(ring.map(shift), pageHMm, true)} S`).join('\n')
  const crease = model.crease
    .map(([a, b]) => `${pathOps([shift(a), shift(b)], pageHMm, false)} S`)
    .join('\n')
  const perf = (model.perf ?? [])
    .map((ring) => `${pathOps(ring.map(shift), pageHMm, ring.length >= 3)} S`)
    .join('\n')

  const content = `% CUT DeviceRGB / CREASE DeviceRGB / PERF DeviceRGB
q
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
q
0.75 0 0.75 RG
0.4 w
[1 0.8] 0 d
${perf}
Q
`

  const iccHex = iccToAsciiHex(buildSrgbIcc())
  const idHex = md5ish(`${title}:${model.width}:${model.height}:${model.structureId}`)
  const xmp = xmpPacket(title, `${idHex.slice(0, 8)}-${idHex.slice(8, 12)}-${idHex.slice(12, 16)}-${idHex.slice(16, 20)}-${idHex.slice(20)}`)

  const objects: string[] = []
  objects.push(
    '<< /Type /Catalog /Pages 2 0 R /Metadata 5 0 R /OutputIntents [6 0 R] /MarkInfo << /Marked true >> /ViewerPreferences << /DisplayDocTitle true >> >>',
  )
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox ${media} /BleedBox ${bleed} /TrimBox ${trim} /CropBox ${media} /Contents 4 0 R /Resources << >> >>`,
  )
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`)
  objects.push(`<< /Type /Metadata /Subtype /XML /Length ${xmp.length} >>\nstream\n${xmp}endstream`)
  objects.push(
    `<< /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier (${SRGB_OUTPUT_CONDITION}) /RegistryName (http://www.color.org) /Info (${SRGB_OUTPUT_CONDITION} — technical dieline, not a press CMYK condition) /DestOutputProfile 7 0 R >>`,
  )
  objects.push(`<< /N 3 /Filter /ASCIIHexDecode /Length ${iccHex.length} >>\nstream\n${iccHex}endstream`)
  objects.push(
    `<< /Title (${esc(title)}) /Creator (Grapxor) /Producer (Grapxor dieline) /Trapped /False /GTS_PDFXVersion (PDF/X-4) /GTS_PDFXConformance (PDF/X-4:2010) >>`,
  )

  let pdf = '%PDF-1.6\n%\xE2\xE3\xCF\xD3\n'
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
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 8 0 R /ID [<${idHex}> <${idHex}>] >>\nstartxref\n${xref}\n%%EOF\n`
  return pdf
}
