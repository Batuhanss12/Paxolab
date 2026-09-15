# Kit ↔ VisualConcept alignment (Faz 2.8)

Single art-direction read path: **VisualConcept** (`id`, `languages`, `avoid`, `motifLexicon`, `decorationBudget`) is chosen **before** style costume defaults. `StyleType` only modulates density, air, and type scale inside that concept. It must not reopen avoided strategies (`heavy-frame`, `ornate-seal`, `dense-pattern`, `generic-corners`).

Lockup typography mathematics (`applyPlan` optical center, `typeSystem`) are unchanged — this table only selects the `LockupId` input.

## Concept → lockup

| Concept id | LockupId | Notes |
|---|---|---|
| `earthen-premium` | `harvest-seal` | Botanical companion on overlay; no food diamond frame |
| `grove-press` / `harvest-press` | `harvest-seal` | Same harvest grammar |
| `grove-kraft` / `harvest-kraft` / `kraft-botanical` / `botanical-night` | `stamp-center` | Eco/kraft, not a luxury seal |
| `nocturne-crest` / `heraldic-crest` | `centered-crest` | Crest is kit focal; motif takes ribbon/cartouche |
| `heraldic-cartouche` | `serif-cartouche` | Classic generic — cartouche is the grammar |
| `soft-oval` / `drop-concentrate` | `soft-oval` | Oval lockup **and** oval/ring motif language |
| `air-paper` | `air-rule` | Quiet hairline; no ornate seal/frame |
| `tech-glyph` | `tech-grid` | Linear/geometric; not L-corner pack |
| `signal-plaque` | `metal-plaque` | Luxury electronics plaque, still linear |
| `index-stripe` | `left-index` | Modern index |
| `capsule-field` | `badge-capsule` | Playful field; spend stays under budget |
| `restrained-foil` | `centered-crest` | Luxury fallback |

Label wrap/stack lockups are **not** remapped (label grammar wins). Faz 2.14 paints grammar-native chrome behind type; it does not turn a wrap into `centered-crest`.

## Frame / chrome / pattern

- `sectorFrame` skips food diamonds / luxury rings when `avoid` has `heavy-frame` or language is `quiet-line`. Electronics L-brackets skip on `linear` language or `generic-corners` (NOCTURNE still keeps perfume rings; it only forbids the L-corner pack).
- `goldBar` stays on luxury perfume / cream. It drops when the concept forbids both `heavy-frame` and `ornate-seal` (earthen, air-paper).
- ArtDirection `chrome` is forced `quiet` on air / quiet-line / heavy-frame avoid so `lockupWindow` cannot fight the motif winner.
- Kit pattern: `air-paper` set 0 is `none`. `avoid: dense-pattern` blocks `contour` / `ornament`; style may still pick a quiet substitute (`stripe`, `weave`) — it must not reopen dense costume fills.

## Overlay contract

If the kit already supplies a **crest** focal (`centered-crest` lockup or crest hero), motif search treats `crest` as a used lexicon token and skips a second hero-stamp on `hero-with-support`. Companions must use unused lexicon tokens (ribbon / cartouche). Soft-oval lockup is shared language, not a clone — oval/ring may still win on the overlay.

`serif-cartouche` is the same class of focal: kit already paints the cartouche grammar, so overlay must not stamp `crest-spot`. `cartouche` + `crest` are used; ribbon (or mineral band) is the companion. `badge-capsule` marks `capsule` used so the overlay prefers vintage/badge family files, not a second capsule.

## Faz 2.8 kit proof (before → after)

| Face | Before | After |
|---|---|---|
| EARTHEN kit | `hero-with-support`, 2 atoms, spend 0.20; luxury food diamonds/gold-bar could fight the grove | `asymmetric-editorial`, 3 atoms (branch + corner + bottom), spend 0.35; no sector-frame, no gold-bar |
| NOCTURNE kit | Motif `crest-spot` + corner (second crest scream on top of kit crest) | Kit crest stays focal; motif winner `ribbon-corner` only |
| SOFT OVAL kit | Oval lockup + oval ring (already close); luxury rings possible | Lockup `soft-oval`, motif `soft-oval-ring`, chrome quiet, no sector-frame |
| AIR PAPER kit | `air-rule` + hairline | Same story; chrome quiet; no ornate seal/frame |
| TECH GLYPH / NOX kit | Linear `pattern16`, not L-pack | Held: `asymmetric-editorial`, no `l-bracket` / sector-frame |
| kit-09 CAPSULE | spend 0.37 / budget 0.48 | Held (no 4.40 relapse) |

Blank 2.5–2.7 winners were not rewritten.

## Faz 2.9 craft fill

After alignment, spend had a **cap** but no **floor**. Kit NOCTURNE sat at 0.09 (ribbon speck). `fillDecorationBudget` raises opacity / support scale toward `craftFillFloor` without exceeding `decorationBudget`. Kit crest focal may take a second unused-lexicon companion (ribbon + cartouche on opposite top corners — not a 4-corner L-pack). Kit-supplied crest counts in concept fidelity so the overlay is not punished for not cloning the crest.

| Face | 2.8 | 2.9 |
|---|---|---|
| NOCTURNE kit | spend 0.09, 1 ribbon, fidelity 38 | spend 0.19, ribbon + cartouche, fidelity 100 |
| EARTHEN kit | 3 atoms, spend 0.35 | held |
| SOFT OVAL kit | spend 0.14 | spend 0.15, oval ring held |
| AIR PAPER | spend 0.12 | held (quiet floor) |
| TECH / NOX | 1 glyph, spend 0.21 | 1 glyph, spend 0.22, still not L-pack |
| kit-09 | spend 0.37 / 0.48 | held |

## Faz 2.10 atom kalemi

Craft fill ölçeği düzeltti; çizimler hâlâ ince kalemdi. Aynı ailede daha ağır SVG: zeytin dalı (damar + meyve), çift oval halka, kalkan+kurdele, kartuş volüt, linear glyph damgası. Yeni dil / yeni gramer yok. `pattern16` sayfası duruyor; lexicon hit varken aile dosyası sheet parçasının önüne geçer.

| Face | 2.9 | 2.10 |
|---|---|---|
| EARTHEN kit | olive-branch, 3 atoms, spend 0.35 | aynı lexicon, damar+meyve, spend 0.38 |
| NOCTURNE kit | ribbon + cartouche, spend 0.19 | kalkan/kurdele/kartuş dolu, spend 0.26 |
| SOFT OVAL kit | tek ellipse, spend 0.15 | çift halka + tick, spend 0.17 |
| AIR PAPER | hairline, spend 0.12 | çift hairline, spend 0.14 (quiet) |
| TECH / NOX | pattern16 fragment, spend 0.22 | `tech-glyph-mark`, spend 0.24, not L-pack |
| kit-09 | spend 0.37 / 0.48 | held |

## Faz 2.11 kit lockup kalemi

Overlay atomları doluydu; kit yüzü hâlâ ince kilit çizimiydi. `lockupRule` stil kostümü (foil elmas / hair). `lockupWindow` sessiz chrome’da kapanıyor. Aynı `LockupId`, aynı `layoutFrontLockup` Y’leri — chrome yazının **arkasına** biner, tipi kaydırmaz. `ruleKindOf` / `hasRule` / `stackH` kilit (modern `tech-grid` zaten `hasRule: false`; chrome fallback `ruleY` kullanır).

| LockupId | Chrome |
|---|---|
| `harvest-seal` | Yaprak uçlu rule + yan zeytin filizleri; foil elmas kostümü yok |
| `centered-crest` | Çift heraldik bar + elmas tick; markanın üstünde yay yok |
| `soft-oval` | Tip kolonunu saran çift elips (yüz boyu çerçeve değil) |
| `air-rule` | Çift hairline + uç tick; oval / crest / yaprak yok |
| `tech-grid` | Çift rule + uç kare + yan index tick; L-bracket pack yok |

Label wrap/stack chrome almaz. `serif-cartouche` / `metal-plaque` / `badge-capsule` bu fazda dokunulmaz. Motif spend değişmez (kit boyası). Crafted LockupId `lockupWindow` kutusunu da kapatır (jenerik 0.16 rect, kilit chrome’unun üstüne binmesin).

| Face | Overlay (2.10 held) | Lockup chrome |
|---|---|---|
| EARTHEN kit | olive-branch, 3 atoms, spend 0.38 / 0.42 | harvest-seal rule + filiz |
| NOCTURNE kit | ribbon + cartouche, spend 0.26 / 0.28 | centered-crest bar + yay |
| SOFT OVAL kit | oval ring, spend 0.17 / 0.24 | kolon elipsi |
| AIR PAPER | hairline, spend 0.14 / 0.18 | çift hairline |
| TECH / NOX | `tech-glyph-mark`, spend 0.24 / 0.22 | dual rule + kare, not L-pack |
| kit-09 | spend 0.37 / 0.48 | held (badge-capsule, chrome yok) |

## Faz 2.12 kalan kutu lockup kalemi

2.11 beş kanıt ID’sini çizdi; kalan kutu lockup’ları hâlâ stil kostümü `lockupRule` / boş yüzdü. Aynı kural: `layoutFrontLockup` kilit, chrome yazının arkasına biner. Label wrap/stack yine boş.

| LockupId | Chrome |
|---|---|
| `serif-cartouche` | Kolon kartuşu (çift yuvarlatılmış çerçeve + yan volüt); crest kalkanı değil |
| `metal-plaque` | Tip kolonunda sığ plaka + uç tick; L-bracket pack / sector-frame yok |
| `stamp-center` | Kraft pres halkası (kesikli daire) + eco rule; ornate-seal / zeytin yok |
| `left-index` | Sol index rayı + tick; dört köşe L yok |
| `badge-capsule` | Tip kolonunu saran kapsül; panel L-pack yok |

Kanıt işleri: `10-kurabiye-tray-classic`, `14` luxury (`signal-plaque`), `21-krem-eco-monstera`, `27-krem-modern-zebra`, `09-cikolata-tray-playful`. 2.11 beş yüz ve motif spend durur.

## Faz 2.13 katalog boşlukları

Aile dosyası olmayan primary family’ler sheet parçasına düşüyordu: harvest (grove/harvest-press/kraft), geometric-deco (restrained-foil), mineral-frame, ornate-stamp (capsule-field → `588vintage`). Yeni gramer yok. `pattern16` / deco sheet fallback durur; unused lexicon varken aile dosyası önde.

| Aile | Atom | Lexicon |
|---|---|---|
| `harvest` | `harvest-olive-wreath`, `harvest-press-stamp`, `harvest-grain-leaf` | wreath / olive / press / grain / leaf |
| `geometric-deco` | `deco-foil-corner`, `deco-hairline-frame` | foil / frame / hairline |
| `mineral-frame` | `mineral-band-rule` | band companion |
| `ornate-stamp` | `vintage-badge` | vintage / badge |

Cartouche overlay: kit-10 winner `crest-spot` değil. kit-09 spend ≤ 0.48, aile dosyası sheet’in önünde. 2.11/2.12 lockup Y ve chrome durur. Family −1000 / L-pack durur.

## Faz 2.14 etiket lockup kalemi

Kutu LockupId’leri 2.11–2.12’de chrome aldı; `label-wrap` / `label-stack` hâlâ stil kostümü `lockupRule` (foil elmas) veya boş yüzdü. Grammar kilit: etiket kutu ID’sine remap edilmez. `layoutFrontLockup` Y’leri durur. Wrap chrome SEAM rezervinin solunda kalır.

| LockupId | Chrome |
|---|---|
| `label-wrap` | Sol okuma rayı + çift hairline; L-bracket pack yok; seam’e binmez |
| `label-stack` | Merkez çift rule + uç tick; kartuş / crest / kraft mühür değil |

Kanıt: `05-parfum-wrap-luxury`, `07-serum-wrap-minimal`, `06-krem-wrap-modern`, `11-bal-label-classic`, `12-recel-label-eco`. 2.11 kutu Y ve harvest overlay durur.

## Faz 2.15 kit-grade üretim

İnsan bakışı: `FORMA-Faz2-Ornekler/02-katalog-kit` (stil-kit painter, overlay atom yok) kabul edilebilir; `FORMA-Faz25-Ornekler/01-blank-canvas` (overlay-first clip-art) değil. Modern / luxury / minimal özellikle kit yüzü.

Stüdyo artık `blankCanvas: false` (katalog kit yolu). Blank generate de kit painter kullanır: arka plan, `frontDecor`, concept lockup remap. Overlay `<image>` clip-art **luxury / modern / minimal / classic / eco** yüzünde boyanmaz. Playful motif araması durur.

`centered-crest` chrome’dan marka üstü yay (`crestArc`) çıktı — dual bar + elmas tick kaldı. Lockup Y, family −1000, L-pack, bütçe tavanı durur.

| Yüz | 2.14 | 2.15 |
|---|---|---|
| Luxury / modern / minimal kit | Motif overlay + kit chrome | Kit chrome + native hero; overlay yok |
| Blank (aynı stiller) | Boş zemin + overlay stamp | Kit painter; overlay yok |
| Playful kit-09 | vintage-badge overlay | Held |
| Classic / eco overlay | Aile dosyası | 2.16 / 2.17 kit-grade skip (overlay yok) |

**İsim çakışması:** 2.14 kapanışında planlanan 2.15 *critic* (kit-10/11/12/21 + grove-press MODIFY kökleri) bu dilim değildi. O kök `DECORATION_OVERLOAD` false-positive’dı; 2.15 critic aşağıda.

## Faz 2.15 critic (asıl plan)

Faz25 galerideki MODIFY kazananları family FAILURE, overlap veya region değildi. `critiqueCandidate` `decorationDensity < 40 && densityTarget <= 0.28` ise `DECORATION_OVERLOAD` yazıyordu. Skor hedeften sapma; spend çoğu zaman bütçenin altındaydı. Cümle kaldırıldı. Gerçek ağırlık kontrolü durur: `decoWeight >= 0.72 && decorationLevel < 0.5`. Bütçe tavanı ve lockup Y oynatılmaz. Overlay kit-grade stillerde kapalı kalır.

## Faz 2.16 classic critic

Klasik parfüm yüzünde iki clip-art üst üste biniyordu: `paintCrest` kalkan+şişe glyph’i ve `double-line-corner` overlay `<image>`. İnsan bakışı ikisini de veto etti.

- Overlay skip classic’e uzadı (luxury / modern / minimal ile aynı kit yolu). Eco / playful araması durur.
- Classic `crest` / `cartouche` kit glyph boyanmaz — lockup chrome (centered-crest bar / serif-cartouche) kalır.
- `double-line-corner` retired. Flacon / perfume-bottle path’leri boş.
- Luxury crest kalkanı durur; içindeki şişe/kapak yok. Lockup Y, family −1000, L-pack, bütçe tavanı durur.

## Faz 2.17 eco critic

Classic 2.16’dan sonra açık delik eco overlay’di: kit-21 monstera hero + leaf overlay istif; kit-12 harvest-grain-leaf etiket damgası.

- Overlay skip eco’ya uzadı. Native kit hero (monstera / harvest / leaf) ve lockup chrome durur.
- Playful kit-09 vintage-badge overlay held.
- Lockup Y, family −1000, L-pack, bütçe tavanı durur.

## Faz 2.18 classic food native harvest

2.16 crest-omit `kitFamily === 'crest'` iken *bütün* classic hero’yu kesiyordu. Classic gıda (kurabiye / kiler / bal) planı `harvest` seçer; kalkan+şişe değil. Native `paintHeroGraphic('harvest')` geri geldi. Classic parfüm (`heraldic-crest`) hâlâ glyph’siz — sadece `centered-crest` chrome. Overlay, flacon, `double-line-corner` kapalı.

## İnsan onayı (15 Eyl 2026)

Faz25 `02-katalog-kit` bakışı:

- **02 kolonya** — `centered-crest` chrome, glyph yok. Onay. Şişe/kalkan geri gelmez.
- **Playful 09 / 24 / 25 / 26** — `vintage-badge` overlay KEEP. Onay. 2.19 kit-grade overlay skip açılmaz.

Faz 2 görsel hat burada kilitlenir. Faz 3 yalnız açık cümle ile (öğrenme / LLM planner).


