import type { Locale } from "@/content/types";

/** TR root ↔ EN /en pairs. /kvkk shares EN privacy with /gizlilik. */
export const LOCALE_PAIRS: { tr: string; en: string }[] = [
  { tr: "/", en: "/en" },
  { tr: "/ambalaj-tasarimi", en: "/en/packaging-design" },
  { tr: "/kutu-tasarimi", en: "/en/box-design" },
  { tr: "/etiket-tasarimi", en: "/en/label-design" },
  { tr: "/bicki-cizimi", en: "/en/dieline" },
  { tr: "/kozmetik-ambalaj-tasarimi", en: "/en/cosmetic-packaging-design" },
  { tr: "/parfum-kutusu-tasarimi", en: "/en/perfume-box-design" },
  { tr: "/gida-ambalaj-tasarimi", en: "/en/food-packaging-design" },
  { tr: "/serum-krem-kutusu-tasarimi", en: "/en/serum-cream-box-design" },
  { tr: "/ai-ambalaj-tasarimi", en: "/en/what-is-ai-packaging-design" },
  { tr: "/baskiya-hazir-dieline", en: "/en/print-ready-dieline" },
  { tr: "/etiket-mi-kutu-mu", en: "/en/label-vs-box" },
  { tr: "/nasil-calisir", en: "/en/how-it-works" },
  { tr: "/ornekler", en: "/en/examples" },
  { tr: "/fiyatlandirma", en: "/en/pricing" },
  { tr: "/sss", en: "/en/faq" },
  { tr: "/iletisim", en: "/en/contact" },
  { tr: "/gizlilik", en: "/en/privacy" },
  { tr: "/kvkk", en: "/en/privacy" },
  { tr: "/kullanim-kosullari", en: "/en/terms" },
  { tr: "/private-label-gida-kutusu-brief", en: "/en/private-label-food-box-brief" },
  { tr: "/gida-etiket-zorunlu-bilgi-alanlari", en: "/en/food-label-mandatory-info-fields" },
  { tr: "/atistirmalik-kutu-vs-poset", en: "/en/snack-box-vs-pouch" },
  { tr: "/serum-kutusu-olcu-brief", en: "/en/serum-box-size-brief" },
  { tr: "/krem-kavanoz-etiketi", en: "/en/cream-jar-label" },
  { tr: "/skincare-set-kutusu", en: "/en/skincare-set-box" },
  { tr: "/ai-vs-grafik-ajans-ambalaj", en: "/en/ai-vs-design-agency-packaging" },
  { tr: "/grapxor-vektor-motoru-nasil-calisir", en: "/en/how-grapxor-vector-engine-works" },
  { tr: "/ai-ambalaj-mitleri", en: "/en/ai-packaging-myths" },
  { tr: "/svg-dieline-matbaaya-nasil-verilir", en: "/en/how-to-send-svg-dieline-to-printer" },
  { tr: "/tuck-end-dieline-okuma", en: "/en/reading-a-tuck-end-dieline" },
  { tr: "/ambalaj-preflight-checklist", en: "/en/packaging-preflight-checklist" },
  { tr: "/etiket-ve-kutu-ne-zaman-birlikte", en: "/en/when-to-use-label-and-box-together" },
  { tr: "/e-ticaret-kutusu-tasarimi", en: "/en/ecommerce-box-design" },
  { tr: "/sise-wrap-etiket", en: "/en/bottle-wrap-label" },
];

const trToEn = new Map<string, string>();
const enToTr = new Map<string, string>();

for (const pair of LOCALE_PAIRS) {
  trToEn.set(pair.tr, pair.en);
  // Prefer /gizlilik as TR counterpart when EN privacy is shared with /kvkk
  if (!(pair.en === "/en/privacy" && pair.tr === "/kvkk")) {
    enToTr.set(pair.en, pair.tr);
  }
}
if (!enToTr.has("/en/privacy")) {
  enToTr.set("/en/privacy", "/gizlilik");
}

export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "tr";
}

export function getAlternatePath(path: string, target: Locale): string {
  const normalized = path === "" ? "/" : path;
  if (target === "en") {
    return trToEn.get(normalized) ?? (normalized.startsWith("/en") ? normalized : "/en");
  }
  return enToTr.get(normalized) ?? (normalized.startsWith("/en") ? "/" : normalized);
}

export function getLanguageAlternates(path: string): {
  "tr-TR": string;
  en: string;
  "x-default": string;
} {
  const locale = localeFromPath(path);
  const trPath = locale === "tr" ? path : getAlternatePath(path, "tr");
  const enPath = locale === "en" ? path : getAlternatePath(path, "en");
  return {
    "tr-TR": trPath,
    en: enPath,
    "x-default": trPath,
  };
}

/** Unique sitemap entries: skip duplicate EN when multiple TR map to same EN. */
export function sitemapPaths(): { tr: string; en: string }[] {
  const seenEn = new Set<string>();
  const out: { tr: string; en: string }[] = [];
  for (const pair of LOCALE_PAIRS) {
    if (pair.tr === "/kvkk") {
      // Include TR /kvkk; EN privacy already covered by /gizlilik pair
      out.push({ tr: pair.tr, en: pair.en });
      continue;
    }
    if (seenEn.has(pair.en)) continue;
    seenEn.add(pair.en);
    out.push(pair);
  }
  return out;
}

export const EN_ROUTES = [
  "/en",
  "/en/packaging-design",
  "/en/box-design",
  "/en/label-design",
  "/en/dieline",
  "/en/cosmetic-packaging-design",
  "/en/perfume-box-design",
  "/en/food-packaging-design",
  "/en/serum-cream-box-design",
  "/en/what-is-ai-packaging-design",
  "/en/print-ready-dieline",
  "/en/label-vs-box",
  "/en/how-it-works",
  "/en/examples",
  "/en/pricing",
  "/en/faq",
  "/en/contact",
  "/en/privacy",
  "/en/terms",
  "/en/private-label-food-box-brief",
  "/en/food-label-mandatory-info-fields",
  "/en/snack-box-vs-pouch",
  "/en/serum-box-size-brief",
  "/en/cream-jar-label",
  "/en/skincare-set-box",
  "/en/ai-vs-design-agency-packaging",
  "/en/how-grapxor-vector-engine-works",
  "/en/ai-packaging-myths",
  "/en/how-to-send-svg-dieline-to-printer",
  "/en/reading-a-tuck-end-dieline",
  "/en/packaging-preflight-checklist",
  "/en/when-to-use-label-and-box-together",
  "/en/ecommerce-box-design",
  "/en/bottle-wrap-label",
] as const;
