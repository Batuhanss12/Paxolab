import { useEffect, useRef, useState } from 'react'
import type { Attachment, DesignBrief, ChatMessage, DesignSpec, DimensionsMm, StyleType, TabId } from '../types'
import { isCoreReady } from '../engine/fields'
import { Chat } from './Chat'
import { ComparePreview } from './ComparePreview'
import { DielinePreview } from './DielinePreview'
import { InputsPanel } from './InputsPanel'
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
  onPickTemplate: (templateId: string, dims: DimensionsMm) => void
  onDims: (dims: DimensionsMm) => void
  onStyle: (style: StyleType) => void
  onVary?: () => void
  tab: TabId
  onTab: (tab: TabId) => void
  onReset: () => void
  onAuthChange?: (user: AuthUser | null) => void
  syncNote?: string | null
  creditsRefreshKey?: number
  onLoadProject?: (projectId: string) => void | Promise<void>
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
          {design.designPlan?.summaryTr ? `${design.designPlan.summaryTr}. ` : ''}
          Forxa motor rev {design.revision} · {design.structureId}. Soldan konuşarak iterasyon yapın.
        </p>
      )}
    </div>
  )
}

type ToolsMenu = 'none' | 'style' | 'inputs'

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
  onPickTemplate,
  onDims,
  onStyle,
  onVary,
  tab,
  onTab,
  onReset,
  onAuthChange,
  syncNote,
  creditsRefreshKey = 0,
  onLoadProject,
}: WorkspaceProps) {
  const showPreview = !!design || generating || showTemplates
  const showTabs = !!design
  const showStyles = !!design || showTemplates || isCoreReady(brief)
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
          Forxa
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
                {t.id === 'dieline' && design?.kind === 'label' ? 'Etiket seti' : t.label}
              </button>
            ))}
          </nav>
        )}

        <div className="topbar__right">
          {showStyles && (
            <div className="topbar-tools" ref={toolsRef}>
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
              {toolsMenu === 'style' && (
                <div className="topbar-popover topbar-popover--style" role="dialog" aria-label="Ruh hali">
                  <StyleBar
                    brief={brief}
                    design={design}
                    onStyle={onStyle}
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
            </div>
          )}
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

      <div className={`workspace__body ${showPreview ? 'has-preview' : ''}`}>
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
                <p>Forxa motoru çalışıyor</p>
              </div>
            )}
            {!generating && !design && showTemplates && (
              <TemplatePicker brief={brief} onPick={onPickTemplate} onDims={onDims} />
            )}
            {!generating && tab === 'konusma' && design && (
              <ConversationBrief messages={messages} design={design} />
            )}
            {!generating && tab === 'vektor' && design && (
              <Preview2D design={design} attachments={allAttachments} />
            )}
            {!generating && tab === 'karsilastir' && design && (
              <ComparePreview current={design} previous={designHistory.at(-1)} />
            )}
            {!generating && tab === 'dieline' && design && <DielinePreview design={design} />}
            {!generating && tab === 'onizleme3d' && design && (
              <Preview3D design={design} attachments={allAttachments} />
            )}
            {!generating && tab === 'uretim' && design && <ProductionInfo design={design} />}
          </section>
        )}
      </div>
    </div>
  )
}
