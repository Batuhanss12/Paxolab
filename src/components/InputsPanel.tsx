import type { DesignBrief } from '../types'
import { filledEntries } from '../engine/fields'
import { IconChevron } from './Icons'

type InputsPanelProps = {
  brief: DesignBrief
  open: boolean
  onToggle: () => void
}

export function InputsPanel({ brief, open, onToggle }: InputsPanelProps) {
  const keys = filledEntries(brief)
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
                <div key={row.key} className={`girdiler__row ${row.key === 'styleType' ? 'is-style' : ''}`}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}
