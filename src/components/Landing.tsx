import { useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import type { Attachment } from '../types'
import { IconArrowUp, IconPaperclip } from './Icons'
import { AuthPanel } from './AuthPanel'
import type { AuthUser } from '../api/client'

const CHIPS = [
  { label: 'Kutu', text: 'Kutu' },
  { label: 'Etiket', text: 'Etiket' },
  { label: 'Kutu + Etiket', text: 'Kutu + Etiket' },
  { label: 'Kozmetik', text: 'Kozmetik kutusu' },
  { label: 'Kahve', text: 'Kahve kutusu' },
  { label: 'Elektronik', text: 'Elektronik kutusu' },
  { label: 'Henüz emin değilim', text: 'Henüz emin değilim' },
] as const

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
          Ne tasarlamak istediğini anlat. İstersen birkaç seçenekten de başlayabilirsin.
        </p>

        <div className="composer composer--hero">
          <textarea
            className="composer__input"
            placeholder="Bir parfüm kutusu yapmak istiyorum… Marka, ürün, renk ve duruş — yazman yeterli."
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

        <p className="chips__hint">İstersen bir yüzey seç — zorunlu değil</p>
        <div className="chips">
          {CHIPS.map((chip) => (
            <button key={chip.label} type="button" className="chip" onClick={() => onSend(chip.text)}>
              {chip.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
