import { useCallback, useRef, useState } from 'react'
import { Landing } from './components/Landing'
import { Workspace } from './components/Workspace'
import { openingReply, runConversation } from './engine/conversation'
import { generateDesign } from './engine/designEngine'
import { emptyBrief, uid } from './engine/fields'
import type {
  AppPhase,
  Attachment,
  BriefFields,
  ChatMessage,
  DesignSpec,
  FieldKey,
  TabId,
} from './types'

function readFiles(list: FileList | null): Promise<Attachment[]> {
  if (!list) return Promise.resolve([])
  const files = [...list].filter((f) => f.type.startsWith('image/'))
  return Promise.all(
    files.map(
      (file) =>
        new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('read'))
          reader.onload = () => {
            resolve({
              id: uid(),
              name: file.name,
              kind: /logo/i.test(file.name) ? 'logo' : 'referans',
              dataUrl: String(reader.result),
            })
          }
          reader.readAsDataURL(file)
        }),
    ),
  )
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('landing')
  const [prompt, setPrompt] = useState('')
  const [pending, setPending] = useState<Attachment[]>([])
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [brief, setBrief] = useState<BriefFields>(emptyBrief)
  const [awaiting, setAwaiting] = useState<FieldKey | null>(null)
  const [design, setDesign] = useState<DesignSpec | null>(null)
  const [typing, setTyping] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [inputsOpen, setInputsOpen] = useState(true)
  const [tab, setTab] = useState<TabId>('vektor')

  const briefRef = useRef(brief)
  const awaitingRef = useRef(awaiting)
  const designRef = useRef(design)
  const startedRef = useRef(false)

  const reset = useCallback(() => {
    setPhase('landing')
    setPrompt('')
    setPending([])
    setAllAttachments([])
    setMessages([])
    const fresh = emptyBrief()
    setBrief(fresh)
    briefRef.current = fresh
    setAwaiting(null)
    awaitingRef.current = null
    setDesign(null)
    designRef.current = null
    setTyping(false)
    setGenerating(false)
    setInputsOpen(true)
    setTab('vektor')
    startedRef.current = false
  }, [])

  const attach = useCallback(async (files: FileList | null) => {
    const next = await readFiles(files)
    if (next.length === 0) return
    setPending((p) => {
      const tagged = next.map((a, i) =>
        p.length + i === 0 ? { ...a, kind: 'logo' as const } : a,
      )
      setAllAttachments((all) => [...all, ...tagged])
      return [...p, ...tagged]
    })
  }, [])

  const removePending = useCallback((id: string) => {
    setPending((p) => p.filter((a) => a.id !== id))
  }, [])

  const process = useCallback((text: string, files: Attachment[]) => {
    const user: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text || (files.length ? 'Görsel ekledim.' : ''),
      attachments: files.length ? files : undefined,
    }
    const first = !startedRef.current
    startedRef.current = true
    setMessages((m) => [...m, user])
    setTyping(true)

    window.setTimeout(() => {
      const result = runConversation({
        text: user.content,
        attachments: files,
        brief: briefRef.current,
        awaiting: awaitingRef.current,
        hasDesign: !!designRef.current,
      })

      briefRef.current = result.brief
      awaitingRef.current = result.awaiting
      setBrief(result.brief)
      setAwaiting(result.awaiting)

      const replies = [...result.replies]
      if (first) {
        const open = openingReply(user.content)
        if (open && !result.shouldGenerate) replies[0] = open
      }

      const publish = () => {
        setMessages((m) => [
          ...m,
          ...replies.map((content) => ({
            id: uid(),
            role: 'assistant' as const,
            content,
          })),
        ])
        setTyping(false)
      }

      if (result.shouldGenerate) {
        setGenerating(true)
        window.setTimeout(() => {
          const next = generateDesign(
            result.brief,
            designRef.current,
            result.overridePatch,
            result.copyPatch,
          )
          designRef.current = next
          setDesign(next)
          if (result.overridePatch.printReady) setTab('uretim')
          else setTab((t) => (t === 'konusma' ? 'vektor' : t))
          setGenerating(false)
          publish()
        }, 880)
        return
      }

      publish()
    }, 380)
  }, [])

  const send = useCallback(
    (forced?: string) => {
      const text = (forced ?? prompt).trim()
      const files = pending
      if (!text && files.length === 0) return
      if (phase === 'landing') setPhase('workspace')
      setPrompt('')
      setPending([])
      process(text, files)
    },
    [pending, phase, process, prompt],
  )

  return (
    <div className="app">
      {phase === 'landing' ? (
        <Landing
          prompt={prompt}
          onPrompt={setPrompt}
          attachments={pending}
          onAttach={attach}
          onRemoveAttach={removePending}
          onSend={send}
        />
      ) : (
        <Workspace
          messages={messages}
          prompt={prompt}
          onPrompt={setPrompt}
          attachments={pending}
          allAttachments={allAttachments}
          onAttach={attach}
          onRemoveAttach={removePending}
          onSend={() => send()}
          typing={typing}
          generating={generating}
          brief={brief}
          inputsOpen={inputsOpen}
          onToggleInputs={() => setInputsOpen((v) => !v)}
          design={design}
          tab={tab}
          onTab={setTab}
          onReset={reset}
        />
      )}
    </div>
  )
}
