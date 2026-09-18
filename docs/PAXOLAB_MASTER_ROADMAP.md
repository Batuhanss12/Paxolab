# PAXOLAB — MASTER ROADMAP (tek gerçek kaynak)

**Açılış:** 2026-09-17 · **Hedef:** tüm eksikler kapanana kadar sıralı ilerleme
**Kural:** Bu dosya tek SoT'dir. Diğer audit/roadmap dosyaları *tarihsel kanıt*tır; çelişki halinde bu dosya geçerlidir.
**Yöntem:** Her faz kod + test + bu dosyada durum güncellemesi ile kapanır. Bir faz kapanmadan sonrakine atlanmaz.
**Dürüstlük kuralı:** Bir faz ancak doğrulama komutu yeşil döndükten *sonra* `[x]` işaretlenir. İlerleme kaydına yalnızca gerçekten çalıştırılmış doğrulama yazılır.

---

## 0. Başlangıç skoru (gerçekçi, doğrulanmış — 2026-09-17)

Eski `FORMA_DESIGN_ROADMAP.md` "%98" iddiası yalnızca *painter craft*'ı ölçüyordu ve karar mimarisini kapsamıyordu — bu roadmap onun yerine geçer.

| Eksen | Başlangıç /100 | Güncel /100 | Kanıt |
|---|---:|---:|---|
| Build / tip sağlığı | 40 | **100** | `npx tsc -b` → 0 hata · `npm run build` ✓ (R0) |
| Design Brain karar zinciri | 55 | **75** | intent+principles bağlı; ölü mimari temiz (R2); craft skoru generate + critic'te (R3) |
| Visual Language | 70 | **90** | VL-1/2/4/5b canlı; VL-3 kararla reddedildi, sözleşme testli (R6) |
| Asset Language | 45 | **80** | preferred/allowed/forbidden AL'de; rol ekseni winner'ı çevirebiliyor (R7) |
| Studio DNA (canlı yüz) | 70 | **88** | brief yönü sürüyor (R4); golden ledger bulgusu 8→1 (R9) |
| Studio critic / repair | 40 | **75** | ledger + craft ekseni (R3) + tek turlu repair (R5); kazanan seçimi hâlâ kullanıcıda (tasarım gereği) |
| LLM orkestrasyon | 65 | 65 | kapı + sanitize + fail-open; endpoint yoksa tamamen heuristik |
| Öğrenme halkası | 55 | 55 | gate + UI var; generate döngüyü çağırmıyor |
| Sohbet / brief | 70 | 70 | C0–C8 kapalı |
| Üretim dürüstlüğü | 75 | 75 | S9; FOGRA/CMYK bilinçli yok |
| Kit ↔ Studio ayrımı | 45 | **85** | gölge plan ölçüldü (%1.3), UI sızıntısı yok, critic kanalı ayrı (R3/R8) |
| Panel / SaaS | 60 | **90** | Faz 0–4 kapalı (R11–R13); kalan: iyzico prod anahtar + token'lı callback |
| Test / CI | 60 | **95** | **537/537 + 71/71, 0 lint hatası, CI kuruldu**; kalan: tarayıcı E2E otomasyonu |
| **GENEL** | **~58** | **~86** | — |

---

## 1. Faz sırası

> Bağımlılık sırası. `[ ]` açık · `[~]` devam ediyor · `[x]` kapandı (doğrulandı).

### `[x]` R0 — Build yeşil (tip hijyeni) · P0-7 · **kapandı 2026-09-17**

| Dosya | Sorun | Uygulanan çözüm |
|---|---|---|
| `src/engine/brain/DesignCritic.ts` | TS1355 — `as const` ternary üzerinde (3 yer) | `feedbackStrength(severity)` yardımcısı, dönüş tipi `StructuredFeedback['strength']` |
| `src/engine/studio/directionTalk.ts` | `pinFamily` = `false \| StudioFamily \| undefined` | `namedOnly ? undefined : named.find(...)` |
| `src/engine/studio/layoutContext.ts` | `withIdent<T>` literal'i `string`'e genişletiyordu → `markKind` hatası | `<const T extends object>` (20 çağrı yeri literal tipini korur) |
| `src/engine/assignAwaiting.ts` | `awaiting === 'colors'` — üst blokta zaten `return` edildiği için ulaşılamaz dal | Ölü dal kaldırıldı (davranış aynı) |
| `src/engine/catalog/structureRecommend.ts` | `mode === 'label'` — tip `"box"`'a daralmış, ulaşılamaz dal | Ölü ternary kaldırıldı |
| `src/components/ComparePreview.tsx` | `DesignSpec` tip importu eksik | `import type { DesignSpec } from '../types'` |
| `src/engine/llm/studioChatC8.test.ts` | fixture `ReturnType<typeof coffee>` literal tipi gerçek `DesignBrief`'i reddediyordu | Helper'lar `DesignBrief` ile tiplendi |
| `src/appState.test.ts` | eksik alanlı fixture cast'i | `as unknown as` |
| `src/engine/studio/studioHonesty.test.ts` | `HeroFamily` vs `'marble-frame'` karşılaştırması | **Audit'in önerisi reddedildi** — aşağıya bakın |

**Motor sözleşme kararı (audit düzeltmesi):** `PAXOLAB_PANEL_AUDIT` P0-7, `HeroFamily` union'ının "runtime'ın gerisinde kaldığını" ve genişletilmesi gerektiğini söylüyordu. **Bu yanlış.** `'marble-frame'` bir **stüdyo arketipi** (`studio/types.ts`), kit `HeroFamily`'si değil (`brain/DesignPlan.ts:19`) — iki ayrı string uzayı. Union'ı genişletmek kit painter'ın çizemeyeceği id'leri tipe sokardı. Test, kit hero'sunu stüdyo arketip adıyla karşılaştıran savunma amaçlı bir kontroldü; `hero` metin olarak ele alındı, runtime davranışı birebir korundu.

**Doğrulama (çalıştırıldı):** `npx tsc -b` → 0 hata · `npm run build` → ✓ 564 ms · `npx vitest run` → **502 passed / 2 failed (504)**. İki kırmızı, temiz HEAD worktree'sinde de kırmızı → **önceden var olan baseline**, bu dilimden bağımsız (`structureRecommend.test.ts` `/Yapı:/`, `phase15` `/hex/i`).

### `[x]` R1 — Doküman gerçeği · **kapandı 2026-09-17**
- VL-1/VL-2/VL-4'ün fiilen uygulandığı VL audit'lerine not düşülür (kod doğrulandı: `plan.visualLanguage`, `visualLanguageFor`, dil-farkındalı `allowedHeroes`)
- `DESIGN_BRAIN_V1_AUDIT` gap-2 (`void principlesFor`) ve gap-3 (`DesignIntent` alias) kapandı olarak işaretlenir
- `FORMA_DESIGN_ROADMAP.md` "%98" başlığı bu roadmap'e yönlendirilir
- `PAXOLAB_FULL_AUDIT` P0-1 (pattern/primitives unwired) ve P1-5 (`wrapContinuity` stub) **kapandı** — kodda doğrulandı

**Çıkış kapısı:** Hiçbir doküman kodun gerisinde "yapılmadı" demiyor.

### `[x]` R2 — Ölü mimari temizliği (motor) · **kapandı 2026-09-17**
- `advisePlan` (identity, çağıran yok) — **silindi**
- `planGraph` + `buildDesignGraph` + `DesignGraph.ts` (generate çağırmıyordu) — **silindi**, `brain/index.ts` export'ları temizlendi
- `server/app.ts` kullanılmayan `listBuckets` / `reconcileCheck` importları — **kaldırıldı** (`bucketSummary` kullanılıyor, kaldı)

**Doğrulama (çalıştırıldı):** `tsc -b` 0 hata · `oxlint` **0 error** · `vitest run` 502/504 (baseline değişmedi).

**Kapsam dışı bırakıldı (bilinçli):** `src/api/admin|orgs|operations.ts`, `consoleApi` ölü tipleri ve `BillingPanel`/`MockPayPage` ayrımı panel yüzeyidir ve **kullanıcının bu oturumda commit ettiği taze iştir** — silmek yerine panel temizliğiyle birlikte **R13**'e taşındı. Kalan 121 lint *uyarısı* React hook/stil kaynaklı, ölü kodla ilgisiz → R13.

### `[x]` R3 — Değerlendirme birleşmesi · **kapandı 2026-09-17**
- `scoreVisualCraft` artık **her** generate'te çalışıyor (kit + stüdyo), `DesignSpec.craftScore` olarak taşınıyor. Hesap, repair kararlarından **sonra** ve teslim edilen markup üzerinde yapılıyor → `needsRepair` eşiği ve 29/18 hash'ler etkilenmiyor.
- Craft skoru critic'e **kanıt** olarak bağlandı (`CritiqueEvidence.source: 'craftScore'`). 6 eksen eşiği: hierarchy/composition/typography < 55, sectorFit/decoration < 45, originality < 40. Severity hiçbir zaman `error` değil.
- **K3 yeniden tanımlandı:** Ledger → `DesignCritique` eşlemesi (collision → composition/placement, taşma → typography/fit, minText → typography/type_size) audit yazıldıktan sonra zaten tamamlanmış. Gerçek boşluk şuydu: stüdyo yüzü kit `critique.hints` atlandığı için **hiç** yoğunluk/hiyerarşi/sektör kritiği almıyordu. Craft ekseni bu kanalı kit sözlüğü ödünç almadan açıyor.

**Doğrulama (çalıştırıldı):** `tsc -b` 0 hata · `build` ✓ · `vitest run` **507 passed / 2 failed (509)** — +5 yeni test (`brain/craftScore.test.ts`), 2 kırmızı hâlâ aynı baseline.

### `[x]` R4 — Studio yön zekâsı (C3+) · **kapandı 2026-09-17 — kod zaten hazırdı, testle kilitlendi**

**Ölçüm sonucu:** Bu fazın hedefi kodda **zaten karşılanmış**; `STUDIO_CHAT_AUDIT` §2.5'in anlattığı durum (sektör ağırlığı 0.5) güncel değil. Doğrulanan gerçek:
- `scoreArchetype`: `sectorFit * 0.22` — C3'ün hedef aralığında (`direction.ts:192`)
- `visualOverrideFromBrief`: mermer / botanik / klinik gibi görsel kelimeler sektör pin'ini **eziyor**
- V8 / C-C varyasyon boşluğu da kapalı: `walk = uniqueFamilyRows(ranked, 6)` — "başka yön" 6 farklı aile arasında yürüyor, top-3 kardeş değil. 3'lük `pool` yalnızca D3 yön *teklifi* listesi (tasarım gereği).

**Bu dilimde yapılan:** davranışı kilitleyen 5 regresyon testi (`studio/studioDirectionBrief.test.ts`) — aynı sektör + farklı görsel brief → farklı arketip; "elektronik kutu ama mermer ve altın" → `marble-frame`; yön farkı **boyanan yüzü** değiştiriyor (hash farkı), sadece etiketi değil; görsel ipucu yoksa sektör prior'u deterministik.

**Doğrulama (çalıştırıldı):** `vitest run` **512 passed / 2 failed (514)**. Skorlama değişmediği için 18 studio + 29 kit hash **korundu** (golden güncellemesi gerekmedi).

### `[x]` R5 — Studio critic → gerçek düzeltme · **kapandı 2026-09-17**

`src/engine/studio/studioRepair.ts` — tek turlu, ledger güdümlü. Kit `repairPlan` stüdyoda kapalı kaldı; critic hâlâ SVG'ye dokunmuyor. Tek kol kimlik ölçeği: çarpışma/taşma sayısına göre `titleScale`/`logoScale` ×0.9 (hafif) veya ×0.82 (3+ bulgu), `clampStudioScale` tabanında durur.

**Kritik koruma:** Yeniden boyama yalnızca `ledgerHits` **azalırsa** kabul edilir. Temiz yüz hiç yeniden boyanmaz, repair hiçbir zaman yüzü kötüleştiremez.

**Golden'da bulunan gerçek hata:** `06-elektronik-kutu` referans yüzü **11 ledger bulgusuyla** (5 çarpışma + 2 taşma, yan panellerde dikey marka üst üste) donmuştu. Repair 7'ye düşürüyor → hash **bilinçli güncellendi** (`31594a74…` → `fd68a9de…`), arketip/aile/zemin değişmedi. Kalan 7 bulgu dürüst sınır: tek tur, sınırlı kol.
`02-krem-kutu`'da 1 bulgu var ama retune iyileştirmedi → repair **reddedildi**, hash korundu (korumanın çalıştığının kanıtı).

**Doğrulama (çalıştırıldı):** `tsc -b` 0 · `vitest run` **518 passed / 2 failed (520)** — +6 test (`studio/studioRepair.test.ts`), 18 golden yeşil (1'i bilinçli güncel), 29 kit hash değişmedi.

### `[x]` R6 — Visual Language invert (VL-3) · **kapandı 2026-09-17 — kararla reddedildi, sözleşme kilitlendi**

**Ölçüm sonucu:** VL-1, VL-2, VL-5b **ve VL-4** hepsi kodda. `visualConceptFor` artık intent alıyor ve `conceptInLanguage(keyed, allowed, …)` ile concept'i **dil allow-list'i içinde** yeniden seçiyor (`VisualConcept.ts:318`) — yani VL-4 tie-break canlı.

**VL-3 "tam invert" bilinçli olarak yapılmadı — yanlış hedef:**
1. `VISUAL_LANGUAGE_V5_AUDIT` §4'ün çarpışma analizi kanıtlıyor: tek bir `character` üç ayrı dil ailesine düşüyor (luxury parfüm → heraldic, luxury gıda → botanical, luxury krem → oval). Character tek başına lehçeyi ayıramaz; **sector anahtar kalmak zorunda.**
2. Mevcut sözleşme zaten test edilmiş ve doğru: `designBrainV1.test.ts` `stayHeraldic` — zeytinyağı intent'i parfüm işine taşındığında yüzü botanical'a **sürüklemiyor**. Intent'i dil anahtarı yapmak bu testi ve bu doğru ayrımı kırardı.

**Bu dilimde yapılan:** `DesignIntentBlock.sector` üretim kodunda **hiç okunmuyordu** — yetkisi olmayan bir alan gibi duruyordu (V5'in "taşıyıcı bütünlüğü kırık" notu). `visualLanguageFor` içinde diğer bilinçli-yoksayılanlarla aynı hizaya `void intent.sector` + gerekçe yorumu eklendi; 4 test (`artwork/visualLanguageAuthority.test.ts`) sözleşmeyi kilitliyor: taşınan intent yüzü kendi sektörüne sürükleyemez, `intent.sector` değişmesi çıktıyı değiştirmez, VL-5b character modifikatörü canlı kalır.

**Doğrulama (çalıştırıldı):** `vitest run` — 4/4 yeni test yeşil, 29 katalog dil vektörü değişmedi.

### `[x]` R7 — Asset Language otoritesi · **kapandı 2026-09-17 — ölçüldü, canlı çıktı, testle kilitlendi**

`ASSET_LANGUAGE_AUDIT`'in üç ana iddiası da artık geçerli değil. Ölçülen gerçek:
1. **preferred / allowed / forbidden AL'de üretiliyor** — `assetLanguageFor` `preferred {roles, lexicon}` · `allowed {families, languages}` · `forbidden {avoid, strategies}` döndürüyor (`assetLanguage.ts:45-105`).
2. **Rol ağırlığı 0 değil.** `assetCompatibilityOf` rol uyumunu `alFit × 0.7 + roleFitOf × 0.3` ile karıştırıyor ve `compositionCandidates.ts:684`'ten çağrılıyor → `assetCompatibility` (0.06) ekseninin %30'u. Testle ölçtüm: tam rol ıskası `(right − wrong) × weight` **> 0.8**, yani `chooseCompositionWinner` eşiğini aşıp beraberliği çevirebiliyor.
3. **`organic` / `geometric` rol listeleri boş değil** (`['stamp','ornament']` / `['stamp','accent']`) — katalogdaki tek overlay stili olan playful artık atıl değil.

**Bu dilimde yapılan:** 5 ölçüm testi (`artwork/assetLanguageRole.test.ts`). Skorlamaya dokunulmadı → playful 4/29 winner **korundu** (freeze delinmedi).

**Not:** `roleFitOf` dışa aktarılmış ama `assetCompatibilityOf` dışında çağıranı yok; ölü değil, kompozisyon içi kullanılıyor.

### `[x]` R8 — Çift painter ayrımı (F1 / C-A) · **kapandı 2026-09-17 — ölçüldü, müdahale gereksiz**

**"`createPlan` stüdyoda israf" (F1) ölçüldü:** stüdyo generate ortalama **8.7 ms**, `createPlan` **0.1 ms** → toplamın **%1.3'ü**. Planı atlamak karar kaydını (`assetLanguageFor(plan)`), craft skorunu ve `spec.designPlan`'ı kırar; kazanç ölçüm gürültüsü kadar. **Karar: kalsın.** Kit planı stüdyoda "gölge" olarak çalışıyor ve yüzü boyamıyor — bu bilinçli.

**"Kit metadata kullanıcıya sızıyor" (C-A) ölçüldü — sızmıyor:** `Preview2D.tsx:88` ve `StyleBar.tsx:103` stüdyo açıkken `studioFaceLabel(design)` kullanıyor, kit `designPlan` alanlarına yalnızca stüdyo kapalıyken düşüyor. `studioHonesty.test.ts` bunu zaten kilitliyor (`Strateji:` stüdyo yüzünde görünmüyor, `heroGraphic` caption'a girmiyor).

**Critic dili ayrımı R3'te kapandı:** stüdyo yolu kit `critiquePlan` ipuçlarını almıyor; kendi kanalı craft ekseni (`craftScore.test.ts` `sources.has('critiquePlan') === false` ile pinli).

**Yeni kod yazılmadı** — ceremony eklemek yerine ölçüm kayda geçirildi ki ileride biri "optimize edeyim" diye planı sökmesin.

### `[x]` R9 — Craft kalan boşluklar · **kapandı 2026-09-17 — iki gerçek layout hatası bulundu ve düzeltildi**

Ölçüm bu fazda iki somut çizim hatası ortaya çıkardı; ikisi de golden sette canlıydı:

**1. Yan panel dikey markası (`boxLayouts.ts` compact dalı).** Mark, dikey ürün satırı ve marka aynı merkez ekseni paylaşıyor. `fitSize` 1.6 mm'de tabana oturduğu için, boşluk yetmediğinde dikey satır **her ikisinin üzerinden geçiyordu** — `vertical-brand × side-mark`, `vertical-brand × side-brand` ve iki taşma. Artık satır yalnızca en küçük puntoda gerçekten sığıyorsa basılıyor.

**2. Paragraf ↔ net miktar (`labelLayouts.ts` + `boxLayouts.ts`).** Net miktar panel ayağına sabitlenmiş, slogan paragrafı ise aşağı büyüyor; küçük yüzeyde üst üste biniyorlardı. Yeni `linesThatFit(top, limit, size, max)` yardımcısı (anatomy.ts) ile paragraf, ayak rezervine girmek yerine **satır düşürüyor**.

**Ölçülen etki — 18 golden yüzdeki toplam ledger bulgusu: 8 → 1.**
- `06-elektronik-kutu`: 11 → 1 (R5 repair + spine guard)
- `02-krem-kutu`: 1 → 0
- Kalan tek bulgu: `front:chip-text×badge-text` (ayrı yerleşim işi, ratchet testiyle sabitlendi)

**Bilinçli golden güncellemesi:** `02-krem-kutu` hash'i (ön yüz düzeldi). `06-elektronik-kutu` R5'te güncellenmişti; spine düzeltmesi yan panelde olduğu için hash'i değişmedi.

**Yapılmayanlar (gerekçeli):**
- **`FACE_EM` gerçek font metriği:** yapılmadı. Tahmin aslında harf bazlı çarpanlarla ayarlı (dar `IİJ1l`, geniş `MWĞÖ`, yuvarlak kapitaller, rakamlar). Bulduğum taşmalar metrik hatası değil **yerleşim** hatasıydı ve düzeldi. Gerçek metrik font dosyası/opentype gerektirir — roadmap kilitlerinde park.
- **Flap / top sade zemin (C-H/D4):** `STUDIO_STAGE_AUDIT` D4'te zaten kapanmış (`paintBoxFlap` marka + hacim).
- **QR:** S9'da dürüst hale getirilmiş (`data-sample` + "ISO/IEC 18004 değil" notu). Gerçek QR opsiyonel kaldı.

**Doğrulama (çalıştırıldı):** `tsc -b` 0 · `build` ✓ · `vitest run` **535 passed / 2 failed (537)** — +8 test (`studioSpineFit`, `studioLabelShapes`), 18 golden yeşil.

### `[x]` R10 — Öğrenme halkası kapanışı · **kapandı 2026-09-17 — C7'de tamamlanmış, ölçüldü**

- **Otomatik akış var:** `afterObservation()` üç gözlem noktasının (feedback / outcome / critic) hepsinden çağrılıyor ve `runLearningCycle({ approve: 'automated' })` çalıştırıyor (`LearningEngine.ts:218,248,316`). User/brand eşikte açılıyor, **global yalnız insan onayıyla** kalıyor; try/catch ile öğrenme generate'i asla bloklamıyor.
- **Zincir kullanıcıya görünüyor:** `Workspace.tsx:110` → `learnedPreferenceLine(design.appliedKnowledge, { studio })`; C6 "neden bu yön" + S7 onay/red/rollback paneli mevcut.
- **Kapsam zaten tam:** `studioLearning.test.ts` TEST 7–8 (onaylı kural sonraki bağımsız generate'i değiştiriyor), TEST 12 (üretim yolu: sohbet feedback → observe → validate → sonraki SVG + preflight), TEST 3/5/6 (global otomatik açılmıyor, doğrulanmamış aday uygulanmıyor), TEST 10 (determinizm). Ek test yazmak tekrar olurdu.
- **Park yazılı:** FAZ 7b A/B ve FAZ 8 preference model veri eşiğine kadar bilinçli park; RL / SVG fine-tune kalıcı kilit.

### `[x]` R11 — Panel Faz 2 (admin tamamlama) · **kapandı 2026-09-17**

**Ölçüm (2026-09-17):** Sunucu tarafı **tamamen hazır**, kalan iş yalnızca `site/` arayüzü.

| Madde | Sunucu | Arayüz |
|---|---|---|
| Plan düzenleme | ✅ `PATCH /api/admin/plans/:id` (app.ts:1515) | ❌ AdminApp'te çağrı yok |
| Ekip detay | ✅ `GET /api/admin/orgs/:id` (app.ts:1367) | ❌ detay linki/sayfası yok |
| Admin bakiye org-farkındalığı (P0-6) | ✅ `/admin/users` artık `billingUserId` + `billingBalance` + `sharedWallet` döndürüyor | ❌ listede fatura cüzdanı kolonu yok |
| LLM maliyeti | ✅ `GET /api/admin/llm-costs` (app.ts:1572) | ⚠️ veri çekiliyor (`AdminApp.tsx:776`), tablo render edilmiyor |
| Askıda rezervasyon süpürmesi | ✅ `sweepStaleReservations` (credits.ts:785) | — |
| Admin rate limit | ✅ `admin.use('*', rateLimit('admin'))` (app.ts:1189) | — |

**Uygulandı (2026-09-17, tarayıcıda doğrulandı):**

| Madde | Ne yapıldı | Tarayıcı kanıtı |
|---|---|---|
| Plan düzenleme | Ayarlar'da satır içi form: kredi + fiyat + açık/kapalı → `PATCH /api/admin/plans/:id` | Starter 150→175 kaydedildi, **veritabanında doğrulandı** (`monthly_credits: 175`), sonra 150'ye geri alındı |
| Fatura cüzdanı kolonu (P0-6) | Kullanıcı tablosuna "Kişisel" + "Fatura cüzdanı" kolonları; ekip üyesinde sahibin bakiyesi + `ekip` etiketi | Geçici ekip üyesi + aktif abonelikle `149 / 50 ekip` görüntülendi; kural `resolveBillingUserId` ile birebir aynı (org yok / sahip / aktif abonelik yok → kendi) |
| LLM maliyet tablosu | Kayıtlar'a sağlayıcı · model · tarih · USD satırları + toplam | Geçici 2 kayıtla `toplam $0.0068` doğrulandı |
| Ekip detay sayfası | `/admin/teams/:id` — kısa ad, sahip planı, koltuk doluluk, kuruluş tarihi + üye tablosu (sahip etiketi, kullanıcıya link) | North Studio detayı açıldı: `Koltuk 1/1 · dolu`, üye satırı `sahip` etiketiyle |

**Tarayıcı doğrulamasının yakaladığı gerçek hata:** LLM maliyet verisi hiç render edilmediği için tip tanımı **snake_case** kalmıştı (`estimated_cost_usd`, `created_at`), oysa API **camelCase** döndürüyor (`estimatedCostUsd`, `createdAt`). İlk render `Invalid Date` ve `$0.0000` gösterdi; düzeltildi. Sadece tip kontrolüyle bu yakalanmazdı.

**Ayrıca:** `AdminApp` kendi yerel `AdminUser` tipini kullanıyor; `consoleApi.ts`'deki aynı adlı **ölü** tip (R13 temizlik listesinde) dokunulmadan bırakıldı.

**Not (dev ortamı):** Doğrulama için `server/data/forma.sqlite`'a eklenen geçici kayıtlar (1 ekip üyesi, 1 abonelik, 2 LLM maliyet satırı) **tamamen geri alındı**; veritabanı bulunduğu durumda bırakıldı. Ayrıca :8787'de **eski kodu** çalıştıran API süreci yeniden başlatıldı — `dev324`'teki `billingUserId` alanlarını döndürmüyordu.

**Doğrulama (çalıştırıldı):** `npm run build:site` ✓ (tip kontrolü dahil) · `npm run test:server` **64/64**.

### `[x]` R12 — Panel Faz 3 (ödeme kapısı) · **kapandı 2026-09-17**

**Ölçüm:** P0-5 kapısı `dev324`'te zaten gelmiş — `POST /api/billing/subscribe` iyzico anahtarları varsa **403** döndürüyor (`app.ts:724`). Çift ödeme koruması da mevcut: `fulfillPaidOrder` `status === 'paid'` dalında `granted: false, alreadyPaid: true` ile çıkıyor ve mock yolunda "double complete no double grant" testi zaten vardı.

**Gerçek boşluk testti:** Hiçbir test iyzico anahtarlarını **set etmiyordu**, yani sistemin en kritik ticari güvencesi (canlıda ücretsiz plan dağıtmama) hiç doğrulanmamıştı. Eklenen 4 test (`server/billing.test.ts` → `payment gate`):
- anahtar varken `subscribe` 403 **ve** kullanıcıda abonelik oluşmuyor
- anahtar yokken (mock) `subscribe` 201 — dev akışı bozulmadı
- anahtar konulduğunda `mock/complete` kapanıyor
- token'sız callback 400 **ve** bakiye değişmiyor

**Kapsanamayan (dürüst sınır):** Token **taşıyan** callback test edilemiyor — handler karar vermeden önce canlı iyzico API'sine gidiyor, istek ağda asılı kalıyor (testte 5 sn timeout ile görüldü). Kapsamak için enjekte edilebilir bir iyzico istemcisi gerekir; prod anahtar + gerçek sağlayıcı doğrulaması hâlâ açık iş.

**Doğrulama (çalıştırıldı):** `npm run test:server` **68/68** (önceki 64 + 4 yeni).

### `[x]` R13 — Panel Faz 4 (sertleştirme) · **kapandı 2026-09-17**

- **Admin audit izi: zaten tamdı.** Üç olay türü kayıtlı: `admin_credit_adjusted` (+ `manual_admin_adjustment` işlemi `by: adminUserId` ile, `credits.ts:673`), `admin_role_changed` (`app.ts:1354`), `admin_plan_updated` (`app.ts:1529`).
- **Ölü kod temizliği (R2'den devredilen):** `BillingPanel` bileşeni silindi, `MockPayPage` kendi dosyasına taşındı (`src/components/MockPayPage.tsx`, tarayıcıda çalıştığı doğrulandı); `consoleApi`'deki kullanılmayan `AdminUser` / `AdminPlan` / `AdminOperation` tipleri kaldırıldı.
- **Panel bileşen testi yerine API sözleşme testi.** Bileşen testi için `site/`'a test altyapısı (vitest + testing-library + jsdom) kurmak gerekiyordu; bunun yerine **tarayıcıda yakaladığım hatanın sınıfını** hedefleyen 3 sözleşme testi yazıldı (`server/admin.test.ts`): `/users`'ın `billingUserId`/`billingBalance`/`sharedWallet` alanları, `/llm-costs`'un **camelCase** (`estimatedCostUsd`, `createdAt`) olması, `/plans` ve `/orgs/:id` + `members[]` alan adları. Bir yanıt yeniden adlandırılırsa test sesli düşer — snake/camel uyuşmazlığı bir daha sessizce geçemez.

**Bilinçli bırakılan:** `src/api/admin.ts` / `orgs.ts` / `operations.ts` — kullanılmadıkları doğrulandı ama **kullanıcının bu oturumda yazdığı taze kod**; build'den tree-shake ediliyorlar, silmek yerine sahibinin kararına bırakıldı. 121 React hook lint *uyarısı* da davranış değiştirme riski taşıdığı için ayrı ele alınmalı (0 hata var).

**Doğrulama (çalıştırıldı):** `tsc -b` 0 · `build:site` ✓ · `test:server` **71/71** · `vitest run` 535/537 · `oxlint` 0 error.

### `[x]` R14 — CI / QA kapanışı · **kapandı 2026-09-17**

- **CI kuruldu (yoktu).** `.github/workflows/ci.yml` — iki iş: *Engine* (`npm ci` → `build` → `lint` → `vitest run` → `test:server`) ve *Site* (`build` + tip kontrolü). Node 24 (`node:sqlite` ≥22.5 gerektiriyor). 29 katalog fingerprint'i ve 18 stüdyo yüz hash'i artık **her push'ta** yeniden koşuyor — determinizm ancak böyle bir şeyi koruyor.
- **Son iki kırmızı kapandı.** Oturum boyunca "baseline" diye taşıdığım 2 test aslında **bayat**tı: ikisi de C1/C2'de bilinçli değiştirilmiş metni eski haliyle kilitliyordu.
  - `structureRecommend` `/Yapı:/` → C1 bu turu numaralı **yapı teklifine** çevirdi; tek cümlelik "Yapı: X" artık generate turunda. Assertion, teklifin gerçek yapı adları içermesine güncellendi.
  - `phase15` `/hex/i` → C2 intake'i hex kodundan **renk/duruş/hikâye** diline taşıdı. Assertion güncel sözleşmeye çevrildi (+ hex'in geri gelmediğini de kontrol ediyor).
- **Rate limit** zaten yerinde: `auth` (register/login), `checkout`, `admin/*`.

**Doğrulama (çalıştırıldı):** `tsc -b` 0 · `npm run build` ✓ · `oxlint` **0 error** · `vitest run` **537/537 — repo ilk kez tamamen yeşil** · `test:server` **71/71** · `build:site` ✓.

**Açık kalan (yazılı, kasıtlı):** uçtan uca tarayıcı E2E otomasyonu (bu oturumda panel manuel tarayıcıda doğrulandı) · `LAUNCH_CHECKLIST.md` kutucukları canlı trafik öncesi insan eliyle işaretlenmeli · iyzico prod anahtar + token'lı callback doğrulaması (bkz. R12).

---

## 2. Değişmeyen kilitler (her fazda geçerli)

- LLM SVG / geometri / path üretmez
- Packfy / SAM / YOLO / raster-to-SVG / image-gen yok
- 29 kit fingerprint freeze; 18 studio hash yalnız **bilinçli** güncellenir
- Global knowledge otomatik aktifleşmez; RL / SVG fine-tune yok
- FOGRA / CMYK iddiası yok
- Kit painter silinmez

---

## 2.4 LAUNCH DURUMU — "bugün açsak olur mu?" (2026-09-17, gerçek yolculuk koşularak)

> Bu bölüm kod okumasıyla değil, **sıfırdan kullanıcı olarak uçtan uca akış çalıştırılarak** yazıldı:
> kayıt → panel → handoff → sohbet brief → yapı seçimi → generate → dieline → preflight → export.

### Cevap: Ücretli trafiğe **hayır**. Kapalı beta / önizlemeye **evet**.

| Hat | Durum | Neden |
|---|---:|---|
| **B — Ürün döngüsü** (akış, bıçak izi, şablon, indirme) | **%80 → %92** | L1 sonrası: dosya font bağımsız, punto ticari eşikte, kullanıcı ölçüsü korunuyor |
| **A — Tasarım kalitesi** (özgünlük, profesyonellik) | **%60** | Tipografi düzeldi; sektör-motif uyumu ve palet sadakati hâlâ zayıf → L2 |
| **Launch hazırlığı (bileşik)** | ~%65 → **~%78** | Üretim blokajı kalktı; kalan iş tasarım kalitesi (L2) ve prod ödeme/E2E (L3) |

### Doğrulanan — gerçekten çalışıyor

- Kayıt → müşteri paneli (120 kredi) → handoff → stüdyo: **kesintisiz**
- **Tek paragraftan** marka, sektör, alt ürün, palet ve duruş doğru çıkarıldı
- Yapı teklifi: 3 gerçek yapı, hepsi ölçüye dayalı gerekçeyle
- Kredi: 117 rezerve → commit, defterde doğru. **117 + 3 = 120** — başlangıç kredisi tam olarak *bir tasarım + bir revizyon*; kasıtlı ve zarif
- **Tasarım ↔ bıçak izi entegrasyonu gerçekten oturuyor**: tüm paneller dolu, arka yüzde yasal blok + barkod, tuck'larda marka, `CUT + CREASE tutarlı`
- Preflight 24/28; geçmeyen 4'ün hepsi **dürüst uyarı** (örnek barkod, örnek legal, prova kilidi), hata değil
- Ledger: **96 kutu, örtüşme yok** (R5/R9 işinin sahadaki karşılığı)
- Teslim ZIP 8 dosya: `knife.svg`, `knife.dxf` (**CUT ACI 1 / CREASE ACI 5 / PERF ACI 6** — kalıpçının beklediği konvansiyon), `dieline.svg`, `dieline.pdf`, `artwork.svg`, `combined.svg`, `shop.json`, `OKU.txt`

### Launch'ı bloklayan 4 bulgu

| # | Bulgu | Kanıt | Etki |
|---|---|---|---|
| **1** | **Fontlar gömülü değil.** Export SVG'si yalnız `local('Cormorant Garamond'), local('Georgia')` bildiriyor; ikili font verisi yok | `studio/text.ts:29-41`; export probe: `gömülü font: false`, `local() bildirimi: true` | **SERT BLOKAJ.** Matbaada o fontlar yoksa Georgia/Arial'a düşer → metrikler değişir → motorun `fitSize`/tracking/çarpışma ile kurduğu yerleşim **kayar**. Tarayıcıda doğru, baskıda bozuk. "Üretime hazır" vaadi burada kırılıyor |
| **2** | **En küçük metin 1.05 mm** (export'ta ölçüldü; ~3 pt) | export probe `en küçük font-size: 1.05` | Ticari baskıda okunamaz. Motorun kendi tabanı (1.2 mm) da ticari minimumun (≈1.8–2.1 mm) altında |
| **3** | **Kullanıcının ölçüsü sessizce değişiyor.** "70×70×180" dedim, yapı seçince **80×50×180** oldu | sohbet: "Şablon ölçüsü 80×50×180 mm — sağda değiştir" | Söylüyor ama varsayılanı kullanıcının verisinin üstüne yazıyor. Profesyonel araç şablonu kullanıcı ölçüsüne oturtur |
| **4** | **Marka çıkarımı Türkçe iyelik ekini yutuyor.** "Nexora markası için…" → marka adı **"Nexora markası"** oldu ve kutuya öyle basıldı | ön yüz lockup: `NEXORA MARKASI` | D5 "Parfüm"ü çözmüş ama `markası/için/adlı` kalıbı açık. İlk izlenimi doğrudan bozuyor |

### Tasarım kalitesi — dürüst okuma

Üretilen yüz (zeytinyağı kutusu) **tutarlı ve şablon-doldurmanın üstünde**: kemerli pencere, serif lockup, el yazısı alt satır, ayakta ürün rozeti, yan panellerde ikon listesi, arkada yasal + barkod. Ajans işi gibi *durmuyor* ama amatör de değil.

İki gerçek kusur:
- **Sektör-motif uyuşmazlığı:** zeytinyağına **çam ağaçları ve dağ manzarası** çizildi. `landscape-window` arketipi bal/dağ referansından damıtılmış. Tasarımcı zeytin dalı, bahçe, damla çizerdi.
- **Palet sadakati zayıf:** "koyu yeşil ve altın" istendi; yüz krem/adaçayı ağırlıklı çıktı. Palet etiketi doğru yazıyor ama boyamaya tam yansımıyor.
- **Tavan:** ~12 arketiplik havuz. Aynı sektör + benzer brief → benzer yüz riski (henüz ölçülmedi).

---

## 2.5 R0–R14 kapandı — sonra ne kaldı?

Tüm fazlar kapalı. Bilerek açık bırakılanlar (hepsi yazılı gerekçeli):

| Konu | Neden açık | Nerede |
|---|---|---|
| iyzico prod anahtarı + token'lı callback doğrulaması | Gerçek sağlayıcı ve enjekte edilebilir istemci gerekiyor | R12 |
| Tarayıcı E2E otomasyonu | Panel bu oturumda elle tarayıcıda doğrulandı; otomasyon ayrı kurulum | R14 |
| `src/api/admin\|orgs\|operations.ts` | Kullanılmıyor ama kullanıcının taze kodu — silme kararı sahibinin | R13 |
| 121 React hook lint uyarısı | 0 hata var; uyarıları düzeltmek davranış değiştirme riski taşıyor | R13 |
| `FACE_EM` gerçek font metriği | Font dosyası/opentype gerektirir; kalıcı park | R9 |
| VL-3 tam invert, FAZ 7b A/B, FAZ 8 preference, RL / SVG fine-tune | Kararla reddedildi veya veri eşiğine kadar park | R6, R10 |
| `front:chip-text×badge-text` (1 ledger bulgusu) | Ayrı yerleşim işi; ratchet testiyle büyümesi engellendi | R9 |

---

## 2.6 LAUNCH KAPILARI — buradan sonrası

R0–R14 **altyapıyı** sağlamlaştırdı (build, test, CI, panel, ödeme kapısı). Bundan sonrası ürün vaadini karşılamakla ilgili. Sıra **bağımlılığa göre**, isteğe göre değil.

### `[x]` L1 — Üretim gerçeği · **kapandı 2026-09-17**

**Uygulandı (2026-09-17):**

| # | İş | Sonuç |
|---|---|---|
| **L1-4** | Türkçe iyelik eki marka adından düşüyor | "Nexora markası için…" → **Nexora**. Kök sebep daha derindeydi: ürün adı bulucu markanın *kelimelerini* değil tamamını karşılaştırıyordu, "Elite Brew"i "Elite"e kırpıyordu. `stripBrandTail` + kelime bazlı karşılaştırma. **+6 test** |
| **L1-3** | Kullanıcı ölçüsü korunuyor | `selectStructureResult` artık şablon varsayılanını kullanıcının ölçüsünün üstüne yazmıyor; netler parametrik olduğu için 70×70×180 aynen üretiliyor. Sohbet "Senin ölçünle…" diyor. **+5 test** |
| **L1-1** | **Export'ta yazılar outline** | `fontOutlines.json` (8 yüz, ~195 glyph) `assets/fonts/` altındaki SIL OFL subset'lerinden derleniyor; `outlineSvgText` her `<text>`'i path'e çeviriyor, tekrar eden harfler `<defs>/<use>` ile paylaşılıyor. **+6 test** |

**Outline neden base64 gömmeye tercih edildi:** matbaanın SVG'yi açtığı en olası araç Illustrator ve o, SVG'ye gömülü webfont'u yok sayar — yine kayar. Path geometridir, kayamaz. Stüdyo canvas'ı hiç etkilenmedi: düzenleme canlı model üzerinde sürüyor, outline yalnızca uygulamadan **çıkan** dosyaya uygulanıyor.

**Ölçülen kanıt:**
- 74/74 metin outline'landı, export'ta `<text>` ve `local()` font bildirimi **kalmadı**
- Dosya 110KB → 171KB (glyph paylaşımı olmadan 736KB olurdu)
- **Ana paket etkilenmedi:** font tablosu ayrı chunk (802KB / 277KB gzip), yalnız export'ta yükleniyor; `index.js` +12KB
- Tablo advance'leri gerçek fontla **%0.4–1.6** farkla örtüşüyor (kalan fark kerning çiftleri)

| **L1-2** | **Gerçek metrik + punto tabanı** (tek layout geçişi) | `FACE_EM` tahmincisi gerçek fontlardan **−%10…+%20** sapıyordu (script %19.9, sans-light −%10). Negatif sapma kritikti: motor satırı olduğundan dar sanıp "sığar" diyor ve taşırıyordu — R9'daki çakışmalar bunun semptomuymuş. Artık `fontMetrics.json` (13.6 kB, paketlenir) ile **gerçek advance** kullanılıyor: tarayıcı ölçümüne **%2'den yakın**. Aynı geçişte `STUDIO_TYPE_FLOOR_MM = 1.5 mm` kondu ve her hesaplanan punto ona kırpıldı. **+7 test** |

**Punto tabanının ölçülen etkisi:**

| | Önce | Sonra |
|---|---:|---:|
| 1.5 mm altı metin (18 golden yüz) | 113 / 724 (**%15.6**) | **0** (gerçek GTIN ile) |
| Ledger'ın gördüğü en küçük punto | 1.15 mm | **1.50 mm** |
| Ledger bulgusu | 1 | **1** (taban yeni taşma yaratmadı) |

Eski preflight eşikleri (uyarı 1.2 / hata **0.9 mm ≈ 2.5 pt**) okunamayacak puntoyu geçiriyordu; ikisi de 1.5'e çekildi — artık garanti, altı hata demek.

**Tek istisna, bilinçli:** örnek barkodun altındaki "örnek" uyarısı 1.05 mm kalıyor. Yalnızca **placeholder barkodda** çıkıyor, gerçek GTIN girilince kayboluyor (ölçümle doğrulandı) ve `barcode.ts` kit ile paylaşıldığı için dokunmak 29 katalog hash'ini kaydırırdı.

**Golden güncellemesi (bilinçli, tek seferlik):** 18 stüdyo yüzünün **16'sının** hash'i değişti. **Arketip / background / family 18'inde de aynı kaldı** — DNA kaymadı, yalnız tipografi düzeldi. 29 kit hash'i etkilenmedi (`FACE_EM` yalnızca stüdyoda).

**Doğrulama (çalıştırıldı):** `tsc -b` 0 · `build` ✓ · **561/561 SPA · 71/71 server · 0 lint hatası**.
Sattığın şey üretime hazır dosya; bugün o dosya matbaada bozuluyor.
1. **Font gömme** — `artwork.svg` / `combined.svg` içine gerçek font verisi (WOFF/TTF subset, base64). Lisans kontrolü şart: Cormorant Garamond + Montserrat + Great Vibes üçü de SIL OFL, gömmeye izinli. Alternatif: metni **outline'a çevirmek** (path). Outline daha güvenli — metin düzenlenebilirliği kaybolur ama baskı kesin doğru olur; ZIP'te ikisini birden vermek de mümkün (`-artwork-outlined.svg`).
2. **Minimum punto tabanı** — 1.2 mm → ticari eşik (≈1.8 mm gövde, 1.5 mm yasal). Taban yükseltilince bazı yüzler preflight'ta düşecek; layout'un buna uyması gerekir (R9'daki `linesThatFit` deseni bunun için hazır).
3. **Kullanıcı ölçüsüne saygı** — şablon varsayılanı kullanıcı ölçüsünün üstüne yazmasın; net üretilebiliyorsa kullanıcı ölçüsü kazansın, üretilemiyorsa **sebebiyle** reddedilsin.
4. **Türkçe iyelik/kalıp temizliği** — `markası / için / adlı / firması` marka adından düşsün.

**Çıkış kapısı:** İndirilen SVG, o fontlar **kurulu olmayan** bir makinede açıldığında birebir aynı görünüyor (kanıt: iki ortamda render karşılaştırması) · export'ta hiçbir metin ticari eşiğin altında değil · kullanıcı ölçüsü korunuyor.

### `[~]` L2 — Tasarım gerçeği

**Özgünlük ölçümü (2026-09-17, `scripts/measure-originality.ts` — 28 brief, 14 kategoride ikişer zıt brief):**

| Ölçüt | Sonuç |
|---|---|
| Benzersiz yüz hash | **28 / 28** — hiçbir iki tasarım birebir aynı değil |
| Kullanılan arketip | 7 (kutu havuzu 8; `ink-wash` hiç seçilmedi) |
| En baskın arketip | `botanical-card` — %21 (tek arketip her şeyi yemiyor) |
| Benzersiz zemin / temperament | 7 / 6 |
| **Aynı kategori + zıt brief → aynı arketip** | **5 / 14 (%36)** |

**Tavan bulundu: 8 kutu arketipi.** 28 brief 7 arketipe düşüyor.

Çöken çiftler — brief zıt olmasına rağmen:
`serum klinik↔sıcak` · `bal dağ↔modern` (siyah·sarı, modern olan da çayır alıyor) · `temizlik ferah↔doğal` · `şampuan botanik↔editorial` (siyah·beyaz, modern olan da botanik alıyor) · `çay klasik↔sakin`.
Sebep: `productFamilyFit` ±0.22 ham puanla ekleniyor ve `styleFit * 0.35`'i bastırıyor — yani ikinci ve daha güçlü bir sektör pini.

**L2-1 uygulandı — sektör-motif sadakati:**

Ölçüm gösterdi ki sorun sandığımdan genişti: zeytinyağı `botanical` bile almıyordu — lüks olanı **mermer**, eko olanı **çam ağaçlı çayır** alıyordu. Yani hiçbir arketip ürünün *ne olduğunu* bilmiyordu; mermer ve botanik, alakasız kategorilere "lüks" ve "doğal" duvar kâğıdı gibi uygulanıyordu.

Yeni `studio/species.ts` katmanı bu soruyu ayırıyor: **kompozisyon arketipte kalır, ne çizildiği üründen gelir.** `speciesFor(brief)` → olive / coffee / tea / grain / citrus / cocoa / flora / conifer; `landscapeMeadow` ve `botanical` painter'ları siluetleri bu türden alıyor.

Tarayıcıda doğrulandı: zeytinyağı kutusu artık **yuvarlak taçlı zeytinlik**, bal kutusu **buğday başakları** çiziyor — ikisi de eskiden çam üçgeniydi. **+8 test.** Golden'da yalnız 2 yüz (çayır zeminli gıda) değişti, DNA sabit.

**L2-2 uygulandı — palet sadakati (A seçeneği: "brief'in sesini yükselt"):**

Görsel incelemede asıl kusurun arketip değil **renk** olduğu ortaya çıktı: "Sleek Volume, siyah · beyaz, modern" şampuan **turkuaz** bir kutu alıyordu. Kullanıcının ilk fark edeceği şey bu.

Üç katmanlı kök sebep, sırayla kazılarak bulundu:

1. **Brief renkleri stüdyoya hiç ulaşmıyordu.** `paletteFromBrief` yalnızca `blankCanvas` yolunda çağrılıyordu; normal stüdyo yolu sektör/stil tablosuna düşüyordu. Yani isimli renk tablosu zaten hiç danışılmıyormuş.
2. **Tablo 12 renkti** — pembe, mor, turuncu, mavi, sarı, kırmızı, gri, kahve, turkuaz yoktu. "pembe · mor" hiçbir şeye eşleşmeyip sektör varsayılanına düşüyor ve **turuncu** çıkıyordu.
3. **"Siyah" nötr değildi.** `#1a0a0a` %44 doygunluk taşıyor; siyah brief "renkli" sayılıyor ve `vivid-mono` ondan hue türetiyordu.

Yapılanlar: stüdyo yolu artık `paletteFromBrief` kullanıyor (**kit yolu `paletteFor` ile bırakıldı — 29 katalog fingerprint'i bu yüzden sağlam**); renk tablosu 30 girdiye çıkarıldı; siyah `#141414` yapıldı; nötr brief `vivid-mono`'ya sokulmuyor (tek boğaz noktasında) ve yalnızca doygun mizaç taşıyan arketipler nötr brief'te **−0.5 ceza** alıyor; nötr brief'te vurgu rengi camgöbeği uydurmak yerine brief'in kendi açık rengine düşüyor.

**Ölçülen sonuç:**

| Brief | Önce | Sonra |
|---|---|---|
| siyah · beyaz (şampuan) | turkuaz botanik kart | **siyah zeminli tech yüzü** |
| pembe · mor (çikolata) | turuncu | **pembe/magenta** |
| siyah · altın (parfüm) | siyah + gümüş | **siyah + altın** |
| lacivert · altın | lacivert + turkuaz | **lacivert + altın** |
| mermer · altın | mermer | mermer *(görsel kelime hâlâ kazanıyor)* |
| (renk yok) | sektör varsayılanı | *(değişmedi)* |

**Aynı kategori + zıt brief → aynı arketip: %36 → %29.** Şampuan çifti ayrıştı. **+9 test.** Golden: 17 yüz güncellendi, **DNA 18'inde de sabit**.

**L2-3 uygulandı — arketip içi yerleşim (B seçeneği: "tavanı kaldır"):**

Arketip iskeleti belirler; **yerleşim varyantı ağırlığın nereye oturduğunu** belirler. `DesignDirection.variant` (0–2) brief'in kendi seed'inden türüyor — ek kullanıcı girdisi gerekmiyor, `variationIndex` de seed'in parçası olduğu için "yeni tasarım" varyantları da dolaşıyor.

Uygulandığı 5 yüz (8 kutu arketipinin 5'i): `botanical-card`, `marble-frame`, `landscape-window`, `line-scene`, `wave-panel`. Her birinde üç gerçek ritim — blok üstte/ortada/ayakta, pencere-rozet örtüşmesi, lockup yüksekliği.

**Ölçülen sonuç:**

| Ölçüt | L2 öncesi | L2 sonrası |
|---|---|---|
| Aynı kategori + zıt brief → aynı arketip | %36 | %29 |
| **Aynı arketip VE aynı yerleşim** | **%29** | **%0 (0/14)** |
| Benzersiz yüz hash | 28/28 | 28/28 |
| Yerleşim dağılımı (28 brief) | — | v0:11 · v1:12 · v2:5 |

Kalan dört aynı-arketip çiftinin **dördü de** farklı yerleşim alıyor (serum 1/2, bal 1/2, temizlik 0/1, çay 0/1). Etkin kompozisyon sayısı 8 → **~24**.

**+6 test.** Golden'da 6 yüz güncellendi, DNA sabit; 18 galeri yüzünde ledger bulgusu **1** (değişmedi), en küçük punto 1.50 mm.

**Tamamlandı:** `dark-landscape` (manzara ufku + lockup yüksekliği), `ink-wash` (mürekkebin girdiği köşe — üç yerleşimin en görünürü) ve `diagonal-tech` (ürün bloğunun düşüşü) de eklendi. **8 kutu arketipinin 8'i** artık yerleşim taşıyor. Doğrulandı: parfüm ve elektronik briefleri yedi markada üç yerleşime dağılıyor, 7/7 benzersiz yüz, **0 çakışma**. **+10 test** (`layoutVariant.test.ts`, her varyantlı yüz için ayrı kapsam).

**Kalan:** Kör kalite değerlendirmesi (FAILURE_CATALOG referans-bar yöntemi) hâlâ yapılmadı — ve bu, diğerlerinden farklı olarak sayıyla ölçülemez, insan gözü gerekir.
1. **Sektör-motif sadakati** — zeytinyağına çam çizilmemeli. Arketip↔sektör uyumu için motif katmanı (zeytin dalı, bahçe, damla) veya arketip seçiminde sert sektör vetosu.
2. **Palet sadakati** — brief'teki renk, boyanan yüzde ölçülebilir şekilde baskın olsun (ölçüt: üretilen SVG'deki renk dağılımı brief paletine yakınsıyor mu).
3. **Özgünlük ölçümü** — 25–30 sentetik brief → arketip dağılımı + yüz hash çeşitliliği. **Tavanın nerede olduğunu bilmiyoruz.** Sonuç, arketip havuzunu mu büyütmek yoksa arketip *içinde* parametrik kompozisyona mı geçmek gerektiğini söyleyecek.
4. **Kör kalite değerlendirmesi** — `FAILURE_CATALOG.md`'deki referans-bar yöntemi (13 Eyl'den beri güncellenmedi), üretilen yüzler gerçek ajans işleriyle yan yana.

**Çıkış kapısı:** Aynı sektörde farklı brief → farklı ve **sektöre uygun** yüz · palet isteği çıktıda görünür · kör değerlendirmede "müşteriye gösterilir" oranı hedefin üstünde.

### `[ ]` L3 — Ölçek ve güven
Tarayıcı E2E otomasyonu (bu akış elle koşuldu, tekrarlanabilir olmalı) · iyzico prod anahtar + token'lı callback · `LAUNCH_CHECKLIST.md` kutucukları · hata izleme/log.

**Çıkış kapısı:** Launch checklist tamamen işaretli.

---

## 3. İlerleme kaydı

Yalnızca doğrulaması çalıştırılmış işler buraya yazılır.

| Tarih | Faz | Ne yapıldı | Doğrulama |
|---|---|---|---|
| 2026-09-17 | — | Roadmap açıldı; başlangıç skoru doğrulandı | `npx tsc -b` (20+ hata), kod okuması |
| 2026-09-17 | R0 | 9 dosyada tip hijyeni; `HeroFamily` genişletme önerisi reddedildi (ayrı tip uzayları) | `tsc -b` 0 hata · `build` ✓ · 502/504 (2 baseline, HEAD worktree'de doğrulandı) |
| 2026-09-17 | R1 | 5 dokümana post-implementation notu: VL-1/VL-2/VL-5b landed, Brain gap-2/gap-3 kapandı, pattern+primitives+wrapContinuity kapandı, %98 iddiası superseded | Her iddia kodda tek tek doğrulandı (grep + dosya okuma) |
| 2026-09-17 | R2 | `advisePlan`, `planGraph`, `buildDesignGraph`, `DesignGraph.ts` ve 2 ölü server importu silindi; panel ölü kodu R13'e taşındı | `tsc -b` 0 hata · `oxlint` 0 error · 502/504 |
| 2026-09-17 | R3 | `scoreVisualCraft` her generate'te (`spec.craftScore`) + critic'e advisory kanıt olarak bağlandı; stüdyo yüzü artık geometri dışı kritik de alıyor | `tsc -b` 0 · `build` ✓ · 507/509 (+5 test, 2 baseline) |
| 2026-09-17 | R4 | Ölçüm: sektör pin'i (0.22) ve varyasyon havuzu (6 aile) **zaten** çözülmüş; 5 regresyon testiyle kilitlendi | 512/514 · hash değişmedi |
| 2026-09-17 | — | Ölçüm turu: R5 (stüdyo repair) **gerçekten açık**, R6 (VL-3 invert) **gerçekten açık**, R7 rol ağırlığı skor kartında hâlâ **0** | grep + kod okuması |
| 2026-09-17 | R5 | Tek turlu stüdyo repair; yalnız ledger bulgusunu azaltırsa kabul. `06-elektronik-kutu` golden'ı 11→7 bulgu ile bilinçli güncellendi | `tsc -b` 0 · 518/520 (+6 test) · 18 golden yeşil |
| 2026-09-17 | R6 | VL-4'ün de uygulanmış olduğu ölçüldü; VL-3 tam invert kararla reddedildi (character lehçeyi ayıramıyor), sözleşme 4 testle kilitlendi | 4/4 yeni test · 29 dil vektörü sabit |
| 2026-09-17 | R7 | AL'in üç audit bulgusunun da kapandığı ölçüldü; rol ekseninin winner eşiğini aşabildiği testle kanıtlandı | 5/5 yeni test · playful winner sabit |
| 2026-09-17 | R8 | `createPlan` maliyeti %1.3 ölçüldü → kaldırılmadı; UI sızıntısı olmadığı doğrulandı | timing probe · grep · mevcut honesty testleri |
| 2026-09-17 | R9 | İki gerçek çizim hatası düzeltildi (yan panel dikey marka, paragraf↔net miktar). Golden sette toplam ledger bulgusu 8→1 | `build` ✓ · 535/537 (+8 test) · 1 golden bilinçli güncel |
| 2026-09-17 | R10 | Öğrenme halkasının C7'de tamamlandığı ölçüldü (3 gözlem → otomatik cycle, UI satırı, TEST 7/8/12 kapsıyor) | grep + mevcut test envanteri |
| 2026-09-17 | R11 | Admin paneli: plan düzenleme, fatura cüzdanı kolonu, LLM maliyet tablosu, ekip detay sayfası. LLM tipinde camelCase hatası tarayıcıda yakalandı | `build:site` ✓ · `test:server` 64/64 · 4 madde tarayıcıda tıklanarak doğrulandı |
| 2026-09-17 | R12 | P0-5 ödeme kapısının test edilmemiş olduğu bulundu; 4 kapı testi eklendi | `test:server` 68/68 |
| 2026-09-17 | R13 | Audit izinin zaten tam olduğu ölçüldü; ölü `BillingPanel` + ölü tipler silindi, `MockPayPage` ayrıldı; 3 API sözleşme testi | `test:server` 71/71 · tarayıcıda MockPayPage ✓ |
| 2026-09-17 | R14 | CI kuruldu (hiç yoktu); son 2 kırmızının bayat test olduğu bulundu ve güncel sözleşmeye çevrildi | **537/537 SPA · 71/71 server · 0 lint hatası · her iki build ✓** |
| 2026-09-17 | — | **Launch denetimi:** sıfırdan kullanıcı olarak uçtan uca akış koşuldu (kayıt→brief→generate→dieline→preflight→export). Sonuç §2.4; kapılar §2.6 | Tarayıcı yolculuğu + export probe (font gömme yok, min punto 1.05 mm) |
| 2026-09-17 | L1 | İyelik eki + kullanıcı ölçüsü + **export outline** (SIL OFL fontlar vendor'landı, glyph tablosu derlendi). `FACE_EM` sapması ölçüldü: −%10…+%20 | `tsc` 0 · **554/554 SPA · 71/71 server · 0 lint hatası** · 3 yönlü tarayıcı render karşılaştırması |
| 2026-09-17 | L1-2 | Gerçek font metrikleri + 1.5 mm punto tabanı tek geçişte; 1.5 altı metin %15.6 → 0; 16/18 stüdyo golden bilinçli güncellendi (DNA sabit) | `tsc` 0 · **561/561 SPA · 71/71 server** · 0 lint hatası · build ✓ |
| 2026-09-17 | L2-ölçüm | 28 brief ile özgünlük ölçüldü: 28/28 benzersiz yüz ama **%36 çift aynı arketipe** düşüyor; tavan 8 kutu arketipi | `scripts/measure-originality.ts` |
| 2026-09-17 | L2-1 | `species.ts`: kompozisyon arketipte, **ne çizildiği üründen**. Zeytinyağı artık zeytinlik, bal buğday çiziyor (ikisi de çamdı) | **569/569 SPA** · 0 lint hatası · 2 golden bilinçli güncel · tarayıcıda doğrulandı |
| 2026-09-17 | L2-2 | Palet sadakati: brief renkleri stüdyoya hiç ulaşmıyormuş. 3 katmanlı kök sebep kazıldı; "siyah·beyaz" turkuaz yerine siyah, "pembe·mor" turuncu yerine pembe. Çökme %36→%29 | **578/578 SPA · 71/71 server** · 0 lint hatası · 17 golden bilinçli güncel (DNA sabit) · 29 kit hash'i sağlam |
| 2026-09-17 | L2-3 | Arketip içi yerleşim varyantı (5 yüzde 3 ritim), brief seed'inden. Aynı arketip + aynı yerleşim oranı %29 → **%0** | **584/584 SPA · 71/71 server** · 0 lint hatası · 6 golden bilinçli güncel (DNA sabit) · ledger bulgusu değişmedi |
| 2026-09-17 | L2-3b | Kalan 3 arketipe de yerleşim eklendi — **8/8 kutu yüzü** varyant taşıyor | **588/588 SPA · 71/71 server** · 0 lint hatası · 1 golden güncel · 0 çakışma |
| 2026-09-17 | L2-4 | Baskı puntosu tabanı çizilen yüzde de garanti altına alındı. `chip()`/`textEl()`'e doğrudan geçilen sabit punto `fitSize`'ı atlıyormuş: elektronik kutusu 1.40 mm ile export kapısından dönüyordu, QR altyazısı 1.1 mm hiç yakalanmamıştı. Testler yardımcıyı ölçüyordu, çıktıyı değil | **602/602 SPA** · `typeFloor.test.ts` üretilen markup'taki her font-size'ı okuyor (14 brief, 6 sektör, 2 mod) · 10/10 export yeşil |
| 2026-09-17 | L2-5 | "mermer · altın" hardal kutu üretiyordu: mermer sözlükte yok (düşüyor) + kalan tek renk zemin oluyor. Metalikler artık aksan yuvasına gidiyor, zemin başka yerden. Zemin düzelince mermer damarı ortaya çıktı ve yol haritası gibiydi — konik dolgu + sürüklenen dönüş hızı + dallanma ile yeniden yazıldı | **602/602 SPA** · 0 lint · 2 golden bilinçli güncel (sadece mermer yüzleri, DNA sabit) |
| 2026-09-17 | **L2-C** | **Ruh hali kolu ölmüştü** — sahip bildirdi, ölçüm doğruladı: brief'te renk varken 6 ruh hali de aynı zemini, 3'ü bayt bayt aynı yüzü veriyordu. Üç bağımsız kısa devre üst üste binmiş: paletin ruh halini duymaması, `temperamentFor`'un sektörü stilden önce sorması, ve arketipin temperament'ı veto etmesi. Katmanlı model kuruldu: **brief hangi renkler, ruh hali o renklerin ne yaptığı, varyasyon aynı kararın yeni hali** | **619/619 SPA** · 0 lint · `moodAuthority.test.ts` sözleşmeyi çiviliyor · 6/6 farklı zemin, varyasyonda zemin sabit · 18 golden bilinçli güncel, **DNA 18/18 sabit** (renk katmanı iskelete sızmadı), 29 kit hash'i dokunulmadı |
| 2026-09-17 | L2-D | Önizlemenin zemini tasarımın rengini alıyordu — etikette stil değişince tasarımın *dışındaki* bant ve şişe camı da renk değiştiriyordu. İki kaynak: `renderPanelSvg` dolgulu alanı `palette.paper` ile dolduruyordu, `BottlePreview` camı paletten boyuyordu. Tabla sabit nötr, kap sabit cam, panele saç teli kenar | **624/624 SPA** · `previewMount.test.ts` · üretim dosyası etkilenmedi (ayrı yol) |
| 2026-09-17 | L2-E | Arayüz tek kola indi: "Stil" ve "Ruh hali" birleşti, Temperament kullanıcı kolu olmaktan çıkıp çıktı oldu. Renk kutucukları artık sabit örnek değil, **kullanıcının kendi brief renginden** türüyor — kredi harcamadan nereye gideceği görünüyor | `tsc` 0 · 624/624 · tarayıcıda altı kol da doğrulandı |
| 2026-09-17 | L2-F | **1 ödeme = 1 çekim = 6 varyasyon.** Çekim kimliği brief'in fiyatlanan alanlarından türüyor (`shotKeyOf`), `directionVariation` hariç. Hak sunucuda, bakiyenin yanında zorlanıyor: *farklı varyasyon* sayısı bitmask ile sayılıyor, böylece metin düzeltmek için aynı varyasyonu yeniden çizmek hakkı yemiyor. Aralık dışı indeks kırpılmıyor, reddediliyor (kırpsaydım 7. tasarım bedava gelirdi) | **640/640 SPA · 77/77 server** · `shot.test.ts` + `shotAllowance.test.ts` |
| 2026-09-17 | L2-G | Ruh hali kutunun **tamamını** yönetiyor. Yan/üst/kapak yüzleri `accent2`'den renk alıyordu — o yuva doku kardeşi, yüzey değil: siyah lüks kutunun yanları krem, modern kutunun yanları ön yüzden açık, eco kutunun yanları kahve çıkıyordu. `deep` artık gerçek bir palet rolü, zeminden türüyor, **ne kadar uzaklaşacağına ruh hali karar veriyor** (minimal az, klasik çok, zemini zaten koyu olan mod neredeyse hiç) | **653/653 SPA** · `deepSurface.test.ts` · 36 kombinasyonda 0 çakışma, 0 düşük kontrast · **18 golden sabit** (ön yüz değişmedi) |

| 2026-09-18 | L2-K | **Sessiz zemin yoktu.** Müşteri "varyasyon" dedikçe gelen her zemin kalabalıktı: yaprak, dalga, mermer damarı, mürekkep. `gradient-wash` — filtre değil gradyan durağıyla kurulmuş yumuşak alan; yeni renk uydurmuyor, salınımı zeminin kendi açıklığından alıyor. DNA listesine **sona** eklendi, çünkü varyasyon 0 golden'ın dondurduğu yer. Yol boyunca bulundu: **18 `paintBackground` çağrısından sadece 3'ü `d.background`'ı okuyor**, gerisi kendi ailesini sabit yazmış | `tsc` 0 · **667/667 SPA** · `gradientWash.test.ts` boyacının yönü gerçekten okuduğunu çiviliyor (hata geri konup testin düştüğü kanıtlandı) · **18 golden sabit** |
| 2026-09-18 | L2-K2 | OFL künyesi eksikti: `assets/fonts/OFL.txt` yalnız Montserrat'ın telifini taşıyordu. Cormorant ve Great Vibes satırları font dosyalarının `name` tablosundan okunup eklendi. Ayrıca doğrulandı — **font ikilileri müşteriye hiç dağıtılmıyor**, sadece `build-font-outlines.py` girdisi | `assets/fonts/OFL.txt` · fontTools ile telif satırları okundu |
| 2026-09-18 | **L2-L** | **İlk "çizilmiş özne" arketipi.** Repertuvardaki her görsel bir *dokuydu*; ortada duran bir özne kavramı yoktu. `speciesHero` + `specimen-hero` (kutu ve etiketin aynı arketipi paylaştığı tek aile) + `heroInk` palet eşlemesi. Marka ve ürün blokları **önce** ölçülüyor, çizime sadece gerçekten artan yer veriliyor; yer yoksa çizim düşüyor, tip düşmüyor. İki DNA düzeltmesi gerekti: `marble-frame` kremi 0.5 ile tanıma tabanının üstünde tutuyordu (yüz kremine taş levha), `specimen-hero` serumu 0.4 ile klinik bir B5'i alıyordu | `tsc` 0 · **674/674 SPA** · `speciesHero.test.ts` + `specimenHero.test.ts` · golden **5/18 bilinçli** (3 iyileşme, 2 nötr, 0 gerileme) · 0 ön yüz çarpışması |
| 2026-09-18 | L2-M | Çizici derinleşti: tür-özel **yaprak anatomisi** (6 dış hat + orta damar), **gravür modu** (dolgu yerine dış hat — aynı geometriden ikinci dil), **4 kompozisyon** tohumla seçilen (dal/filiz/çelenk/çapraz). Varyasyon artık rengi değil **resmi** değiştiriyor | `tsc` 0 · **685/685 SPA** · golden **DNA 0**, hash 2 |
| 2026-09-18 | L2-M2 | **7 yeni tür → 16** ve ilk çiçek dağarcığı (daisy/spike/umbel/cup/cluster). Her tür yaprak+meyveydi, yani mahsul dili; oysa Paxolab'ın en çok bastığı sektörler çiçekle konuşur. **Bal buğdaydı** → `blossom`. Kendi açtığım regresyon yakalandı: yeni türler `speciesTree` default'una düşüyordu, lavanta tarlası çam ormanı olurdu | `tsc` 0 · **688/688 SPA** · golden DNA 0, hash 3 · `data-bloom` işareti eklendi (uzunluk ölçen yanlış test atıldı) |
| 2026-09-18 | L2-N | Sahibin verdiği referans karton hedef alındı: **yaprak içi gradyan** (dipte koyu → uçta ışık, tek `objectBoundingBox` tanımı her yaprağı kendi ekseninde aydınlatıyor), **kıvrım**, gerçek **`corolla`** çiçeği (üst üste binen yuvarlak taç yapraklar + çizilmiş ercik), ve ilk **asimetrik `spray`** düzeni (yığın bir yanda, tek odak çiçek karşıda) | `tsc` 0 · **688/688 SPA** · golden DNA 0, hash 2 |

| 2026-09-18 | **Y-1** | **Yuvarlak etiket** — kavanoz kapağı / balm tin / sabun mührü; repertuvarda karşılığı olmayan format. `round-label` yapısı (disk paneli: sınır kutusu aynı, kesim çizgisi çember), `isDisc` ile geometriden tanınan yönlendirme, ve akorda duyarlı `paintRoundFace`. Sıralama doğru çalışıyor: 60×60 balm tinde **birinci (0.85)**, reçel kavanozunda ikinci, parfüm wrap'inde sonuncu | `tsc` 0 · **693/693 SPA** · `roundLabel.test.ts` · 5 brief × 4 çap: 0 çarpışma, 0 export hatası |

| 2026-09-18 | **Y-2** | **"Söylediğini çiz" değişmezi.** Daha önce "18 `paintBackground` çağrısından 15'i sabit yazmış, DNA dekoratif" diye rapor etmiştim — **ölçünce etki olarak yanlış çıktı**: tek zeminli DNA satırında sabit yazmak yalan değil, arketipin kendisi olması. Çok zeminli 8 arketipten **tam 2'si** yalan söylüyormuş. `dark-landscape` mermeri listeleyip hiç çizmiyordu → yön okunur oldu (siyah mermer parfüm kartonu iyi bir yüz çıktı). `line-scene` kartonu kâğıdı listeliyordu → burada boyacı haklı, **DNA yanlıştı**: bu yüz manzarayı yazının *üstüne* çiziyor, panel dolduran bir zemin markayı ve başlığı siliyor (render edip gördüm, boş karton) | `tsc` 0 · **701/701 SPA** · `backgroundPromise.test.ts` her çok zeminli arketipi tarıyor (mutasyonla düşürüldü) · **golden DNA 0, hash 0** |

| 2026-09-18 | **Y-3** | **Marka kiti** — askı etiketi (delikli, ayrı kesim yolu) ve teşekkür / bakım kartı. Cosmo araştırmasının 5. açığı: her paket bunları taşıyordu, Paxolab'da karşılığı yoktu. Üç kusur ölçerek bulundu: (1) kapılar regülasyon arkasını **`labelBack` adıyla** arıyordu, bu yüzden 8 parçanın hepsi 0 çarpışmayla export'tan dönüyordu — arka panel kimliği artık tek yerden; (2) 38×76 mm askı etiketinin arkasına **tam regülasyon paneli** basılıyordu (besin tablosu, içindekiler, barkod, 32 eleman — hepsi sığdığı için ledger temiz diyordu) → `paintKitBack`; (3) kart, şekilce yakın olduğu için parfüm etiketine 2. sırada teklif ediliyordu — **skoru kurcalamak yanlış levyeydi** (alt ürün daraltmak durumu kötüleştirdi), kit parçaları artık brief adını anmadıkça havuza girmiyor | `tsc` 0 · **705/705 SPA** · `brandKit.test.ts` (üç kusurun üçü de mutasyonla kanıtlandı) · **golden DNA 0, hash 0** |

| 2026-09-18 | **Y-4** | **Ürün hattı** — ve rapor ettiğim açığın çoğu zaten kapalıymış. Ölçtüm: bir brief'in kutusu, etiketi, kapağı, askı etiketi ve kartı **aynı aile, aynı zemin, aynı mizaç, aynı tipografi, aynı renkler** ile geliyor; arketip sadece yüzeye göre değişiyor. `studioFamily` damgalama mekanizması çalışıyor. Dört SKU'luk bir seri de kardeş çıkıyor. **Gerçek kusur başkaydı:** her SKU farklı *kompozisyon* alıyordu (rozet / çapraz / çelenk / filiz), çünkü düzen seed'i ürün adını taşıyor — rafta dört ayrı ürün gibi okunur. `lineSeed` eklendi (marka + yüzey + varyasyon, ürün adı hariç): kardeşler düzeni paylaşıyor, varyasyon hâlâ resmi değiştiriyor. Bunun bedeli çiçeklerin kaybolmasıydı (çelenk çiçek çizmiyordu) → çelenk artık çiçekli, yani **aynı çelenk farklı çiçek** | `tsc` 0 · **705/705 SPA** · golden **DNA 0**, hash 2 · `scripts/product-line-sheet.ts` |

| 2026-09-18 | **F-1** | **Yön üç eksen daha kazandı: tip ikilisi, çerçeve, süs.** Bunlar arketipin *özelliğiydi* — DNA satırı tek `typePairing`, tek `frame` taşıyordu ve ön yüz boyacıları `thinDoubleFrame`'i adıyla çağırıyordu; brief, beyin ya da müşteri ne derse desin bir mermer yüz ömrü boyunca aynı kenarı giyiyordu. Artık her satır **izin verdiklerini** listeliyor (`typePairings/frames/ornaments`), varyasyon listeyi geziyor, ipucu arketip izin veriyorsa kazanıyor, boyacılar yönün kararını çiziyor (`paintFrame`). Üç yeni çerçeve dili: `band-hairline` (Diako plaka kenarı), `fleuron-crown` (Heeva köşe süsleri), `bezel` (disk/oval jant). Süs seviyesi zemine **kazanç** olarak iniyor (`ornament` → `gain`), tipe değil — hiyerarşi kuralı yerinde. Ölçüm düzeltti: tavan 1'de `rich` mürekkep panelinde `measured` ile bayt-bayt aynıydı, tavan 1.25 oldu ve sayaç harcayan boyacılar (bant, damar, benek) gerçekten zenginleşiyor | `tsc` 0 · **711/711 SPA** · `directionAxes.test.ts` (6) · **golden DNA 0, hash 0** — varyasyon 0 her listenin ilkini alıyor, ilk giriş eski sabit değer |

| 2026-09-18 | **F-2** | **STİCKERR REF alımı.** 19 parfüm etiketinden 5'i tutuldu (sahip 1-3-4'ü çıkardı). İkisi arketip oldu: `atelier-plate` (Diako — **üç katlı tip plakası**: marka / ürün + konsantrasyon / imza satırları, kısa kurallarla ayrılmış, bant+saç teli kenar) ve `crest-panel` (Azzurra — **düz arabesk zemin** üzerinde madalyon ve arma; `arabesque` repertuvardaki ilk *geometri* zemini, doku değil). İkisi çerçeve oldu: `fleuron-crown` (Heeva) ve `bezel` (Raavi) — bezel için **oval kesim** geldi: `oval-label` yapısı, `fm-label-oval` şablonu, yuvarlak boyacı elipse genelleştirildi (disk formülleri bire bir korundu, hash oynamadı). **Dogwood & Fir hiçbir şey vermedi**: ayırt edici hamlesi ürünü markanın üstüne koymak, sahibin kuralı hiyerarşi gevşemez. Kabartma alınmadı — o mockup'ın işi. Parfüm **kopya katmanları**: `concentration` (EDT/EDP/extrait kanonik yazım, banka satırını geçer), `edition`, `attribution`, `origin` — plaka çizer, kart yok sayar. Metalik: rose gold / pirinç / platin isimleri + **`foilOn`** (koyu zeminde rose gold kontrast tabanını geçemeyince motor vurguyu *kâğıt rengine* çeviriyordu — folyo artık tonu açılarak kalıyor, rengi değişmiyor). İki ölçüm düzeltti: (1) plaka yüzün üstünden sarkıyordu (kartonda %27'de bitiyordu) → sonda ledger ile ölçülüp **optik merkeze** oturtuldu; (2) yeni arketiplerin sektör ağırlıkları tanıma tabanının üstündeyken **7/18 golden oynadı** (parfüm olmayanlar — yürüyüş indeks tabanlı) → parfüm dışı sektörler 0.28'e çekildi, plakalara parfümde yürüyüşle, başka yerde brief sözcüğü / beyin ipucuyla ulaşılıyor | `tsc` 0 · **728/728 SPA** · `refPlates.test.ts` (13) · **golden DNA 0, hash 0** · `scripts/ref-plates-sheet.ts` → `public/_ref/` · `scripts/diff-studio-golden.ts` (yalnız oynayan satırları basar) · iki elle yazılmış format listesi daha katalogdan türetildi |

| 2026-09-18 | **F-3** | **Tasarım beyni stüdyoya bağlandı.** `createPlan` her üretimde tip otoritesi, görsel niyet, süs bütçesi, boşluk, metalik rolü üretiyordu ve stüdyo yolu **hiçbirini okumuyordu** (audit bulgusu). `studioPlanBridge`: plan → yalnız üç eksene ipucu (tip ikilisi / çerçeve / süs) — arketipe, zemine, mizaca **asla**; ekstralarda **ilk sırada**, yani bilgi ve müşteri her anahtarda beynin önüne geçiyor. Sıralamaya küçük `intentFit` terimi (0.05): havuzu sıralar, sektörü yenemez. Eşleme gerçek plan üzerinden: luxury → aralıklı serif + (arketip izin veriyorsa) plaka kenarı; minimal/modern → quiet + kenarsız + hafif sans; playful ve yüksek bütçe → rich. **Golden bilinçli oynadı: 11 hash, 1 DNA** (minimal sağlık kartonu ink-wash → diagonal-tech; etiketi zaten diagonal-split'ti, çift artık aynı ailede). Her oynayan yüz `scripts/golden-sheet.ts` ile render edilip okundu, sonra tablo yeniden yazıldı. Yol boyunca yanlış iddiam düzeltildi: "0.05'te golden oynamaz" yazmıştım, ölçüm 1 DNA gösterdi — yorum ölçüme göre değişti | `tsc` 0 · `studioPlanBridge.test.ts` (7) · golden tablosu + gerekçe paragrafı güncellendi |

| 2026-09-18 | **F-4** | **LLM sanat yönetmeni sözleşmesi 3 → 6 karar.** Model yalnız arketip / zemin / mizaç isteniyordu; yönün yeni öğrendiği üç eksende (tip ikilisi, çerçeve, süs) sesi yoktu. Sözleşme genişledi, her yeni anahtar eskilerle **aynı kapıdan** geçiyor (bilinmeyen değer düşer, asla zorlanmaz; yalnız yeni eksenlere konuşan yanıt da yön sayılır). Prompt yeni arketipleri ve `arabesque`'i adlandırıyor, müşterinin serbest metni (`story`) yönetmene gidiyor. İç içe iki `try` kaldırıldı. Yol boyunca: `ALL_BACKGROUNDS` elle yazılmış listeydi ve `arabesque`'i bilmiyordu — boyacı, DNA ve testler biliyordu, kapı ve prompt bilmiyordu → liste artık union'dan **türetiliyor** (`Record<BackgroundFamily, true>`), eksik üye derlemede patlar. F-3'ün üç regresyonu da burada ölçülüp kapatıldı: (1) `stackedLockup` sarma kararı 1.5 mm tabanla ölçüp 2.4 mm tabanla çiziyordu — 38 mm yüzde 44.8 mm'lik marka; (2) 40 mm diskte script öneki ürünü net miktara itiyordu → küçük diskte önek yok, miktar ürünün altına; (3) `directorCue` artık plan köprüsüyle stüdyoya ulaştığı için "hash değişmez" testi "DNA değişmez"e çevrildi | `tsc` 0 · `studioContract.test.ts` +2 · golden **DNA 0, hash 0** (F-3 tablosuna göre) |

| 2026-09-18 | **F-5** | **Sohbet beş alanlık form olmaktan çıktı.** Brief derinliği: `audience`, `channel`, `priceTier` (kapalı: mass/mid/premium/boutique), `feeling`, `avoidLike` — laf arasında söylenince kaydediliyor, **hiçbiri soru sormuyor** (kritik liste aynı, kayıt testleri tur kazanmadı). Sezgisel çıkarım Türkçe ek ve ünlü farkındalığıyla (`\b` ASCII'dir: "Genç kadınlara" "kadın" çıkıyordu → Unicode harf çiti + ek listesi); LLM brief çıkarımı aynı anahtarları alçak kaynakla taşıyor, geometri kapısından geçiyor, fiyat katmanı kapalı enum. **~20 tasarım komutu** (`parseDesignCommands`): çerçeve (kaldır / ince çift / bant / köşe süsü / parantez / jant), süs (azalt / zenginleştir / ölçülü), tip ikilisi (aralıklı serif / serif başlık / el yazısı / sans), lockup (ortala / sol kolon / monogram sağ / rozet), parfüm katmanları (EDT olsun / edisyon / imza / menşe) — hepsi yönün zaten okuduğu anahtarlara iniyor, `isIteration` bunları tanıyor. Derinlik yüze ulaşıyor: `hintsFromBriefDepth` — ekonomik segment / sakin his → quiet, butik / gösterişli → rich; plan ipucundan güçlü, müşteri komutundan zayıf. **Ölçülen hata:** aile sözcüklerini komut ayrıştırıcıda da işlemeye kalktım — "ink tasarımından daha teknik" cümlesi ilk takma adı (ink) sabitleyip aynı turda vetoladı; aile sözcükleri `parseDirectionTalk`'ta kaldı, yeni aileler oraya takma adla girdi, "X gibi … yap" / "… ekle" kalıpları sabitleme sayıldı | `tsc` 0 · `briefDepth.test.ts` (9) · golden **DNA 0, hash 0** |

| 2026-09-18 | **F-6** | **Yön şeridi adayı gösteriyor, renk kutucuğunu değil.** İki ikinci yön "mizaç kutucuğu + aile adı" olarak duruyordu; müşteri "botanik"in kendi brief'inde ne demek olduğunu görmek için kredi harcıyordu. `paintStudioFront`: yalnız ön yüz, aynı boyacılar, seçili olmayan satırlara `face` (tam panel SVG) — seçili satır tasarımın kendisi, o boş. Üretim değil: ledger yok, onarım döngüsü yok, **kredi modeli aynı**. Şerit `face` varsa küçük resim, yoksa eski kutucuk. Elite Brew kartonu ve Verda etiketi için üç aday da render edilip okundu (`public/_offer/`) | `tsc` 0 · **749/749 SPA** · `studioOfferFaces.test.ts` (3) · golden **DNA 0, hash 0** |

| 2026-09-18 | **F-7** | **Görme kanalı.** LLM'in her kanalı metindi; model hiç boyanan yüzü görmüyordu — stüdyonun en son verdiği yargı ("okunuyor mu?") ledger'a kalıyordu, ledger çarpışmayı sayar ama temiz-ama-yanlış yüzü göremez. `StructuredRequest.images` + çok modlu mesaj parçaları (OpenAI uyumlu; `data:` URL, hiçbir şey yüklenmiyor), üç görev: `vision-critique` (render edilmiş ön → okunurluk / denge / hiyerarşi / ≤3 sorun / yönün **kendi eksenlerinde** öneri), `vision-reference` (müşteri referansı → kapalı sözlük yön ipuçları + ≤3 hex), `vision-compare` (iki ön → hangisi, neden). Her enum yönetmenle aynı kapıdan; serbest metin kısaltılıp geometri/hex taraması; rasterleştirici **enjekte** (tarayıcı canvas → PNG; test/sunucu stub, motor DOM'a dokunmuyor). Kritik yüze **teklif** olarak iniyor: `StudioCriticKind` +`vision`, her teklifin `utterance`'ı müşterinin yazabileceği bir tasarım komutu ("süsü azalt", "çerçeveyi kaldır") → "önerini uygula" aynı ayrıştırıcıdan geçiyor. Uygulama: üretim bitince asenkron, sessiz-hata, `design.critic` eylemi `generatedAt` ile aynı üretime kilitli | `tsc` 0 · `visionContract.test.ts` (7) · golden **DNA 0, hash 0** |
| 2026-09-18 | **F-8** | **Kalite döngüyü kapatıyor.** (1) `scoreVisualCraft` hep hesaplanıp hiç danışılmıyordu — 30 puanlık temiz yüz 75'lik gibi çıkıyordu. Artık **kapı**: ledger temiz ama puan `STUDIO_CRAFT_FLOOR` altındaysa sonraki 3 arketip denenir, yalnız temiz **ve** daha yüksek puanlıysa alınır (sınırlı, tek yönlü). Taban 50 — 18 golden yüzde ölçülen aralık 57–76, tablo dokunulmadan kalıyor. (2) Bilgi tabanı üç eksene konuşuyor: `studio-typePairing / studio-frame / studio-ornament` öneri türleri, `studioHintsFromKnowledge` güven ≥ 0.6'da sabitliyor (kaçınma yalnız gerekçe — eksen başına veto listesi uydurulmadı); anahtar/ilişki/UI açıklamaları switch ile tam. (3) `DesignKnowledgeRule.principle`: öğrenilen kural arkasındaki **ilkeyi** taşıyor (`principleForRecommendation` → `principleForCriticTopic` tablosu tek kaynak): sessiz süs / kenarsız / ağır motiften kaçınma / sıkılaştırma ipucu = "boşluk lükstür", yığılmış motif = "tek motif ailesi" | `tsc` 0 · `craftGate.test.ts` (4) · golden **DNA 0, hash 0** |

| 2026-09-18 | **F-9** | **Lansman öncesi uçtan uca deneme — testlerin görmediği üç kusur.** 784 test, 85 sunucu testi ve temiz derleme yeşilken uygulamayı tarayıcıda gerçekten kullandım; üç hata çıktı. (1) **İlk turdaki brief yutuluyordu:** yön-konuşma kolu brief çıkarımından önce çalışıyor ve tasarım yokken erken dönüyordu — "Verda krem etiketi, botanik olsun" cümlesi "yeniden çiziyorum" cevabı verip **marka, sektör, ölçüyü atıyordu**; ölçüldü, dört sıradan ilk mesajın üçü böyleydi. Kök neden bugünkü F-5'te `PIN_FAMILY`'ye eklediğim `(ekle\|olsun\|yap\|çiz)$` kalıbı; ayrıca kolun kendisi yapısal tuzaktı. İkisi de kapatıldı: emir fiili artık aile adına **en fazla iki kelime** uzaklıkta olmalı (`familyCommandIn`), ve tasarım yokken tur yutulmuyor — aile korunup brief aynı cümleden okunmaya devam ediyor. (2)+(3) **Cevaplanan alan sezgiye yeniliyordu:** `applyExtraction` önce soruya verilen cevabı (`assignAwaiting`), sonra cümleyi tarayan sezgiyi (`extractFields`) birleştiriyordu — sonra gelen kazanıyor. Sezginin kuralı marka için `words[0]`, ürün için "ilk kelimeden sonraki ilk ad". Sonuç: **"Fleur de Nuit" → "DE"**, "Rose de Mai" → "de", "Gece Çiçeği" → "Çiçeği", **"Elite Brew" → "Elite"**, "Verda Botanicals Apothecary" → "Verda". Çok kelimeli her marka/ürün adı ambalaja bozuk basılıyordu — hem de sayfanın en büyük puntosunda. Doğrudan cevap artık sezgiyi eziyor | `tsc` 0 · **784/784 SPA · 85/85 sunucu** · `firstTurnBrief.test.ts` (9, mutasyonla kanıtlandı) + `answeredFieldWins.test.ts` (14) · golden **DNA 0, hash 0** · tarayıcıda uçtan uca doğrulandı (oval etiket + atelier-plate + boyalı aday şeridi) |

| 2026-09-18 | **F-10** | **Eğri kesimli etiketlerin arka yüzü ve çalışma alanı.** Sahip bildirdi: yuvarlak/oval tasarımlarda özellikle arkada bozulma, önizleme küçük, arkada "siyah ve beyaz iki katman". Dördü de gerçekti. (1) **Arka yüz kesimi yok sayıyordu:** ön yüz `isRound` ile `paintRoundFace`'e sapıyor, arka sapmıyordu — regülasyon paneli sınır kutusuna diziliyordu. Ölçüldü: 60 mm kapakta **7**, 70×45 ovalde **5** köşe kesim dışı, en kötüsü barkod **%117 / %121** yarıçap — bıçağın ötesine mürekkep. Yeni `paintRoundBack`: başlık en geniş kirişte, orta bantta regülasyon, işaretler merkez ekseninde; **her genişlik çizildiği y'deki kirişten** alınıyor. Dikdörtgeni yazılı kutuya sıkıştırmak yerine formata ait kompozisyon. (2) **Gıdada tablo zorunluymuş:** sadeleştirirken besin tablosunu düşürdüm, `ds-food-family` kapısı zeytinyağı ovalinin export'unu **haklı olarak** blokladı — tablo geri geldi, tipografi baskı tabanına kadar küçülerek iki satır banda sığıyor. (3) **Önizleme iki dikdörtgen katman çiziyordu:** kâğıt dolgusu ve kenar çizgisi `<rect>` idi, yani yuvarlak etiketin arkasında beyaz kart + dikdörtgen kontur; ikisi de artık panelin **kendi poligonunu** izliyor, tabla da merkezden büyütülmüş aynı hat — yuvarlak etiket yuvarlak tabla üzerinde. (4) **`preserveAspectRatio="none"`** kabı doldurmak için X/Y'yi bağımsız geriyordu — daire yumurtaya dönüyordu; `xMidYMid meet`. (5) Etiketler önizlemede 360 px ile sınırlıyken kutular 420 px alıyordu → eşitlendi. **Boşluk dersi:** `roundLabel.test.ts` beş brief × dört çapı tarıyordu ama yalnız `frontPanelId`'ye bakıyordu; yeni `labelBackShapes.test.ts` **her aktif etiket şablonunu ön+arka** tarıyor, kapsama poligon-içi testiyle (dikdörtgen, yuvarlatılmış dikdörtgen, disk, oval hepsi) | `tsc` 0 · **802/802 SPA · 85/85 sunucu** · `labelBackShapes.test.ts` (17, mutasyonla kanıtlandı: eski yönlendirme 5 test düşürüyor) · golden **DNA 0, hash 0** · uygulamada ön+arka doğrulandı |

| 2026-09-18 | **F-11** | **Çalışma alanı ve eğri arka yüzün tamamlanması.** Sahip: "etiketin etrafı neden beyaz, neden tam boyutu gösterilmiyor? arka düz etiketlere göre çok boş." (1) **Tabla kaldırıldı.** Açık renkli tasarımın sınırı görünsün diye konan nötr kart, kazandırdığından çok götürüyordu: diskin/ovalin arkasında dikdörtgen bir kart olarak okunuyordu ve her kenardan 6 mm — 70×45 ovalde genişliğin **%17'si** — boşluğa gidiyordu. Yerine editörlerin yaptığı şey: kesim hattı üzerinde **tek ince çizgi**, koyu tuvalde okunacak kadar açık. `PREVIEW_PAD` 6 → 1.2. (2) **Önizleme sabit 420 px tavanındaydı;** ölçüldü, 924×675 tuvalde etiket genişliğin %45'ini, yüksekliğin %41'ini kaplıyordu. Piksel tavanı odanın ne kadar olduğunu bilemez — sarmalayıcı yuvayı alıyor, `xMidYMid meet` oranı bozmadan sığdırıyor: **%99**. (3) **Eğri arka doldu:** düz etiketin taşıdığı yazmaçların aynısı (kullanım, uyarı, içindekiler, üretici) ve piktogramlar barkodun **yanına** alındı — üstünde ayrı bant yiyorlardı, 70×45 ovalde metne 9 mm kalıyordu. Başlık 0.72'ye çıkarıldı, orta bant metne verildi. (4) Yol boyunca `legalColumn`'da gizli bir kusur: `Math.max(1, …)` yer olmasa da bir satır çizmeye zorluyordu — yüksek dikdörtgen arkada zararsız, dar bantta çarpışma; 40 mm kapakta regülasyon sütunu barkodun üstüne biniyordu. `maxBottom` artık söz, ipucu değil: başlığı **ve** bir satırı sığdıramayan bölüm hiç başlatılmıyor. (5) Yuvarlak ön yüzde metin madalyonun *yarıçapının* 1.72 katına kadar çizilebiliyordu — madalyonun yalnız merkezinde olan bir genişlik; marka satırı yukarıda olduğu için çelenge taşıyordu. Aynı kiriş disiplini madalyona uygulandı (`medChord`) | `tsc` 0 · lint 0 · **803/803 SPA · 85/85 sunucu** · golden **DNA 0, hash 0** · `previewMount.test.ts` yeni sözleşmeye göre yeniden yazıldı (tasarımın dışında hiçbir şey çizilmez) · uygulamada ve tam boy render'da doğrulandı |

| 2026-09-18 | **F-12** | **Lansman taraması: formatlar, aşamalar, katalog.** Sahip son kontrol istedi. Üç tarama yazıldı (etiket formatları, stil/mizaç/varyasyon/yön, katalog × sektör) ve ölçüm dört kusur daha çıkardı. (1) **Hiyerarşi ters dönüyordu:** `productStack`'in alt sınırı sabit 2.6 mm; yüz darken marka kendi tabanında (2.4) kalıyor, ürün onu geçiyordu — 40 mm kapakta "Verda Botanicals" ile ölçüldü. Ürünün tabanı artık kendi tavanına (secondaryMax) boyun eğiyor; mutlak olan yalnız baskı tabanı. (2) **Askı etiketinin arkası** taşıyordu: üretici satırı baskı tabanında bile sığmıyordu (39.3 mm / 30 mm) ve `spacedLine` yine de çiziyordu → sığmıyorsa sarılıyor; sarınca QR'a çarptı → ayak önce ölçülüp QR kalan yeri alıyor. Her satır artık `spanAt` ile **çizildiği y'deki kesim genişliğine** göre ölçülüyor (yuvarlatılmış köşe de dahil). (3) **Katalogun önerdiği 41 kombinasyonun 8'i export'ta blokluydu** — beşte biri. Dört ayrı sebep: kısa kutu arkasında hikâye metni zorunlu bloğun yerini yiyordu; sektör blokları (nota/besin) aynı ters önceliğe sahipti; arka başlığı yalnız genişliğe göre ölçekleniyordu (40 mm arkanın 18 mm'si); ve kapı `İÇERİK` ararken boyacı `İÇİNDEKİLER` yazıyordu. Pay artık hedef değil **taban** (`legalTop` kıstırması — 0.08 mm'lik fark bile bölümü düşürüyordu). **8/41 → 0/41.** (4) Nota piramidi sütun başlıkları sütuna sığdırılmıyordu; 45 mm kartonda "TEPE NOTALAR" 15.5 mm / 13 mm sütun → üçü üst üste. Tabanda bile sığmadığı için kısaltıldı ("TEPE"), ki tablo zaten "KOKU PİRAMİDİ" başlığını taşıyor. **Yol boyunca kendi hatam:** kapı listesini genişletmek yerine değiştirdim, kit yolunun `İÇERİK`/`YANICI` sözcükleri düştü ve 14 donmuş kit parmak izi birden kızardı — iki boyacının ortak sözlüğü yok, kapı ikisini de bilmeli | `tsc` 0 · lint 0 · **862/862 SPA · 85/85 sunucu** · golden **DNA 0, hash 0** · `catalogExports.test.ts` (46: katalogun önerdiği her kombinasyon export ediyor) + `studioStages.test.ts` (13: mod/ton/varyasyon/yön kuralları) · audit: `docs/PAXOLAB_LAUNCH_AUDIT.md` |

| 2026-09-18 | **F-13** | **Peyzaj kaldırıldı, çizim sektöre bağlandı, başlat dört tasarım açıyor.** Sahip üç şey söyledi ve üçü de aynı şikâyetin parçasıydı: balı seçince peyzaj geliyor, peyzaj vasat, ve müşteri tek yüzle değil bir seçkiyle karşılaşmalı. (1) **`landscape` ailesi tamamen çıktı** — iki arketip (`landscape-window`, `landscape-badge`), `landscape-meadow` zemini, sektör sabitlemeleri, `paintLandscapeWindowFace` / `landscapeBadge` boyacıları ve artık kullanılmayan importlar. Ölçüldü: kaldırmadan önce 93 üretimin **25'i (%27)** bu aileydi. Ay ışıklı karton ilk turda **adlandırma gerekçesiyle** kurtulmuştu (arayüz o aileye "peyzaj" değil "karanlık lüks" diyor) — gerekçe tutmuyordu: boyacı dağ silsilesi, çam ve göle vuran ay yansıması çiziyordu, menüdeki ad ne olursa olsun bu bir peyzaj. Zemin de gitti, arketip `dark-landscape` → **`noir-stack`** olarak yeniden adlandırıldı, çünkü eski ad yönetmen modeline ve sonraki okuyucuya sahne sözü vermeye devam ederdi. Aile duruyor: siyah + altın, artık **arabesk** zemin üzerinde (denendi: `gradient-wash` düz karanlık dikdörtgen okunuyordu, `ink-wash` ayağa yapışan altın kütle çiziyordu — yani kaldırılan şeyin ta kendisi). (2) **Kahraman çizim sektöre ait:** bal artık papatya çiçekli dalın üstünde **arı** taşıyor (`bee` ilkeli, `data-hero-mark="bee"`, yalnız `pollinator` bitkisinde); sağlık `conifer`'a düşüyordu — merhem kutusuna çam dalı — artık `chamomile`, kozmetik `flora`. (3) **Başlat dört tasarım açıyor:** `DIRECTION_OFFER_SIZE = 4`, `uniqueFamilyRows` dört ayrı aile veriyor, dördüncü sıra sayısı (`dördüncü`, `4. yön`) ayrıştırıcıda. Şeritteki **her satır boyanıyor, seçili olan dâhil** — F-6'da seçili satır "tasarımın kendisi" diye boş bırakılmıştı, bu şerit tek yüze alternatif listesiyken doğruydu; dört bitmiş tasarım birlikte sunulunca boş satır seçkide delik oluyor ve delik hep müşteriye gösterilen seçeneğe düşüyordu. Seçili satır yeniden boyanmıyor, **onarım döngüsünden geçmiş** yüz kullanılıyor. Sohbet cümlesi de dördünü birden sayıyor (önce "4 yön var" deyip üç ad sıralıyordu). **Yol boyunca bulunan gerçek kusur:** `volumeLine` `adet` / `kapsül` / `capsule` birimlerini tek dala toplayıp hepsine "kapsül" diyordu — galerideki kablosuz kulaklık kartonu brief'inde "1 adet" yazarken ön yüzüne **"1 kapsül"** basıyordu, İngilizcesi "1 capsules". Ne ledger, ne kapılar, ne golden hash bunu görebilirdi; yalnız yüzü okumak buldu | `tsc` 0 · lint 0 · **866/866 SPA · 85/85 sunucu** · `backgrounds.test.ts` "hiçbir zemin sahne çizmiyor" (mutasyonla kanıtlandı) + `volumeLine.test.ts` (4, mutasyonla kanıtlandı) · golden **5 satır oynadı** (01-parfum-kutu, 06-elektronik-kutu: noir-stack/arabesque; 04-gida-bal-kutu, 04-gida-bal-etiket, 07-bebek-kutu; 06-elektronik-etiket yalnız hash) · tarayıcıda uçtan uca doğrulandı: bal brief'i → dört boyalı aday (botanik çizim / dalga / botanik / atölye plakası), dördüncüyü seçmek REV 2'yi atölye plakası olarak çizdi, sayfanın hiçbir yerinde peyzaj yok, bal adayı arıyı taşıyor |

| 2026-09-18 | **F-14** | **Bir karton tek tasarımdır; dört tasarım bir seçim ekranıdır.** Sahip iki şey bildirdi. (1) **Dieline'da paneller birbirini tutmuyordu:** "ortası arma, yanları karanlık lüks". Gerçekti ve kaynağı tek satırdı — yan/arka/kapak yüzleri dokularını **elle yazılmış dört arketiplik bir listeden** seçiyordu; listede olmayan her arketip (`crest-panel`, `atelier-plate`, `specimen-hero`, `card-on-art`) düz renk levhaya düşüyordu. Arma kartonunda bu levha paletin **en koyu** tonuydu, kendi ön yüzü ise en açığı: ortada açık arabesk zemin üstünde madalyon, yanlarda iki koyu levha, arkada düz açık panel — aynı kutuya ait olmayan üç yüzey. Motorun hiçbir kapısı bunu göremezdi: her panel kesim içindeydi, çarpışma yoktu, export geçiyordu, donmuş hash tutuyordu. **Kusur ancak kutunun bütünü seviyesinde var** ve o seviyeye bakan hiçbir şey yoktu. Artık tek kural: yan, arka, kapak ve **kapak dili** yönün kendi zeminini taşıyor (arka en yoğun metni taşıdığı için 0.26 yoğunlukta fısıltı hâlinde). Bilerek ayrılan iki arketip var, ikisi de kendi DNA'sında yazılı: noir kartonun **mermer sırtları**, teknik kartonun **devre** deseni. `crest-panel` artık koyu yüzey listesinde değil — Azzurra referansı *düz* bir zemin, yani tek yüzey. (2) **Dört tasarım seçilmiyordu:** adaylar 34×44 px'lik bir şeritte duruyordu; o boyutta önizleme yoktur, sahip haklı olarak "tasarım önizlemeleri gelmiyor, kullanıcıya seçme hakkı sunulmalı" dedi. Yeni `DirectionChoice` ekranı üretim biter bitmez önizleme sütununun tamamını alıyor: dört boyalı ön yüz kart boyunda, her birinin altında aile adı, kendi sisteminin tek cümlelik tarifi (`dna.summaryTr`) ve ton; ekrandaki aday "EKRANDA" rozetiyle işaretli; bir tık seçiyor. Grid 2×2, sütun yeterince genişse tek sıra — **asla 3+1**, çünkü dördün biri tek başına alt satıra düşünce seçki "üç artı bir fazlalık" gibi okunuyor. Ölçü kabı pencere değil sütun (`container-type: inline-size`) — bu panel sohbetin yanında yaşıyor, pencere genişliği kaç kart sığdığı hakkında hiçbir şey söylemiyor. Ekran **üretim başına bir kez** açılıyor (`sameKind` testi): yön seçmek de bir üretim olduğu için, her seçimden sonra geri gelen bir seçim ekranı karar değil döngü olurdu. Şerit kalıyor ama artık sonradan geçiş aracı, 50×64 px | `tsc` 0 · lint 0 · **877/877 SPA · 85/85 sunucu** · `cartonCoherence.test.ts` (11: on ailenin her panelinde zemin = yönün zemini; mutasyonla kanıtlandı — yan yüz alanı kaldırılınca **10/10 düşüyor**) · golden **DNA 0 · hash 0** (değişiklik yalnız ikincil panellerde, tam olarak olması gerektiği gibi) · tarayıcıda uçtan uca doğrulandı: başlat → dört kart tek sıra → 1. kart → REV 2 specimen-hero → dieline'da tek tip karton |

| 2026-09-18 | **F-15** | **Dört yerine sekiz tasarım; yarım kalan ön yüz; ilk kullanım turu.** (1) **Teklif büyüdü.** Sahip "4 az" dedi ve tavanı sordu. Ölçüldü: havuzun mutlak tavanı görsel aile sayısı, **10** — 12 istendiğinde kutuda 10, etikette **9** dönüyor (`dark-luxe` ile `ink` etikette `ink-panel`'i paylaşıyor). Maliyet engel değil: on boyalı adayla tam üretim uçtan uca **10–20 ms**, ek yüz başına 1–2 ms, yüz başına 21–35 KB SVG. Yine de **8**'de duruldu, çünkü kuyruk teklif olmaktan çıkıyor: bal kartonunda sıralı skorlar 1.95 · 0.41 · 0.38 · 0.24 · 0.12 · 0.11 · 0.11 · 0.09 iken 9. 0.05, 10. **−0.03** — yani bir bal kavanozuna devre kartı deseni. Negatif skor, arketipin kendi DNA'sının o sektörü reddettiği anlamına geliyor; artık kart bile almıyor (`OFFER_SCORE_FLOOR`). (2) **2D'de kutunun ön yüzü yarım görünüyordu.** `.art-svg` yalnız genişlikten ölçülüyordu, yükseklik en-boy oranından düşüyordu ve sahne `overflow: hidden` ile kırpıyordu. Ölçüldü: 70×120 mm kutu, 1366×768 ekran → çizim 642 px, sahne 478 px, **tasarımın %74'ü görünüyor**. Yalnız kutularda çünkü etiketler geniş. Sarmalayıcı artık viewBox'ın kendi oranını taşıyor (`Preview2D` satır içi veriyor) ve `max-height` işini yapıyor: **%100**. Gölge de sarmalayıcıdan çizimin kendisine taşındı, yoksa dar eksende kutu çizime oturmuyordu. (3) **`line-scene` sektöre bağlandı.** Sabit bir deniz manzarası çiziyordu — güneş, ufuk, dalgalar, üç yelkenli, bulutlar, iki palmiye, şemsiye, kum çizgisi — ve bunu bal, deterjan, bebek şampuanı için aynen tekrarlıyordu. Peyzaj temizliğinden "adı peyzaj değil" diye kurtulmuştu, sektör testlerinden de sektörü hiç okumadığı için. Artık alt yarıda ürünün kendi türü, sistemin zaten konuştuğu gravür çizgi dilinde; altında düz bir ince kural (ufuk değil). (4) **İlk kullanım turu.** Stüdyo ilk tasarımı verip susuyordu; yön değiştirme, ruh hali, metin, kesim planı, 3D ve üretim hep basılmak için sebep olmayan bir sekmenin arkasındaydı. `Coach`: her adım gerçek bir kontrolü `data-coach` ile hedefliyor, ekranda olmayan adımı işaret etmek yerine atlıyor, tarayıcı başına bir kez açılıyor, üst barda "Tur" ile yeniden çalışıyor. Adımlar yüzeye göre: etiket metnini 2D'de düzenliyor, kutu dieline'da — tek ortak liste kutunun metin adımını sessizce düşürüyordu | `tsc` 0 · lint 0 · **878/878 SPA · 85/85 sunucu** · `backgrounds.test.ts` +"özne çizen zemin brief'in öznesini çizer" · golden **DNA 0 · hash 0** · tarayıcıda doğrulandı: 8 kart / 4 sütun / hepsi boyalı · 2D ön yüz %100 · tur 5 adımın beşini de buluyor |

| 2026-09-18 | **F-16** | **İki aile bir adı paylaşıyordu; yön şeridi hem büyük hem dardı; sıralama tıklandıkça oynuyordu.** (1) **Ad çakışması.** `botanical` "botanik", `specimen` "botanik çizim" diye geçiyordu — biri bir ad, diğeri aynı ad artı bir kelime. Sahip şeride bakıp botanik ailesinin nereye gittiğini sordu, oysa iki kart ötede duruyordu: bir kelimeyi paylaşan iki sistem iki seçenek olarak okunmuyor. Birbirinin varyantı da değiller — `botanical` woo.originals sistemi (tek ton botanik zemin, beyaz başlık kartı, koyu iddia bandı, yanlarda fayda listesi, **arkada tam legal düzen** — sahibin hatırladığı "arkası farklı olan" bu), `specimen` ise çizim motoru. Artık **"botanik kart"** ve **"illüstrasyon"**; takma ad sözlüğünde iki kelimelik biçimler tek kelimeden **önce** eşleşiyor, yani eski alışkanlık ("botanik çizim") hâlâ doğru yere gidiyor. Botanik kartın tarifine arka yüzü de eklendi, çünkü sahip aileyi oradan tanıyor. (2) **Sıralama oynuyordu.** İki ayrı kusur aynı belirtiyi veriyordu: teklif canlı sıralamadan kuruluyordu, sıralama en-uygun-önce, ve bir tasarım seçmek o aileyi sabitleyip başa taşıyordu; ayrıca aynı sabitleme skorları kaydırıp **kesim çizgisindeki aileyi kümeden atıyordu** (ölçüldü: bal kartonunda `marble` ya da `crest` seçmek `ink` yerine `dark-luxe` getiriyordu). Teklif artık aile tablosunun sabit sırasında diziliyor **ve** hiçbir şey seçilmemiş gibi sıralanıyor; öneri, hangi adayın `selected` geldiğiyle taşınıyor. Ölçüldü: sekiz ailenin sekizinde de **sıra 0/8 oynuyor, küme 0/8 değişiyor** (önce 2/8 ve 2/8 idi). Böylece sohbetteki "3. yön" bir tık sonra da 3. kart demek. (3) **Sıra numarası ayrıştırıcısı 4'te kalmıştı** — teklif 8'e çıkmıştı ama "6. yön" hiçbir şeye çözülmüyordu; hem yazılı sıra sayıları hem rakamlar gerçek uzunluğa genişletildi, "sonuncu" da eklendi. (4) **Şerit yeniden tasarlandı.** Şerit ve tam ekran seçim aynı işi iki boyutta yapıyordu; sekiz aday × (küçük resim + numara + aile adı) hem derin hem sıkışık bir bant üretiyordu. İş ayrıldı: **seçmek** seçim ekranında, **fikir değiştirmek** şeritte. Şeritte yalnız yüzler (38×46 karo, köşede numara), solda o an ekranda olanın adı, sağda seçim ekranını geri açan "Tümü". Bant yüksekliği **~120 px → 67 px**, 1440 px'te yatay taşma yok | `tsc` 0 · lint 0 · **881/881 SPA · 85/85 sunucu** · `directionOfferStable.test.ts` (3: seçim sırayı da kümeyi de oynatmıyor, index = konum) · golden **DNA 0 · hash 0** · tarayıcıda doğrulandı: şerit ve seçim ekranı aynı sırada, "Tümü" 8 kartı geri açıyor, adlar "botanik kart" / "illüstrasyon" |

| 2026-09-18 | **F-17** | **Etiket paritesi: arka yüzler, yapıştırma payı, karanlık lüks etiketi.** Sahip kutu tarafındaki kontrollerin etikette de yapılmasını istedi; üç kusur çıktı, ikisi iki kapı tarafından yakalandı. (1) **Etiket arka yüzleri görsel sistemi taşımıyordu** — `paintLabelBack`, `paintRoundBack` ve `paintKitBack` üçü de çıplak `ground()` ile başlıyordu, oysa on iki etiket ön yüzü de yönün zeminini seriyor. "Ön + arka etiket seti" açılınca dokulu ön, düz arka: aynı ürüne ait olmayan iki yüzey. Kartondaki F-14 kusurunun birebir aynısı, ve etiketi denetleyen test olmadığı için iki tur daha yaşadı. Kural artık tek yerde: `panelField.ts` (`secondaryField` + `fieldPalette` + panel rolüne göre yoğunluk/bastırma tablosu), iki taraf da oradan okuyor. (2) **Wrap etikette ön yüzün sağındaki bant.** Sahip "2D'deki gibi durmuyor" dedi, haklıydı: `wrapLabel` ön panelin sağına yapıştırma payı ekliyor, 2D yalnız `label` panelini çiziyor, Set tüm dieline'ı. İlk çözümüm payı ön yüzün alanıyla doldurmaktı — **`glue-art` kapısı reddetti, doğru olan oydu**: yapıştırıcı mürekkebin üstünde tutmaz. Pay artık hiç boyanmıyor; dieline kroması onu taralı çiziyor ve **"YAPIŞTIRMA PAYI"** yazıyor, yani üretim payı olarak okunuyor, boş tasarım alanı olarak değil. (3) **`dark-luxe` etikette ulaşılamıyordu** — `ink` ile aynı `ink-panel`'i paylaşıyordu ve teklif aileye göre tekilleştirdiği için etikette havuz 9'da kalıyordu; müşteri kutuda seçtiği "karanlık lüks"ü şişede bulamıyordu. Yeni `noir-plate` arketipi (derin zemin, ortada dikey kilit, ayağın üstünde slogan) etiketi de 10'a çıkardı. İlk DNA'sı fazla cömertti, krem etiketini `card-on-art`'tan ve elektronik etiketini `diagonal-split`'ten aldı — yeni bir arketip boşluk doldurur, komşusunu ilhak etmez; sektör uyumları daraltıldı ve golden tablo yerinde kaldı. Ayrıca `ds-label` kapısı yeni boyacıyı **dikiş işareti çizmediği için** blokladı, o da eklendi | `tsc` 0 · lint 0 · **893/893 SPA · 85/85 sunucu** · `labelCoherence.test.ts` (11: sekiz formatta ön/arka aynı zemin, pay temiz kalıyor, on ailenin onu da etikette çiziliyor — mutasyonla kanıtlandı: alan geri alınınca **8/8 düşüyor**) · golden **DNA 0 · hash 0** · dört formatın seti render edilip okundu |

| 2026-09-18 | **F-18** | **Ton yön seçiminde kayboluyordu; Set'ten yapıştırma payı kaldırıldı; baskıya hazır çıktı Türkçe adlara kapalıydı.** (1) **Ton.** Sahip tonu koyu lükse alıp şeritten başka bir yön seçince tasarım açık lüks dönüyordu. `onDirectionPick` `studioTemperament`'i **siliyordu**, bir sonraki üretim de tonu yeni arketipten yeniden tahmin ediyordu. Yön seçimi iskelet hakkında bir karardır, renk hakkında hiçbir şey söylemez; müşterinin rengini sessizce geri almak aracın seninle tartışması gibi okunuyor. Ekrandaki ton artık seçimle birlikte taşınıyor. Kural iki yarımlı ve ikisi de taşıyıcı: taşınan ton **kilitsiz** gidiyor ve bir sonraki ruh hali değişimi onu bırakıyor, ton kontrolünden **seçilen** ton ise `studioTemperamentLocked` ile tutuluyor — ikinci yarım olmasa ton seansın geri kalanında donar ve ruh hali knob'u rengi bir daha hiç oynatamazdı. Aileyle aynı kalıp. (2) **Set'ten pay kaldırıldı.** Bir önceki turda payı taralayıp "YAPIŞTIRMA PAYI" yazmıştım; sahip onu da istemedi, haklı: bu görünüm müşterinin iki yüzünün provası, bıçak dosyası değil. Etiket setinde yapıştırma panelleri artık hiç çizilmiyor ve kesim hattı panel başına veriliyor, yani ön yüz 2D'dekiyle aynı duruyor. Pay kalıpta ve export'ta duruyor. Karton "Açılım" görünümü tam neti göstermeye devam ediyor — orada kapaklar zaten görünmesi gereken şey. (3) **Dil karışımı kapısı Türkçeyi reddediyordu.** `copy-locale-mix`, `exportOk`'un on bir koşulundan biri, yani tetiklendiğinde müşteri hiçbir şey indiremiyor. Ürün adının İngilizce olup olmadığına **ç/ğ/ı/ö/ş/ü yokluğundan** karar veriyordu — bu İngilizce testi değil, aksan testi. Ölçüldü: "Gece Serisi" adlı Türkçe parfüm etiketi baskıya hazır çıktıdan dil karışımı diye reddediliyordu; "Beyaz Sabun", "Altin Seri" de aynı kaderde. Kural artık kelime sınırında **bilinen bir İngilizce kelime** arıyor: "Night Serum" hâlâ yakalanıyor, "Gece Serisi" geçiyor, `series` de `Serisi`'ne takılmıyor. PDF'in kendisi sağlam çıktı — %PDF-1.6, xref, trailer, tek sayfa, OutputIntent (PDF/X), TrimBox + BleedBox, çizim operatörleri yerinde | `tsc` 0 · lint 0 · **908/908 SPA · 85/85 sunucu** · `toneSurvivesPick.test.ts` (3: altı ton × on ailede pin çiziliyor) + `copyLocaleMix.test.ts` (12: aksansız Türkçe geçer, gerçek karışım yakalanır) · golden **DNA 0 · hash 0** · tarayıcıda uçtan uca: etikette "karanlık lüks" teklif ediliyor, ton yön değişiminde **Koyu lüks kalıyor**, Set yalnız Ön + Arka gösteriyor |

| 2026-09-18 | **F-19** | **Ticari kapı: baskı dosyaları sunucudan, stüdyoda gerçek giriş.** Audit'in bir numaralı maddesi: teslim paketi tarayıcıda üretiliyor ve **koşulsuz** indiriliyordu; istemci kredi uç noktasını önce çağırıyordu ama yalnız nezaketen, o çağrıyı atlamak hiçbir şeye mal olmuyordu. Üstelik çıkış yapmış panelde form da düğme de yoktu — hesaba tek giriş yolu pazarlama sitesinden gelen `?handoff=` parametresiydi, yani stüdyoyu yer imine ekleyen müşteri kalıcı misafirdi. İkisi birleşince ürünün gelir yolu yoktu. (1) **`POST /api/credits/export`** — `requireAuth` arkasında. Sıra taşıyıcı: preflight **gönderilen tasarım üzerinde yeniden hesaplanıyor** (spec çağıranın yazdığı JSON'dur, kendi `exportOk`'u hiçbir şey kanıtlamaz), sonra ZIP kuruluyor, en son kredi düşülüyor — üretilmemiş dosya için kimse ücretlendirilmiyor. (2) **İhracatçı tarayıcıdan çıktı.** İstemci artık yalnız istiyor. Ölçülen yan etki: paket **2060 KB → 1247 KB** (gzip **634 KB → 353 KB**); 805 KB'lik outline/font yükü (gzip 277 KB) tarayıcıya hiç inmiyor. (3) **Stüdyoya giriş/kayıt formu.** `api/auth.ts` zaten çalışıyordu, panel hiç çağırmıyordu. Misafir etiketi de dürüstleşti: "sınırsız yerel" her şey bedavayken doğruydu; misafirin aldığı şey sınırsız **tasarım**, baskı dosyası değil. Üretim sekmesinde indirme düğmesi misafire kapalı ve nedenini söylüyor. **Yol boyunca iki tuzak:** motoru sunucuya almak `.svg?raw` içe aktarmalarında patlattı (`ERR_UNKNOWN_FILE_EXTENSION`) — sunucu testleri Vitest, yani Vite üzerinden koştuğu için **yeşildi**; yalnız gerçek süreci başlatmak buldu. Kanca yazıldı, ama `import './rawAssets.ts'` yetmedi: ESM tüm grafiği gövdeler çalışmadan bağlar, motor bağlama sırasında yükleniyordu — motora ulaşan her şey dinamik içe aktarmaya alındı | `tsc` 0 · lint 0 · **908/908 SPA · 92/92 sunucu** · `exportGate.test.ts` (7: misafir 401, sahte `exportOk` 422, bakiye bitince 402 ve dosya yok, geçerli istek gerçek ZIP) · golden **DNA 0 · hash 0** · canlı API'ye curl ile doğrulandı (200, 158 KB, `PK`, 0.18 sn) ve tarayıcıda uçtan uca: misafir indiremiyor → stüdyodan kayıt → bakiye geldi → indirme `POST /api/credits/export → 200` |

| 2026-09-18 | **F-20** | **Müşterinin emeği kaybolmuyor.** Audit'in 2., 3. ve 5. maddeleri; hiçbiri bir testin kızarmasıyla değil, kalıcılık katmanını okuyarak bulundu — üçü de müşterinin **parayı ödedikten sonra** keşfedeceği cinsten. (1) **Logo yenilemede yok oluyordu.** İki deponun hiçbiri `allAttachments` saklamıyordu ve iki geri yükleme yolu da onu boşaltıyordu (`restoredAppState`, `hydrate`). Ekrandaki tasarım kendi içine basılmış logoyu koruduğu için hiçbir şey bozuk görünmüyordu — ta ki **bir sonraki üretim** logoyu listede arayıp boş bulana ve sessizce logosuz bir tasarım çizene kadar. Ekler artık IndexedDB'de (base64'tür, 5 MB'lık yerel kotayı patlatır), yerel depo onlar hariç her şeyi taşıyor, ve geri yüklemede yalnız `pending` temizleniyor: o besteci tepsisi, kayıt değil. (2) **Çift yüzeyin yarısı gidiyordu.** `boxDesign`, `labelDesign`, `surfaceView`, `bottleShape` hiçbir depoda yoktu; hem kutu hem etiket yapan müşteri ekranda olmayanı kaybediyordu. Dördü de iki depoda. `conversation` da yerel depoya eklendi — yalnız IndexedDB'de olduğu için iki depo birbirini tutmuyor, yerelden dönen sohbet cevaplanmış soruları yeniden soruyordu. (3) **Dolu kota her şeyi siliyordu.** `saveSession` depolama hatasına `removeItem` ile cevap veriyordu: deponun baskı altında olduğu tek an, işin çöpe gittiği tek andı. Artık kilo veriyor — önce geri alma geçmişi, sonra ikinci yüzey, sonra tasarım; brief ve sohbete inmiş hâli bile yazılamazsa vazgeçiyor. (4) **Yükleme sessizce başarısız oluyordu.** Okuyucu `image/*` dışını süzüp hiçbir şey demiyordu; tasarımcının göndereceği `.ai/.eps/.pdf/.svg` yok oluyordu, okuma hatası yakalanmıyordu, boyut sınırı yoktu. Artık hangi dosyanın **neden** alınmadığı söyleniyor, 4 MB sınırı var, tek bozuk dosya diğerlerini düşürmüyor. Mesajın görüneceği yer de eklendi: bildirim yalnız çalışma alanı üst barında çiziliyordu, oysa müşteri ilk yüklemesini **landing** ekranından yapıyor — uyarı vardı, çıkacak yeri yoktu. (5) **Logoya tıklamak projeyi siliyordu.** `onReset` → boş durum → 250 ms sonra kaydetme efekti iki depoyu da üzerine yazıyordu. Onay yok, geri alma yok. Logo artık başa dönüyor; sıfırlama yalnız `Yeni` düğmesinde ve önce soruyor | `tsc` 0 · lint 0 · **914/914 SPA · 92/92 sunucu** · `workSurvives.test.ts` (6, mutasyonla kanıtlandı: ek saklama geri alınınca 2 test düşüyor) · golden **DNA 0 · hash 0** · tarayıcıda uçtan uca: `.ai` reddediliyor ve nedenini yazıyor, PNG kabul, **yenilemeden sonra depoda 5 ek duruyor**, logoya tıklamak tasarımı bozmuyor, `Yeni` onay soruyor ve iptal edilince hiçbir şey olmuyor |

| 2026-09-18 | **F-21** | **Huninin sonu: prova bir düğme, teslim paketi tek marka, ve içinde tasarımın resmi.** Audit'in 4. ve 3. maddeleri. (1) **Baskı provası sihirli bir cümleydi.** `printReady` yalnız sohbete "baskıya hazırla" yazılınca açılıyordu; Üretim sekmesi bunu söylüyor ama kontrol sunmuyordu, tanıtım turu ise olmayan bir onay düğmesi vaat ediyordu. Yazmayan müşteri, güvenli alan ve taşma payı **kılavuzları olmayan** bir paket indiriyordu — üstelik düğmenin adı ve fiyatı aynıydı, fark tam da önemli olduğu anda görünmüyordu. Artık durum ekranda ("Baskı provası açık/kapalı", ne anlama geldiğiyle birlikte) ve tek tık değiştiriyor; prova kapalıyken indirme düğmesinin yanında "paket kılavuzsuz iner" yazıyor. (2) **Teslim dosyaları dört ad taşıyordu.** Paket kendini "FORXA teslim ZIP" diye tanıtıyor, `<marka>-forma.zip` olarak iniyor, manifestinde `forma-export/v1`, SVG yorumlarında `Grapxor`, PDF üstverisinde `FORXA` yazıyordu. Müşterinin matbaaya ilettiği tek dosyada, üçünü hiç duymadığı dört isim. Hepsi **Grapxor**. İç raporlar (kalıp motoru sertifikasyonu, yapı yönlendirme) kendi adlarını koruyor — onlar müşteriye gitmiyor. (3) **Pakette tasarımın resmi yoktu.** İçindeki her şey matbaa içindi: bıçak, kalıp, outline SVG. Müşteri yaptığı şeyi kimseye vektör programı açmadan gösteremiyordu. Artık `*-onizleme.png` var — tarayıcıda üretiliyor, çünkü tuval orada; sunucu PNG imzasını ve boyutunu doğrulayıp pakete koyuyor, koyduğunda da OKU.txt'ye satırını ekliyor (olmayan dosyayı listeleyen bir okuma dosyası, listenin kendisini değersizleştirir). Baskı dosyaları hâlâ sunucuda üretiliyor; kredinin aldığı şey o. **Yol boyunca kendi hatam:** ilk test paketin tüm baytlarında dosya adını aradı — ad OKU.txt'nin içinde de geçtiği için test **hiçbir şey kanıtlamadan geçiyordu**; gerçek zip girdi adlarını okuyacak şekilde yeniden yazıldı | `tsc` 0 · lint 0 · **914/914 SPA · 95/95 sunucu** · `exportGate.test.ts` +3 (geçerli PNG pakete giriyor, önizlemesiz indirme yine çalışıyor, PNG olmayan her şey düşüyor) · golden **DNA 0 · hash 0** · tarayıcıda uçtan uca: tek tıkla prova açıldı ve kapandı, istemci 625 KB'lik önizlemeyi gönderdi, indirme 200 döndü |

| 2026-09-18 | **F-22** | **Teslim edilen vektör Illustrator'da eksik açılıyordu; etiket artık yalnız tasarım.** Sahip indirdiği dosyayı Illustrator'da açtı ve tasarımın tamamını göremedi. Sebep tek bir öznitelikti: outline edici her harfi paylaşılan bir `<path id>` havuzuna yazıp **`<use href="#g12">`** ile örneklendiriyordu. Bu doğru SVG 2 ve daha küçük — ama Illustrator'ın içe aktarıcısı **SVG 1.1**, orada öznitelik `xlink:href` ve ad alanının beyan edilmesi gerekir. Çıplak `href` hiçbir şeye çözülmüyor, dolayısıyla şekiller ve renkler geliyor, **bütün yazılar gelmiyordu**. Ölçüldü: teslim edilen dosyada 457 `<use>`, 0 `xlink`, kökte `xmlns:xlink` yok. `xlink:href` eklemek muhtemelen yeterdi; **satır içine yazmak hiç başarısız olamaz** — id yok, ad alanı yok, çözülecek referans yok. Dosya 72 KB'den 157 KB'ye çıkıyor; baskı dosyası matbaada bir kez açılır, o kilobaytlar tek önemli özelliği satın alıyor. (2) **Etiket pakedi sadeleşti.** Karton katlanır: bıçak, kalıp, DXF gerekir. Etiket katlanmaz, tek basılı yüzdür; dört dosyalık kalıp seti gürültüydü. Etiket paketi artık `*-tasarim.svg` + manifest + OKU.txt. Hiçbir şey kaybolmuyor: kesim hattı tasarımın **kendi içinde** `CUT` katmanı olarak duruyor (baskı katmanı da `ARTWORK`), yani kesilerek üretilen disk ya da oval kendi konturuyla matbaaya gidiyor — etiket baskısının zaten beklediği biçim. **Yol boyunca kendi hatam:** dosyayı `-tasarim.svg` diye yeniden adlandırınca outline filtresindeki `(artwork\|combined)` kalıbına takılmaz oldu ve bir an için **yazıları hâlâ kurulu fonta bağımlı** bir etiket teslim edildi — outline'ın var olma sebebinin ta kendisi. Filtre artık dosyanın ne olduğuna bakıyor, adına değil | `tsc` 0 · lint 0 · **921/921 SPA · 95/95 sunucu** · `deliveryFiles.test.ts` (7: çözülecek referans yok, kurulacak font yok, tanımsız `url(#…)` yok, etikette kalıp dosyası yok, kartonda hepsi var, OKU.txt yalnız pakette olan dosyaları sayıyor — mutasyonla kanıtlandı: `<use>` geri gelince 4 test düşüyor) · `outlineText.test.ts` yeni sözleşmeye göre güncellendi (eski "glyph paylaş" testi kaldırıldı, gerekçesiyle) · golden **DNA 0 · hash 0** · canlı sunucudan indirildi: 3 dosya, 157 KB tasarım, 0 `<use>`, 0 `<text>`, 494 yol, tarayıcıda eksiksiz açılıyor |

| 2026-09-18 | **F-23** | **Sohbet I: müşterinin söylediği artık kayboluyor değil.** Audit ilk tasarıma kadar 5–7 tek alanlık soru ölçmüştü; asıl sorun soru sayısı değil, **yolda atılan bilgiydi**. Yedi ölçülmüş kusur: (1) **"Merhaba" marka adı oluyordu** — ilk kelime isme benziyorsa marka sayılıyor ve selamlama tam olarak isme benziyor; "Merhaba, Noctis diye bir markam var" bile ambalaja **Merhaba** basıyordu. (2) **Etiketli alanlar okunmuyordu.** `labeled` iki nokta ya da tire şart koşuyor, kimse sohbette öyle yazmıyor; "Noctis markası için parfüm şişesi etiketi, **ürün Gece Serisi**" ürünü **"şişesi"** yapıyordu — cümlenin ortasından bir kelime, oysa cevap iki cümlecik sonra harfi harfine yazılıydı. Üç okuma eklendi (noktalı etiket, sözlü etiket, isim-önce-etiket) ve `spokenNames` ile tek kaynaktan okunuyor. (3) **"Barkod örnek"** serbest metinde yok sayılıyordu, ertesi tur yine soruluyordu — zengin açılışta müşteriyle tasarımı arasındaki tek soru buydu. (4) **Cevabın tamamı ürün adı oluyordu:** "Gece Serisi, 50 ml, siyah altın" üç cümleciğiyle ambalajın en büyük puntosuna basılıyordu. (5) **Soru beklerken anlama tamamen kapalıydı** — sohbetin çoğu bir soru beklerken geçtiği için hedef kitle, satış kanalı, fiyat katmanı ve his her seferinde çöpe gidiyordu. (6) **Düzeltme sessizce kayboluyordu:** barkod sorusundayken "aslında marka adı Noktis olsun" yazmak hiçbir şey değiştirmiyordu. (7) **Olumsuz cümledeki kelime istek sayılıyordu:** "çok klinik durmasın" paleti **Klinik** yapıyordu, yani müşterinin az önce reddettiği şeyi. Ayrıca **çıplak sayı hiçbir şey seçmiyordu** (numaralı liste okuyup `2` yazmak sohbetin ilk refleksi) ve **seçim ekranında soru sormak kredi harcıyordu** ("kaç mm olacak?" üretim başlatıyordu). Ölçülen sonuç: zengin açılış **3 → 2 mesaj**, uzun anlatım **4 → 3**, ve dördünde de marka/ürün doğru. **Yol boyunca üç kez aynı tuzak:** `` ASCII `\w`'ye göre tanımlı, Türkçe harfte çalışmıyor; üstüne kabuk üzerinden yazılan `` iki kez **gerçek backspace baytına** dönüşüp regex'i sessizce hiçbir şeye eşleşmez hâle getirdi — biri `extractFields` içinde, biri bir test dosyasında. Sınırlar artık açık açık yazılı (`spokenFields.ts`), kontrol baytları temizlendi | `tsc` 0 · lint 0 · **939/939 SPA · 95/95 sunucu** · `chatUnderstanding.test.ts` (18, mutasyonla kanıtlandı: selamlama koruması kaldırılınca 4 test düşüyor) · golden **DNA 0 · hash 0** |

## Açık — çizici (sahip onaylı, sonra yapılacak)

Referans kartona göre kapanmayan fark ve iki gerçekçi yol. L2-N'de 3. seçenek (mevcut seviyeyi yeterli say, yuvarlak formata geç) tercih edildi; 1 ve 2 açık kaldı:

| # | İş | Not |
|---|---|---|
| Ç-1 | Vektörde daha da zorla | Taç yaprağı başına ayrı gradyan, yaprak başına birden fazla ton dilimi, öne kısalmış/bükülmüş yapraklar. Fark kapanmaz, azalır. |
| Ç-2 | Melez kabul (karar gerektirir) | Yalnız kahraman illüstrasyon için raster / gradyan mesh. Referansa en yakın yol, ama o eleman için **"renkleri brief sahiplenir"** kuralı bırakılır. |
| — | **Kapanamayan** | Yumuşak kenar. İki yolu da kapalı: blur filtresi RIP'te rasterleşir (export kapısının varlık sebebi), gömülü raster brief'in renklerini giyemez. |
