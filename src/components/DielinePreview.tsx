import { useEffect, useRef, useState } from 'react'
import type { DesignSpec } from '../types'
import { artworkMarkup, clipDefs } from '../engine/artwork/composeArtwork'
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
  const svg = renderDielineSvg(design.dieline, {
    showArtwork: true,
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
