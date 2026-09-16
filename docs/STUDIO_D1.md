# D0 / D1 — Studio logo + scale honesty

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** Design Intelligence Reality Audit (`docs/PAXOLAB_DESIGN_INTELLIGENCE_STATUS.md`)  
**Sonraki:** D2 (studio critic = C6 yön düğmeleri) — `docs/STUDIO_D2.md`

Kilitler durdu: yeni Design Brain yok, LLM SVG yok, overlay-candidate/critic tiyatrosu yok, 18 stüdyo hash (logo yok + `titleScale` 1) durur, kit `luxury-tighten` → `titleScale` 1.1 stüdyo yoluna sızmaz.

---

## 1. BEFORE

P1 (`App.tsx` `studio: true`) sohbeti logo dosyasını generate’e veriyordu; painter okumuyordu.

| Söz | Gerçek |
|---|---|
| “Logoyu aldım. Monogram yerine bunu yerleştireceğim.” | `logoHref` studio SVG’ye girmez |
| “Logo ölçeğini büyüttüm.” | `logoScale` yalnız kit lockup + 3D fallback |
| “Başlığı büyüttüm.” | `titleScale` yalnız kit; stüdyoda no-op |
| Kit `luxury-tighten` | `titleScale = 1.1` her generate’de, stüdyo dahil (ama stüdyo tüketmediği için hash duruyordu) |

---

## 2. AFTER

`GenerateInput.logoHref` + `overrides.logoScale` / `titleScale` → `composeStudioArtwork` → `LayoutCtx` → lockup / stack / pill / monogram / product badge.

- Kullanıcı logosu, yarıçapı `STUDIO_MIN_LOGO_R` (2.5 mm) ve üzeri marka yuvasında vector mark’ın yerini alır.
- Daha küçük yuvalar (peşin 1.6 mm ayak işareti, 2.2 mm yaprak) vector kalır.
- Ölçek 1 ve logo yok: 18 golden hash aynı.
- Stüdyoda `luxury-tighten` otomatik 1.1 **uygulanmaz**. Kit yolu aynı kalır.

---

## 3. Kanıt

- `src/engine/studio/studioIdentity.test.ts`
- `src/engine/studio/studioGolden.test.ts` (logo yok, scale 1)
