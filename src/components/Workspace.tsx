import { useEffect, useRef, useState } from 'react'
import type { CopyField } from '../engine/studio/recomposeCopy'
import type { Attachment, BottleShape, DesignBrief, ChatMessage, DesignSpec, DimensionsMm, StyleType, TabId } from '../types'
import { isCoreReady } from '../engine/fields'
import { isDualDeliverable } from '../engine/conversationUnderstand'
import type { SurfaceView } from '../appState'
import { learnedPreferenceLine } from '../engine/brain'
import { STRUCTURE_LABEL } from '../engine/catalog/structureOffer'
import { familyOf, familyTalk } from '../engine/studio/family'
import type { StudioFamily, Temperament } from '../engine/studio/types'
import { DirectionOfferStrip } from './DirectionOfferStrip'
import { Chat } from './Chat'
import { LearningPanel } from './LearningPanel'
import { ComparePreview } from './ComparePreview'
import { DielinePreview } from './DielinePreview'
import { InputsPanel } from './InputsPanel'
import { LabelFormatPicker } from './LabelFormatPicker'
import { Preview2D } from './Preview2D'
import { Preview3D } from './Preview3D'
import { ProductionInfo } from './ProductionInfo'
import { StyleBar } from './StyleBar'
import { TemplatePicker } from './TemplatePicker'
import { AuthPanel } from './AuthPanel'
import type { AuthUser } from '../api/client'

const TABS: { id: TabId; label: string }[] = [
  { id: 'konusma', label: 'Konuşma' },
  { id: 'vektor', label: '2D Vektör' },
  { id: 'karsilastir', label: 'Karşılaştır' },
  { id: 'dieline', label: 'Dieline' },
  { id: 'onizleme3d', label: '3D' },
  { id: 'uretim', label: 'Üretim' },
]

type WorkspaceProps = {
  messages: ChatMessage[]
  prompt: string
  onPrompt: (value: string) => void
  attachments: Attachment[]
  allAttachments: Attachment[]
  onAttach: (files: FileList | null) => void
  onRemoveAttach: (id: string) => void
  onSend: () => void
  typing: boolean
  generating: boolean
  brief: DesignBrief
  inputsOpen: boolean
  onToggleInputs: () => void
  design: DesignSpec | null
  designHistory: DesignSpec[]
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  showTemplates: boolean
  onSelectTemplate: (templateId: string, dims: DimensionsMm) => void
  onPickTemplate: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
  onCopyChange?: (field: CopyField, value: string) => void
  onCopyCommit?: () => void
  onStyle: (style: StyleType) => void
  onTone?: (temperament: Temperament) => void
  credits?: { balance: number | null; costs: { generate: number; revise: number; download: number } | null }
  onDirectionPick?: (family: StudioFamily, index: number) => void
  onVary?: () => void
  tab: TabId
  onTab: (tab: TabId) => void
  onReset: () => void
  onAuthChange?: (user: AuthUser | null) => void
  syncNote?: string | null
  creditsRefreshKey?: number
  onLoadProject?: (projectId: string) => void | Promise<void>
  boxDesign?: DesignSpec | null
  labelDesign?: DesignSpec | null
  surfaceView?: SurfaceView
  onSurfaceView?: (surface: SurfaceView) => void
  bottleShape?: BottleShape | null
  onBottleShape?: (shape: BottleShape) => void
  onStartLabel?: () => void
}

function ConversationBrief({
  messages,
  design,
}: {
  messages: ChatMessage[]
  design: DesignSpec | null
}) {
  return (
    <div className="brief-log">
      <p className="eyebrow">Konuşma özeti</p>
      <h2>{design ? `${design.copy.brand} brief’i` : 'Brief oluşuyor'}</h2>
      <ol>
        {messages
          .filter((m) => m.role === 'user')
          .map((m) => (
            <li key={m.id}>{m.content}</li>
          ))}
      </ol>
      {design && (
        <p className="brief-log__note">
          Rev {design.revision} · {STRUCTURE_LABEL[design.structureId] ?? design.structureId}. Soldan konuşarak devam et.
        </p>
      )}
      {design && <DesignProcessNote design={design} />}
    </div>
  )
}

/** Short design-process trail. No critic menu, no yön adayları dump. */
function DesignProcessNote({ design }: { design: DesignSpec }) {
  const learned = learnedPreferenceLine(design.appliedKnowledge, { studio: Boolean(design.studio) })
  const studio = design.studio?.direction
  const family = studio ? familyOf(studio.archetype, design.brief.studioFamily) : undefined
  if (!learned && !studio) return null
  return (
    <p className="brief-log__note">
      {studio ? `${familyTalk(family)} yüzey. ` : ''}
      {learned}
    </p>
  )
}

type ToolsMenu = 'none' | 'style' | 'inputs' | 'learn'

export function Workspace({
  messages,
  prompt,
  onPrompt,
  attachments,
  allAttachments,
  onAttach,
  onRemoveAttach,
  onSend,
  typing,
  generating,
  brief,
  inputsOpen,
  onToggleInputs,
  design,
  designHistory,
  canRedo,
  onUndo,
  onRedo,
  showTemplates,
  onSelectTemplate,
  onPickTemplate,
  onDims,
  onCopyChange,
  onCopyCommit,
  onStyle,
  onTone,
  credits,
  onDirectionPick,
  onVary,
  tab,
  onTab,
  onReset,
  onAuthChange,
  syncNote,
  creditsRefreshKey = 0,
  onLoadProject,
  boxDesign = null,
  labelDesign = null,
  surfaceView = 'box',
  onSurfaceView,
  bottleShape = null,
  onBottleShape,
  onStartLabel,
}: WorkspaceProps) {
  const dualFromChat = messages.some((m) =>
    /kutu\s*(ve|ile|\+)\s*(şişe\s*)?etiket|(etiket|label)\s*(ve|ile|\+)\s*kutu/i.test(m.content),
  )
  const dualIntent =
    dualFromChat ||
    isDualDeliverable(brief) ||
    Boolean(boxDesign && (labelDesign || brief.packagingMode === 'label' || brief.deliverables?.includes('label')))
  const labelPicker = showTemplates && brief.packagingMode === 'label'
  const boxPicker = showTemplates && brief.packagingMode !== 'label' && !design
  const showPicker = labelPicker || boxPicker
  const showPreview = !!design || generating || showTemplates || !!boxDesign
  const showTabs = !!design && !showPicker
  const showStyles = !!design || showTemplates || isCoreReady(brief)
  const copyOn2D = !!design && design.kind === 'label'
  const copyOnDieline = !!design && design.kind !== 'label'
  const hasCopyCanvas = !showPicker && ((tab === 'vektor' && copyOn2D) || (tab === 'dieline' && copyOnDieline))
  const viewingLabel = Boolean(labelPicker || design?.kind === 'label' || surfaceView === 'label')
  const [toolsMenu, setToolsMenu] = useState<ToolsMenu>('none')
  const toolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toolsMenu === 'none') return
    function onDoc(e: MouseEvent) {
      if (!toolsRef.current?.contains(e.target as Node)) setToolsMenu('none')
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setToolsMenu('none')
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [toolsMenu])


  return (
    <div className="workspace">
      <header className="topbar">
        <button type="button" className="wordmark wordmark--btn" onClick={onReset}>
          Grapxor
        </button>
        {showTabs && (
          <nav className="tabs" aria-label="Görünüm">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tabs__btn ${tab === t.id ? 'is-active' : ''}`}
                onClick={() => onTab(t.id)}
              >
                {t.id === 'dieline' && design?.kind === 'label' ? 'Set' : t.label}
              </button>
            ))}
          </nav>
        )}
        {(dualIntent || (boxDesign && labelDesign)) && (
          <div className="surface-switch" role="group" aria-label="Yüzey">
            <span className="surface-switch__intent">Kutu + etiket</span>
            <button
              type="button"
              className={!viewingLabel && boxDesign ? 'is-active' : ''}
              disabled={!boxDesign}
              onClick={() => onSurfaceView?.('box')}
            >
              Kutu
            </button>
            {labelDesign ? (
              <button
                type="button"
                className={viewingLabel ? 'is-active' : ''}
                onClick={() => onSurfaceView?.('label')}
              >
                Etiket
              </button>
            ) : (
              <button
                type="button"
                className={labelPicker ? 'is-active' : ''}
                disabled={!boxDesign}
                onClick={() => onStartLabel?.()}
              >
                {labelPicker ? 'Etiket formatı' : 'Etiket üret'}
              </button>
            )}
          </div>
        )}

        <div className="topbar__right">
          <div className="topbar-tools" ref={toolsRef}>
            {showStyles && (
              <>
                <button
                  type="button"
                  className={`ghost-btn ${toolsMenu === 'style' ? 'is-active' : ''}`}
                  aria-expanded={toolsMenu === 'style'}
                  onClick={() => setToolsMenu((m) => (m === 'style' ? 'none' : 'style'))}
                >
                  Stil
                </button>
                <button
                  type="button"
                  className={`ghost-btn ${toolsMenu === 'inputs' ? 'is-active' : ''}`}
                  aria-expanded={toolsMenu === 'inputs'}
                  onClick={() => setToolsMenu((m) => (m === 'inputs' ? 'none' : 'inputs'))}
                >
                  Girdiler
                </button>
              </>
            )}
            <button
              type="button"
              className={`ghost-btn ${toolsMenu === 'learn' ? 'is-active' : ''}`}
              aria-expanded={toolsMenu === 'learn'}
              onClick={() => setToolsMenu((m) => (m === 'learn' ? 'none' : 'learn'))}
            >
              Öğrenme
            </button>
            {toolsMenu === 'style' && (
              <div className="topbar-popover topbar-popover--style" role="dialog" aria-label="Stil">
                <StyleBar
                  brief={brief}
                  design={design}
                  onStyle={onStyle}
                  onTone={onTone}
                  credits={credits}
                  onDims={onDims}
                  onVary={onVary}
                  variant="rail"
                />
              </div>
            )}
            {toolsMenu === 'inputs' && (
              <div className="topbar-popover topbar-popover--inputs" role="dialog" aria-label="Girdiler">
                <InputsPanel
                  brief={brief}
                  design={design}
                  open
                  onToggle={() => {
                    setToolsMenu('none')
                    if (inputsOpen) onToggleInputs()
                  }}
                />
              </div>
            )}
            {toolsMenu === 'learn' && (
              <div className="topbar-popover topbar-popover--learn" role="dialog" aria-label="Öğrenme">
                <LearningPanel />
              </div>
            )}
          </div>
          {syncNote && (
            <span className="topbar__sync" title={syncNote}>
              {syncNote}
            </span>
          )}
          <div className="history-actions">
            <button type="button" className="ghost-btn" onClick={onUndo} disabled={!designHistory.length}>
              Geri al
            </button>
            <button type="button" className="ghost-btn" onClick={onRedo} disabled={!canRedo}>
              Yinele
            </button>
            <button type="button" className="ghost-btn" onClick={onReset}>
              Yeni
            </button>
          </div>
          <AuthPanel onAuthChange={onAuthChange} creditsRefreshKey={creditsRefreshKey} onLoadProject={onLoadProject} />
        </div>
      </header>

      <div className={`workspace__body ${showPreview ? 'has-preview' : ''} ${hasCopyCanvas ? 'has-copy-canvas' : ''}`}>
        <aside className="workspace__left">
          <Chat
            messages={messages}
            prompt={prompt}
            onPrompt={onPrompt}
            attachments={attachments}
            onAttach={onAttach}
            onRemoveAttach={onRemoveAttach}
            onSend={onSend}
            typing={typing}
          />
        </aside>

        {showPreview && (
          <section className="workspace__right">
            {generating && (
              <div className="engine-wait">
                <span className="engine-wait__bar" />
                <p>Çiziyorum</p>
              </div>
            )}
            {!generating && showPicker && brief.packagingMode === 'label' && (
              <LabelFormatPicker brief={brief} onSelect={onSelectTemplate} onPick={onPickTemplate} onDims={onDims} />
            )}
            {!generating && showPicker && brief.packagingMode !== 'label' && (
              <TemplatePicker brief={brief} onSelect={onSelectTemplate} onPick={onPickTemplate} onDims={onDims} />
            )}
            {!generating && !showPicker && tab === 'konusma' && design && (
              <ConversationBrief messages={messages} design={design} />
            )}
            {!generating && !showPicker && tab === 'vektor' && design && (
              <div className="preview-stack">
                <Preview2D
                  design={design}
                  attachments={allAttachments}
                  onDims={onDims}
                  onCopyChange={copyOn2D ? onCopyChange : undefined}
                  onCopyCommit={copyOn2D ? onCopyCommit : undefined}
                />
                {onDirectionPick && (
                  <DirectionOfferStrip
                    offer={design.studio?.offer}
                    onPick={onDirectionPick}
                    disabled={generating}
                  />
                )}
              </div>
            )}
            {!generating && !showPicker && tab === 'karsilastir' && design && (
              <ComparePreview current={design} previous={designHistory.filter((d) => d.kind === design.kind).at(-1)} />
            )}
            {!generating && !showPicker && tab === 'dieline' && design && (
              <div className="preview-stack">
                <DielinePreview
                  design={design}
                  onCopyChange={copyOnDieline ? onCopyChange : undefined}
                  onCopyCommit={copyOnDieline ? onCopyCommit : undefined}
                />
                {onDirectionPick && (
                  <DirectionOfferStrip
                    offer={design.studio?.offer}
                    onPick={onDirectionPick}
                    disabled={generating}
                  />
                )}
              </div>
            )}
            {!generating && !showPicker && tab === 'onizleme3d' && design && (
              <Preview3D
                design={design}
                attachments={allAttachments}
                bottleShape={bottleShape}
                onBottleShape={onBottleShape}
              />
            )}
            {!generating && !showPicker && tab === 'uretim' && design && <ProductionInfo design={design} />}
          </section>
        )}
      </div>
    </div>
  )
}
