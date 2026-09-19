import type { Attachment, AwaitingKey, DesignBrief, DesignOverrides, EngineResult, PackagingMode } from '../types'
import { getTemplate, pickTemplate } from './catalog/catalog'
import { STRUCTURE_LABEL, templateIdFromUtterance } from './catalog/structureOffer'
import { parseOfferChoice, recommendStructures } from './catalog/structureRecommend'
import { applyExtraction, sameName } from './extract'
import { askCopy, askRetryCopy, nextMissing } from './conversationAsk'
import {
  acceptDefaultFor,
  canDefault,
  decisionSummary,
  emptyConversationState,
  noteAnswered,
  noteAsked,
  noteDecision,
  noteDeclined,
  noteTurn,
  shouldAsk,
  timesAsked,
  type ConversationState,
} from './conversationState'
import { SKIP_UTTERANCE } from './extractRules'
import { styleLabel } from './styles'
import {
  BRIEFING_TAIL,
  cueOverridePatch,
  directionBriefing,
  isDualDeliverable,
  understandUtterance,
  wantsCompanionLabel,
} from './conversationUnderstand'
import { briefSummary, isCoreReady, isSurfaceOnlySummary, mergeBrief } from './fields'
import { parseFeedback } from './iterate/feedbackParser'
import { isIteration, isRepertoireSwap, parseIntent } from './iterate/parseIntent'
import {
  applyDirectionTalk,
  explainStudioDirection,
  inspectStudioDirection,
  inspectStudioDirectionOffer,
  parseDirectionTalk,
} from './studio/directionTalk'
import { APPLY_STUDIO_CRITIC, talkForCritic } from './studio/studioCritic'
import { parseDirectionChoice } from './studio/directionOffer'
import { pickFromFingerprint } from './studio/referenceDna'
import type { StudioCriticOffer, StudioDirectionOffer } from './studio/types'
import { familyOf, familyTalk, hintsFromFamily, hintsFromVeto, applyVetoToHints, isStudioFamily } from './studio/family'

export { askCopy, nextMissing } from './conversationAsk'

/** Spoken start tokens — generate only after the user commits. */
const START_DESIGN = /^(başlat|çalıştır|üret|tasarla|motor|tasarımı\s*başlat|devam)$/i

/**
 * "What have we settled so far?"
 *
 * The decision ledger existed — `decisions` on the state, `noteDecision` to append to it — and
 * nothing wrote to it and nothing read it. Six turns into a design a customer had no way to see
 * what they had already chosen, short of scrolling the chat. Both ends are connected now: the
 * structure, direction and mood are recorded when they are settled, and this asks for them back.
 */
const ASK_SUMMARY = /^(özet|özetle|ne\s*karar\s*verdik|neye\s*karar\s*verdik|şu\s*ana\s*kadar\s*ne\s*var|nerede\s*kaldık)\s*[?.!]*$/i

function studioGeneratePatch(brief: DesignBrief): Partial<DesignOverrides> {
  const patch = cueOverridePatch(brief)
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  const vetoed = brief.avoidStudioFamilies ?? []
  const veto = hintsFromVeto(vetoed)
  const family = brief.studioFamily && !vetoed.includes(brief.studioFamily) ? hintsFromFamily(brief.studioFamily, surface) : null
  const direction = applyVetoToHints({ ...patch.direction, ...veto, ...family }, vetoed)
  if (veto || family || patch.direction) patch.direction = direction
  if (brief.directionVariation != null) patch.variationIndex = brief.directionVariation
  return patch
}

/**
 * Fields the awaited answer owns. While a question is pending, understanding may add to the brief
 * but never argue with the answer that was just given, nor re-guess a name — `extract.ts` already
 * decides which name corrections count.
 */
const ANSWER_OWNED: Record<string, readonly string[]> = {
  brandName: ['brandName'],
  productName: ['productName'],
  sector: ['sector', 'subProduct'],
  packagingMode: ['packagingMode', 'deliverables'],
  volume: ['volume'],
  dimensionsMm: ['dimensionsMm'],
  barcode: ['barcode'],
  templateId: ['templateId'],
  copyLocale: ['copyLocale'],
}

function withUnderstanding(
  brief: DesignBrief,
  text: string,
  attachments: Attachment[],
  awaiting: AwaitingKey | null,
): DesignBrief {
  /*
   * Understanding used to be switched off entirely whenever a question was pending, which is most
   * of the conversation. Everything the customer volunteered while answering was therefore thrown
   * away: audience, channel, price tier, feeling, what not to resemble — the whole brief-depth
   * layer that exists to make the design better. Measured: answering the product question with
   * "Gece Serisi olsun. Hedef kitlemiz 30 yaş üstü kadınlar, eczane rafında duracak, çok klinik
   * durmasın" kept the name and lost the other three facts.
   *
   * It runs now, with the awaited field and the names held back so it cannot overrule the answer.
   */
  const understanding = understandUtterance(text, brief, attachments)
  const patch = { ...understanding.patch }
  /*
   * Names are settled by `applyExtraction`, which knows whether the customer labelled them.
   *
   * While a question is pending that is absolute: the answer belongs to the field that was asked
   * for, and a second reading of the same words must not invent a different field from them —
   * answering "Elite Brew" to the brand question otherwise left **Brew** as the product name.
   *
   * Once a design exists nothing is awaited, and that is where this guard used to stop. So
   * understanding's positional guess ran unchecked and overwrote a name the customer had already
   * given: typing `başlat` set the brand to **başlat**, and "hedef kitle 25-40 yaş, teknoloji
   * meraklısı" set it to **hedef** with the product as **kitle**, on a pack branded Lumen. Past
   * the opener a guess may fill a name nobody has given, but it may not replace one.
   */
  if (awaiting) {
    for (const key of ANSWER_OWNED[awaiting] ?? []) delete (patch as Record<string, unknown>)[key]
    delete (patch as Record<string, unknown>).brandName
    delete (patch as Record<string, unknown>).productName
  } else {
    if (brief.brandName.trim()) delete (patch as Record<string, unknown>).brandName
    if (brief.productName.trim()) delete (patch as Record<string, unknown>).productName
  }
  return mergeBrief(brief, patch)
}

function spokenHead(ack?: string, brief?: DesignBrief): string {
  const raw = (ack ?? '').trim() || (brief ? directionBriefing(brief) : '')
  return raw.replace(BRIEFING_TAIL.trimEnd(), '').replace(/\s+/g, ' ').trim()
}

function generateResult(
  brief: DesignBrief,
  ack?: string,
  text = '',
  state?: ConversationState,
  pass: 'first' | 'again' = 'first',
): EngineResult {
  const offer = recommendStructures(brief)
  const tmpl =
    (brief.templateId ? getTemplate(brief.templateId) : undefined) ??
    (offer.candidates[0] ? getTemplate(offer.candidates[0].templateId) : undefined) ??
    pickTemplate(brief)
  const next = {
    ...brief,
    templateId: tmpl.id,
    packagingMode: brief.packagingMode || tmpl.packagingMode,
  }
  const pinned = { ...offer, selectedTemplateId: tmpl.id }
  const dual =
    isDualDeliverable(next) && next.packagingMode !== 'label'
      ? ' Kutu ve etiket istedin; önce kutuyu çiziyorum. Etiket için “etiketi de üret” yaz.'
      : ''
  const directionOffer = inspectStudioDirectionOffer(next)
  const selected = directionOffer.candidates.find((row) => row.selected)
  const familyBit = selected ? familyTalk(selected.family) : ''
  const isLabel = next.packagingMode === 'label'
  const head = spokenHead(ack, next)
  let line: string
  if (pass === 'again') {
    line = head ? `${head.replace(/\.$/, '')} — yeniden çiziyorum.` : 'Yeniden çiziyorum.'
  } else {
    /*
     * The family belongs in the sentence, not after it.
     *
     * This read "Kutuyu çiziyorum. mermer çizgide." — a fragment starting in lower case, because
     * `familyTalk` returns a noun phrase meant to sit inside a clause. One sentence says it once.
     */
    const what = isLabel ? 'Ön ve arka etiketi' : 'Kutuyu'
    const action = familyBit ? `${what} ${familyBit} çizgisinde çiziyorum.` : `${what} çiziyorum.`
    /*
     * The structure is named, not re-argued.
     *
     * `describeStructureOffer` was quoted whole here, and it is written for the moment of choosing:
     * it gives the winner's full reason, then both runners-up with *their* full reasons, then how
     * to switch. At generation the customer has already chosen and the cards are on screen, so all
     * of that arrives again as justification for a decision nobody is making. Measured on five
     * ordinary conversations the first generation line averaged **637 characters**, with the size
     * repeated three times inside it — "(70×70×140 mm)" in each of the three clauses.
     *
     * What is genuinely new at this moment is the eight designs, so that is what the line spends
     * its length on. The structure gets its name and the size it will be built at.
     */
    const d = next.dimensionsMm
    const size = isLabel ? `${d.L}×${d.H} mm` : `${d.L}×${d.W || '—'}×${d.H} mm`
    const label = STRUCTURE_LABEL[tmpl.structureId] ?? tmpl.title
    const structure = ` ${isLabel ? 'Format' : 'Yapı'}: ${label} · ${size}.`
    /*
     * The strip now carries four painted directions, not one face and a spare, so the line invites
     * a choice instead of an objection — the owner's ask was that pressing start puts a spread in
     * front of the customer.
     */
    const rows = directionOffer.candidates
    const others = rows.filter((row) => !row.selected)
    /*
     * Every row is named, the one on screen included. Listing only the runners-up read as a
     * miscount — "4 yön var" followed by three names — and it also hid which of the four the
     * customer was looking at.
     */
    const alt = rows.length
      ? ` Sağda ${rows.length} tasarım açtım — ${rows
          .map((row) => `${row.index}. ${familyTalk(row.family)}${row.selected ? ' (ekranda)' : ''}`)
          .join(', ')}. Kartlardan birine tıkla ya da “${(others[0] ?? rows[0])!.index}. yön” yaz.`
      : ''
    line = `${head ? `${head.replace(/\.$/, '.') } ` : ''}${action}${dual}${structure}${alt}`
      .replace(/\s+/g, ' ')
      .trim()
  }
  return {
    brief: next,
    awaiting: null,
    replies: [line],
    shouldGenerate: true,
    showTemplates: false,
    overridePatch: studioGeneratePatch(next),
    copyPatch: {},
    note: 'generate',
    feedback: parseFeedback(text),
    state,
    structureOffer: pinned,
    directionOffer,
  }
}

/** Core brief is complete — show ranked structures. Design starts only after the user picks. */
function offerStructureResult(brief: DesignBrief, ack?: string, state?: ConversationState): EngineResult {
  const offer = recommendStructures(brief)
  const next = { ...brief, packagingMode: brief.packagingMode || 'box' }
  const lines = offer.candidates.map((row, i) => {
    const label = STRUCTURE_LABEL[row.structureId] ?? row.title
    return `${i + 1}. ${label} — ${row.reason}`
  })
  const briefing = ((ack ?? '').trim() || directionBriefing(next)).replace(BRIEFING_TAIL, '')
  const dual =
    isDualDeliverable(next) && next.packagingMode !== 'label'
      ? ' Kutu ve etiket istedin; önce kutuyu çizeceğim. Etiket için “etiketi de üret” yaz.'
      : ''
  const isLabel = next.packagingMode === 'label'
  return {
    brief: next,
    awaiting: 'templateId',
    replies: [
      isLabel
        ? `${briefing} Sağda etiket formatı — sarımlı şişe veya düz. Eni ve boyu ayarla, sonra başlat.`
        : `${briefing}${dual} Uygun yapılar sağda — kartı seç, ölçüyü orada ayarla, sonra tasarımı başlat.`,
      lines.join('\n'),
    ].filter(Boolean),
    shouldGenerate: false,
    showTemplates: true,
    overridePatch: studioGeneratePatch(next),
    copyPatch: {},
    note: 'offer',
    state: noteAsked(state ?? emptyConversationState(), 'templateId'),
    structureOffer: offer,
  }
}

function dimsFromTemplate(templateId: string): { L: number; W: number; H: number } {
  const tmpl = getTemplate(templateId)
  return tmpl?.defaultsMm ?? { L: 80, W: 40, H: 120 }
}

function structureGate(input: { hasDesign: boolean; awaiting: AwaitingKey | null; brief: DesignBrief }): boolean {
  if (input.hasDesign || input.awaiting === 'templateId') return true
  const miss = nextMissing(input.brief)
  return miss === null || miss === 'templateId'
}

/** User named a carton — pin it and wait for dim edit + start. Do not generate yet. */
function selectStructureResult(brief: DesignBrief, templateId: string, text: string, state?: ConversationState): EngineResult {
  const tmpl = getTemplate(templateId)
  // The nets are parametric, so a structure choice must not overwrite a size the user gave.
  // Only fall back to the catalog default when we have nothing of theirs to keep.
  const keepUserDims = !brief.dimsDefaulted && brief.dimensionsMm.L > 0 && brief.dimensionsMm.H > 0
  const dims = keepUserDims ? brief.dimensionsMm : dimsFromTemplate(templateId)
  const next = {
    ...brief,
    templateId,
    packagingMode: brief.packagingMode || tmpl?.packagingMode || 'box',
    dimensionsMm: dims,
    dimsDefaulted: !keepUserDims,
  }
  const offer = recommendStructures(next)
  const label = tmpl ? (STRUCTURE_LABEL[tmpl.structureId] ?? tmpl.title) : templateId
  const isLabel = next.packagingMode === 'label'
  const size = isLabel ? `${dims.L}×${dims.H} mm` : `${dims.L}×${dims.W || '—'}×${dims.H} mm`
  const settled = noteDecision(
    noteAsked(state ?? emptyConversationState(), 'templateId'),
    `${isLabel ? 'Format' : 'Yapı'}: ${label} · ${size}`,
  )
  return {
    brief: next,
    awaiting: 'templateId',
    replies: [
      isLabel
        ? keepUserDims
          ? `${label} seçildi. Senin ölçünle: ${dims.L}×${dims.H} mm — sağda değiştirebilirsin, sonra “Etiketi başlat”.`
          : `${label} seçildi. Etiket ${dims.L}×${dims.H} mm — sağda değiştir, sonra “Etiketi başlat”.`
        : keepUserDims
          ? `${label} seçildi. Senin ölçünle: ${dims.L}×${dims.W || '—'}×${dims.H} mm — sağda değiştirebilirsin, sonra “Tasarımı başlat”.`
          : `${label} seçildi. Şablon ölçüsü ${dims.L}×${dims.W || '—'}×${dims.H} mm — sağda değiştir, sonra “Tasarımı başlat”.`,
    ],
    shouldGenerate: false,
    showTemplates: true,
    overridePatch: studioGeneratePatch(next),
    copyPatch: {},
    note: 'select',
    feedback: parseFeedback(text),
    state: settled,
    structureOffer: { ...offer, selectedTemplateId: templateId },
  }
}

/** Was the awaited field answered (filled or declined) by this turn? */
function settleAwaiting(state: ConversationState, awaiting: AwaitingKey | null, text: string, before: DesignBrief, after: DesignBrief): ConversationState {
  if (!awaiting) return state
  if (SKIP_UTTERANCE.test(text) || /^(yok|yoktur)$/i.test(text)) return noteDeclined(noteAnswered(state, awaiting), awaiting)
  const changed = JSON.stringify((before as Record<string, unknown>)[awaiting]) !== JSON.stringify((after as Record<string, unknown>)[awaiting])
  return changed || !nextMissingIs(after, awaiting) ? noteAnswered(state, awaiting) : state
}

function nextMissingIs(brief: DesignBrief, key: AwaitingKey): boolean {
  return nextMissing(brief) === key
}

/**
 * Pick the next blocking question. A field asked MAX_ASK times (or declined) that has
 * a deterministic default is defaulted instead of asked again; brand / sector / surface
 * have no safe default and stay questions.
 */
function resolveMissing(brief: DesignBrief, state: ConversationState): { brief: DesignBrief; missing: AwaitingKey | null } {
  let current = brief
  for (let guard = 0; guard < 4; guard++) {
    const missing = nextMissing(current)
    if (!missing || missing === 'templateId') return { brief: current, missing }
    if (shouldAsk(state, missing) || !canDefault(missing)) return { brief: current, missing }
    current = acceptDefaultFor(current, missing)
  }
  return { brief: current, missing: nextMissing(current) }
}

/**
 * One turn of the conversation, with the brief sanitised before it and the answer on the way out.
 *
 * A family pin the studio does not recognise is dropped rather than obeyed — the right behaviour,
 * guarded in `familyPin.test.ts`. What was missing is that nobody told the customer. The pin can
 * only ever be stale, because the field is typed and the one untyped path is a saved session
 * restored from JSON; drawing a different family than the one they picked, without a word, reads
 * as the engine ignoring them.
 *
 * This sits outside the turn rather than inside one of its branches: `runConversationTurn` has a
 * dozen exits and the first version of this only ever fired on one of them.
 */
export function runConversation(input: Parameters<typeof runConversationTurn>[0]): EngineResult {
  const stale = input.brief.studioFamily !== undefined && !isStudioFamily(input.brief.studioFamily)
  if (!stale) return runConversationTurn(input)
  // Drop it on the way in, so the turn never sees it and it cannot be saved again on the way out.
  const cleaned = { ...input.brief, studioFamily: undefined, studioFamilyLocked: false }
  const out = runConversationTurn({ ...input, brief: cleaned })
  return {
    ...out,
    brief: { ...out.brief, studioFamily: undefined, studioFamilyLocked: false },
    replies: ['Kayıtlı tasarım ailen artık tanımadığım bir ad taşıyor — onu bırakıp brief’e en uygun çizgiyi seçiyorum.', ...out.replies],
  }
}

function runConversationTurn(input: {
  text: string
  attachments: Attachment[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  hasDesign: boolean
  /** Asked / answered ledger. Omit for stateless callers (tests, template pick). */
  state?: ConversationState
  /** Ledger C6 offers from the current studio face. */
  studioCritic?: StudioCriticOffer[]
  /** D3 ranked directions from the current studio face. */
  directionOffer?: StudioDirectionOffer
}): EngineResult {
  const text = input.text.trim()
  let state = noteTurn(input.state ?? emptyConversationState())


  const previewOffer = recommendStructures(input.brief)
  /*
   * A bare number belongs to the list the chat printed last.
   *
   * Both offers are numbered and the structure branch runs first, so once a design existed "3" was
   * read as the third *structure* — and `structureGate` returns true whenever a design exists, so
   * it silently started a re-generation. Measured on a honey label: the chat had just listed eight
   * directions and invited “1. yön”, the customer typed `3`, and the answer was "yeniden
   * çiziyorum" on the same direction as before. `5` looked correct only by accident — there were
   * three structures, so it fell through to the direction branch.
   *
   * Once a design is on screen the direction strip is the live numbered list. Changing the
   * structure still works by name ("düz", "2. yapı"), which is unambiguous.
   */
  const bareNumber = /^\d+[.)]?$/.test(text)
  const offerPick = bareNumber && input.hasDesign ? null : parseOfferChoice(text, previewOffer.candidates.length)
  if (offerPick && structureGate(input)) {
    const hit = previewOffer.candidates[offerPick - 1]
    if (hit) {
      const next = {
        ...input.brief,
        templateId: hit.templateId,
        packagingMode: input.brief.packagingMode || (hit.structureId.includes('label') ? ('label' as const) : ('box' as const)),
      }
      if (input.hasDesign) return generateResult(next, directionBriefing(next), text, state, 'again')
      return selectStructureResult(next, hit.templateId, text, state)
    }
  }

  const structureId = templateIdFromUtterance(text, input.brief.packagingMode)
  if (structureId && structureGate(input)) {
    const next = {
      ...input.brief,
      templateId: structureId,
      packagingMode: input.brief.packagingMode || (structureId.includes('label') ? 'label' as const : 'box' as const),
    }
    if (input.hasDesign) return generateResult(next, directionBriefing(next), text, state, 'again')
    return selectStructureResult(next, structureId, text, state)
  }

  if (
    input.awaiting === 'templateId' &&
    isCoreReady(input.brief) &&
    (SKIP_UTTERANCE.test(text) || START_DESIGN.test(text))
  ) {
    const seeded =
      input.brief.templateId
        ? input.brief
        : { ...input.brief, templateId: previewOffer.candidates[0]?.templateId ?? '', dimensionsMm: dimsFromTemplate(previewOffer.candidates[0]?.templateId ?? '') }
    return generateResult(seeded, seeded.templateId ? 'Ölçü ve yapıyla tasarımı başlatıyorum.' : 'Önerdiğim yapı + standart ölçüyle devam ediyorum.', text, state)
  }

  if (input.hasDesign && wantsCompanionLabel(text) && input.brief.packagingMode !== 'label') {
    const labelBrief = {
      ...input.brief,
      packagingMode: 'label' as const,
      templateId: '',
      deliverables: ['box', 'label'] as PackagingMode[],
    }
    return offerStructureResult(
      labelBrief,
      `${directionBriefing(labelBrief)} Kutu duruyor. Şimdi etiket formatını seç — sarımlı şişe veya düz.`,
      state,
    )
  }

  if (ASK_SUMMARY.test(text)) {
    const settled = decisionSummary(state)
    const ack = briefSummary(input.brief)
    const line = [ack, settled].filter(Boolean).join(' · ')
    return {
      brief: input.brief,
      awaiting: input.awaiting,
      replies: [line ? `Şu ana kadar: ${line}.` : 'Henüz bir şey seçmedik — ürünü anlatarak başlayabilirsin.'],
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'summary',
      state,
    }
  }

  /*
   * The start word keeps working after the first design.
   *
   * `START_DESIGN` was only consulted at the structure picker, so once a design existed `başlat`
   * fell all the way through to the "I could not read that as a change" shrug — the system
   * refusing the exact word it tells customers to type. It means the same thing on the second
   * press as on the first: draw it again.
   */
  if (input.hasDesign && START_DESIGN.test(text)) {
    return generateResult(input.brief, directionBriefing(input.brief), text, state, 'again')
  }

  const listedOffer = input.directionOffer ?? inspectStudioDirectionOffer(input.brief)
  // "ilk tasarımlara dön" is not a pick of direction 1 — see `isRepertoireSwap`.
  const directionPick = input.hasDesign && !isRepertoireSwap(text) ? parseDirectionChoice(text, listedOffer.candidates.length) : null
  if (directionPick) {
    const hit = listedOffer.candidates[directionPick - 1]
    if (hit) {
      if (hit.selected) {
        return {
          brief: input.brief,
          awaiting: input.awaiting,
          replies: [`Zaten ${hit.index}. yön (${familyTalk(hit.family)}) üzerindeyiz.`],
          shouldGenerate: false,
          showTemplates: false,
          overridePatch: {},
          copyPatch: {},
          note: 'direction-same',
          state,
          directionOffer: listedOffer,
        }
      }
      // The card is the design as shown: its arrangement, pairing and ornament are pinned with its family.
      const picked = { ...input.brief, studioPick: pickFromFingerprint(hit.fingerprint) }
      const applied = applyDirectionTalk(
        picked,
        {
          kind: 'pin',
          vetoFamilies: [],
          pinFamily: hit.family,
          note: `${hit.index}. yön: ${familyTalk(hit.family)}.`,
        },
        text,
      )
      const directionOffer = inspectStudioDirectionOffer(applied.brief)
      return {
        brief: applied.brief,
        awaiting: null,
        replies: [applied.note],
        shouldGenerate: true,
        showTemplates: false,
        overridePatch: { ...studioGeneratePatch(applied.brief), ...applied.overridePatch },
        copyPatch: {},
        note: 'direction-pick',
        feedback: parseFeedback(text),
        state: noteDecision(state, `Yön: ${familyTalk(hit.family)}`),
        directionOffer,
      }
    }
  }

  const currentFamily =
    input.brief.studioFamily ??
    (input.hasDesign ? familyOf(inspectStudioDirection(input.brief).direction.archetype) : undefined)
  const talk = parseDirectionTalk(text, currentFamily)
  if (talk?.kind === 'why') {
    const explained = explainStudioDirection(input.brief)
    return {
      brief: input.brief,
      awaiting: input.awaiting,
      replies: [explained.text],
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'why',
      state,
    }
  }
  /*
   * A direction named before there is anything to re-draw is part of the brief, not a command.
   *
   * This branch used to return here whenever the utterance named a family, which threw the rest of
   * the sentence away: "Verda krem etiketi, botanik olsun" answered "botanik kilitleyerek yeniden
   * çiziyorum" and kept *no* brand, no sector, no size — there was no design to redraw, and the
   * customer had to type their brief a second time. Measured on four ordinary first messages,
   * three were swallowed this way.
   *
   * So when no design exists the family is kept and the turn falls through: the same sentence
   * still gets read for brand, sector, colours and dimensions below.
   */
  let baseBrief = input.brief
  let directionNote = ''
  let directionOverride: EngineResult['overridePatch'] = {}
  if (talk && (talk.kind === 'veto' || talk.kind === 'vary' || talk.kind === 'pin')) {
    const applied = applyDirectionTalk(input.brief, talk, text)
    if (!input.hasDesign) {
      baseBrief = applied.brief
      directionOverride = applied.overridePatch
      // `talk.note` is written for a re-draw ("… kilitleyerek yeniden çiziyorum"). There is no
      // design yet, so it would promise something that is not happening.
      directionNote = talk.pinFamily
        ? `${familyTalk(talk.pinFamily)} çizgisinde ilerleyeceğim.`
        : talk.vetoFamilies.length
          ? `${familyTalk(talk.vetoFamilies[0])} dışında bir yön seçeceğim.`
          : ''
    } else {
      const directionOffer = inspectStudioDirectionOffer(applied.brief)
      return {
        brief: applied.brief,
        awaiting: null,
        replies: [applied.note],
        shouldGenerate: true,
        showTemplates: false,
        overridePatch: { ...studioGeneratePatch(applied.brief), ...applied.overridePatch },
        copyPatch: {},
        note: talk.kind,
        feedback: parseFeedback(text),
        state,
        directionOffer,
      }
    }
  }

  if (input.hasDesign && APPLY_STUDIO_CRITIC.test(text)) {
    const action = input.studioCritic?.[0]
    if (!action) {
      return {
        brief: input.brief,
        awaiting: input.awaiting,
        replies: ['Yerleşim şu an temiz — ekstra bir sadeleştirme önermiyorum.'],
        shouldGenerate: false,
        showTemplates: false,
        overridePatch: {},
        copyPatch: {},
        note: 'critic-idle',
        state,
      }
    }
    const applied = applyDirectionTalk(input.brief, talkForCritic(action.kind), action.utterance)
    const directionOffer = inspectStudioDirectionOffer(applied.brief)
    return {
      brief: applied.brief,
      awaiting: null,
      replies: [
        action.kind === 'vision'
          ? `Tasarıma baktım: ${action.reason}. ${applied.note}`
          : `Sıkışan yerleşimi açıyorum. ${applied.note}`,
      ],
      shouldGenerate: true,
      showTemplates: false,
      overridePatch: { ...studioGeneratePatch(applied.brief), ...applied.overridePatch },
      copyPatch: {},
      note: 'critic-apply',
      feedback:
        action.kind === 'quieter'
          ? [{ type: 'brand_fit', target: 'character', direction: 'strengthen', strength: 'high', raw: 'critic-apply:quieter' }]
          : [{ type: 'composition', target: 'layout', direction: 'vary', strength: 'medium', raw: 'critic-apply:vary' }],
      state,
      directionOffer,
    }
  }

  if (input.hasDesign && isIteration(text)) {
    const parsed = parseIntent(text, input.brief.styleType)
    const moved = parsed.briefPatch.styleType
    return {
      brief: { ...input.brief, ...parsed.briefPatch },
      awaiting: null,
      replies: [parsed.note],
      shouldGenerate: true,
      showTemplates: false,
      overridePatch: parsed.overridePatch,
      copyPatch: parsed.copyPatch,
      note: parsed.note,
      feedback: parseFeedback(text),
      state: moved ? noteDecision(state, `Ruh hali: ${styleLabel(moved)}`) : state,
    }
  }

  // `baseBrief` carries a family the same sentence named, when there was no design to re-draw.
  const extracted = applyExtraction(baseBrief, text, input.attachments, input.awaiting)
  const understood = withUnderstanding(extracted, text, input.attachments, input.awaiting)
  state = settleAwaiting(state, input.awaiting, text, input.brief, understood)
  const resolvedMissing = resolveMissing(understood, state)
  const brief = resolvedMissing.brief

  const ready = isCoreReady(brief)
  const missing = resolvedMissing.missing
  const ack = briefSummary(brief)
  const replies: string[] = []

  // The direction was heard even though the turn went on to collect the brief — say so once.
  if (directionNote) replies.push(directionNote)

  if (input.attachments.length) {
    replies.push(
      input.attachments.some((a) => a.kind === 'logo')
        ? 'Logoyu aldım. Monogram yerine bunu yerleştireceğim.'
        : 'Referansı kaydettim.',
    )
  }

  if (input.hasDesign) {
    const grew = JSON.stringify(brief) !== JSON.stringify(input.brief)
    if (grew) {
      return {
        brief,
        awaiting: null,
        replies: [ack ? `${ack}. Bunlarla yeniden çiziyorum.` : 'Tasarımı güncelledim.'],
        shouldGenerate: true,
        showTemplates: false,
        overridePatch: cueOverridePatch(brief),
        copyPatch: {},
        note: 'update',
        feedback: parseFeedback(text),
        state,
      }
    }
    return {
      brief,
      awaiting: null,
      replies: ['Bunu bir değişiklik olarak okuyamadım. “daha teknik”, “daha sakin” veya “neden bu yön” yazman yeter.'],
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: {},
      copyPatch: {},
      note: 'hint',
      state,
    }
  }

  if (missing && missing !== 'templateId') {
    const grew = briefSummary(brief) !== briefSummary(input.brief)
    const askKey: AwaitingKey =
      input.awaiting === 'productName' && sameName(text, brief.brandName) && !brief.productName.trim() ? 'productName' : missing
    // Same field, second time, nothing learned from the answer → rephrase, never repeat verbatim.
    const retry = input.awaiting === askKey && timesAsked(state, askKey) >= 1 && !grew
    if (retry) replies.push(askRetryCopy(brief, askKey, text))
    else replies.push(`${grew && ack && !isSurfaceOnlySummary(ack) ? `${ack}. ` : ''}${askCopy(brief, missing)}`.trim())
    return {
      brief,
      awaiting: askKey,
      replies,
      shouldGenerate: false,
      showTemplates: false,
      overridePatch: { ...directionOverride, ...cueOverridePatch(brief) },
      copyPatch: {},
      note: 'ask',
      state: noteAsked(state, askKey),
    }
  }

  if (ready && brief.templateId && input.awaiting === 'templateId') {
    /*
     * At the picker, only a start word starts a design.
     *
     * This branch used to fire on *any* unparsed text once a structure was pinned. So typing "kaç
     * mm olacak?" while looking at the structure cards began a generation and spent a credit — a
     * question answered by a charge. A question is not a command; the picker says what to press.
     */
    if (START_DESIGN.test(text.trim()) || SKIP_UTTERANCE.test(text.trim())) {
      return generateResult(brief, undefined, text, state)
    }
    return {
      brief,
      awaiting: 'templateId',
      replies: [
        'Yapı seçili. Ölçüyü sağdaki karttan değiştirebilirsin; hazır olunca “Tasarımı başlat”a bas ya da “başlat” yaz.',
      ],
      shouldGenerate: false,
      showTemplates: true,
      overridePatch: {},
      copyPatch: {},
      note: 'hint',
      state,
    }
  }

  if (ready) {
    /*
     * The list is printed when it is news, not on every turn.
     *
     * Refining the brief while the structure cards are up — "siyah bej" at the palette question —
     * re-ran this branch and printed the identical three lines a second time. Measured on a coffee
     * carton: the same "1. poligon kutu / 2. taşıyıcı tepsi / 3. tepsi" block twice in a row, with
     * only the palette clause differing above it. The cards are still on screen; what the customer
     * needs to hear is that the thing they just said was taken.
     */
    const before = recommendStructures(input.brief)
    const sameRanking =
      input.awaiting === 'templateId' &&
      before.candidates.length === previewOffer.candidates.length &&
      before.candidates.every((row, i) => row.templateId === recommendStructures(brief).candidates[i]?.templateId)
    if (sameRanking) {
      const took = briefSummary(brief)
      return {
        brief,
        awaiting: 'templateId',
        replies: [
          `${took ? `${took}. ` : ''}Yapı listesi sağda duruyor — kartı seç, ölçüyü orada ayarla, sonra “Tasarımı başlat”.`,
        ],
        shouldGenerate: false,
        showTemplates: true,
        overridePatch: { ...directionOverride, ...cueOverridePatch(brief) },
        copyPatch: {},
        note: 'offer-standing',
        state,
        structureOffer: recommendStructures(brief),
      }
    }
    return offerStructureResult({ ...brief, templateId: '' }, undefined, state)
  }

  replies.push(askCopy(brief, 'packagingMode'))
  return {
    brief,
    awaiting: 'packagingMode',
    replies,
    shouldGenerate: false,
    showTemplates: false,
    overridePatch: {},
    copyPatch: {},
    note: 'fallback',
    state: noteAsked(state, 'packagingMode'),
  }
}

export function openingReply(text: string): string {
  const t = text.toLowerCase()
  if (/henüz\s*emin|emin değilim/i.test(t)) {
    return 'Anlatman yeterli. Kutu mu etiket mi, hangi ürün, marka, renk, nasıl dursun — eksikleri ben sorarım.'
  }
  if (/kutu\s*\+|kutu.+(etiket|label)|(etiket|label).+kutu/i.test(t)) {
    return 'Kutu ve etiket. Önce kutuyu kuracağım.'
  }
  if (/etiket/.test(t)) return 'Etiket tasarlıyoruz.'
  if (/kutu/.test(t)) return 'Kutu tasarlıyoruz.'
  return ''
}

/** Async facade used by the workspace. Same local engine; no LLM coordinates. */
export async function runConversationAsync(
  input: Parameters<typeof runConversation>[0],
): Promise<EngineResult> {
  return runConversation(input)
}
