import type { DesignBrief, DesignSpec } from '../types'
import { filledEntries, formatDimensions } from '../engine/fields'
import { IconChevron } from './Icons'

type InputsPanelProps = {
  brief: DesignBrief
  design: DesignSpec | null
  open: boolean
  onToggle: () => void
}

export function InputsPanel({ brief, design, open, onToggle }: InputsPanelProps) {
  const sampleVolume = !brief.volume.trim() && design?.copy.volume ? design.copy.volume : ''
  const sampleDims =
    !(brief.dimensionsMm.L && brief.dimensionsMm.H) && design
      ? formatDimensions({
          L: design.layout.widthMm,
          W: design.layout.depthMm,
          H: design.layout.heightMm,
        })
      : ''
  const keys = filledEntries(brief, { sampleVolume, sampleDims })
  return (
    <section className={`girdiler ${open ? 'is-open' : ''}`}>
      <button type="button" className="girdiler__head" onClick={onToggle}>
        <span>Girdiler</span>
        <span className="girdiler__count">{keys.length}</span>
        <IconChevron className="girdiler__chev" />
      </button>
      {open && (
        <div className="girdiler__body">
          {keys.length === 0 ? (
            <p className="girdiler__empty">Konuşma ilerledikçe alanlar dolacak.</p>
          ) : (
            <dl>
              {keys.map((row) => (
                <div
                  key={row.key}
                  className={`girdiler__row ${row.key === 'styleType' ? 'is-style' : ''} ${row.sample ? 'is-sample' : ''}`}
                >
                  <dt>{row.label}</dt>
                  <dd>
                    {row.value}
                    {row.sample && <span className="girdiler__hint">örnek / varsayılan</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}
