import { useState } from 'react'
import type { DesignBrief, DimensionsMm, FormaTemplate } from '../types'
import { getTemplate } from '../engine/catalog/catalog'
import { STRUCTURE_LABEL, structureCardDims, structureCards } from '../engine/catalog/structureOffer'
import { recommendStructures } from '../engine/catalog/structureRecommend'
import { buildDieline } from '../engine/dieline/buildDieline'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'
import { CartonShell } from './CartonShell'

type TemplatePickerProps = {
  brief: DesignBrief
  onSelect: (templateId: string, dims: DimensionsMm) => void
  onPick: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
  livePreview?: boolean
}

/**
 * What this structure will actually be built at, for this brief.
 *
 * Deliberately the engine's own `resolveDimensions` rather than a second opinion: a size the
 * customer typed is an instruction, and the card has to show the box they are choosing between,
 * not the catalogue's stock size. It used to estimate from the volume and fall back to
 * `template.defaultsMm`, ignoring `brief.dimensionsMm` entirely — so a customer who asked for
 * 70×45×150 was offered "100×50×150", "80×40×80" and "70×35×120", and the net drawn on each card
 * was the wrong *shape*, not merely the wrong caption. The large preview beside them already
 * honoured the typed size, so the two disagreed on screen.
 */
function netSvg(brief: DesignBrief, template: FormaTemplate, dims: DimensionsMm): string {
  return renderDielineSvg(buildDieline(template.structureId, { ...brief, templateId: template.id, dimensionsMm: dims }))
}

export function TemplatePicker({ brief, onSelect, onPick, onDims, livePreview = true }: TemplatePickerProps) {
  const [showAll, setShowAll] = useState(false)
  // The cards are the engine's ranking, not a second list assembled here. See `structureCards`:
  // the two used to disagree, and the chat's own second recommendation for a cream brief never
  // appeared on screen at all.
  const cards = structureCards(brief, { includeAll: showAll })
  const ranked = recommendStructures(brief).all.filter((row) => row.eligible)
  const rankById = new Map(ranked.map((row, i) => [row.templateId, { ...row, rank: i }]))
  const rankByStruct = new Map(ranked.map((row, i) => [row.structureId, { ...row, rank: i }]))
  const extras = showAll ? 0 : structureCards(brief, { includeAll: true }).length - cards.length
  const selected = brief.templateId ? getTemplate(brief.templateId) : undefined
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : selected
        ? structureCardDims(brief, selected)
        : cards[0]
          ? structureCardDims(brief, cards[0])
          : { L: 80, W: 40, H: 120 }
  const live =
    livePreview && selected
      ? netSvg(brief, selected, dims)
      : ''
  const grammar = selected ? STRUCTURE_LABEL[selected.structureId] ?? selected.structureId : ''

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <div className="templates">
      <p className="eyebrow">Yapı seçimi</p>
      <h2>{brief.packagingMode === 'label' ? 'Uygun etiket yapıları' : 'Uygun kutu yapıları'}</h2>
      <p className="templates__hint">Sektöre uyan yapılar. Karttaki net o kutunun açılımı. Seç, L×W×H’yi değiştir, sonra başlat.</p>
      {cards.length === 0 && <p className="templates__empty">Bu sektör için kutu şablonu yok.</p>}
      <div className="templates__grid">
        {cards.map((t: FormaTemplate) => {
          const cardDims = structureCardDims(brief, t)
          const meta = rankById.get(t.id) ?? rankByStruct.get(t.structureId)
          const thumb = livePreview ? netSvg(brief, t, cardDims) : ''
          const label = STRUCTURE_LABEL[t.structureId] ?? t.structureId
          return (
            <button
              key={t.id}
              type="button"
              className={`tcard ${brief.templateId === t.id ? 'is-active' : ''}`}
              onClick={() => onSelect(t.id, cardDims)}
            >
              {thumb ? <div className="tcard__thumb" dangerouslySetInnerHTML={{ __html: thumb }} /> : null}
              <em>{label}</em>
              <strong>{t.title}</strong>
              <span>
                {cardDims.L}×{cardDims.W || '—'}×{cardDims.H} mm
              </span>
              {meta && meta.rank < 3 && (
                <p className="tcard__reason">{meta.reason}</p>
              )}
            </button>
          )
        })}
      </div>
      {extras > 0 && (
        <button type="button" className="ghost-btn templates__more" onClick={() => setShowAll(true)}>
          Diğer yapılar ({extras})
        </button>
      )}
      {showAll && (
        <button type="button" className="ghost-btn templates__more" onClick={() => setShowAll(false)}>
          Yalnızca uyumlu yapılar
        </button>
      )}
      {selected && (
        <div className="templates__live">
          <div className="templates__identity">
            <p className="eyebrow">{grammar}</p>
            <h3>{selected.title}</h3>
          </div>
          <div className="templates__dims">
            <label>
              L
              <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
            </label>
            {selected.packagingMode === 'box' && (
              <label>
                W
                <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
              </label>
            )}
            <label>
              H
              <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
            </label>
            <span className="templates__dims-unit">mm</span>
            <button type="button" className="ghost-btn templates__start" onClick={() => onPick(selected.id, dims)}>
              Tasarımı başlat
            </button>
          </div>
          {livePreview && (
            <div className="templates__preview">
              <div className="templates__svg" dangerouslySetInnerHTML={{ __html: live }} />
              <CartonShell
                widthMm={dims.L || selected.defaultsMm.L}
                heightMm={dims.H || selected.defaultsMm.H}
                depthMm={dims.W || selected.defaultsMm.W || 28}
                kind={selected.packagingMode === 'label' ? 'label' : 'box'}
                grammar={grammar}
                caption="Hacim kabaca; net kartta. Yastık / poligon da dikdörtgen kabuk."
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
