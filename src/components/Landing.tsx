import { useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import type { Attachment } from '../types'
import { IconArrowUp, IconPaperclip } from './Icons'
import { AuthPanel } from './AuthPanel'
import type { AuthUser } from '../api/client'

const CHIPS = ['Kozmetik kutusu', 'Gıda ambalajı', 'Elektronik kutusu', 'Etiket'] as const

type LandingProps = {
  prompt: string
  onPrompt: (value: string) => void
  attachments: Attachment[]
  onAttach: (files: FileList | null) => void
  onRemoveAttach: (id: string) => void
  onSend: (text?: string) => void
  onAuthChange?: (user: AuthUser | null) => void
  creditsRefreshKey?: number
  onLoadProject?: (projectId: string) => void | Promise<void>
}

export function Landing({
  prompt,
  onPrompt,
  attachments,
  onAttach,
  onRemoveAttach,
  onSend,
  onAuthChange,
  creditsRefreshKey = 0,
  onLoadProject,
}: LandingProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (prompt.trim() || attachments.length) onSend()
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    onAttach(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="landing">
      <header className="topbar topbar--landing">
        <span className="wordmark">Grapxor</span>
        <div className="topbar__right">
          <span className="topbar__meta">Tasarım motoru</span>
          <AuthPanel onAuthChange={onAuthChange} creditsRefreshKey={creditsRefreshKey} onLoadProject={onLoadProject} />
        </div>
      </header>

      <main className="landing__hero">
        <p className="eyebrow">Talk → Engine → Edit → Print</p>
        <h1 className="landing__title">Ne tasarlamak istiyorsunuz?</h1>
        <p className="landing__sub">
          AI ile konuş → Grapxor tasarım motoru üretir. Nihai baskı vektördür, görsel üretim değil.
        </p>

        <div className="composer composer--hero">
          <textarea
            className="composer__input"
            placeholder="Örn. Lumina Night Serum için siyah-altın kozmetik kutusu, 80×40×120 mm"
            value={prompt}
            onChange={(e) => onPrompt(e.target.value)}
            onKeyDown={onKey}
            rows={4}
          />
          {attachments.length > 0 && (
            <div className="thumbs">
              {attachments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="thumb"
                  onClick={() => onRemoveAttach(a.id)}
                  title="Kaldır"
                >
                  <img src={a.dataUrl} alt={a.name} />
                  <span>{a.kind === 'logo' ? 'Logo' : 'Ref'}</span>
                </button>
              ))}
            </div>
          )}
          <div className="composer__bar">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onFile}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => fileRef.current?.click()}
              aria-label="Logo veya referans ekle"
            >
              <IconPaperclip />
            </button>
            <span className="composer__hint">Logo veya referans</span>
            <button
              type="button"
              className="send-btn"
              disabled={!prompt.trim() && attachments.length === 0}
              onClick={() => onSend()}
              aria-label="Gönder"
            >
              <IconArrowUp />
            </button>
          </div>
        </div>

        <div className="chips">
          {CHIPS.map((chip) => (
            <button key={chip} type="button" className="chip" onClick={() => onSend(chip)}>
              {chip}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
