import { useEffect, useMemo, useRef, useState } from 'react'
import type { DesignSpec } from '../types'
import { artworkMarkup, clipDefs } from '../engine/artwork/renderArtwork'
import { renderDielineSvg } from '../engine/dieline/renderDielineSvg'
import { artworkFromDocument } from '../engine/document'
import { pressSafeMm } from '../engine/production/pressBoxes'
import type { CopyField } from '../engine/studio/recomposeCopy'
import { CopyCanvas, copyFieldFromTarget } from './CopyCanvas'

type DielinePreviewProps = {
  design: DesignSpec
  onCopyChange?: (field: CopyField, value: string) => void
  onCopyCommit?: () => void
}

export function DielinePreview({ design, onCopyChange, onCopyCommit }: DielinePreviewProps) {
  const labelSet = design.kind === 'label'
  const editing = Boolean(onCopyChange) && !labelSet
  const [active, setActive] = useState<CopyField | null>(null)
  const [dockOpen, setDockOpen] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  const artwork = artworkFromDocument(design.document)

  /*
   * The label set shows the two faces, and nothing else.
   *
   * A wrap label's die carries a glue tab on the right of the front, and drawing the whole net put
   * it beside the design with the front's own cut line running past it — so the front looked like
   * it had an empty strip attached, and did not match the 2D view. Labelling the tab helped a
   * little and was still the wrong answer: this view is the customer's proof of their two faces,
   * not the knife file. The tab stays in the die and in the export; it comes out of the proof.
   *
   * Cartons keep their full net: there the flaps *are* the thing the Açılım view exists to show.
   */
  const model = useMemo(() => {
    if (!labelSet || !design.dieline.glueIds.length) return design.dieline
    const glue = new Set(design.dieline.glueIds)
    const faces = design.dieline.panels.filter((panel) => !glue.has(panel.id))
    if (!faces.length) return design.dieline
    return {
      ...design.dieline,
      panels: faces,
      glueIds: [],
      cut: faces.map((panel) => panel.polygon),
      crease: [],
    }
  }, [design.dieline, labelSet])

  const svg = renderDielineSvg(model, {
    showArtwork: true,
    // Clip ids come from the full die: the glue layer is still in the artwork, painting nothing.
    artworkMarkup: `<defs>${clipDefs(design.dieline)}</defs>${artworkMarkup(artwork)}`,
    safeInsetMm: design.overrides.printReady ? pressSafeMm(design.dieline) : 0,
  })

  useEffect(() => {
    setActive(null)
  }, [design.id])

  useEffect(() => {
    if (!editing) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  useEffect(() => {
    const root = canvasRef.current
    if (!root || !editing) return
    const onClick = (event: MouseEvent) => {
      const field = copyFieldFromTarget(event.target)
      if (!field) return
      event.preventDefault()
      setActive(field)
      setDockOpen(true)
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [editing, svg])

  useEffect(() => {
    const root = canvasRef.current
    if (!root) return
    for (const node of root.querySelectorAll('[data-edit]')) {
      node.classList.toggle('is-editing', node.getAttribute('data-edit') === active)
    }
  }, [active, svg])

  return (
    <div className={`preview-stage${editing ? ' preview-stage--edit' : ''}`}>
      <div className="preview-stage__meta">
        <span>{labelSet ? 'Ön + arka etiket seti' : 'Açılım'}</span>
        <span>
          {labelSet
            ? `${design.layout.widthMm} × ${design.layout.heightMm} mm`
            : `${design.layout.widthMm} × ${design.layout.depthMm || '—'} × ${design.layout.heightMm} mm`}
        </span>
        {design.dieline.consistent ? <span className="pill">Tutarlı</span> : <span className="pill pill--warn">Panel hatası</span>}
        {editing ? (
          <button
            type="button"
            aria-expanded={dockOpen}
            className={`ghost-btn copy-canvas__toggle${dockOpen ? ' is-active' : ''}`}
            onClick={() => setDockOpen((open) => !open)}
          >
            Yazı
          </button>
        ) : null}
      </div>
      <div className="preview-stage__work">
        <div className={`preview-stage__canvas${labelSet ? '' : ' preview-stage__canvas--wide'}`} ref={canvasRef}>
          <div
            className={`dieline-svg${editing ? ' dieline-svg--live' : ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        {editing && dockOpen ? (
          <CopyCanvas
            design={design}
            active={active}
            onActive={setActive}
            onChange={onCopyChange!}
            onCommit={() => onCopyCommit?.()}
            onClose={() => setDockOpen(false)}
          />
        ) : null}
      </div>
    </div>
  )
}
