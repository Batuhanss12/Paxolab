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
import { DirectionChoice } from './DirectionChoice'
import { Coach, coachSeen, studioCoachSteps } from './Coach'
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
  /** The wordmark's action. Scrolls/returns to the top of the current project — never destructive. */
  onHome?: () => void
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
  /** The four-design choice — open right after a fresh generation, closed once answered. */
  directionChoiceOpen?: boolean
  onDirectionChoiceClose?: () => void
  onDirectionChoiceOpen?: () => void
  /** Swap the offer for the other repertoire (F-32) without leaving the choice screen. */
  onSwapRepertoire?: () => void
  /** Print-ready proof toggle for the Üretim tab. */
  onProof?: (on: boolean) => void
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
  onHome,
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
  directionChoiceOpen = false,
  onDirectionChoiceClose,
  onDirectionChoiceOpen,
  onSwapRepertoire,
  onProof,
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
  /*
   * The chooser takes the whole preview column while it is up. It is a decision, not a panel
   * beside the design: showing a face *and* four candidates for that face at once is what made
   * the old strip read as decoration.
   */
  const showChoice =
    !generating && !showPicker && directionChoiceOpen && (design?.studio?.offer?.candidates.length ?? 0) > 1
  const hasCopyCanvas =
    !showPicker && !showChoice && ((tab === 'vektor' && copyOn2D) || (tab === 'dieline' && copyOnDieline))
  const viewingLabel = Boolean(labelPicker || design?.kind === 'label' || surfaceView === 'label')
  const [toolsMenu, setToolsMenu] = useState<ToolsMenu>('none')
  const toolsRef = useRef<HTMLDivElement>(null)
  const [coachOn, setCoachOn] = useState(false)

  /*
   * The walkthrough waits for the design to actually be on screen — not while generating, not
   * behind the format picker, and not while the four-design choice is up, since the customer is
   * already being asked a question there. The short delay lets the layout settle so the first
   * ring lands on the control rather than on where it used to be.
   */
  useEffect(() => {
    if (coachOn || coachSeen()) return
    if (!design || generating || showPicker || showChoice) return
    const timer = window.setTimeout(() => setCoachOn(true), 700)
    return () => window.clearTimeout(timer)
  }, [coachOn, design, generating, showPicker, showChoice])

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
        {/*
          * The wordmark goes home; it does not delete the project.
          *
          * It used to call `onReset`, which wipes the state and — 250 ms later, through the save
          * effect — overwrites both stores with the empty one. No confirm, no undo, no trash. One
          * misplaced click on the thing every other web app treats as "go home" and hours were
          * gone. Resetting is still available, on the button that says `Yeni` and asks first.
          */}
        <button type="button" className="wordmark wordmark--btn" onClick={onHome}>
          Grapxor
        </button>
        {showTabs && (
          <nav className="tabs" aria-label="Görünüm">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? 'page' : undefined}
                className={`tabs__btn ${tab === t.id ? 'is-active' : ''}`}
                data-coach={`tab-${t.id}`}
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
              aria-pressed={!viewingLabel && !!boxDesign}
              className={!viewingLabel && boxDesign ? 'is-active' : ''}
              disabled={!boxDesign}
              onClick={() => onSurfaceView?.('box')}
            >
              Kutu
            </button>
            {labelDesign ? (
              <button
                type="button"
                aria-pressed={viewingLabel}
                className={viewingLabel ? 'is-active' : ''}
                onClick={() => onSurfaceView?.('label')}
              >
                Etiket
              </button>
            ) : (
              <button
                type="button"
                aria-pressed={labelPicker}
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
                  data-coach="style"
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
            {!!design && (
              <button type="button" className="ghost-btn" onClick={() => setCoachOn(true)} title="Adımları yeniden göster">
                Tur
              </button>
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
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                const hasWork = !!design || messages.length > 0
                if (hasWork && !window.confirm('Yeni bir tasarıma başlansın mı? Buradaki sohbet ve tasarım kapanır.')) return
                onReset()
              }}
            >
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
            note={syncNote}
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
            {showChoice && design && (
              <DirectionChoice
                offer={design.studio?.offer}
                surface={design.kind === 'label' ? 'label' : 'box'}
                brandName={design.copy.brand}
                productName={design.copy.product}
                busy={generating}
                repertoire={brief.studioRepertoire ?? 'studio'}
                onPick={(family, index) => {
                  onDirectionChoiceClose?.()
                  onDirectionPick?.(family, index)
                }}
                onKeep={() => onDirectionChoiceClose?.()}
                onSwapRepertoire={onSwapRepertoire}
              />
            )}
            {!generating && !showPicker && !showChoice && tab === 'konusma' && design && (
              <ConversationBrief messages={messages} design={design} />
            )}
            {!generating && !showPicker && !showChoice && tab === 'vektor' && design && (
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
                    onOpenAll={onDirectionChoiceOpen}
                    disabled={generating}
                  />
                )}
              </div>
            )}
            {!generating && !showPicker && !showChoice && tab === 'karsilastir' && design && (
              <ComparePreview current={design} previous={designHistory.filter((d) => d.kind === design.kind).at(-1)} />
            )}
            {!generating && !showPicker && !showChoice && tab === 'dieline' && design && (
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
                    onOpenAll={onDirectionChoiceOpen}
                    disabled={generating}
                  />
                )}
              </div>
            )}
            {!generating && !showPicker && !showChoice && tab === 'onizleme3d' && design && (
              <Preview3D
                design={design}
                attachments={allAttachments}
                bottleShape={bottleShape}
                onBottleShape={onBottleShape}
              />
            )}
            {!generating && !showPicker && !showChoice && tab === 'uretim' && design && (
              <ProductionInfo design={design} onProof={onProof} busy={generating} />
            )}
          </section>
        )}
      </div>
      {coachOn && design && (
        <Coach steps={studioCoachSteps(design.kind === 'label' ? 'label' : 'box')} onDone={() => setCoachOn(false)} />
      )}
    </div>
  )
}
