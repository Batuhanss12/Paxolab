# D2 — Studio critic = C6 yön düğmeleri

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** D1 `docs/STUDIO_D1.md`  
**Sonraki:** D3 (isteğe bağlı 2–3 direction adayı) — bu fazda yok

Kilitler durdu: kit `repairPlan` stüdyoda kapalı, SVG rewrite yok, overlay critic yok, kazanan seçimi yok, 18 golden hash durur.

---

## 1. BEFORE

S2 ledger’ı `DesignCritique` satırına çeviriyordu (`separate` / `fit` / `enlarge`). Workspace “Kritik N not aldı” diyordu. `critiqueAsFeedback` generate’e girmiyordu. C6 düğmeleri (daha sakin / farklılaştır / veto) ayrı bir sohbet parser’ıydı.

---

## 2. AFTER

Ledger kalabalık → **quieter** (“daha sakin olsun”). Taşma veya zaten sakin temperament → **vary** (“farklılaştır”). Tip sığmama preflight kalır, C6 düğmesi değildir.

- `composeStudioArtwork` `StudioReport.critic` doldurur.
- `critiqueAsFeedback` yalnız quieter/vary satırlarını öğrenme kanalına alır (type-fit yok).
- Generate `observeCritic` (`signal: critic`) — aile `studio-archetype` avoid etmez.
- “önerini uygula” mevcut `applyDirectionTalk` yolunu çalıştırır.
- Workspace “Kritik not aldı” yalanını bırakır; C6 cümlesini yazar veya susar.

---

## 3. Kanıt

- `src/engine/studio/studioCritic.test.ts`
- `src/engine/brain/designCritic.test.ts` (ledger → quieter, type-fit C6 değil)
- `src/engine/studio/studioGolden.test.ts`
