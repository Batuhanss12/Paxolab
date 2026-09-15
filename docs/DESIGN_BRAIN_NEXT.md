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
| **FAZ 5** Outcome + structured feedback parser (heuristic; LLM sınıflandırma kapalı) | Kapandı |
| Overlay skip’i dile bağlamak | Park — freeze delinmesi |
| Character/density dil anahtarı; cue ikinci quiet-line | Park |
| Painter stroke/scale/frame; GraphicLibrary; budget / lockup Y | Park |
| `assetLanguage` zorunlu DesignPlan alanı | Park |
| FAZ 6 Design Knowledge (scoped confidence / sample_count) | Park — otomatik kural yok |
| FAZ 7 Learning Engine + Learning Gate + knowledge versioning + A/B | Park |
| FAZ 8 Preference model | Park — veri birikince |
| FAZ 9 LLM fine-tune (extract / critique / classification) | Park — SVG için asla; RL yok |

## FAZ 4–5

Her `generate` bir karar kaydı yazar: path `kit` (25/29 catalog) veya `overlay` (playful aday skorları). Skor uydurulmaz; kit tek aday `scorecard` eksenleri, overlay mevcut `weightedTotal`. Outcome: regenerate / revision / export / rating. Feedback: `type / target / direction / strength` — `parseIntent` override’ları durur.

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
