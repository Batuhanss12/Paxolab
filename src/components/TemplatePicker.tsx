import type { DesignBrief, DimensionsMm, FormaTemplate } from '../types'
import { filterTemplates, getTemplate } from '../engine/catalog/catalog'
import { buildDieline } from '../engine/dieline/buildDieline'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'

type TemplatePickerProps = {
  brief: DesignBrief
  onPick: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
}

export function TemplatePicker({ brief, onPick, onDims }: TemplatePickerProps) {
  const cards = filterTemplates(brief)
  const selected = brief.templateId ? getTemplate(brief.templateId) : undefined
  const dims = brief.dimensionsMm.L || brief.dimensionsMm.H
    ? brief.dimensionsMm
    : selected?.defaultsMm ?? cards[0]?.defaultsMm ?? { L: 80, W: 40, H: 120 }
  const live = selected
    ? renderDielineSvg(buildDieline(selected.structureId, { ...brief, dimensionsMm: dims }))
    : ''

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  return (
    <div className="templates">
      <p className="eyebrow">Şablon</p>
      <h2>Yapı seçin — dieline canlı</h2>
      <div className="templates__grid">
        {cards.map((t: FormaTemplate) => (
          <button
            key={t.id}
            type="button"
            className={`tcard ${brief.templateId === t.id ? 'is-active' : ''} ${t.status === 'soon' ? 'is-soon' : ''}`}
            disabled={t.status === 'soon'}
            onClick={() => onPick(t.id, t.defaultsMm)}
          >
            <strong>{t.title}</strong>
            <span>
              {t.structureId} · {t.defaultsMm.L}×{t.defaultsMm.W || '—'}×{t.defaultsMm.H} mm
            </span>
            {t.status === 'soon' && <em>Yakında</em>}
          </button>
        ))}
      </div>
      {selected && (
        <div className="templates__live">
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
