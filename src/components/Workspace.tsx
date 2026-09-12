import type {
  Attachment,
  BriefFields,
  ChatMessage,
  DesignSpec,
  TabId,
} from '../types'
import { Chat } from './Chat'
import { InputsPanel } from './InputsPanel'
import { Preview2D } from './Preview2D'
import { Preview3D } from './Preview3D'
import { ProductionInfo } from './ProductionInfo'

const TABS: { id: TabId; label: string }[] = [
  { id: 'konusma', label: 'Konuşma' },
  { id: 'vektor', label: '2D Vektör' },
  { id: 'onizleme3d', label: '3D Önizleme' },
  { id: 'uretim', label: 'Üretim Bilgisi' },
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
  brief: BriefFields
  inputsOpen: boolean
  onToggleInputs: () => void
  design: DesignSpec | null
  tab: TabId
  onTab: (tab: TabId) => void
  onReset: () => void
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
          Motor rev {design.revision} · {design.kind === 'landing' ? 'dijital yüzey' : 'ambalaj yüzeyi'}.
          Soldan yeni bir cümle yazarak iterasyon yapın.
        </p>
      )}
    </div>
  )
}

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
  tab,
  onTab,
  onReset,
}: WorkspaceProps) {
  const showPreview = !!design || generating
  const showTabs = !!design

  return (
    <div className="workspace">
      <header className="topbar">
        <button type="button" className="wordmark wordmark--btn" onClick={onReset}>
          FORMA
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
                {t.label}
              </button>
            ))}
          </nav>
        )}
        <button type="button" className="ghost-btn" onClick={onReset}>
          Yeni
        </button>
      </header>

      <div className={`workspace__body ${showPreview ? 'has-preview' : ''}`}>
        <aside className="workspace__left">
          <InputsPanel brief={brief} open={inputsOpen} onToggle={onToggleInputs} />
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
                <p>Tasarım motoru çalışıyor</p>
              </div>
            )}
            {!generating && tab === 'konusma' && (
              <ConversationBrief messages={messages} design={design} />
            )}
            {!generating && tab === 'vektor' && design && (
              <Preview2D design={design} attachments={allAttachments} />
            )}
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
