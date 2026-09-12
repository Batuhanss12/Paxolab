import type { Attachment, DesignSpec } from '../types'
import { monogram } from '../engine/designEngine'

type Preview2DProps = {
  design: DesignSpec
  attachments: Attachment[]
}

function logoHref(attachments: Attachment[]): string | undefined {
  const logo = attachments.find((a) => a.kind === 'logo') ?? attachments[0]
  return logo?.dataUrl
}

function Barcode({ value, color, x, y, w, h }: { value: string; color: string; x: number; y: number; w: number; h: number }) {
  const bars = value.split('').map((ch) => {
    const n = Number(ch) || 1
    return 1 + (n % 3)
  })
  const total = bars.reduce((a, b) => a + b, 0)
  let cursor = x
  return (
    <g>
      {bars.map((bw, i) => {
        const width = (bw / total) * w
        const el = i % 2 === 0 ? (
          <rect key={i} x={cursor} y={y} width={Math.max(1.1, width * 0.7)} height={h} fill={color} />
        ) : null
        cursor += width
        return el
      })}
    </g>
  )
}

function CropMarks({ w, h, color }: { w: number; h: number; color: string }) {
  const m = 18
  const len = 12
  const pts: [number, number, number, number][] = [
    [m - 8, 8, m - 8, 8 + len],
    [8, m - 8, 8 + len, m - 8],
    [w - (m - 8), 8, w - (m - 8), 8 + len],
    [w - 8 - len, m - 8, w - 8, m - 8],
    [m - 8, h - 8 - len, m - 8, h - 8],
    [8, h - (m - 8), 8 + len, h - (m - 8)],
    [w - (m - 8), h - 8 - len, w - (m - 8), h - 8],
    [w - 8 - len, h - (m - 8), w - 8, h - (m - 8)],
  ]
  return (
    <g>
      {pts.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.7" />
      ))}
    </g>
  )
}

function PackFace({ design, attachments }: Preview2DProps) {
  const { palette: p, copy, overrides, layout } = design
  const logo = logoHref(attachments)
  const mark = monogram(copy.brand)
  const s = overrides.logoScale
  const t = overrides.titleScale
  const w = 400
  const h = 560

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="artboard" role="img" aria-label="2D ambalaj">
      <rect width={w} height={h} fill={p.bg} />
      <rect x="18" y="18" width={w - 36} height={h - 36} fill="none" stroke={p.accent} strokeOpacity="0.5" />
      <rect x="28" y="28" width={w - 56} height={h - 56} fill="none" stroke={p.fg} strokeOpacity="0.08" />

      <g transform={`translate(200 ${105 + (s - 1) * 10}) scale(${s})`}>
        {logo ? (
          <image href={logo} x={-28} y={-28} width="56" height="56" preserveAspectRatio="xMidYMid meet" />
        ) : (
          <>
            <circle r="28" fill="none" stroke={p.accent} strokeWidth="1" />
            <text
              textAnchor="middle"
              y="6"
              fill={p.accent}
              fontFamily="Georgia, 'Instrument Serif', serif"
              fontSize="16"
              letterSpacing="2"
            >
              {mark}
            </text>
          </>
        )}
      </g>

      <text
        x="200"
        y={190}
        textAnchor="middle"
        fill={p.fg}
        fontFamily="Georgia, 'Instrument Serif', serif"
        fontSize={28 * t}
        letterSpacing="6"
      >
        {copy.brand.toUpperCase()}
      </text>
      <line x1="160" y1="212" x2="240" y2="212" stroke={p.accent} strokeWidth="0.6" />
      <text
        x="200"
        y="248"
        textAnchor="middle"
        fill={p.fg}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={13 * t}
        letterSpacing="4"
        opacity="0.88"
      >
        {copy.product.toUpperCase()}
      </text>
      <text
        x="200"
        y="288"
        textAnchor="middle"
        fill={p.muted}
        fontFamily="Georgia, serif"
        fontSize="13"
        fontStyle="italic"
      >
        {copy.tagline}
      </text>

      {copy.volume && (
        <text
          x="200"
          y="430"
          textAnchor="middle"
          fill={p.fg}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          letterSpacing="3"
          opacity="0.7"
        >
          {copy.volume.toUpperCase()}
        </text>
      )}

      {overrides.barcodeVisible && (
        <g>
          <Barcode value={copy.barcode} color={p.fg} x={150} y={458} w={100} h={28} />
          <text
            x="200"
            y="502"
            textAnchor="middle"
            fill={p.muted}
            fontFamily="ui-monospace, monospace"
            fontSize="8"
            letterSpacing="1.2"
          >
            {copy.barcode}
          </text>
        </g>
      )}

      <text
        x="200"
        y="532"
        textAnchor="middle"
        fill={p.muted}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="7"
        letterSpacing="0.4"
        opacity="0.7"
      >
        {layout.widthMm} × {layout.depthMm} × {layout.heightMm} mm
      </text>

      {overrides.printReady && <CropMarks w={w} h={h} color={p.muted} />}
    </svg>
  )
}

function LabelFace({ design, attachments }: Preview2DProps) {
  const { palette: p, copy, overrides } = design
  const logo = logoHref(attachments)
  const mark = monogram(copy.brand)
  const s = overrides.logoScale
  const t = overrides.titleScale
  const w = 280
  const h = 520

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="artboard artboard--label" role="img" aria-label="2D etiket">
      <rect width={w} height={h} fill={p.bg} rx="6" />
      <rect x="14" y="14" width={w - 28} height={h - 28} fill="none" stroke={p.accent} strokeOpacity="0.4" rx="3" />

      <g transform={`translate(140 ${80}) scale(${s})`}>
        {logo ? (
          <image href={logo} x={-22} y={-22} width="44" height="44" />
        ) : (
          <text
            textAnchor="middle"
            y="6"
            fill={p.accent}
            fontFamily="Georgia, serif"
            fontSize="18"
            letterSpacing="3"
          >
            {mark}
          </text>
        )}
      </g>

      <text
        x="140"
        y="140"
        textAnchor="middle"
        fill={p.fg}
        fontFamily="Georgia, serif"
        fontSize={22 * t}
        letterSpacing="5"
      >
        {copy.brand.toUpperCase()}
      </text>
      <text
        x="140"
        y="178"
        textAnchor="middle"
        fill={p.muted}
        fontFamily="Inter, sans-serif"
        fontSize="11"
        letterSpacing="3"
      >
        {copy.product.toUpperCase()}
      </text>

      <line x1="90" y1="210" x2="190" y2="210" stroke={p.accent} strokeWidth="0.5" />

      <foreignObject x="40" y="230" width="200" height="80">
        <div
          style={{
            color: p.muted,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 1.45,
          }}
        >
          {copy.tagline}
        </div>
      </foreignObject>

      <text
        x="140"
        y="360"
        textAnchor="middle"
        fill={p.fg}
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="2"
      >
        {copy.volume.toUpperCase()}
      </text>

      {overrides.barcodeVisible && (
        <g>
          <Barcode value={copy.barcode} color={p.fg} x={90} y={400} w={100} h={36} />
          <text
            x="140"
            y="452"
            textAnchor="middle"
            fill={p.muted}
            fontFamily="ui-monospace, monospace"
            fontSize="8"
          >
            {copy.barcode}
          </text>
        </g>
      )}

      {overrides.printReady && <CropMarks w={w} h={h} color={p.muted} />}
    </svg>
  )
}

function LandingFace({ design }: { design: DesignSpec }) {
  const { palette: p, copy, overrides } = design
  const t = overrides.titleScale
  const w = 720
  const h = 460

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="artboard artboard--web" role="img" aria-label="Landing page">
      <rect width={w} height={h} fill={p.bg} rx="10" />
      <rect width={w} height="28" fill={p.paper} />
      <circle cx="16" cy="14" r="4" fill="#3d3d3d" />
      <circle cx="30" cy="14" r="4" fill="#3d3d3d" />
      <circle cx="44" cy="14" r="4" fill="#3d3d3d" />
      <rect x="220" y="8" width="280" height="12" rx="6" fill="#1a1a1a" />

      <text x="36" y="64" fill={p.fg} fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="3">
        {copy.brand.toUpperCase()}
      </text>
      <text x="560" y="64" fill={p.muted} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="1">
        Ürün     Hikâye     İletişim
      </text>

      <text
        x="36"
        y="160"
        fill={p.fg}
        fontFamily="Georgia, serif"
        fontSize={36 * t}
      >
        {copy.product}
      </text>
      <text x="36" y="198" fill={p.muted} fontFamily="Georgia, serif" fontSize="16" fontStyle="italic">
        {copy.tagline}
      </text>

      <rect x="36" y="230" width="128" height="34" rx="17" fill={p.fg} />
      <text x="100" y="252" textAnchor="middle" fill={p.bg} fontFamily="Inter, sans-serif" fontSize="11">
        {copy.cta}
      </text>
      <rect x="176" y="230" width="128" height="34" rx="17" fill="none" stroke={p.fg} strokeOpacity="0.5" />
      <text x="240" y="252" textAnchor="middle" fill={p.fg} fontFamily="Inter, sans-serif" fontSize="11">
        Brief oku
      </text>

      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={36 + i * 224} y="310" width="208" height="110" rx="10" fill={p.paper} />
          <rect x={52 + i * 224} y="328" width="40" height="3" fill={p.accent} />
          <text x={52 + i * 224} y="360" fill={p.fg} fontFamily="Inter, sans-serif" fontSize="13">
            {['Motor', 'İterasyon', 'Baskı'][i]}
          </text>
          <text x={52 + i * 224} y="384" fill={p.muted} fontFamily="Inter, sans-serif" fontSize="10">
            {['Deterministik yüzey', 'Konuşarak düzelt', 'Üretim checklist'][i]}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function Preview2D({ design, attachments }: Preview2DProps) {
  return (
    <div className="preview-stage">
      <div className="preview-stage__meta">
        <span>Rev {design.revision}</span>
        <span>
          {design.kind === 'landing'
            ? '1440 × 900'
            : design.kind === 'label'
              ? `${design.layout.widthMm} × ${design.layout.heightMm} mm`
              : `${design.layout.widthMm} × ${design.layout.depthMm} × ${design.layout.heightMm} mm`}
        </span>
        {design.overrides.printReady && <span className="pill">Baskıya hazır</span>}
      </div>
      <div className="preview-stage__canvas">
        {design.kind === 'landing' && <LandingFace design={design} />}
        {design.kind === 'label' && <LabelFace design={design} attachments={attachments} />}
        {design.kind === 'packaging' && <PackFace design={design} attachments={attachments} />}
      </div>
    </div>
  )
}
