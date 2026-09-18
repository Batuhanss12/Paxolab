/**
 * The switcher, not the offer.
 *
 * This strip and the full-panel `DirectionChoice` were doing the same job at two sizes, and the
 * strip lost: eight cards each carrying a thumbnail, an index and a family name made a band that
 * was tall and cramped at the same time — the owner's report was that it looks oversized and
 * narrow at once, and not good to look at. Two jobs, two components:
 *
 *   - choosing happens on `DirectionChoice`, where a design gets a whole card;
 *   - changing your mind happens here, and that needs the faces, small, in a fixed order, plus a
 *     way back to the full set.
 *
 * So the name comes off every tile except the current one, the tiles are quiet squares, and "Tümü"
 * reopens the chooser instead of trying to be it.
 */
import { familyTalk } from '../engine/studio/family'
import type { StudioDirectionOffer, StudioFamily } from '../engine/studio/types'

type DirectionOfferStripProps = {
  offer?: StudioDirectionOffer
  onPick: (family: StudioFamily, index: number) => void
  onOpenAll?: () => void
  disabled?: boolean
}

export function DirectionOfferStrip({ offer, onPick, onOpenAll, disabled }: DirectionOfferStripProps) {
  const candidates = offer?.candidates ?? []
  if (candidates.length < 2) return null
  const current = candidates.find((row) => row.selected)

  return (
    <div className="direction-offer" data-coach="directions">
      <div className="direction-offer__head">
        <span className="direction-offer__label">Yön</span>
        <span className="direction-offer__current">{familyTalk(current?.family)}</span>
      </div>

      <div className="direction-offer__rail" role="listbox" aria-label="Tasarım yönleri">
        {candidates.map((row) => (
          <button
            key={row.index}
            type="button"
            role="option"
            disabled={disabled}
            aria-selected={row.selected}
            aria-label={`${row.index}. ${familyTalk(row.family)}`}
            className={`direction-tile ${row.selected ? 'is-selected' : ''}`}
            title={`${row.index}. ${familyTalk(row.family)}`}
            onClick={() => {
              if (!row.selected) onPick(row.family, row.index)
            }}
          >
            {row.face ? (
              <span className="direction-tile__face" aria-hidden dangerouslySetInnerHTML={{ __html: row.face }} />
            ) : (
              <span className="direction-tile__blank" aria-hidden />
            )}
            <span className="direction-tile__index">{row.index}</span>
          </button>
        ))}
      </div>

      {onOpenAll && (
        <button type="button" className="direction-offer__all" onClick={onOpenAll} disabled={disabled}>
          Tümü
        </button>
      )}
    </div>
  )
}
