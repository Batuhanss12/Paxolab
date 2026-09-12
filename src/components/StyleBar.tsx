import type { DesignBrief, DesignSpec, DimensionsMm, StyleType } from '../types'
import { STYLE_OPTIONS } from '../engine/styles'

type StyleBarProps = {
  brief: DesignBrief
  design: DesignSpec | null
  onStyle: (style: StyleType) => void
  onDims: (dims: DimensionsMm) => void
}

export function StyleBar({ brief, design, onStyle, onDims }: StyleBarProps) {
  const active = brief.styleType || design?.brief.styleType || 'luxury'
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : design
        ? { L: design.layout.widthMm, W: design.layout.depthMm, H: design.layout.heightMm }
        : { L: 0, W: 0, H: 0 }
  const showDims = !!design
  const showW = (brief.packagingMode || design?.kind) !== 'label' && (design?.kind !== 'label')

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <section className="style-bar" aria-label="Stil">
      <p className="style-bar__label">Stil</p>
      <div className="style-chips" role="listbox" aria-label="Stil seçimi">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="option"
            aria-selected={active === opt.id}
            className={`style-chip ${active === opt.id ? 'is-active' : ''}`}
            onClick={() => onStyle(opt.id)}
          >
            <span className="style-chip__swatch" style={{ background: opt.swatch }} />
            <span className="style-chip__name">{opt.label}</span>
            <span className="style-chip__hint">{opt.hint}</span>
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
    </section>
  )
}
