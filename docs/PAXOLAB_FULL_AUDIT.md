# PAXOLAB — TAM SİSTEM AUDIT RAPORU
**Tarih:** 2026-09-13  
**Kaynak (source of truth):** `C:\Users\Admin\Desktop\Paxolab` (working tree; GitHub `Batuhanss12/Paxolab` geride / uncommitted craft çalışması var)  
**İncelenen kopya:** `/workspace/paxolab-src` (node_modules hariç zip)  
**Kural:** Kodda olmayan sistem “var” sayılmadı. Doküman ≠ runtime. Kod değişikliği yapılmadı.

---

## 1. EXECUTIVE SUMMARY

Paxolab (paket adı **forma**, UI’da **FORMA**) bugün **profesyonel bir ambalaj/etiket SaaS platformu değil**; **Vite + React 19 + TypeScript** ile yazılmış, tarayıcıda çalışan **yerel vektör tasarım atölyesi SPA**’dır.

- **Çalışan çekirdek:** Chat → brief → şablon → dieline → DesignDirector plan → design system → `composeArtwork` → preflight → (opsiyonel) tek repair → SVG/DXF/ZIP export.
- **Harici paketleme API’si yok.** Motor `FormaLocalEngine` (istemci).
- **SaaS katmanı yok:** auth, abonelik, kredi, billing, admin, marketing site IA, i18n framework, deploy/CI — hepsi **MISSING**.
- **Profesyonel tasarım seviyesi: 2 / 5** (çalışan uzmanlaşmış prototip; özellikle parfüm kutu + dürüst export kapıları).
- **En kritik motor açığı:** Director plan’da pattern/illustration var; painter çoğunu çizmiyor. Cut path 4-nokta bbox → die-making için **RISKY**.
- **Doğru sıra:** Önce craft wiring + dieline doğruluğu; SaaS ayrı epic. Motoru billing stub’larıyla kirletme.

| Maturity | /100 |
|---|---:|
| TOTAL DESIGN MATURITY | **59** |
| TOTAL PLATFORM MATURITY | **20** |
| TOTAL SAAS MATURITY | **5** |
| TOTAL PRODUCT MATURITY | **38** |

---

## 2. CURRENT PROJECT STATE

| Öğe | Durum |
|---|---|
| Repo lokal | `Desktop/Paxolab`, git `main`, origin GitHub; çok sayıda uncommitted motor değişikliği |
| Stack | Vite 8 · React 19 · TS · Vitest · oxlint — runtime deps yalnızca `react` + `react-dom` |
| Ürün yüzeyi | `landing` \| `workspace` (react-router yok) |
| Persistence | `localStorage` (`forma.project.v1`, ratings) |
| Test | `npm test` → **6 dosya / 18 test PASS**; smokes `scripts/*-smoke.ts` (npm script değil) |
| İsim | Kod/README: FORMA; klasör/hedef marka: Paxolab |

Desktop’ta **karıştırılmaması gereken** kardeş klasörler var (packfy, ORCHESTRATOR, Printbroker2, Paxolab-Tasarim-Seti, vb.). Bu audit **yalnızca** `Desktop/Paxolab`.

---

## 3. PAXOLAB ARCHITECTURE MAP

```
Browser SPA
├── Landing / Workspace UI (App.tsx reducer)
├── Conversation + extract (+ optional LLM JSON brief)
├── FormaLocalEngine.generate
│     ├── catalog pickTemplate
│     ├── buildDieline (4 structures)
│     ├── DesignDirector.createPlan
│     ├── resolveDesignSystem + applyPlan
│     ├── composeArtwork → panel SVG layers
│     ├── preflight + critique + score
│     └── optional repairPlan → re-compose
├── Preview2D / Compare / Dieline / 3D-shell / Production
└── exportDoc (SVG + DXF ZIP) / print via window.print

MISSING: API server · DB · Auth · Billing · Credits · Admin · Router site · i18n · Analytics · CI/CD
```

**Dependency graph (özet):** UI → EnginePort → FormaLocalEngine → (catalog, dieline, brain, designSystem, artwork, marks, production). Brain → plan alanları; artwork compose **kısmi** tüketir.

---

## 4. DESIGN ENGINE PIPELINE (gerçek)

```
USER INPUT / Chat / Template / Style / Dims
  → extractBriefWithLlm? (nlu.ts, opsiyonel)
  → runConversation (conversation.ts)
  → FormaLocalEngine.generate
       1 pickTemplate
       2 resolveDimensions (+ luxury default style)
       3 buildDieline(structureId)
       4 sampleCopy + barcode/mfr honesty flags
       5 createPlan (DesignDirector)
       6 applyPlanToSystem(resolveDesignSystem)
       7 composeArtwork
       8 runPreflight → critique → score
       9 needsRepair? repairPlan → one re-compose
      10 DesignSpec (revision++)
  → generation.finish → history
```

| Aşama | Dosya | Durum |
|---|---|---|
| Brief | extract.ts, conversation.ts, fields.ts | WORKING (heuristic) |
| LLM NLU | nlu.ts | PARTIAL (URL opsiyonel; KEY hiç gönderilmiyor) |
| Template | catalog.ts + formaTemplateCatalog.json | WORKING |
| Dieline | buildDieline.ts | PARTIAL (crease OK; cut RISKY) |
| Plan | DesignDirector / ArtDirection | WORKING (plan üretir) |
| Paint | composeArtwork.ts | PARTIAL (pattern/primitives unwired) |
| Marks | marks/* | WORKING (parfüm IC1–IC4) |
| Preflight/Export | preflight.ts, exportDoc.ts, dxf.ts | PARTIAL |
| Mock engine | FormaMockEngine | Aynı local engine wrapper |

---

## 5. CHAT FLOW

- TR ask sequence: kutu vs etiket ayrı (`ASK_BOX` / `ASK_LABEL_SEQ`).
- Heuristic extract + iterate `parseIntent` (regex patches).
- Etiket akışında barkod/mfr soruları kısaltılmış.
- Opsiyonel LLM sadece JSON brief; başarısız olursa heuristic devam.

**WORKING** olarak stüdyo prototipi chat’i. Profesyonel discovery derinliği yok.

---

## 6. MISSING CHAT STAGES

| Profesyonel aşama | Paxolab |
|---|---|
| Discovery | PARTIAL (alan soruları) |
| Product understanding | PARTIAL |
| Design brief | PARTIAL → DesignBrief v2 |
| Structure selection | WORKING (template picker + match) |
| Template matching | WORKING |
| Visual direction | PARTIAL (style bar + plan; craft gap) |
| Content hierarchy | PARTIAL (lockup) |
| Initial design | WORKING |
| Design review | PARTIAL (preflight/critique/score UI) |
| User feedback → revision | PARTIAL (full regenerate) |
| Quality check | PARTIAL |
| Final approval / production file | PARTIAL (ZIP; PDF/X yok) |

Eksik: yasal metin gerçek kaynak, SKU matrisi, foto/illüstrasyon yükleme pipeline’ı, tekrar soru engeli için kalıcı brief QA, layered review.

---

## 7. REVISION SYSTEM

| Yetenek | Durum |
|---|---|
| revision counter | WORKING |
| Undo/redo (full snapshot) | WORKING (max 20; persist son 5) |
| ComparePreview | WORKING |
| Partial panel update | MISSING |
| DesignDocument model | DEFINED-ONLY (`document/types.ts` unused) |
| Undo of single layer | MISSING |

---

## 8. BOX DESIGN SYSTEM

**WORKING (güçlü):** tuck-end panel rolleri (front/back/side/spine/glue/tuck), kit/gate ayrımı, parfüm marks, spine rotate(-90), glue-only painter.

**PARTIAL:** tray panelleri daha ince art; sleeve `soon` gerçek geometri yok.

---

## 9. LABEL DESIGN SYSTEM

**WORKING:** flat-label + wrap-label, labelBack, SEAM cue, ayrı ask sequence, daha yüksek min type.

**BROKEN/STUB:** `wrapContinuity` → `''`.

---

## 10. BOX TEMPLATE MATCHING

`filterTemplates` skor (sector/sub/mode); `brief.templateId` veya best score.

| Template | Sınıf |
|---|---|
| fm-cos-tuck-perfume/cream/serum | WORKING |
| fm-cos-label-bottle | WORKING (craft PARTIAL) |
| fm-food-tuck-oil | WORKING |
| fm-food-tray-snack | PARTIAL |
| fm-food-label-jar | WORKING |
| fm-elec-tuck-earbuds/cable | WORKING |
| fm-elec-label-device | WORKING |
| fm-box-tuck-universal | WORKING |
| fm-box-sleeve-soon | DEFINED-ONLY / UNUSED |

Hardcoded fallback: dims yoksa template defaults. FE/BE ayrımı yok (tek client motor).

---

## 11. DIELINE / CUTTING SYSTEM

| Feature | Durum |
|---|---|
| Crease | WORKING |
| Glue areas | WORKING |
| Cut | **RISKY** — panel bbox (4 nokta), gerçek die outline değil |
| Bleed geometry | BROKEN vs claim (metin 3mm; geometri yok) |
| Safe overlay | PARTIAL (2 mm dashed) |
| DXF CUT/CREASE | WORKING (basic) |
| Consistency | PARTIAL (tray her zaman consistent) |

Tasarım yüzeyleri panel polygon clip ile bağlı; cut outline üretim için yanıltıcı.

---

## 12. GRAPHIC / ILLUSTRATION / DECORATION

| Modül | Runtime |
|---|---|
| Heroes / frames / goldBar / modernStripe | WORKING |
| backgroundTreatments | PARTIAL (eco/playful empty) |
| paintPatternFamily | UNUSED |
| motifs (contour, lattice, leaf, foil, …) | UNUSED (yalnız legalColumnChrome compose’da) |
| paintPrimitives | UNUSED |
| wrapContinuity | STUB |
| Marks / icons | WORKING (sektöre göre) |

**Probe:** luxury perfume planPattern=`contour` ama front’ta pattern=0.

---

## 13. DESIGN LANGUAGE

Kutu vs etiket **kodda ayrılmış** (kits, gates, compose yolları) — “basit varyasyon” değil.  
Ama dil zenginliği **plan düzeyinde** yüksek, **paint düzeyinde** düşük → FAILURE_CATALOG F1 (style collapse) hâlâ geçerli risk.

---

## 14. PROFESSIONAL DESIGN GAP

Motorun profesyonel ambalaj tasarımcısına yaklaşması için ilk 10 eksik (önem sırası):

1. Pattern/motif → compose wiring  
2. Illustration primitives painting  
3. wrapContinuity gerçek implementasyon  
4. Gerçek die-cut outline (bbox değil)  
5. Bleed/safe iddia ↔ geometri hizası  
6. Style differentiation (eco/playful/bg)  
7. Editable design document / partial revise  
8. Artwork-bound 3D preview  
9. Gerçek font dosyaları / kerning  
10. Certifiable legal/nutrition copy (sample değil)

---

## 15. SVG / VECTOR

Panel SVG layers + clip WORKING. Combined SVG honesty gates WORKING (ör. invented GTIN block).  
Preview2D/Compare WORKING. Filters/masks sınırlı; embedded raster logo dataURL destekli.  
Preview3D artwork map etmiyor.

---

## 16. PRINT READINESS

| | |
|---|---|
| SVG/DXF/ZIP export | WORKING |
| Browser printPdf | PARTIAL (PDF/X değil) |
| Bleed | MISSING geometri |
| Min font / line gates | PARTIAL (preflight) |
| Barcode honesty | WORKING |
| Press ICC / trap | MISSING |

Kutu vs etiket üretim kuralları kısmen (min type label’da yüksek); tam print-spec yok.

---

## 17. UX/UI

Landing → Workspace anlaşılır. Chat + 2D + Compare + Dieline + Production sekmeleri var.  
Kredi/abonelik UI yok (çünkü sistem yok).  
3D sekmesi yanıltıcı (CSS shell).  
Hata/preflight metinleri TR, dürüst örnek barkod uyarıları iyi.

---

## 18. WEBSITE ARCHITECTURE

Yalnız SPA shell. Marketing IA (`/ambalaj-tasarimi`, pricing, blog, SSS…) **MISSING**.  
Öneri (sonra): ayrı marketing site veya Next/router; stüdyo `/studio` altında. Şimdi gereksiz SEO sayfası üretme.

---

## 19. SEO ARCHITECTURE

`lang=tr` + title only. Meta description, OG, sitemap, robots, hreflang, JSON-LD **MISSING**.  
TR keyword kümesi (ambalaj/kutu/etiket/bıçak çizimi…) için henüz sayfa yok → **önce motor kalitesi**, SEO site ayrı faz.

---

## 20. INTERNATIONAL / i18n

i18n framework **MISSING**. Hardcoded TR. EN/ES için mimari yok.  
`toLocaleLowerCase('tr')` = string casing, çeviri değil.  
Baştan: UI dictionary + locale routing; motor copy ayrı content packs.

---

## 21. AUTHENTICATION

**MISSING** (login/register/session/roles/JWT). “Session” = localStorage proje.

---

## 22. USER DASHBOARD

Studio Workspace **WORKING**. Cloud projects / billing / credits dashboard **MISSING**.

---

## 23. ADMIN DASHBOARD

**MISSING**.

---

## 24. SAAS ARCHITECTURE

**MISSING.** İstemci motor + localStorage. Multi-tenant yok.

Hedef akış (henüz yok):
USER → AUTH → SUBSCRIPTION → CREDITS → DESIGN SESSION → RESERVE → EXECUTE → COMMIT/REFUND

---

## 25. SUBSCRIPTION SYSTEM

**MISSING.** Plan/trial/renewal/payment failure yok.

---

## 26. CREDIT SYSTEM

**MISSING.** Balance, deduction, refund, atomicity, double-charge koruması yok — değerlendirilecek kod yok.  
`runGenerate` metering yapmıyor.

---

## 27. BILLING / PAYMENT

Stripe / iyzico / PayTR **MISSING**. (Kodda `stripe` = motif adı.)

---

## 28. BROKEN FEATURES

- `wrapContinuity` stub  
- Preflight bleed claim vs export mismatch  
- Preview3D non-mapped artwork  
- Optional LLM KEY never attached  

---

## 29. PARTIAL FEATURES

- Pattern/illustration (planned, not painted)  
- Tray craft depth  
- Chat depth vs studio process  
- Print (SVG OK, press PDF yok)  
- Style backgrounds eco/playful  
- History persistence (5 of 20)  

---

## 30. UNUSED FEATURES

- `paintPatternFamily`, çoğu `motifs.*`, `paintPrimitives`  
- `document/types.ts` DesignDocument  
- `advisePlan` identity / `planGraph` generate dışı  
- `craft.stages` metadata-only  
- `fm-box-sleeve-soon`  
- `VITE_ENGINE=mock` (aynı motor)  

---

## 31. MISSING FEATURES

Auth, backend, DB, subscription, credits, billing, admin, marketing router, SEO stack, i18n, analytics, CI/CD, PDF/X, true die outline, font files, photo pipeline.

---

## 32. TECHNICAL RISKS

| Risk | Seviye |
|---|---|
| Cut bbox die-making misleading | HIGH |
| Director≠Painter craft gap | HIGH |
| Bleed overclaim | MED |
| Vite LLM key leakage if misused | MED–HIGH |
| Full regenerate cost / no layer lock | MED |
| Roadmap “98%” false confidence | MED |
| localStorage-only data loss | MED (SaaS öncesi) |
| Sample legal/nutrition as production | HIGH if sold as print-ready |

Race/double-charge: N/A (kredi yok).

---

## 33. TEST / QA

18 vitest PASS. Smokes manuel. Coverage: engine/intent/score/appState — **yok:** E2E, auth, billing, visual golden compose-wiring, die perimeter goldens.  
`d2-smoke` motif’leri isolation’da test eder; compose wiring’i kanıtlamaz.

---

## 34. PERFORMANCE

Client-side generation prototip için uygun. Code-split/CDN/budget yok. Ağır SVG/regenerate ölçekte UI jank riski (ölçülmedi).

---

## 35. DESIGN MATURITY SCORE

| Axis | /100 |
|---|---:|
| Design Engine | 68 |
| Chat Flow | 66 |
| Revision | 52 |
| Box Design | 76 |
| Label Design | 70 |
| Template Matching | 72 |
| Dieline | 55 |
| Graphic System | 42 |
| Illustration | 30 |
| Typography | 68 |
| Composition | 58 |
| Design Language | 55 |
| Print Readiness | 50 |
| UX | 68 |
| **TOTAL DESIGN MATURITY** | **59** |

Professional level: **2 / 5**

---

## 36. PLATFORM MATURITY SCORE

| Axis | /100 |
|---|---:|
| Architecture (studio) | 72 |
| SEO | 12 |
| i18n | 8 |
| Authentication | 0 |
| User Platform | 28 |
| Admin | 0 |
| Testing | 58 |
| Performance | 62 |
| **TOTAL PLATFORM MATURITY** | **20** |

---

## 37. SAAS MATURITY SCORE

| Axis | /100 |
|---|---:|
| SaaS Architecture | 5 |
| Subscription | 0 |
| Credit System | 0 |
| Billing | 0 |
| **TOTAL SAAS MATURITY** | **5** |

---

## 38. PRODUCT MATURITY SCORE

**TOTAL PRODUCT MATURITY: 38 / 100**  
(Güçlü yerel motor + zayıf/eksik platform; “Paxolab SaaS stüdyosu” hedefinin ~1/3’ü.)

---

## 39. P0 / P1 / P2 / P3 / P4 ISSUES

### P0
1. **Pattern/decor plan painter’a bağlı değil** — Evidence: probe patterns=0; compose motifs import only legalColumnChrome. Impact: craft collapse. Fix: wire `paintPatternFamily` + lockout. Complexity M.
2. **Cut = bbox** — Evidence: buildDieline outline 4 pts. Impact: converter yanıltma. Fix: gerçek outer path. Complexity L.
3. **SaaS olarak konumlandırma** — Evidence: auth/billing/credits yok. Impact: false product posture. Fix: dürüst “local studio” veya platform epic. Complexity — product.

### P1
4. Illustration primitives unused  
5. wrapContinuity stub  
6. Bleed/safe claim mismatch  
7. (SaaS hedefi varsa) Auth + backend + metering öncesi satış yok

### P2
8. Eco/playful backgrounds empty  
9. LLM KEY unused / proxy auth  
10. No partial revision / unused DesignDocument  
11. Style collapse F1 hardening

### P3
12. Preview3D shell  
13. Sleeve soon placeholder  
14. Marketing SEO site  
15. i18n EN

### P4
16. advisePlan/craft.stages ceremony cleanup  
17. Team orgs / SSO / advanced entitlements  

---

## 40. PRIORITIZED ROADMAP (dependency-aware)

Gerçek sıra (örnek faz listesinden sapma bilerek):

0. **Craft honesty + wiring** (patterns, primitives, wrapContinuity, bleed copy)  
1. **Dieline production geometry** (true cut)  
2. **Chat/brief/revision depth** (partial update veya document model)  
3. **Graphic vocabulary completion** (eco/playful, sector richness)  
4. **Export/print truth** (align claims; later PDF/X)  
5. **Public waitlist/marketing (thin)** — sadece ihtiyaç varsa  
6. **Auth + backend + project cloud**  
7. **Credits metering around generate** (atomic reserve/commit)  
8. **Subscription + billing (TR: iyzico adayı)**  
9. **User + Admin dashboards**  
10. **SEO TR site + i18n EN**  
11. **QA hardening / performance / launch**

---

## 41. PHASED DEVELOPMENT PLAN

### PHASE 0 — STABILIZATION / CRAFT WIRING
WHY: Docs ve Director runtime’dan ileri; güven kırığı.  
WHAT: compose’a pattern + primitives; wrapContinuity; preflight metin düzelt.  
FILES: composeArtwork.ts, patternFamilies.ts, motifs.ts, illustrationPrimitives.ts, preflight.ts, exportDoc.ts  
DONE: probe’da planPattern görünür; wrapContinuity ≠ ''; bleed metni = geometri.

### PHASE 1 — DIELINE CUT CORRECTNESS
WHY: “bıçak çizimi” ürün vaadi.  
WHAT: panel dış kenarlarından cut path; tuck radius opsiyon; DXF goldens.  
FILES: buildDieline.ts, dxf.ts, tests  
DONE: cutPts >> 4; converter örnek net geçer.

### PHASE 2 — REVISION / DOCUMENT
WHY: “logo küçülsün” her seferinde full regen.  
WHAT: DesignDocument’i kullan veya sil; panel-lock / patch path.  
FILES: document/types.ts, App.tsx, FormaLocalEngine.ts  

### PHASE 3 — DESIGN LANGUAGE RICHNESS
WHY: Level 2→3.  
WHAT: eco/playful bg; sector vocab paint; FAILURE F1 kapat.  

### PHASE 4 — CHAT STUDIO PROCESS
WHY: Profesyonel brief.  
WHAT: eksik alan QA, tekrar soru engeli, yasal alan gerçek kaynak.  

### PHASE 5 — PRINT HARDENING
WHAT: bleed geometry; PDF/X adayı sonra.  

### PHASE 6 — PLATFORM FOUNDATION
Auth + API + DB + project sync.  

### PHASE 7 — METERING + BILLING
Credit wallet + subscription; generate’e reservation.  

### PHASE 8 — WEBSITE + SEO TR + i18n EN
Router/marketing; hreflang later.  

### PHASE 9 — ADMIN + OPS
Users, refunds, abuse, logs.  

### PHASE 10 — LAUNCH HARDENING
E2E, rate limit, secrets, legal pages.

---

## 42. TOP 10 NEXT ACTIONS

1. **Wire `paintPatternFamily` into compose** — en büyük craft yalanı.  
2. **Call `paintPrimitives` when plan asks** — variation/S3 vaadi.  
3. **Implement or delete `wrapContinuity`** — label dili.  
4. **Fix bleed/safe preflight copy to match 2 mm overlay** (veya gerçek bleed çiz).  
5. **Replace bbox cut with true outer path** — dieline ürün vaadi.  
6. **Add compose-wiring golden smoke** (Director plan fields must appear in SVG).  
7. **Downgrade roadmap “98%” rhetoric** to match runtime (FAILURE_CATALOG ile hizala).  
8. **Decide product posture:** local studio vs SaaS — pazarlamayı buna kilitle.  
9. **Do not start Stripe/credits yet** — motor P0’lar açıkken SaaS yalancı ürün.  
10. **If public demo:** static waitlist page ayrı; SPA’ya fake auth ekleme.

---

## 43. PRE-LAUNCH CHECKLIST

### Local / private studio demo
- [x] Engine generates SVG  
- [ ] Pattern/illustration wiring  
- [ ] True cut path  
- [ ] Bleed honesty  
- [x] Basic tests green  
- [ ] Compose golden smokes  

### Public SaaS launch (hepsi açık)
- [ ] Auth  
- [ ] Backend + DB  
- [ ] Credits atomicity  
- [ ] Subscription + payment  
- [ ] User dashboard  
- [ ] Admin  
- [ ] Deploy/CI/secrets  
- [ ] Legal/privacy  
- [ ] SEO baseline  
- [ ] Rate limits / abuse  
- [ ] E2E  

**Sonuç:** SaaS launch **hazır değil**. Local studio demo **şartlı hazır** (craft P0 sonrası).

---

## 44. FINAL VERDICT

1. **Motor seviyesi:** Level **2/5** — çalışan specialist prototype.  
2. **Chat→tasarım en büyük eksikler:** derin discovery, yasal gerçek içerik, partial revision, plan≠paint.  
3. **Kutu/etiket dilleri ayrılmış mı?** Kodda **evet**; craft zenginliği label’da wrapContinuity stub ile zayıf.  
4. **Template→ölçü→dieline→tasarım güvenilir mi?** Template/ölçü **kısmen evet**; cut outline **hayır (RISKY)**; crease/glue **evet**.  
5. **Profesyonel seviyeye en büyük engeller:** unwired decor library, bbox cut, sample legal, no fonts, regenerate-only.  
6. **Grafik/illustration eksik:** patternFamilies + primitives + çoğu motifs runtime’da yok.  
7. **Mevcut mimari üzerine devam?** **Evet** — `FormaLocalEngine` + dieline + compose omurgası doğru; rewrite gerekmez.  
8. **Baştan yapılacak bölüm?** SaaS/auth/billing/credits/SEO site **sıfırdan**; motor **evrim**. Sleeve gerçek geometri sıfırdan.  
9. **Ana sayfa/site:** Şimdi ayrı ince marketing veya bekle; stüdyo SPA’yı şişirme. TR hizmet sayfaları motor stabilize sonra.  
10. **TR SEO:** Intent sayfaları (ambalaj/kutu/etiket/bıçak) — **faz 8**; keyword stuffing yok.  
11. **EN/uluslararası:** i18n dictionary + hreflang; EN ikinci dil.  
12. **i18n konumlandırma:** Baştan UI strings ayır; hardcoded TR’yi dictionary’ye taşı (şimdi borç).  
13. **Abonelik mimarisi yeterli mi?** **Hayır — yok.**  
14. **Credit güvenilir mi?** **N/A / hayır — yok.**  
15. **Design op ↔ credit bağlantısı?** **Yok.**  
16. **User/admin sırası:** Auth+user projects → credits/billing → admin.  
17. **Launch öncesi mutlak:** craft wiring, cut correctness, bleed honesty, (SaaS ise) auth+metering+billing+legal.  
18. **İlk 10 geliştirme:** §42.  
19. **Doğru roadmap ile profesyonel stüdyo seviyesine çıkabilir mi?** **Evet, motor temeli var** — ama “98% bitti” değil; craft wiring + die geometry + sonra platform. SaaS iddiası şu an **kanıtsız**.

---

*Kanıt detayları: `/workspace/paxolab-audit-design.md`, `/workspace/paxolab-audit-platform.md`*  
*Paxolab kaynaklarına yazılmadı.*
