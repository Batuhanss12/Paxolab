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

**Kalan:** arketip çeşitliliği (yukarıdaki %36), palet sadakati, kör kalite değerlendirmesi.
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
