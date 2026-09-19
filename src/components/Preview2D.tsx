import type { Attachment, DesignSpec, DimensionsMm } from '../types'
import { studioFaceLabel, studioLanguageCaption } from '../engine/studio/faceCaption'
import { facePanelId, renderFrontSvg, renderPanelSvg, PREVIEW_PAD } from '../engine/artwork/renderArtwork'
import { artworkFromDocument } from '../engine/document'
import { useEffect, useRef, useState } from 'react'
import { CopyCanvas, copyFieldFromTarget } from './CopyCanvas'
import { labelFaceForField, type CopyField } from '../engine/studio/recomposeCopy'

type Preview2DProps = {
  design: DesignSpec
  attachments: Attachment[]
  onDims: (dims: DimensionsMm) => void
  onCopyChange?: (field: CopyField, value: string) => void
  onCopyCommit?: () => void
}

export function Preview2D({ design, onDims, onCopyChange, onCopyCommit }: Preview2DProps) {
  const isLabel = design.kind === 'label'
  const [labelFace, setLabelFace] = useState<'front' | 'back'>('front')
  const [active, setActive] = useState<CopyField | null>(null)
  const [dockOpen, setDockOpen] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dims: DimensionsMm = {
    L: design.layout.widthMm,
    W: design.layout.depthMm,
    H: design.layout.heightMm,
  }
  const artwork = artworkFromDocument(design.document)
  const svg = isLabel
    ? (() => {
        const panelId = facePanelId(design.dieline, design.artwork, labelFace)
        return panelId
          ? renderPanelSvg(design.dieline, design.artwork, panelId, design.palette, { pad: PREVIEW_PAD, exportFonts: true })
          : renderFrontSvg(design.dieline, artwork, design.palette)
      })()
    : renderFrontSvg(design.dieline, artwork, design.palette)
  /*
   * The art is sized by its own proportion, not by width alone.
   *
   * `.art-svg` used to set a width and let the height fall out of the aspect ratio, which is fine
   * until the height exceeds the stage — the canvas clips, and a tall carton lost its foot. It is
   * a carton-only fault because labels are wide: measured on a 70×120 mm box at 1366×768, the art
   * came out 642 px tall in a 478 px stage, so the customer saw 74% of their own design.
   *
   * Handing the wrapper the viewBox's ratio lets `max-height` do its job: the browser shrinks the
   * width to satisfy the height and the whole face fits, at whichever axis is the tight one.
   */
  const aspectRatio = (() => {
    const box = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/.exec(svg)
    const w = Number(box?.[1])
    const h = Number(box?.[2])
    return w > 0 && h > 0 ? `${w} / ${h}` : undefined
  })()
  const languageCaption = studioLanguageCaption(design)

  function selectField(field: CopyField | null, opts: { syncFace?: boolean } = {}) {
    setActive(field)
    if (!field || !isLabel) return
    if (opts.syncFace !== false) setLabelFace(labelFaceForField(field))
    setDockOpen(true)
  }

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  useEffect(() => {
    const root = canvasRef.current
    if (!root || !onCopyChange) return
    const onClick = (event: MouseEvent) => {
      const field = copyFieldFromTarget(event.target)
      if (!field) return
      event.preventDefault()
      selectField(field, { syncFace: false })
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [isLabel, onCopyChange])

  useEffect(() => {
    setLabelFace('front')
    setActive(null)
  }, [design.id])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const root = canvasRef.current
    if (!root) return
    for (const node of root.querySelectorAll('[data-edit]')) {
      node.classList.toggle('is-editing', node.getAttribute('data-edit') === active)
    }
  }, [active, svg])

  return (
    <div className={`preview-stage${onCopyChange ? ' preview-stage--edit' : ''}`}>
      <div className="preview-stage__meta">
        <span>Rev {design.revision}</span>
        {design.designPlan || design.studio ? <span>{studioFaceLabel(design)}</span> : null}
        {languageCaption ? <span>{languageCaption}</span> : null}
        {isLabel && (
          <div className="label-face-toggle" role="group" aria-label="Etiket yüzü">
            {/* `is-active` is a colour; `aria-pressed` is the state. Without it the toggle is
                invisible to a screen reader and to keyboard users, who hear two plain buttons. */}
            <button type="button" aria-pressed={labelFace === 'front'} className={labelFace === 'front' ? 'is-active' : ''} onClick={() => setLabelFace('front')}>
              Ön
            </button>
            <button type="button" aria-pressed={labelFace === 'back'} className={labelFace === 'back' ? 'is-active' : ''} onClick={() => setLabelFace('back')}>
              Arka
            </button>
          </div>
        )}
        {onCopyChange ? (
          <button
            type="button"
            aria-expanded={dockOpen}
            className={`ghost-btn copy-canvas__toggle${dockOpen ? ' is-active' : ''}`}
            data-coach="copy"
            onClick={() => setDockOpen((open) => !open)}
          >
            Yazı
          </button>
        ) : null}
        {design.overrides.printReady && !design.preflight.blocking && <span className="pill">Baskı kapısı açık</span>}
        <div className="dim-strip" aria-label="Ölçü">
          <span className="dim-strip__label">Ölçü</span>
          <label>
            {isLabel ? 'En' : 'L'}
            <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
          </label>
          {!isLabel && (
            <label>
              W
              <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
            </label>
          )}
          <label>
            {isLabel ? 'Boy' : 'H'}
            <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
          </label>
          <span className="dim-strip__unit">mm</span>
        </div>
      </div>
      <div className="preview-stage__work">
        <div className="preview-stage__canvas" ref={canvasRef}>
          <div
            className={`art-svg ${isLabel ? 'art-svg--label' : ''} art-svg--live`}
            style={aspectRatio ? { aspectRatio } : undefined}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        {onCopyChange && dockOpen ? (
          <CopyCanvas
            design={design}
            active={active}
            face={isLabel ? labelFace : undefined}
            onActive={selectField}
            onChange={onCopyChange}
            onCommit={() => onCopyCommit?.()}
            onClose={() => setDockOpen(false)}
          />
        ) : null}
      </div>
    </div>
  )
}
