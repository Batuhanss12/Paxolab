import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import type { Attachment, ChatMessage } from '../types'
import { IconArrowUp, IconPaperclip } from './Icons'

type ChatProps = {
  messages: ChatMessage[]
  prompt: string
  onPrompt: (value: string) => void
  attachments: Attachment[]
  onAttach: (files: FileList | null) => void
  onRemoveAttach: (id: string) => void
  onSend: () => void
  typing: boolean
}

export function Chat({
  messages,
  prompt,
  onPrompt,
  attachments,
  onAttach,
  onRemoveAttach,
  onSend,
  typing,
}: ChatProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

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
    <div className="chat">
      <div className="chat__thread">
        {messages.map((m) => (
          <article key={m.id} className={`bubble bubble--${m.role}`}>
            {m.role === 'assistant' && <span className="bubble__who">FORMA</span>}
            <p>{m.content}</p>
            {m.attachments && m.attachments.length > 0 && (
              <div className="thumbs thumbs--msg">
                {m.attachments.map((a) => (
                  <span key={a.id} className="thumb thumb--static">
                    <img src={a.dataUrl} alt={a.name} />
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
        {typing && (
          <article className="bubble bubble--assistant">
            <span className="bubble__who">FORMA</span>
            <p className="dots">
              <i /><i /><i />
            </p>
          </article>
        )}
        <div ref={endRef} />
      </div>

      <div className="composer composer--dock">
        <textarea
          ref={areaRef}
          className="composer__input"
          placeholder="Brief’i tamamlayın veya iterasyon yazın…"
          value={prompt}
          onChange={(e) => onPrompt(e.target.value)}
          onKeyDown={onKey}
          rows={2}
        />
        {attachments.length > 0 && (
          <div className="thumbs">
            {attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                className="thumb"
                onClick={() => onRemoveAttach(a.id)}
              >
                <img src={a.dataUrl} alt={a.name} />
              </button>
            ))}
          </div>
        )}
        <div className="composer__bar">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFile} />
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileRef.current?.click()}
            aria-label="Ekle"
          >
            <IconPaperclip />
          </button>
          <span className="composer__hint">Enter gönder · Shift+Enter satır</span>
          <button
            type="button"
            className="send-btn"
            disabled={!prompt.trim() && attachments.length === 0}
            onClick={onSend}
            aria-label="Gönder"
          >
            <IconArrowUp />
          </button>
        </div>
      </div>
    </div>
  )
}
