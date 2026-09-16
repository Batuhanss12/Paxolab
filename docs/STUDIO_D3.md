# D3 — 2–3 gerçek DesignDirection adayı

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** D2 `docs/STUDIO_D2.md`  
**Sonraki:** D4 `docs/STUDIO_D4.md` (P1 dürüstlük; VL/overlay birleşimi yok)

Kilitler durdu: overlay-candidate/critic tiyatrosu yok, kit `repairPlan` stüdyoda kapalı, SVG rewrite yok, critic kazanan seçmez, 18 golden hash (logo yok + `titleScale` 1) durur.

---

## 1. BEFORE

`decideDirection` zaten `ranked.slice(0, 3)` havuzunu hesaplıyordu; üretim tek yüz boyuyordu (`variationIndex` ile havuzda yürüyordu). Chat “neden / veto / vary / pin” biliyordu. Kullanıcıya 1/2/3 olarak sunulan gerçek `DesignDirection` seti yoktu. Overlay slot yarışı P1’de kapalı duruyordu.

---

## 2. AFTER

Aynı brief + aynı `composeStudioArtwork` painter. Havuzun ilk 2–3 arketipi tam `DesignDirection`. Generate hâlâ **bir** yüz boyar; kardeşler metadata.

- Seçili aday = `decideDirection` kazananı (pin veya `variationIndex`), critic değil.
- Chat C5 kalıbı: “2. yön” / “ikinci yön” → `studioFamily` pin → tek yüz yeniden boyanır.
- Workspace adayları isimlendirir; A/B/C preview paneli yok.
- Hash kanıtı testte: üç aday ayrı generate, yüz hash’leri ayrışır. `variationIndex` 0 golden yüz aynı.

---

## 3. Kanıt

- `src/engine/studio/studioDirectionOffer.test.ts`
- `src/engine/studio/studioGolden.test.ts`
