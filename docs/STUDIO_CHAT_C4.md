# C4 — Copy brief’ten (copyBank fallback)

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C3 `docs/STUDIO_CHAT_C3.md`  
**Sonraki:** C5 yapı zekâsı (bu fazda yok)

Kilitler durdu: LLM SVG yok, 29 kit freeze, 18 stüdyo yüz hash **güncellenmedi**, kit painter/copyBank sözlüğü yeniden yazılmadı.

---

## 1. Before

C4 öncesi tagline seçimi `resolveDirection` içinde tek satırdı:

```ts
const spokenTag = (hints.taglineLine || input.copy.tagline || '').trim()
const tagline = (isGenericTagline(spokenTag, brief.brandName) ? '' : spokenTag) || bank.tagline
```

Kaynak ayrımı yoktu (`user` / `brief` / `bank` tek `taglineLine`’a çöküyordu).

Extraction yalnız etiketliydi:

```ts
const slogan = labeled(raw, ['slogan', 'tagline', 'metin'])
if (slogan) patch.copyOverrides = slogan
```

`slogan:` yazılmayan cümle (`Geceye özel koyu kavrum.`) `copyOverrides` olmuyordu. `sampleCopy` o zaman kit/sektör satırına düşüyordu; generic süzgeç (`isGenericTagline` / `GENERIC_SAMPLE_TAGLINE`) kit sızıntısını (`Masada duran lezzet`) bank’a çeviriyordu. Sonuç: kullanıcı sloganı yokken `SAVOR THE DISTINCTION` — doğru fallback. Kullanıcı sloganı varken çoğu zaman **hiç extract edilmiyordu**.

Marble yüz `chips[1] ?? taglineLine` boyar. Bank kahve chip’i `SAVOR THE DISTINCTION`. Yani `taglineLine` kullanıcı olsa bile lockup hâlâ bank chip’ini gösterebiliyordu.

Hikâye: `brief.story` varsa arka yüz `paragraph(d.story)` — REAL; etiketsiz hikâye cümlesi extract edilmiyordu.

| Bağlantı | C4 öncesi | Durum |
|---|---|---|
| USER → UNDERSTANDING | `extractFields` / `assignAwaiting` | PARTIAL (yalnız `slogan:` / C2 `hikâye:`) |
| UNDERSTANDING → STUDIO BRIEF | `copyOverrides`, `story` | REAL (alanlar vardı) |
| BRIEF → COPY | `sampleCopy` + `mergeLlmCopy` + generic süzgeç + `copyBankFor` | PARTIAL (user satırı extract edilmezse bank) |
| COPY → COMPOSE | `resolveDirection.taglineLine` | REAL metadata; marble lockup chip’e bakıyordu |
| COMPOSE → SVG | `composeStudioArtwork` → `marbleFront` / `paintBoxBack` | REAL painter; user satırı chip yüzünden gizlenebiliyordu |

`copyBank` authoritative fallback’dı, user satırına göre değil.

---

## 2. Change

Yeni copy motoru yok. Mevcut `copyOverrides` / `story` / `isGenericTagline` / `copyBankFor` kullanıldı.

| Sembol | Dosya | Ne |
|---|---|---|
| `extractSpokenCopy` / `isSpokenTagline` / `isSpokenStory` | `src/engine/extractCopy.ts` | Etiket + cümle ipucu (`kavrum`, `doğal içerik`, `doğdu`…) |
| `extractFields` | `src/engine/extractFields.ts` | Slogan extract’i `extractSpokenCopy`’ye verdi |
| `assignAwaiting(colors/styleType)` | `src/engine/assignAwaiting.ts` | Yön cevabı slogan/hikâyeyse palete yazılmaz |
| `CopySource` | `src/engine/studio/types.ts` | `'user' \| 'brief' \| 'bank'` |
| `resolveStudioCopy` | `src/engine/studio/direction.ts` | user → brief → bank |
| `resolveDirection` | aynı | `taglineLine` + `copySource`; user ise `chips[1] = user tagline` |

Öncelik (kod):

```text
if copyOverrides ve generic değil → user
else if spokenTag generic değil ve bank’tan farklı → brief
else → bank
```

Painter / SVG / `copyBank` tablosu / sektör prior / kit freeze **dokunulmadı**. Marble lockup hâlâ `chips[1]`; C4 user iken o chip’i kullanıcı satırı yapar.

---

## 3. Runtime Path

```text
USER utterance
  → extractFields / assignAwaiting
      extractSpokenCopy → brief.copyOverrides | brief.story
  → FormaLocalEngine.generate
      sampleCopy + mergeLlmCopy (userTagline = copyOverrides)
      resolveDirection
          copyBankFor → bank.tagline
          resolveStudioCopy → { tagline, copySource }
          copySource=user → chips[1] = tagline
      composeStudioArtwork
          marbleFront: stackedLockup(..., chips[1] ?? taglineLine)
          paintBoxBack: paragraph(..., d.story)
      SVG text (toLocaleUpperCase('tr'))
```

Kanıtlı örnek — `"Geceye özel koyu kavrum."`:

1. `isSpokenTagline` true → `copyOverrides`
2. `resolveStudioCopy` → `copySource: 'user'`, tagline kullanıcı satırı
3. `taglineLine` ve `copy.tagline` aynı satır
4. Front lockup SVG: `GECEYE ÖZEL KOYU KAVRUM` — `SAVOR THE DISTINCTION` yok

Boş copy: `copySource: 'bank'`, `SAVOR THE DISTINCTION` (C3 ile aynı).

---

## 4. Evidence

| İddia | File | Symbol | Test | Result |
|---|---|---|---|---|
| User satırı extract | `extractCopy.ts` | `isSpokenTagline` / `extractSpokenCopy` | `copyBrief.test.ts` TEST 1 | PASS |
| User > bank | `direction.ts` | `resolveStudioCopy` | TEST 1, TEST 6 | PASS |
| Claim compose+SVG | `FormaLocalEngine` → `composeStudioArtwork` → `marbleFront` | lockup `chips[1]` | TEST 2 | PASS |
| Bank fallback | `copyBankFor('beverage')` | `tagline` | TEST 3, negative | PASS |
| A≠B painted | `boxLayouts.marbleFront` | SVG text | TEST 4 | PASS |
| Story consumed | `boxLayouts.paintBoxBack` | `paragraph(d.story)` | TEST 5 | PASS (story; tagline değil) |
| Generic ezmez | `isGenericTagline` + user öncelik | `resolveStudioCopy` | TEST 6 | PASS |
| LUMA çalınmaz | `extractCopy.ts` | `BRIEF_NOISE` / `AVOID_TALK` | LUMA case | PASS |
| 18 hash | `studioGolden.test.ts` | `STUDIO_FACE_GOLDEN` | 18/18 | PASS |
| 29 fingerprint | `designBrainV1.test.ts` | `F/G` + `F: 29 kit generate` | 29/29 | PASS |

---

## 5. Proof Results

| Test | Sonuç | Not |
|---|---|---|
| TEST 1 User copy wins | **PASS** | Extract + `copySource=user` + compose SVG `GECEYE ÖZEL KOYU KAVRUM`; bank yok |
| TEST 2 Claim reaches output | **PASS** | `extractFields` → generate → lockup `DOĞAL İÇERİK` / `GÜNLÜK KULLANIM` |
| TEST 3 CopyBank fallback | **PASS** | `copySource=bank`, `SAVOR THE DISTINCTION` markup’ta |
| TEST 4 A vs B | **PASS** | `taglineLine` ve markup farklı; yalnız metadata değil |
| TEST 5 Story / hikâye | **PASS** | Extract → `direction.story` → back `data-art="paragraph"` (`partiler`, `kavrulan`). Tagline olmaz — bank kalır (kasıtlı; sahte slogan yok) |
| TEST 6 Generic override | **PASS** | `selectedCopy !== PREMIUM COFFEE`; `===` user satırı; markup’ta user, `SAVOR` yok |
| Negative control | **PASS** | Aynı brief/seed, boş copy → aynı bank tagline |
| LUMA intake | **PASS** | Slogan/hikâye çalınmaz |

`ELECTRONICS` / `EAU DE PARFUM` / `COFFEE` `isGenericTagline` listesinde değil — bunlar `categoryLine` / chip. User tagline onları **ezmez**; kategori satırı bank’ta kalır (bilinçli sınır).

---

## 6. Regression

C4 kodundan önce (önceki oturum): 7 dosya / 77 test yeşil (`designBrainV1`, `studioGolden`, `studioDirection`, conversation C1–C3, `studioContract`, `phase32`). **BASELINE FAILURE yok.**

C4 sonrası (bu oturum):

```
npx vitest run src/engine/studio/copyBrief.test.ts src/engine/studio/studioDirection.test.ts src/engine/studio/studioGolden.test.ts src/engine/llm/studioContract.test.ts src/engine/conversationFlow.test.ts src/engine/conversationUnderstand.test.ts src/engine/catalog/catalog.test.ts src/engine/catalog/structureOffer.test.ts src/engine/brain/designBrainV1.test.ts src/engine/artwork/phase32.test.ts src/engine/conversationState.test.ts
→ 11 files, 99 passed
```

```
npx vitest run src/engine/brain/designBrainV1.test.ts src/engine/artwork/phase32.test.ts src/engine/artwork/assetLanguage.test.ts src/engine/artwork/phase30.test.ts src/engine/studio/studioGolden.test.ts
→ 5 files, 46 passed
```

| Kilit | BEFORE | AFTER |
|---|---|---|
| 29/29 set-0 fingerprints | PASS | PASS (`F/G: 29 catalog fingerprints stay frozen`) |
| 29 kit generate exportOK / overlay / lockup Y | PASS | PASS (`F: 29 kit generate…`) |
| 25 kit-grade / 4 playful-overlay | PASS | PASS (`phase32`: kit-grade skip overlay; playful `false`) |
| vintage-badge | PASS | PASS (`assetLanguage`, `phase30`) |
| languageTreatment | PASS | PASS (`designBrainV1` treatment knobs) |
| 18 studio face hash | PASS (değişmedi) | PASS 18/18, deterministic repeat |
| Deterministic painter | PASS | PASS (aynı job → aynı hash) |
| Preflight / exportOK | PASS | PASS (kit F; studio `needsRepair` false duruyor) |
| C0–C3 conversation / catalog / direction | PASS | PASS |
| S8 generic LLM → SAVOR | PASS | PASS (`studioContract`) |

Kit `studio:false` yolu `copySource` görmez. Studio golden job’larda user copy yok → chip/tagline bank → hash aynı.

---

## 7. Remaining Gaps

C4 kapsamında çözülmedi (C5+ değil; copy sınırları):

1. **Kategori / chip anatomisi hâlâ bank.** `categoryLine` kahvede `KAHVE`/`COFFEE`; `chips[0]` `HIGH-QUALITY COFFEE`. C4 yalnız tagline + marble `chips[1]`.
2. **`isGenericTagline` COFFEE / EAU DE PARFUM / ELECTRONICS saymaz** — bunlar kategori. Filtreyi şişirmedik.
3. **Cue’suz slogan extract edilmez.** `"Zamanın ötesinde bir yudum."` ipucu yoksa `copyOverrides` boş kalır. Sahte genel extractor eklenmedi.
4. **`copySource=brief` marble chip’ini değiştirmez.** LLM/sample satırı `taglineLine`’a yazar; lockup user değilse bank `chips[1]`. S8 hâlâ `taglineLine` üzerinden kanıtlı.
5. **Hikâye tagline olmaz.** Arka paragraf olarak tüketilir (TEST 5). Slogan+hikâye ayrı cümle ister.
6. **Manifesto / benefit satırları** copyBank. C4 iddiası değil.

---

## 8. Exit Status

```text
C4 CLOSED
```

Kanıt: user copy bank’tan önce; claim compose+SVG’ye iner; bank yalnız fallback; generic user’ı ezmez; hikâye gerçekten boyanır; fallback + C0–C3 + 29/29 + 25/4 + 18 hash + deterministic painter + preflight yeşil.
