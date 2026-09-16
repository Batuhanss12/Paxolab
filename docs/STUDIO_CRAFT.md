# Studio craft — flap / top anatomy

**Tarih:** 16 Eyl 2026  
**Kaynak:** `docs/STUDIO_STAGE_AUDIT.md` D4  
**DI değil.** Overlay / VL / critic kazanan yok. 18 golden front hash durur.

## Gap

Sleeve / snap-lock / reverse-tuck stüdyo **ön yüze** bağlıydı. `bottom-lock` ve küçük tuck’lar `paintPlain` sade zemine düşüyordu. `paintBoxFlap` yalnız marka yazıyordu, hacim yoktu.

## After

- `kindFromForxaPanel`: `bottom-lock` → `tuck-flap`
- `composeStudioArtwork`: dust / tuck / lock panelleri `paintBoxFlap`
- `paintBoxFlap`: marka + `volumeLine` (`data-art="flap"` + `net-quantity`)
- Sleeve’te flap yok; yanlar spine kalır

## Kanıt

`src/engine/studio/studioCraft.test.ts` · `studioGolden.test.ts` (18) · tam suite 465 geçti / 1 baseline fail (`phase15` `/hex/i`) / 466 toplam
