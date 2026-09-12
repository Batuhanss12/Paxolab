import { useCallback, useRef, useState } from 'react'
import { Landing } from './components/Landing'
import { Workspace } from './components/Workspace'
import { openingReply, runConversation } from './engine/conversation'
import { getEngine } from './engine/EnginePort'
import { emptyBrief, mergeBrief, uid } from './engine/fields'
import { getTemplate } from './engine/catalog/catalog'
import { extractBriefWithLlm } from './engine/nlu'
import type {
  AppPhase,
  Attachment,
  AwaitingKey,
  DesignBrief,
  ChatMessage,
  DesignSpec,
  DimensionsMm,
  TabId,
} from './types'

const engine = getEngine()

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
  const [brief, setBrief] = useState<DesignBrief>(emptyBrief)
  const [awaiting, setAwaiting] = useState<AwaitingKey | null>(null)
  const [design, setDesign] = useState<DesignSpec | null>(null)
  const [typing, setTyping] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [inputsOpen, setInputsOpen] = useState(true)
  const [tab, setTab] = useState<TabId>('vektor')
  const [showTemplates, setShowTemplates] = useState(false)

  const briefRef = useRef(brief)
  const awaitingRef = useRef(awaiting)
  const designRef = useRef(design)
  const attachRef = useRef(allAttachments)
  const startedRef = useRef(false)

  const reset = useCallback(() => {
    setPhase('landing')
    setPrompt('')
    setPending([])
    setAllAttachments([])
    attachRef.current = []
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
    setShowTemplates(false)
    startedRef.current = false
  }, [])

  const attach = useCallback(async (files: FileList | null) => {
    const next = await readFiles(files)
    if (next.length === 0) return
    setPending((p) => {
      const tagged = next.map((a, i) =>
        p.length + i === 0 ? { ...a, kind: 'logo' as const } : a,
      )
      setAllAttachments((all) => {
        const merged = [...all, ...tagged]
        attachRef.current = merged
        return merged
      })
      return [...p, ...tagged]
    })
  }, [])

  const removePending = useCallback((id: string) => {
    setPending((p) => p.filter((a) => a.id !== id))
  }, [])

  const runGenerate = useCallback((nextBrief: DesignBrief, result: ReturnType<typeof runConversation>) => {
    setGenerating(true)
    window.setTimeout(() => {
      const logo = attachRef.current.find((a) => a.kind === 'logo') ?? attachRef.current[0]
      const next = engine.generate({
        brief: nextBrief,
        prev: designRef.current,
        overridePatch: result.overridePatch,
        copyPatch: result.copyPatch,
        logoHref: logo?.dataUrl,
      })
      designRef.current = next
      briefRef.current = next.brief
      setBrief(next.brief)
      setDesign(next)
      setShowTemplates(false)
      if (result.overridePatch.printReady) setTab('uretim')
      else setTab((t) => (t === 'konusma' ? 'vektor' : t))
      setGenerating(false)
    }, 720)
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

    const finish = (mergedBrief: DesignBrief) => {
      const result = runConversation({
        text: user.content,
        attachments: files,
        brief: mergedBrief,
        awaiting: awaitingRef.current,
        hasDesign: !!designRef.current,
      })

      briefRef.current = result.brief
      awaitingRef.current = result.awaiting
      setBrief(result.brief)
      setAwaiting(result.awaiting)
      setShowTemplates(result.showTemplates)

      const replies = [...result.replies]
      if (first && !result.brief.brandName) {
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
        publish()
        runGenerate(result.brief, result)
        return
      }
      publish()
    }

    window.setTimeout(() => {
      void extractBriefWithLlm(user.content)
        .then((llm) => {
          const merged = llm ? mergeBrief(briefRef.current, llm) : briefRef.current
          finish(merged)
        })
        .catch(() => finish(briefRef.current))
    }, 280)
  }, [runGenerate])

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

  const onPickTemplate = useCallback(
    (templateId: string, dims: DimensionsMm) => {
      const tmpl = getTemplate(templateId)
      const next = {
        ...briefRef.current,
        templateId,
        dimensionsMm: dims,
        packagingMode: briefRef.current.packagingMode || tmpl?.packagingMode || 'box',
        sector: briefRef.current.sector || tmpl?.sectors[0] || '',
      }
      briefRef.current = next
      setBrief(next)
      setPhase('workspace')
      const result = runConversation({
        text: 'şablon seçildi',
        attachments: [],
        brief: next,
        awaiting: 'templateId',
        hasDesign: false,
      })
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', content: result.replies[0] || 'Motor çalışıyor.' },
      ])
      runGenerate(next, result)
    },
    [runGenerate],
  )

  const onDims = useCallback((dims: DimensionsMm) => {
    const next = { ...briefRef.current, dimensionsMm: dims }
    briefRef.current = next
    setBrief(next)
  }, [])

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
          showTemplates={showTemplates}
          onPickTemplate={onPickTemplate}
          onDims={onDims}
          tab={tab}
          onTab={setTab}
          onReset={reset}
        />
      )}
    </div>
  )
}
