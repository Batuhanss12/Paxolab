/**
 * The four-design choice, shown once per generation.
 *
 * Pressing "Tasarımı başlat" used to drop the customer straight onto one face, with the three
 * alternatives living in a 34 px strip along the bottom edge. The owner's report was blunt and
 * correct: at that size there is no preview, and nothing about the strip reads as an offer — "4
 * tasarım seçilmiyor, kullanıcıya seçme hakkı sunulmalı".
 *
 * So the offer gets the room an offer needs. Four painted fronts at full card size, each named,
 * each with the one-line description of its own system, and picking one is a single click. The
 * strip stays afterwards for switching later; this is the moment of choosing.
 *
 * And a second way out of it. Eight designs is a lot until none of them is the one, and the
 * honest answer to "none of these" used to be nothing at all — the same eight came back for the
 * same brief forever. "Tasarımları değiştir" swaps the whole offer for the other repertoire
 * (F-32): eight skeletons distilled from a different shelf, on the same brief. It toggles, so the
 * customer can always come back to the set they were shown first.
 */
import { useMemo } from 'react'
import { familyTalk } from '../engine/studio/family'
import { dnaFor } from '../engine/studio/referenceDna'
import { temperamentTalk } from '../engine/studio/temperament'
import type { StudioDirectionOffer, StudioFamily, StudioRepertoire, StudioSurface } from '../engine/studio/types'

type DirectionChoiceProps = {
  offer?: StudioDirectionOffer
  surface: StudioSurface
  brandName: string
  productName: string
  busy?: boolean
  /** Which set is on screen — the label on the swap button says where it goes, not where it is. */
  repertoire?: StudioRepertoire
  onPick: (family: StudioFamily, index: number) => void
  onKeep: () => void
  /** Swap the whole offer for the other repertoire. Absent hides the control. */
  onSwapRepertoire?: () => void
}

export function DirectionChoice({ offer, surface, brandName, productName, busy, repertoire, onPick, onKeep, onSwapRepertoire }: DirectionChoiceProps) {
  const rows = useMemo(() => offer?.candidates.filter((row) => row.face) ?? [], [offer])
  if (rows.length < 2) return null

  const subject = [brandName, productName].filter(Boolean).join(' · ')

  return (
    <section className="dirchoice" aria-label="Tasarım seçimi">
      <header className="dirchoice__head">
        <div>
          <p className="dirchoice__eyebrow">{rows.length} tasarım</p>
          <h2 className="dirchoice__title">Hangisiyle devam edelim?</h2>
          <p className="dirchoice__sub">
            {subject ? `${subject} için ` : ''}aynı brief, {rows.length} ayrı tasarım dili. Birini seç — sonra renk,
            ton ve varyasyonu üzerinde çalışırız.
            {onSwapRepertoire ? ' Hiçbiri değilse tasarımları değiştir, bambaşka sekiz gelsin.' : ''}
          </p>
        </div>
        <div className="dirchoice__actions">
          {onSwapRepertoire && (
            <button
              type="button"
              className="dirchoice__swap"
              onClick={onSwapRepertoire}
              disabled={busy}
              title={
                repertoire === 'reference'
                  ? 'İlk tasarım diline dön — aynı brief, ilk sekiz.'
                  : 'Aynı brief, bambaşka sekiz tasarım dili.'
              }
            >
              {repertoire === 'reference' ? 'İlk tasarımlara dön' : 'Tasarımları değiştir'}
            </button>
          )}
          <button type="button" className="dirchoice__keep" onClick={onKeep} disabled={busy}>
            Şu ankiyle devam et
          </button>
        </div>
      </header>

      <ul className="dirchoice__grid" role="listbox" aria-label="Tasarım adayları">
        {rows.map((row) => {
          const dna = dnaFor(row.archetype, surface)
          return (
            <li key={row.index}>
              <button
                type="button"
                role="option"
                aria-selected={row.selected}
                disabled={busy}
                className={`dirchoice__card ${row.selected ? 'is-current' : ''}`}
                onClick={() => (row.selected ? onKeep() : onPick(row.family, row.index))}
              >
                <span className="dirchoice__faceWrap">
                  <span className="dirchoice__face" aria-hidden dangerouslySetInnerHTML={{ __html: row.face! }} />
                  {row.selected && <span className="dirchoice__badge">Ekranda</span>}
                </span>
                <span className="dirchoice__meta">
                  <span className="dirchoice__name">
                    <span className="dirchoice__index">{row.index}</span>
                    {familyTalk(row.family)}
                  </span>
                  <span className="dirchoice__desc">{dna.summaryTr}</span>
                  <span className="dirchoice__tone">{temperamentTalk(row.temperament)}</span>
                </span>
                <span className="dirchoice__cta">{row.selected ? 'Bununla devam et' : 'Bunu seç'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
