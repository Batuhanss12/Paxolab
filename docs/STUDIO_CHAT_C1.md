# C1 — Sohbet yüzeyi + yapı teklifi

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C0 `docs/STUDIO_CHAT_AUDIT.md`  
**Sonraki:** C2 direktör intake (`docs/STUDIO_CHAT_C2.md`)

Kilitler durdu: LLM SVG çizmez, 29 katalog freeze, 18 stüdyo hash, Learning Gate, FOGRA yok. `hintsFromBrief` bu fazda değişmedi.

---

## 1. Amaç

Landing sektörü yüzey gibi sunmasın. Chip yalnız kutu/etiket olsun. Sohbet gerçek eksik alanı sorsun. Generate sessiz tuck basmasın — yapı adını söylesin; Dieline’de kartlar görünsün; “mailer / sleeve / tuck” yazılabilsin.

---

## 2. Yapılan

| Değişiklik | Kanıt |
|---|---|
| Landing chip: Kutu / Etiket / Kutu + Etiket / Henüz emin değilim. Kozmetik / Kahve / Elektronik kalktı | `src/components/Landing.tsx` `CHIPS` |
| `openingReply` ilk cevabı ezmez; yüzey cümlesini öne ekler | `src/App.tsx` `replies[0] = \`${open} ${result.replies[0]}\`` |
| Sektör sorusu ürün adı ister, kategori menüsü değil | `src/engine/conversationAsk.ts` |
| Generate yapı adını + alternatifleri söyler; `showTemplates: true` | `describeStructureOffer` + `generateResult` |
| Dieline’de picker tasarım varken açık; başlık “Kutu yapıları” | `Workspace.tsx`, `TemplatePicker.tsx` |
| Picker sektörle **gizlemez**; yapı başına bir kart (tuck + mailer + sleeve…) | `pickerTemplates` |
| `tuck / mailer / sleeve / A60 / tepsi` parse → `templateId` | `src/engine/catalog/structureOffer.ts` |
| `assignAwaiting('templateId')` yapı sözcüğünü yazar | `assignAwaiting.ts` |
| Şablon seçimi sektörü brief’e kopyalamaz | `App.tsx` `onPickTemplate` |
| Yüzey-only özet ham `box` basmaz | `briefSummary` → `kutu` / `etiket`; `isSurfaceOnlySummary` |

---

## 3. Test

```
npx vitest run src/engine/conversationFlow.test.ts src/engine/conversationUnderstand.test.ts src/engine/catalog/catalog.test.ts src/engine/catalog/structureOffer.test.ts
```

**Sonuç (C1 kapanış):** 4 dosya, 26 test, yeşil.

Örnek iddialar:

- `Kutu` → `packagingMode=box`, `awaiting=sector`, marka sorusu yok, `\bbox\b` yok
- `Luma parfüm kutusu 70x35x140` → generate, `showTemplates true`, cevapta `Yapı` / tuck
- `…, mailer` → `templateId` mailer
- `pickerTemplates` kozmetik kutusunda tuck + mailer + sleeve, ilk kart tuck
- `parseStructureUtterance('şablon seçildi')` → `null` (picker tıklaması yapı sanılmaz)

---

## 4. Tarayıcı (localhost:5173)

1. Landing: dört yüzey chip’i. “İstersen yalnız yüzeyi seç — sektör chip değil.” Kozmetik/Kahve/Elektronik yok.
2. **Kutu** → “Kutu yüzeyi. Ne ürünü paketliyoruz — parfüm, serum, kahve…” Marka sorusu yok. Ham `box` yok.
3. `parfüm` → marka sorusu. `Luma` → parfüm ölçü sorusu. `şablon` → generate.
4. Sohbet: “Yapı: düz tuck-end (Parfüm tuck-end). Alternatif: mailer / kargo, sleeve / kılıf.”
5. **Dieline** sekmesi: “Kutu yapıları” + Parfüm tuck-end, Sleeve, Mailer kargo, A60, RSC, tepsi… L/W/H + Motoru çalıştır.

---

## 5. Bilinçli sınır (C2’ye bırakılan)

- ASK_CRITICAL hâlâ 4 alan (yüzey → ürün → marka → ölçü). Renk / ruh / hikâye sorulmaz.
- `isCoreReady` sektörü yüzey sayabilir (C-K).
- `hintsFromBrief` sektör pinler (C3).
- Generate hâlâ ilk yapıyı önerir; C5 üç gerekçeli teklif.
- Öğrenme generate’e bağlı değil (C7).

---

## 6. Dosya listesi

- `src/components/Landing.tsx`
- `src/App.tsx`
- `src/components/Workspace.tsx`
- `src/components/TemplatePicker.tsx`
- `src/engine/conversation.ts`
- `src/engine/conversationAsk.ts`
- `src/engine/assignAwaiting.ts`
- `src/engine/extractFields.ts`
- `src/engine/fields.ts`
- `src/engine/catalog/catalog.ts` (`pickerTemplates`)
- `src/engine/catalog/structureOffer.ts` (yeni)
- testler: `conversationFlow`, `conversationUnderstand`, `catalog.test`, `structureOffer.test`
