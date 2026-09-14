import type { DesignBrief, DimensionsMm, FormaTemplate } from '../types'
import { filterTemplates, getTemplate } from '../engine/catalog/catalog'
import { estimateCartonMm } from '../engine/catalog/volumeCarton'
import { buildDieline } from '../engine/dieline/buildDieline'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'

type TemplatePickerProps = {
  brief: DesignBrief
  onPick: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
}

function dimsFor(brief: DesignBrief, template: FormaTemplate): DimensionsMm {
  return estimateCartonMm(brief.volume, brief, template) ?? template.defaultsMm
}

export function TemplatePicker({ brief, onPick, onDims }: TemplatePickerProps) {
  const cards = filterTemplates(brief)
  const selected = brief.templateId ? getTemplate(brief.templateId) : undefined
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : selected
        ? dimsFor(brief, selected)
        : cards[0]
          ? dimsFor(brief, cards[0])
          : { L: 80, W: 40, H: 120 }
  const live = selected
    ? renderDielineSvg(buildDieline(selected.structureId, { ...brief, dimensionsMm: dims }))
    : ''

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <div className="templates">
      <p className="eyebrow">Şablon</p>
      <h2>Bu sektörün kutuları</h2>
      {cards.length === 0 && <p className="templates__empty">Bu sektör için kutu şablonu yok.</p>}
      <div className="templates__grid">
        {cards.map((t: FormaTemplate) => {
          const cardDims = dimsFor(brief, t)
          return (
            <button
              key={t.id}
              type="button"
              className={`tcard ${brief.templateId === t.id ? 'is-active' : ''}`}
              onClick={() => onPick(t.id, cardDims)}
            >
              <strong>{t.title}</strong>
              <span>
                {cardDims.L}×{cardDims.W || '—'}×{cardDims.H} mm
                {brief.volume && !brief.volumeDefaulted ? ' · ml tahmini' : ''}
              </span>
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="templates__live">
          <p className="templates__legend">
            <span className="templates__swatch templates__swatch--cut">Kesim</span>
            <span className="templates__swatch templates__swatch--crease">Kırım</span>
            <span className="templates__swatch templates__swatch--perf">Yırtma</span>
          </p>
          <div className="templates__dims">
            <label>
              L
              <input type="number" value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
            </label>
            {selected.packagingMode === 'box' && (
              <label>
                W
                <input type="number" value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
              </label>
            )}
            <label>
              H
              <input type="number" value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
            </label>
            <button type="button" className="ghost-btn" onClick={() => onPick(selected.id, dims)}>
              Motoru çalıştır
            </button>
          </div>
          <div className="templates__svg" dangerouslySetInnerHTML={{ __html: live }} />
        </div>
      )}
    </div>
  )
}
