import type { BriefFields } from '../types'
import { FIELD_LABELS, filledKeys } from '../engine/fields'
import { IconChevron } from './Icons'

type InputsPanelProps = {
  brief: BriefFields
  open: boolean
  onToggle: () => void
}

export function InputsPanel({ brief, open, onToggle }: InputsPanelProps) {
  const keys = filledKeys(brief)
  return (
    <section className={`girdiler ${open ? 'is-open' : ''}`}>
      <button type="button" className="girdiler__head" onClick={onToggle}>
        <span>Girdiler</span>
        <span className="girdiler__count">{keys.length}/14</span>
        <IconChevron className="girdiler__chev" />
      </button>
      {open && (
        <div className="girdiler__body">
          {keys.length === 0 ? (
            <p className="girdiler__empty">Konuşma ilerledikçe alanlar dolacak.</p>
          ) : (
            <dl>
              {keys.map((key) => (
                <div key={key} className="girdiler__row">
                  <dt>{FIELD_LABELS[key]}</dt>
                  <dd>{brief[key]}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}
