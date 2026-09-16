# C3 — Brief-ağırlıklı yön

**Tarih:** 16 Eyl 2026  
**Durum:** Kapandı  
**Önceki:** C2 `docs/STUDIO_CHAT_C2.md`  
**Sonraki:** C4 copy brief’ten (bank fallback)

Kilitler durdu: 18 stüdyo yüz hash **güncellenmedi** (bilinçli — sektör-only brief aynı DNA). 29 kit freeze. LLM SVG yok.

---

## 1. Amaç

Sektör arketipi kilit olmasın, prior olsun. Kullanıcı “elektronik ama mermer ve altın” dediyse yüzey marble olsun; “parfüm ama klinik” line-scene olsun. Boş extra brief hâlâ TASARIM REF baseline’ına düşer.

---

## 2. Yapılan

| Değişiklik | Kanıt |
|---|---|
| Görsel sözcük override: mermer, botanik, klinik, dalga, manzara, diyagonal | `visualOverrideFromBrief` — sektör pin’inden **önce** |
| Sektör baseline yalnız override yoksa | kahve→marble, parfüm→dark-landscape… (golden) |
| `sectorFit` 0.50 → **0.22**; heuristic pin +2 → **+0.85**; LLM/user pin +2 durur | `scoreArchetype` |
| `productFamilyFit` 0.55 → **0.22** | aynı dosya |
| Chat “mermer / klinik / dalga…” `brief.colors`’a yazılır | `extractFields.ts` |

`resolveDirection` hâlâ `hints.archetype` varsa onu seçer (pinned). Override archetype’i değiştirir; sektör-only işler aynı pin’i taşır → hash durur.

---

## 3. Test

```
npx vitest run src/engine/studio/studioDirection.test.ts src/engine/studio/studioGolden.test.ts src/engine/conversationFlow.test.ts
```

**Sonuç:** 3 dosya, 33 test, yeşil. `STUDIO_FACE_GOLDEN` 18/18.

| Senaryo | Sonuç |
|---|---|
| Elite Brew kahve (renk yok) | marble-frame (baseline) |
| Nox kulaklık + mermer · altın | marble-frame, **diagonal-tech değil** |
| Luma parfüm + beyaz klinik | line-scene, **dark-landscape değil** |
| LUMA serum / FERAH / MİA | eski DNA (line-scene / wave / line-scene) |

---

## 4. Tarayıcı

`Nox kulaklık kutusu 90x50x160 mermer altın` → generate. Markup `data-bg="marble"`. Sohbet: “Nox · kulaklık için Altın · Mermer paleti”. Copy bank hâlâ ELECTRONICS / KABLOSUZ KULAKLIK (C4).

---

## 5. Bilinçli sınır (C4’e)

Yön DNA’sı brief’e uydu; **metin anatomisi** hâlâ `copyBank` sektör klişesi. Kullanıcı sloganı / hikâye C4’te kazanır. C6 “neden bu yön” henüz sohbette yok (rationale motor içinde).

---

## 6. Dosya listesi

- `src/engine/studio/direction.ts`
- `src/engine/studio/studioDirection.test.ts`
- `src/engine/extractFields.ts`
- `src/engine/conversationFlow.test.ts`
