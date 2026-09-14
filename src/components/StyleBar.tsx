import type { DesignBrief, DesignSpec, DimensionsMm, StyleType } from '../types'
import { STYLE_OPTIONS } from '../engine/styles'

type StyleBarProps = {
  brief: DesignBrief
  design: DesignSpec | null
  onStyle: (style: StyleType) => void
  onDims: (dims: DimensionsMm) => void
  onVary?: () => void
  className?: string
  variant?: 'rail'
}

export function StyleBar({ brief, design, onStyle, onDims, onVary, className, variant }: StyleBarProps) {
  const active = brief.styleType || design?.brief.styleType || 'luxury'
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : design
        ? { L: design.layout.widthMm, W: design.layout.depthMm, H: design.layout.heightMm }
        : { L: 0, W: 0, H: 0 }
  const showDims = !!design
  const showW = (brief.packagingMode || design?.kind) !== 'label' && design?.kind !== 'label'

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  const rootClass = ['style-bar', variant === 'rail' ? 'style-bar--rail' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={rootClass} aria-label="Ruh hali">
      <div className="style-chips" role="listbox" aria-label="Ruh hali (kostüm değil)">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="option"
            aria-selected={active === opt.id}
            title={opt.hint}
            className={`style-chip ${active === opt.id ? 'is-active' : ''}`}
            onClick={() => onStyle(opt.id)}
          >
            <span className="style-chip__swatch" style={{ background: opt.swatch }} />
            <span className="style-chip__name">{opt.label}</span>
          </button>
        ))}
      </div>
      {showDims && (
        <div className="style-bar__dims">
          <span className="style-bar__dims-label">Ölçü</span>
          <label>
            L
            <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
          </label>
          {showW && (
            <label>
              W
              <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
            </label>
          )}
          <label>
            H
            <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
          </label>
          <span className="style-bar__dims-unit">mm</span>
        </div>
      )}
      {design && onVary && (
        <button type="button" className="style-bar__vary" onClick={onVary}>
          6 yeni tasarım
          <span className="style-bar__vary-set">
            Set {(design.designPlan?.variationIndex ?? 0) + 1}/6
          </span>
        </button>
      )}
    </section>
  )
}
