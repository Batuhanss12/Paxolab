# Grapxor — Sohbet Stüdyosu Auditi ve Yol Haritası

**Tarih:** 16 Eyl 2026  
**Ürün:** Grapxor / Paxolab  
**Durum:** C0–C8 kapandı. Design Intelligence Reality Audit: `docs/PAXOLAB_DESIGN_INTELLIGENCE_STATUS.md` (FRAGMENTED snapshot). D0/D1 logo+ölçek: `docs/STUDIO_D1.md`. D2 critic→C6: `docs/STUDIO_D2.md`.  
**Önceki program:** S0–S9 kapandı (`docs/STUDIO_STAGE_AUDIT.md`). Bu belge *sohbet → brief → yön → yapı → öğrenme* dilimidir.

Kilit (değişmez): **LLM SVG çizmez. Packfy / SAM / YOLO / raster-to-SVG / image-gen yok. 29 katalog freeze durur. 18 stüdyo yüz hash bilinçli güncellenmedikçe durur. Learning Gate global’i otomatik açmaz. FOGRA/CMYK yok.**

---

## 0. İstek (teknik çeviri)

Kullanıcı cümlesi: klişe şablon değil; her sektör/üründe brief’e göre farklı yüzey; chat sihirbaz değil, grafik stüdyo direktörü + yapı mühendisi + proje yöneticisi; zamanla kendini geliştirsin.

Kodda bu şu anlama gelir:

| Kullanıcı dili | Motor gerçeği |
|---|---|
| “Sabit tasarım üretmesin” | `hintsFromBrief` sektör ismine arketip **pinler** (kahve=mermer, parfüm=manzara, elektronik=diyagonal). Brief renk/ruh/hikâye bunu zor kırar. |
| “Aynı mimari, farklı ürün” | Painter kapalı sözlükte kalır (DNA + ledger). Değişen **skor ve brief ağırlığıdır**, ikinci motor değil. |
| “Chat profesyonel çalışsın” | `ASK_CRITICAL` 4 alan + `openingReply` ilk cevabı ezer. Soru sırası sihirbaz. |
| “Kutu tipi seçilmiyor” | `templateId` `nextMissing`’te var; `runConversation` onu atlar; `pickTemplate` sessiz ilk eşleşmeyi basar; `showTemplates` her zaman `false`. |
| “Landing’de sektör olmasın” | Chip’ler `Kozmetik / Kahve / Elektronik kutusu` gönderir; sektör yüzeymiş gibi durur. |
| “Zamanla gelişsin” | Learning Gate + panel var; generate döngü çalıştırmaz. Gözlem birikir, kural açılmaz. |

Hedef mimari (tek painter, tek sohbet):

```
Utterance
  → Understanding (ürün, yüzey, marka, renk, ruh, yapı ipucu, yasal örnek)
  → Studio brief (eksik = tasarımcı sorusu, öneri + onay)
  → Structure offer (tuck / mailer / sleeve / tepsi / wrap…)  ← kullanıcı görür
  → Direction (brief ağırlıklı skor; sektör prior, kilit değil)
  → composeStudioArtwork
  → Ledger preflight
  → Karar kaydı + (isteğe bağlı) observation
  → İnsan: iterasyon / yapı değiştir / öğrenme onayı
```

---

## 1. Bugünkü olgunluk

S9 sonrası üretim dürüst. Sohbet ve yön hâlâ **sektör şablonuna** yakın.

| Eksen | /5 | Kanıt |
|---|---:|---|
| Sohbet (direktör, sihirbaz değil) | **3.0** | C6: why / veto / vary mevcut yön state’ine bağlı; intake C2 |
| Brief kapsamı | **2.5** | C2+ ürün/barkod; ölçü picker’da; yön veto listesi brief’te |
| Yapı / dieline seçimi | **3.5** | C5 ranking + offer; picker ölçü sonra başlat |
| Yön (brief → arketip) | **3.5** | C3 skor + C6 veto pin-skip; why grounded |
| Copy anatomisi | **3.5** | C4: user/brief/bank; slogan lockup’a iner; kategori/chip hâlâ bank |
| Öğrenme | **3.5** | C7: observe sonrası user/brand auto eşik; global insan; empty = baseline |
| LLM orkestrasyon | **3.5** | C8: allowlist extract + kapalı direction; SVG/geometry drop; fail-open |
| Freeze / determinizm | **4.5** | 29 kit + 18 stüdyo hash |
| Üretim dürüstlüğü | **3.5** | S9: exportOk, 3 mm, PDF/X-4 sRGB iddiası, font subset notu |

**Stüdyo sohbet olgunluğu: ~3.1 / 5.** C6 why/veto/vary yön state’ine iniyor. C7 öğrenme halkası kapalı.

---

## 2. Kanıt — kullanıcı şikayetleri

### 2.1 Landing sektörü yüzey sanıyor

`src/components/Landing.tsx` chip’leri:

- Yüzey: Kutu, Etiket, Kutu + Etiket
- Sektör kılığı: Kozmetik, Kahve, Elektronik (`text: 'Kozmetik kutusu'` …)
- Metin: “İstersen bir yüzey seç”

`conversationFlow.test.ts` bunu dondurur: `'Kozmetik kutusu'` → `sector: kozmetik`, `awaiting: brandName`.

### 2.2 “Kutu” deyince yalnızca marka soruluyor (cevap-alan uyumsuzluğu)

`nextMissing` sırası: `packagingMode → sector → brandName → dimensionsMm` (`conversationAsk.ts`).

Chip **Kutu** yalnız `packagingMode=box` doldurur. Motor aslında **sektör** sorar.

`App.tsx` ilk turda, marka boşsa, gerçek soruyu `openingReply` ile ezer:

```
if (first && !result.brief.brandName) {
  replies[0] = openingReply(user.content)  // "Kutu. Markanın adı nedir?"
}
```

`awaiting` hâlâ `sector`. Kullanıcı marka yazar; `assignAwaiting(..., 'sector')` markayı sektör sanmazsa alan boş kalır, soru tekrar eder veya kayar. Sihirbaz hissi buradan.

`openingReply('Kozmetik kutusu')` → “Kozmetik — ambalajın en net yüzeyi. Markanın adı nedir?”

### 2.3 Şablon katalog var, sohbet kullanmıyor

Katalog: **30 aktif** şablon, **15 structureId** (10’u tuck-end), 26 kutu / 4 etiket.

`TemplatePicker` “Bu sektörün kutuları” der, `filterTemplates` sektörle süzgeçler.

`runConversation`:

- `showTemplates` her dönüşte `false`
- `missing === 'templateId'` generate’e düşer
- `generateResult` → `pickTemplate` → sektör havuzunun **ilk kartı**

`Workspace.tsx`: picker yalnız `{!generating && !design && showTemplates}`. Generate olduktan sonra yapı kartı görünmez.

`assignAwaiting`: `templateId` için `{}` — “tuck / mailer / sleeve” bekleyen alana yazılmaz.

`extractFields`: kutu tipi sözcüğü yok.

### 2.4 Ölçü alınıyor, yapı alınmıyor

`ASK_CRITICAL` ölçü sorar, yapı sormaz. “şablon” = `dimsDefaulted`, sonra sessiz tuck (parfüm/krem/serum hepsi `tuck-end-box` varsayılanı).

Mailer, sleeve, snap-lock, A60, RSC, pillow, rigid-gift sohbette **önerilmez**.

### 2.5 Sektör = klişe yüz

`hintsFromBrief` (`direction.ts`): kahve→marble-frame, bal→landscape, serum/bebek→line-scene, temizlik→wave, krem→botanical, parfüm→dark-landscape, elektronik→diagonal-tech.

`scoreArchetype`: `sectorFit * 0.5` — sektör yarı ağırlık. `productFamilyFit` aynı pin’i pekiştirir.

Kullanıcı “elektronik kutu ama mermer ve altın” dese bile `if (/mermer/)` yalnız `background` yazar; arketip elektronik pininde kalabilir.

`copyBank` parfüme “EAU DE PARFUM / DOĞA GÜCÜ ATEŞLER” basar. Gıda/elektronik aynı bankanın kendi klişesi.

Bu **yanlış değil referans DNA** (TASARIM REF). Yanlış olan: brief (renk, hikâye, rakip, kanal) DNA’yı **seçemez**; sektör seçer.

### 2.6 Brief yarım, generate yine çalışır

`isCoreReady`: marka + (yüzey **veya** sektör). Ürün hattı, renk, ruh, yapı, ölçü zorunlu değil.

`FormaLocalEngine`: boş `styleType` → `luxury`; boş ölçü → şablon `defaultsMm`; boş barkod/üretici → örnek.

İlk yüz “tamam” görünür; stüdyo kararı eksik brief’ten gelir.

### 2.7 Öğrenme halkası (C7)

`observeFeedback` / `observeOutcome` sonrası `runLearningCycle({ approve: 'automated' })`. User/brand eşikte açılır; global validated kalır. Empty store golden/kit baseline. S7 panel hâlâ human global onayı.

### 2.8 LLM brief + yön (C8)

`extractBriefWithLlm` allowlist; `templateId` / ölçü / SVG düşer. `studioDirectionWithLlm` kapalı enum. Endpoint yok veya hata → heuristic generate. Yapı hâlâ C5.

---

## 3. Tespit edilen ek boşluklar (kullanıcı söylemedi)

| ID | Gap | Neden önemli |
|---|---|---|
| C-A | `createPlan` stüdyoda hâlâ hesaplanır, yüzeyi boyamaz | Critic/skor kit dilinde; C6 why stüdyo direction claim’leriyle cevaplar |
| C-B | `StyleBar` lüks/modern/eco kostüm; stüdyo temperament yok | U1 park — iterasyon “6 yeni tasarım” top-3 kardeş havuzu |
| C-C | `variationIndex % pool.slice(0,3)` | “Başka yön” çoğunlukla aynı ailenin kardeşi |
| C-D | Referans görsel (logo dışında) painter’a inmez | Attachment `referans` kaydı; palet/DNA çıkarılmaz (CV yasak — sadece brief ipucu) |
| C-E | Çift teslimat: kutu sonra “etiketi de üret” | Aile kilitli (S4 doğru); chat ikinci yüzeyi proaktif planlamaz |
| C-F | Girdiler paneli salt okunur | Düzeltme sohbet + StyleBar ölçü; brief edit yok |
| C-G | Karşılaştır tab stüdyo arketip farkını yazmaz | U2 |
| C-H | Flap/top sade zemin | D4 — yapı değişince yüz daha boş kalır |
| C-I | Font metrics `FACE_EM` tahmin | V5 — uzun marka taşar |
| C-J | QR/GS1 örnek | S9 dürüst; üretim iddiası yok (doğru) |
| C-K | `isCoreReady` sektörü yüzey sayabilir | `packagingMode \|\| sector` — “kahve” ile yüzey boş generate’e yaklaşır |

---

## 4. Yapılmayacaklar

- LLM’e path / SVG / “şunu çiz”
- Kit painter’ı silmek veya stüdyoyu katalog job’a zorlamak
- Knowledge → geometri
- Global kural otomatik
- RL / SVG fine-tune
- Sektör sayısı kadar yeni arketip (yalnız referans + layout)
- Landing’e 15 kutu tipini wizard kartı olarak dizmek (sohbet önerir, Dieline seçer)

---

## 5. Faz sırası (C0–C8)

Bir faz kapanmadan sonrakine atlama. Her faz: kod + test + `docs/STUDIO_CHAT_Cn.md` kanıt.

| Faz | İçerik | Çıkış kapısı | Risk | Durum |
|---|---|---|---|---|
| **C0** | Bu audit | Belge + canvas + kilitler | — | **Kapandı** 16 Eyl |
| **C1** | Sohbet yüzeyi + yapı teklifi | Chip yalnız kutu/etiket; `openingReply` ezmez; yapı adı sohbette; picker Dieline’de; `tuck/mailer/sleeve` parse | Düşük | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C1.md` |
| **C2** | Direktör intake | Ürün cümlesi sektörü doldurur; renk/ruh/hikâye isteğe bağlı ama sorulur; tek paragrafta generate | Orta | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C2.md` |
| **C3** | Brief-ağırlıklı yön | `hintsFromBrief` pin zayıflar; renk+ruh+hikâye arketip seçer; sektör prior; 18 hash yalnız bilinçli | Yüksek | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C3.md` (hash değişmedi) |
| **C4** | Copy brief’ten | Bank fallback; kullanıcı satırı/hikâye/claim kazanır | Orta | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C4.md` |
| **C5** | Yapı zekâsı | Ürün fiziği → 3 yapı + gerekçe (parfüm tuck, atıştırmalık tepsi, kargo mailer) | Orta | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C5.md` |
| **C6** | Stüdyo konuşması | “Neden bu yön”; veto; vary tam havuz; critic TR | Orta | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C6.md` |
| **C7** | Öğrenme halkası | Generate sonrası observation; user/brand auto eşik; global insan; boş = baseline | Orta | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C7.md` |
| **C8** | LLM brief+yön | Extract’e yapı/renk/hikâye; fail-open; SVG yok | Düşük | **Kapandı** 16 Eyl — `docs/STUDIO_CHAT_C8.md` |

Park: yeni DNA (referans klasörü olmadan), FOGRA, A/B, RL, foto plaka.

---

## 6. C1 ayrıntısı (hemen sonraki dilim)

**Amaç:** Kullanıcı yüzey seçince sektör chip’i görmesin; sohbet gerçek eksik alanı sorsun; kutu tipi görünsün ve yazılabilsin.

Yapılacak:

1. Landing chip: Kutu / Etiket / Kutu + Etiket / Henüz emin değilim. Kozmetik/Kahve/Elektronik kalkar (yazılı “kahve kutusu” hâlâ extract edilir).
2. `App.tsx`: `openingReply` `replies[0]`’ı ezmez. İlk cevap = `askCopy(nextMissing)`.
3. Sektör sorusu: “Kozmetik mi gıda mı?” değil — “Ne ürünü paketliyoruz — parfüm, serum, kahve, kulaklık?”
4. `generateResult`: seçilen şablonun **yapı adını** söyler; alternatifleri bir cümlede; `showTemplates: true`.
5. Dieline sekmesi: `TemplatePicker` tasarım varken de açık. Başlık “Bu sektörün kutuları” → “Kutu / etiket yapıları”.
6. `parseStructureUtterance`: tuck, ters tuck, mailer, sleeve, tepsi, wrap, A60, koli.
7. `assignAwaiting('templateId')` + serbest metin: yapı sözcüğü `templateId` yazar, generate yenilenir.

**Test:** `conversationFlow` / `conversationUnderstand` yeşil; yeni: chip Kutu sektör basmaz; generate cevabında `tuck` veya `mailer`; `showTemplates === true`.

**Dokunma:** `hintsFromBrief`, golden hash, kit freeze, LearningEngine.

---

## 7. C3 notu (kilit tasarım kararı)

“Parfüm yüzü serumda da kullanılabilsin” = **sektör pin’ini kaldırmak**, DNA’yı silmek değil.

Önerilen skor (C3’te, testle):

- sektör prior 0.15–0.25 (bugün 0.5)
- style + temperament + palette 0.35
- brief renk/kelime (`mermer`, `klinik`, `altın`, `editorial`) pin veya boost
- `studioFamily` kullanıcı/LLM/öğrenme ile kilitlenirse last-merge (S4 durur)

18 yüz hash **bilinçli** güncellenir; 29 kit job `studio:false` kalır.

---

## 8. Kanıt dosyaları

| Faz | Rapor |
|---|---|
| C0 | bu belge + canvas |
| C1…C8 | `docs/STUDIO_CHAT_Cn.md` — diff özeti, test komutu, tarayıcı notu |

C6 notu: why/veto/vary `decideDirection` + `avoidStudioFamilies` üzerinden; C5 yapı katmanı ayrı durur.

C7 notu: mevcut Learning Gate sohbet feedback’ine bağlandı. Yeni motor yok.

C8 notu: LLM yalnız structured brief/yön. Painter, C5, C6, C7 deterministic. Reality Audit başlamadı.

Durum tablosu §5 her kapanışta güncellenir.
