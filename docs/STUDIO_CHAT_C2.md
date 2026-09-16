# C2 — Direktör intake

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C1 `docs/STUDIO_CHAT_C1.md`  
**Sonraki:** C3 brief-ağırlıklı yön (`hintsFromBrief` pin zayıflat)

Kilitler durdu: LLM SVG yok, freeze, Learning Gate, `hintsFromBrief` bu fazda değişmedi.

---

## 1. Amaç

Sohbet sihirbaz gauntlet’i büyütmeden stüdyo direktörü gibi çalışsın:

- Ürün cümlesi sektörü doldurur (C1’de vardı; durdu).
- Renk / ruh / hikâye **isteğe bağlı tek soru** — üç ayrı alan değil.
- Marka + ürün + ölçü + (renk veya ruh) **tek paragrafta generate**.
- “örnek” paleti üründen kurar.

---

## 2. Yapılan

| Değişiklik | Kanıt |
|---|---|
| `hasDirectionSignal` — colors / styleType / directorCue / story / copyOverrides | `src/engine/fields.ts` |
| Ölçüden sonra, sinyal yoksa `awaiting=colors` (ASK_CRITICAL’e eklenmedi) | `nextMissing` |
| Tek soru: renk, duruş veya hikâye; “örnek” kaçış | `conversationAsk.ts` |
| Skip → `directionDefaulted`; MAX_ASK sonrası sistem default | `assignAwaiting`, `conversationState.canDefault` |
| `hikâye:` etiketi `brief.story` | `extractFields.ts` |
| `70x35x140` ürün adı olamaz (`x` harf sayılıyordu) | `isMeasureToken` → `looksLikeName` |

ASK_CRITICAL hâlâ 4 alan. Yön sorusu **zorunlu blocker değil**; yokluğu generate’i bir tur geciktirir, iki kez yanıtsız kalırsa default.

---

## 3. Test

```
npx vitest run src/engine/conversationFlow.test.ts src/engine/conversationUnderstand.test.ts src/engine/conversationState.test.ts
```

**Sonuç:** 3 dosya, 27 test, yeşil.

| Senaryo | Beklenen |
|---|---|
| `Luma parfüm kutusu 70x35x140` | `awaiting=colors`, generate yok, ack’te ölçü yok |
| aynı + `örnek` | generate, `directionDefaulted` |
| `… siyah altın editorial` | tek tur generate, colors + `styleType=modern` |
| LUMA paragrafı (bej/yeşil var) | hâlâ yalnız ölçü sorar, sonra generate (C1) |

---

## 4. Tarayıcı (localhost:5173)

1. `Luma parfüm kutusu 70x35x140` → “Renk, duruş veya hikâye — bir cümle yeter… ‘örnek’ yaz.”
2. `siyah altın editorial` → “çağdaş, editorial ve sakin, Siyah · Altın paleti… Yapı: düz tuck-end…”
3. Yeni oturum, tek paragraf `Luma parfüm kutusu 70x35x140 siyah altın editorial` → yön sorusu yok, doğrudan generate. Lockup LUMA / EAU DE PARFUM (ölçü SKU değil).

---

## 5. Bilinçli sınır (C3’e)

Yön **toplanıyor**; yüzey hâlâ sektör pin’iyle boyanıyor (`hintsFromBrief`: parfüm → dark-landscape). Siyah-altın editorial brief aynı DNA’ya düşebilir. C3 sektör prior’u 0.15–0.25’e çeker; renk+ruh arketip seçer. 18 stüdyo hash yalnız bilinçli güncellenir.

---

## 6. Dosya listesi

- `src/types.ts` (`directionDefaulted`)
- `src/engine/fields.ts`
- `src/engine/conversationAsk.ts`
- `src/engine/conversationState.ts`
- `src/engine/assignAwaiting.ts`
- `src/engine/extract.ts`
- `src/engine/extractFields.ts`
- `src/engine/extractHelpers.ts` (`isMeasureToken`)
- `src/engine/conversationFlow.test.ts`
