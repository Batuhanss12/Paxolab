import type { DesignBrief, DesignSpec, DimensionsMm, StyleType } from '../types'
import { studioFaceLabel } from '../engine/studio/faceCaption'
import { STYLE_OPTIONS } from '../engine/styles'
import { TEMPERAMENT_OPTIONS } from '../engine/studio/temperament'
import type { Temperament } from '../engine/studio/types'

type StyleBarProps = {
  brief: DesignBrief
  design: DesignSpec | null
  onStyle: (style: StyleType) => void
  onTemperament?: (temperament: Temperament) => void
  onDims: (dims: DimensionsMm) => void
  onVary?: () => void
  className?: string
  variant?: 'rail'
}

export function StyleBar({ brief, design, onStyle, onTemperament, onDims, onVary, className, variant }: StyleBarProps) {
  const studio = Boolean(design?.studio)
  const activeStyle = brief.styleType || design?.brief.styleType || 'luxury'
  const activeTemp = brief.studioTemperament || design?.studio?.direction.temperament || 'dark-luxe'
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
      <p className="style-bar__kicker">Ruh hali</p>
      <div className="style-chips" role="listbox" aria-label="Ruh hali">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="option"
            aria-selected={activeStyle === opt.id}
            title={opt.hint}
            className={`style-chip ${activeStyle === opt.id ? 'is-active' : ''}`}
            onClick={() => onStyle(opt.id)}
          >
            <span className="style-chip__swatch" style={{ background: opt.swatch }} />
            <span className="style-chip__name">{opt.label}</span>
          </button>
        ))}
      </div>
      {studio && onTemperament ? (
        <>
          <p className="style-bar__kicker">Temperament</p>
          <div className="style-chips" role="listbox" aria-label="Temperament">
            {TEMPERAMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={activeTemp === opt.id}
                title={opt.hint}
                className={`style-chip ${activeTemp === opt.id ? 'is-active' : ''}`}
                onClick={() => onTemperament(opt.id)}
              >
                <span className="style-chip__swatch" style={{ background: opt.swatch }} />
                <span className="style-chip__name">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
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
            {design.studio ? studioFaceLabel(design) : `Set ${(design.designPlan?.variationIndex ?? 0) + 1}/6`}
          </span>
        </button>
      )}
    </section>
  )
}
