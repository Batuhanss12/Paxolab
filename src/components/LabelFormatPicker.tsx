import type { DesignBrief, DimensionsMm, FormaTemplate } from '../types'
import { getTemplate, pickerTemplates } from '../engine/catalog/catalog'
import { STRUCTURE_LABEL } from '../engine/catalog/structureOffer'
import { recommendStructures } from '../engine/catalog/structureRecommend'
import { estimateCartonMm } from '../engine/catalog/volumeCarton'
import { buildDieline } from '../engine/dieline/buildDieline'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'

type LabelFormatPickerProps = {
  brief: DesignBrief
  onSelect: (templateId: string, dims: DimensionsMm) => void
  onPick: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
}

function dimsFor(brief: DesignBrief, template: FormaTemplate): DimensionsMm {
  return estimateCartonMm(brief.volume, brief, template) ?? template.defaultsMm
}

function netSvg(brief: DesignBrief, template: FormaTemplate, dims: DimensionsMm): string {
  return renderDielineSvg(buildDieline(template.structureId, { ...brief, templateId: template.id, dimensionsMm: dims }))
}

export function LabelFormatPicker({ brief, onSelect, onPick, onDims }: LabelFormatPickerProps) {
  const offer = recommendStructures(brief)
  const ranked = offer.all.filter((row) => row.eligible)
  const rankById = new Map(ranked.map((row, i) => [row.templateId, { ...row, rank: i }]))
  const cards = pickerTemplates(brief).filter((t) => t.packagingMode === 'label')
  const selected = brief.templateId ? getTemplate(brief.templateId) : undefined
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : selected
        ? dimsFor(brief, selected)
        : cards[0]
          ? dimsFor(brief, cards[0])
          : { L: 90, W: 0, H: 70 }
  const live = selected ? netSvg(brief, selected, dims) : ''
  const grammar = selected ? STRUCTURE_LABEL[selected.structureId] ?? selected.title : ''

  function setNum(key: 'L' | 'H', value: string) {
    onDims({ ...dims, W: 0, [key]: Number(value) || 0 })
  }

  return (
    <div className="templates templates--label">
      <p className="eyebrow">Etiket formatı</p>
      <h2>Ön / arka etiket seti</h2>
      <p className="templates__hint">
        Kutu şablonu değil. Sarımlı şişe veya düz yüz. Ölçü etiket en × boy. 3D’de şişe sonra seçilir.
      </p>
      {cards.length === 0 && <p className="templates__empty">Bu sektör için etiket formatı yok.</p>}
      <div className="templates__grid">
        {cards.map((t) => {
          const cardDims = dimsFor(brief, t)
          const meta = rankById.get(t.id)
          const thumb = netSvg(brief, t, cardDims)
          const label = STRUCTURE_LABEL[t.structureId] ?? t.structureId
          return (
            <button
              key={t.id}
              type="button"
              className={`tcard ${brief.templateId === t.id ? 'is-active' : ''}`}
              onClick={() => onSelect(t.id, { ...cardDims, W: 0 })}
            >
              <div className="tcard__thumb" dangerouslySetInnerHTML={{ __html: thumb }} />
              <em>{label}</em>
              <strong>{t.title}</strong>
              <span>
                {cardDims.L}×{cardDims.H} mm
              </span>
              {meta && <p className="tcard__reason">{meta.reason}</p>}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="templates__live">
          <div className="templates__identity">
            <p className="eyebrow">{grammar}</p>
            <h3>{selected.title}</h3>
          </div>
          <div className="templates__dims">
            <label>
              En
              <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
            </label>
            <label>
              Boy
              <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
            </label>
            <span className="templates__dims-unit">mm</span>
            <button type="button" className="ghost-btn templates__start" onClick={() => onPick(selected.id, { ...dims, W: 0 })}>
              Etiketi başlat
            </button>
          </div>
          {live && (
            <div className="templates__preview">
              <div className="templates__svg" dangerouslySetInnerHTML={{ __html: live }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
