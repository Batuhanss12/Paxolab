# Design Brain — sonraki dilim ve roadmap

Tarih: 15 Eyl 2026. Faz 2 freeze durur (29 set-0 concept/hero/chrome/lockup/pattern, opticalY/brandY, overlay skip style-only).

Karar zinciri: **Konuşma → Understanding → Intent → VL → AD → Asset Language → havuz → ranking → Composition → mevcut painter**.

Öğrenme halkası (hedef): **LLM → Design Brain → Generate → Evaluate → Feedback → Learn → Design Knowledge → Design Brain**. LLM çizmez; kural yazmaz; SVG fine-tune yok; erken RL yok.

## Faz sırası (kritik, freeze-safe)

| Faz | Durum |
|---|---|
| VL-1…5b, AD-1…4, CS-1, language treatment | Kapandı |
| AL-1 compile preferred/allowed/forbidden | Kapandı |
| AL-2 playful organic/geometric roller + ranking | Kapandı |
| CHAT-1 Conversational Design Brief | Kapandı |
| **CRITIC-1** rol fit skor + critic MODIFY (`ROLE_MISMATCH`); avoid REJECT değil | Kapandı |
| **CHAT-2** sohbet avoid → AL motif token (`avoidMotifs` → `visualConcept.avoid` union) | Kapandı |
| **CHAT-3** yön özeti generate öncesi; kutu+etiket ikinci yüzey (“etiketi de üret”) | Kapandı |
| **FAZ 4** Design Decision Log (what/why/score/version, IndexedDB append-only) | Kapandı |
| **FAZ 5** Outcome + structured feedback parser (heuristic; LLM sınıflandırma opsiyonel) | Kapandı |
| **LLM-1** `LLMProvider` soyutlaması (`generateStructured`), model config log’da | Kapandı |
| **CHAT-4** Brief provenance (USER_EXPLICIT / HEURISTIC_INFERRED / LLM_INFERRED / KNOWLEDGE_DERIVED / SYSTEM_DEFAULT) + sohbet defteri (asked/answered, `MAX_ASK`) | Kapandı |
| **CRITIC-2** `DesignCritique {category,target,severity,issue,suggestedDirection,evidence}` | Kapandı |
| **FAZ 6** Design Knowledge (scope user/brand/global, confidence, sampleCount, state, version) | Kapandı — otomatik kural yok |
| **FAZ 7** Learning Gate (observation → aggregate → candidate → validate → approve) + rollback | Kapandı — A/B park |
| Overlay skip’i dile bağlamak | Park — freeze delinmesi |
| Character/density dil anahtarı; cue ikinci quiet-line | Park |
| Painter stroke/scale/frame; GraphicLibrary; budget / lockup Y | Park |
| `assetLanguage` zorunlu DesignPlan alanı | Park |
| FAZ 7b Knowledge A/B (aktif sürüm karşılaştırma) | Park — veri birikince |
| FAZ 8 Preference model | Park — veri birikince |
| FAZ 9 LLM fine-tune (extract / critique / classification) | Park — SVG için asla; RL yok |

## FAZ 4–5

Her `generate` bir karar kaydı yazar: path `kit` (25/29 catalog) veya `overlay` (playful aday skorları). Skor uydurulmaz; kit tek aday `scorecard` eksenleri, overlay mevcut `weightedTotal`. Outcome: regenerate / revision / export / rating. Feedback: `type / target / direction / strength` — `parseIntent` override’ları durur.

## LLM-1 — tek kapı

`src/engine/llm/provider.ts`: `LLMProvider.generateStructured({ task, system, user })`. Görevler: `brief-extract`, `feedback-interpret`, `critique`, `copy`, `intent`. Endpoint yoksa `NullLlmProvider` → heuristik. Model adı Design Brain’de geçmez; `VITE_FORMA_LLM_MODEL` ve `PROMPT_VERSION` karar kaydına `model` + `llmUsed` olarak yazılır. LLM’e stroke / koordinat / enum eşleme sorulmaz.

## CHAT-4 — kaynak ve defter

`DesignBrief.provenance[key] = { source, confidence }`. `mergeBrief` zayıf kaynağın güçlüyü ezmesine izin vermez (USER_EXPLICIT > HEURISTIC_INFERRED > LLM_INFERRED > KNOWLEDGE_DERIVED > SYSTEM_DEFAULT); `avoidMotifs` / `deliverables` her zaman birleşir. `classifyBriefFields` → KNOWN / INFERRED / UNKNOWN + blocking (REQUIRED = surface, sector, brand, dims). `ConversationState` asked/answered/declined tutar; `dimensionsMm` `MAX_ASK = 2` sonra `SYSTEM_DEFAULT` şablon ölçüsüne düşer, marka/sektör/yüzey soru kalır.

## CRITIC-2

`critiqueDesign` → `critiquePlan` MODIFY topic’leri, overlay winner `issues`, preflight fail/warn. SVG’ye dokunmaz; `critiqueAsFeedback` ile Brain’e StructuredFeedback olarak konuşur. `DesignSpec.designCritique` ve log `critiques`. LLM critique (`critiqueWithLlm`) opsiyonel, aynı şema, pipeline’da otomatik çağrılmaz.

## FAZ 6–7 — Knowledge + Learning Gate

Öneri kelime dağarcığı kapalı: `avoid-motif` (→ `brief.avoidMotifs` → `visualConcept.avoid`) ve `director-cue` (→ `brief.directorCue`, kullanıcı cue vermediyse). Painter / ranking koduna dokunulmaz; boş depo = baseline, 29/29 freeze etkisiz.

Zincir: ham feedback / outcome → `Observation` (user / brand / global scope; brand anahtarı hash, PII yok) → `aggregateObservations` → pattern → `deriveKnowledgeCandidates` (`candidate`) → `validateKnowledge` (`validated` / `rejected`) → `approveKnowledge(id, 'human' | 'automated')` (`active`, sürüm +1). Global scope otomatik onaylanmaz. `rollbackKnowledge(v)` önceki aktif kümeyi geri getirir; geçmiş silinmez.

Eşikler `LEARNING_THRESHOLDS` (LearningEngine.ts): `minSamples {user 2, brand 3, global 30}`, `minConsistency 0.7`, `minConfidence 0.6`, `saturationSamples {user 3, brand 4, global 40}` — confidence = consistency × min(1, n / saturation); tam tutarlı bir grup tam `minSamples`’ta 0.6’yı geçer. `autoApprove {user, brand}`; global yalnız insan.

Uygulama: `applyKnowledgeToBrief` (FormaLocalEngine, `createPlan` öncesi) → `KNOWLEDGE_DERIVED` provenance; log `knowledgeVersion` + `appliedKnowledge`; `DesignSpec.appliedKnowledge`. Uygulama katmanı `runLearningCycle` çağırmaz; approve düğmesi/CLI ile açılır.

## Bilinen kırmızılar (bu dilim dışı, dokunulmadı)

`FormaLocalEngine printReady proof` (PDF/X-4 metni), `formaBoxCert`, `structure.test` (`data-type="cut"/"perf"`), `phase9 P9-A` (tam suite altında 5 s timeout; tek başına yeşil), `src/shims/buffer-global.ts` tsc tipi.

## CHAT-3

Generate öncesi motor yönü konuşur (premium / editorial / palet). Kutu+etiket tek SVG değil: önce kutu, sonra “etiketi de üret” label şablonuna geçer. Catalog job’lar `deliverables` yazmaz.

## Freeze delinmesi — yapma

- Character / density / air → `visualLanguageFor` **anahtarı**
- Cue’yu ikinci quiet-line authority yapmak
- Overlay skip’i dile bağlamak
- GraphicLibrary; budget / lockup Y
- Painter’a yeni stroke / scale / frame yüzeyi
- `assetLanguage`’i zorunlu DesignPlan alanı yapmak
- LLM planner / LLM SVG
- Knowledge auto-update / RL / SVG fine-tune
