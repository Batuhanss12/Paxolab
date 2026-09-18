import type { Attachment, AwaitingKey, DesignBrief, DesignOverrides, EngineResult, PackagingMode } from '../types'
import { getTemplate, pickTemplate } from './catalog/catalog'
import { describeStructureOffer, STRUCTURE_LABEL, templateIdFromUtterance } from './catalog/structureOffer'
import { parseOfferChoice, recommendStructures } from './catalog/structureRecommend'
import { applyExtraction, sameName } from './extract'
import { askCopy, askRetryCopy, nextMissing } from './conversationAsk'
import {
  acceptDefaultFor,
  canDefault,
  emptyConversationState,
  noteAnswered,
  noteAsked,
  noteDeclined,
  noteTurn,
  shouldAsk,
  timesAsked,
  type ConversationState,
} from './conversationState'
import { SKIP_UTTERANCE } from './extractRules'
import {
  cueOverridePatch,
  directionBriefing,
  isDualDeliverable,
  understandUtterance,
  wantsCompanionLabel,
} from './conversationUnderstand'
import { briefSummary, isCoreReady, isSurfaceOnlySummary, mergeBrief } from './fields'
import { parseFeedback } from './iterate/feedbackParser'
import { isIteration, parseIntent } from './iterate/parseIntent'
import {
  applyDirectionTalk,
  explainStudioDirection,
  inspectStudioDirection,
  inspectStudioDirectionOffer,
  parseDirectionTalk,
} from './studio/directionTalk'
import { APPLY_STUDIO_CRITIC, talkForCritic } from './studio/studioCritic'
import { parseDirectionChoice } from './studio/directionOffer'
import type { StudioCriticOffer, StudioDirectionOffer } from './studio/types'
import { familyOf, familyTalk, hintsFromFamily, hintsFromVeto, applyVetoToHints } from './studio/family'

export { askCopy, nextMissing } from './conversationAsk'

/** Spoken start tokens — generate only after the user commits. */
const START_DESIGN = /^(başlat|çalıştır|üret|tasarla|motor|tasarımı\s*başlat|devam)$/i

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
  if (awaiting) {
    for (const key of ANSWER_OWNED[awaiting] ?? []) delete (patch as Record<string, unknown>)[key]
    // Names are settled by `applyExtraction`, which knows whether the customer labelled them.
    delete (patch as Record<string, unknown>).brandName
    delete (patch as Record<string, unknown>).productName
  }
  return mergeBrief(brief, patch)
}

function spokenHead(ack?: string, brief?: DesignBrief): string {
  const raw = (ack ?? '').trim() || (brief ? directionBriefing(brief) : '')
  return raw.replace(/ İlk yüzeyi hazırlıyorum\.?$/u, '').replace(/\s+/g, ' ').trim()
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
  const structure = describeStructureOffer(next, tmpl, pinned)
  const directionOffer = inspectStudioDirectionOffer(next)
  const selected = directionOffer.candidates.find((row) => row.selected)
  const familyBit = selected ? familyTalk(selected.family) : ''
  const isLabel = next.packagingMode === 'label'
  const head = spokenHead(ack, next)
  let line: string
  if (pass === 'again') {
    line = head ? `${head.replace(/\.$/, '')} — yüzeyi yeniliyorum.` : 'Yüzeyi yeniliyorum.'
  } else {
    const action = isLabel ? 'Ön ve arka etiketi çiziyorum.' : 'Kutuyu çiziyorum.'
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
    const familyClause = familyBit ? ` ${familyBit} çizgide.` : ''
    line = `${head ? `${head.replace(/\.$/, '.') } ` : ''}${action}${familyClause}${dual} ${structure}${alt}`
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
  const briefing = ((ack ?? '').trim() || directionBriefing(next)).replace(/ İlk yüzeyi hazırlıyorum\.$/, '')
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
    state: noteAsked(state ?? emptyConversationState(), 'templateId'),
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

export function runConversation(input: {
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
  const offerPick = parseOfferChoice(text, previewOffer.candidates.length)
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

  const listedOffer = input.directionOffer ?? inspectStudioDirectionOffer(input.brief)
  const directionPick = input.hasDesign ? parseDirectionChoice(text, listedOffer.candidates.length) : null
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
      const applied = applyDirectionTalk(
        input.brief,
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
        state,
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
      replies: [action.kind === 'vision' ? `Görsel kritik: ${action.reason} — “${action.utterance}”. ${applied.note}` : `Sıkışan yerleşimi açıyorum. ${applied.note}`],
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
      state,
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
        replies: [ack ? `${ack}. Yüzeyi bu brief ile yeniliyorum.` : 'Yüzeyi güncelledim.'],
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
  if (/etiket/.test(t)) return 'Etiket yüzeyi.'
  if (/kutu/.test(t)) return 'Kutu yüzeyi.'
  return ''
}

/** Async facade used by the workspace. Same local engine; no LLM coordinates. */
export async function runConversationAsync(
  input: Parameters<typeof runConversation>[0],
): Promise<EngineResult> {
  return runConversation(input)
}
