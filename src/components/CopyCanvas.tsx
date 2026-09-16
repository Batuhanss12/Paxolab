import { useEffect, useRef } from 'react'
import type { DesignSpec } from '../types'
import { resolveCopyLocale } from '../engine/copyLocale'
import { resolveSector } from '../engine/designSystem/sector'
import { liveClaim, usageCopy } from '../engine/studio/copyBank'
import { COPY_FIELD_LIMIT, type CopyField } from '../engine/studio/recomposeCopy'

type CopyCanvasProps = {
  design: DesignSpec
  active: CopyField | null
  onActive: (field: CopyField | null) => void
  onChange: (field: CopyField, value: string) => void
  onCommit: () => void
  onClose?: () => void
}

const GROUPS: { title: string; fields: Array<{ id: CopyField; label: string; rows?: number }> }[] = [
  {
    title: 'Ön yüz',
    fields: [
      { id: 'brand', label: 'Marka' },
      { id: 'product', label: 'Ürün' },
      { id: 'tagline', label: 'Slogan', rows: 2 },
      { id: 'cta', label: 'Şerit' },
      { id: 'volume', label: 'Miktar' },
    ],
  },
  {
    title: 'Arka yüz',
    fields: [
      { id: 'usage', label: 'Kullanım', rows: 2 },
      { id: 'ingredients', label: 'İçindekiler', rows: 3 },
      { id: 'warnings', label: 'Uyarı', rows: 3 },
      { id: 'manufacturer', label: 'Üretici' },
      { id: 'address', label: 'Adres', rows: 2 },
      { id: 'barcode', label: 'Barkod' },
    ],
  },
]

function canvasValue(design: DesignSpec, id: CopyField): string {
  if (id === 'cta') {
    const chips = design.studio?.direction.chips ?? []
    return liveClaim(design.copy, chips[1] ?? chips[0] ?? '')
  }
  if (id === 'usage') {
    const sector = design.studio?.direction.sector ?? resolveSector(design.brief)
    return usageCopy(design.copy, sector, resolveCopyLocale(design.brief))
  }
  return design.copy[id] ?? ''
}

export function CopyCanvas({ design, active, onActive, onChange, onCommit, onClose }: CopyCanvasProps) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!active || !root.current) return
    const node = root.current.querySelector<HTMLTextAreaElement | HTMLInputElement>(`[name="${active}"]`)
    if (!node) return
    node.focus({ preventScroll: true })
    node.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <aside className="copy-canvas" ref={root} aria-label="Yazı tuvali">
      <header className="copy-canvas__head">
        <div>
          <p className="copy-canvas__kicker">
            <span className="copy-canvas__live" aria-hidden="true" />
            Yazı tuvali
          </p>
          <h2>Metni düzenle</h2>
        </div>
        {onClose ? (
          <button type="button" className="copy-canvas__close" onClick={onClose}>
            Gizle
          </button>
        ) : null}
      </header>
      {GROUPS.map((group) => (
        <section key={group.title} className="copy-canvas__group">
          <h3>{group.title}</h3>
          {group.fields.map((field) => {
            const value = canvasValue(design, field.id)
            const rows = field.rows ?? 1
            const selected = active === field.id
            const limit = COPY_FIELD_LIMIT[field.id]
            return (
              <label key={field.id} className={`copy-canvas__field${selected ? ' is-active' : ''}`}>
                <span>
                  {field.label}
                  <em>
                    {value.length}/{limit}
                  </em>
                </span>
                {rows > 1 ? (
                  <textarea
                    name={field.id}
                    rows={rows}
                    maxLength={limit}
                    value={value}
                    autoComplete="off"
                    spellCheck={false}
                    onFocus={() => onActive(field.id)}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    onBlur={onCommit}
                  />
                ) : (
                  <input
                    name={field.id}
                    type="text"
                    maxLength={limit}
                    value={value}
                    autoComplete="off"
                    spellCheck={false}
                    inputMode={field.id === 'barcode' ? 'numeric' : 'text'}
                    onFocus={() => onActive(field.id)}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    onBlur={onCommit}
                  />
                )}
              </label>
            )
          })}
        </section>
      ))}
    </aside>
  )
}

export function copyFieldFromTarget(target: EventTarget | null): CopyField | null {
  if (!(target instanceof Element)) return null
  const hit = target.closest('[data-edit]')
  const key = hit?.getAttribute('data-edit')
  if (key && GROUPS.some((g) => g.fields.some((f) => f.id === key))) return key as CopyField
  return null
}
