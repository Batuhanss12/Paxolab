import { familyTalk } from '../engine/studio/family'
import { temperamentOption, temperamentTalk } from '../engine/studio/temperament'
import type { StudioDirectionOffer, StudioFamily } from '../engine/studio/types'

type DirectionOfferStripProps = {
  offer?: StudioDirectionOffer
  onPick: (family: StudioFamily, index: number) => void
  disabled?: boolean
}

export function DirectionOfferStrip({ offer, onPick, disabled }: DirectionOfferStripProps) {
  const candidates = offer?.candidates ?? []
  if (candidates.length < 2) return null
  return (
    <div className="direction-offer" role="listbox" aria-label="Yön adayları">
      <span className="direction-offer__label">Yön</span>
      {candidates.map((row) => {
        const swatch = temperamentOption(row.temperament)
        return (
          <button
            key={row.index}
            type="button"
            role="option"
            disabled={disabled}
            aria-selected={row.selected}
            className={`direction-offer__card ${row.selected ? 'is-selected' : ''}`}
            title={`${familyTalk(row.family)} · ${temperamentTalk(row.temperament)} · ${row.background}`}
            onClick={() => {
              if (!row.selected) onPick(row.family, row.index)
            }}
          >
            <span className="direction-offer__face" aria-hidden>
              <span style={{ background: swatch.swatch }} />
              <span style={{ background: row.selected ? '#c9a86c' : '#444' }} />
              <span style={{ background: '#d8d4ca' }} />
            </span>
            <span className="direction-offer__meta">
              <span className="direction-offer__index">{row.index}</span>
              <span className="direction-offer__name">{familyTalk(row.family)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
