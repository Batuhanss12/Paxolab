import fs from "fs";
import path from "path";

const ROOT = "/workspace/paxolab-site";
const spokes = JSON.parse(fs.readFileSync("/tmp/spokes-all.json", "utf8"));
if (spokes.length !== 15) throw new Error("expected 15 spokes, got " + spokes.length);

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function fmtRelated(arr, indent = "        ") {
  return arr
    .map((r) => `${indent}{ href: "${r.href}", label: "${esc(r.label)}" },`)
    .join("\n");
}

function fmtSections(sections, indent = "        ") {
  return sections
    .map(
      (s) => `${indent}{\n${indent}  title: "${esc(s.title)}",\n${indent}  body: "${esc(s.body)}",\n${indent}},`
    )
    .join("\n");
}

function fmtFaqs(faqs, indent = "        ") {
  return faqs
    .map(
      (f) => `${indent}{\n${indent}  q: "${esc(f.q)}",\n${indent}  a: "${esc(f.a)}",\n${indent}},`
    )
    .join("\n");
}

function serviceBlock(slug, data) {
  return `    "${slug}": {
      slug: "${slug}",
      meta: {
        title: "${esc(data.metaTitle)}",
        description:
          "${esc(data.metaDesc)}",
      },
      hero: {
        title: "${esc(data.heroTitle)}",
        lead: "${esc(data.heroLead)}",
      },
      sections: [
${fmtSections(data.sections)}
      ],
      related: [
${fmtRelated(data.related)}
      ],
      faqs: [
${fmtFaqs(data.faqs)}
      ],
      serviceName: "${esc(data.serviceName)}",
      serviceType: "${data.serviceType}",
    },`;
}

function insertServices(filePath, locale) {
  let src = fs.readFileSync(filePath, "utf8");
  const marker = "\n  howItWorks: {";
  const idx = src.lastIndexOf(marker);
  if (idx < 0) throw new Error("howItWorks marker not found in " + filePath);

  // Find end of services object: the `  },` immediately before howItWorks
  // Pattern: last service closes with `    },\n  },\n\n  howItWorks`
  const before = src.slice(0, idx);
  const after = src.slice(idx);

  // Remove previously inserted spokes if re-running (between last classic and howItWorks)
  // We'll replace from LabelVsBox / etiket-mi-kutu-mu closing through services close

  const blocks = spokes
    .map((sp) => serviceBlock(locale === "tr" ? sp.trSlug : sp.enSlug, locale === "tr" ? sp.tr : sp.en))
    .join("\n");

  // Insert before `  },` that closes services — which is right before howItWorks
  // before should end with `    },\n  },` — the last `  },` closes services
  const servicesClose = before.lastIndexOf("\n  },");
  if (servicesClose < 0) throw new Error("services close not found");
  const head = before.slice(0, servicesClose);
  // strip any prior spoke insertions: detect if private-label already present
  let cleanHead = head;
  const already = locale === "tr" ? '"private-label-gida-kutusu-brief"' : '"private-label-food-box-brief"';
  if (cleanHead.includes(already)) {
    // remove from first spoke key through end of head (keep up to LabelVsBox block end)
    const re =
      locale === "tr"
        ? /\n    "private-label-gida-kutusu-brief":[\s\S]*$/
        : /\n    "private-label-food-box-brief":[\s\S]*$/;
    cleanHead = cleanHead.replace(re, "");
  }

  const newSrc = cleanHead + "\n" + blocks + "\n  }," + after;
  fs.writeFileSync(filePath, newSrc);
  console.log("patched services:", filePath);
}

function patchParentRelated(filePath, locale) {
  let src = fs.readFileSync(filePath, "utf8");

  const parents = {
    tr: {
      "gida-ambalaj-tasarimi": [
        { href: "/private-label-gida-kutusu-brief", label: "Private label gıda brief" },
        { href: "/gida-etiket-zorunlu-bilgi-alanlari", label: "Zorunlu bilgi alanları" },
        { href: "/atistirmalik-kutu-vs-poset", label: "Kutu vs poşet" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
      ],
      "serum-krem-kutusu-tasarimi": [
        { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
        { href: "/krem-kavanoz-etiketi", label: "Krem kavanoz etiketi" },
        { href: "/skincare-set-kutusu", label: "Skincare set kutusu" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      "ai-ambalaj-tasarimi": [
        { href: "/ai-vs-grafik-ajans-ambalaj", label: "AI vs grafik ajans" },
        { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
        { href: "/ai-ambalaj-mitleri", label: "AI ambalaj mitleri" },
        { href: "/nasil-calisir", label: "Nasıl çalışır?" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      ],
      "baskiya-hazir-dieline": [
        { href: "/svg-dieline-matbaaya-nasil-verilir", label: "SVG matbaaya verme" },
        { href: "/tuck-end-dieline-okuma", label: "Tuck-end dieline okuma" },
        { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      "etiket-mi-kutu-mu": [
        { href: "/etiket-ve-kutu-ne-zaman-birlikte", label: "Etiket ve kutu birlikte" },
        { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
        { href: "/sise-wrap-etiket", label: "Şişe wrap etiket" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
    },
    en: {
      "food-packaging-design": [
        { href: "/en/private-label-food-box-brief", label: "Private-label food brief" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/label-design", label: "Label design" },
      ],
      "serum-cream-box-design": [
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/box-design", label: "Box design" },
      ],
      "what-is-ai-packaging-design": [
        { href: "/en/ai-vs-design-agency-packaging", label: "AI vs design agency" },
        { href: "/en/how-forma-vector-engine-works", label: "How FORMA works" },
        { href: "/en/ai-packaging-myths", label: "AI packaging myths" },
        { href: "/en/how-it-works", label: "How it works" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      ],
      "print-ready-dieline": [
        { href: "/en/how-to-send-svg-dieline-to-printer", label: "Send SVG to printer" },
        { href: "/en/reading-a-tuck-end-dieline", label: "Reading a tuck-end dieline" },
        { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/box-design", label: "Box design" },
      ],
      "label-vs-box": [
        { href: "/en/when-to-use-label-and-box-together", label: "Label and box together" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
        { href: "/en/bottle-wrap-label", label: "Bottle wrap label" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/box-design", label: "Box design" },
      ],
    },
  };

  const map = parents[locale];
  for (const [slug, related] of Object.entries(map)) {
    const re = new RegExp(
      `("${slug}":\\s*\\{[\\s\\S]*?related:\\s*\\[)[\\s\\S]*?(\\],\\s*faqs:)`,
      "m"
    );
    if (!re.test(src)) {
      console.warn("WARN: related not found for", slug);
      continue;
    }
    const inner = related.map((r) => `        { href: "${r.href}", label: "${esc(r.label)}" },`).join("\n");
    src = src.replace(re, `$1\n${inner}\n      $2`);
    console.log("parent related:", slug);
  }
  fs.writeFileSync(filePath, src);
}

function patchNav(filePath, locale) {
  let src = fs.readFileSync(filePath, "utf8");
  // Add a few spokes lower in nav.links (before iletisim/contact)
  const additions =
    locale === "tr"
      ? [
          { href: "/private-label-gida-kutusu-brief", label: "Private label gıda brief" },
          { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
          { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
          { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
          { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
        ]
      : [
          { href: "/en/private-label-food-box-brief", label: "Private-label food brief" },
          { href: "/en/serum-box-size-brief", label: "Serum size brief" },
          { href: "/en/how-forma-vector-engine-works", label: "How FORMA works" },
          { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
          { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
        ];

  // idempotent: skip if first already present
  if (src.includes(additions[0].href) && src.includes("nav:")) {
    // check specifically in links array region — still ok to skip duplicates
    const marker = locale === "tr" ? '{ href: "/iletisim", label: "İletişim" }' : '{ href: "/en/contact", label: "Contact" }';
    if (!src.includes(`href: "${additions[0].href}"`)) {
      const lines = additions.map((a) => `      { href: "${a.href}", label: "${esc(a.label)}" },`).join("\n");
      src = src.replace(marker, `${lines}\n      ${marker}`);
      fs.writeFileSync(filePath, src);
      console.log("nav links patched", locale);
    } else {
      console.log("nav links already present", locale);
    }
  } else {
    const marker = locale === "tr" ? '{ href: "/iletisim", label: "İletişim" }' : '{ href: "/en/contact", label: "Contact" }';
    const lines = additions.map((a) => `      { href: "${a.href}", label: "${esc(a.label)}" },`).join("\n");
    if (!src.includes(marker)) throw new Error("nav contact marker missing " + locale);
    if (!src.includes(`href: "${additions[0].href}"`)) {
      src = src.replace(marker, `${lines}\n      ${marker}`);
      fs.writeFileSync(filePath, src);
      console.log("nav links patched", locale);
    } else {
      console.log("nav already has spokes", locale);
    }
  }
}

function writePages() {
  for (const sp of spokes) {
    const trDir = path.join(ROOT, "src/app", sp.trSlug);
    const enDir = path.join(ROOT, "src/app/en", sp.enSlug);
    fs.mkdirSync(trDir, { recursive: true });
    fs.mkdirSync(enDir, { recursive: true });
    fs.writeFileSync(
      path.join(trDir, "page.tsx"),
      `import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("tr").services["${sp.trSlug}"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/${sp.trSlug}",
  locale: "tr",
});

export default function Page() {
  return <ServicePageView data={data} locale="tr" howHref="/nasil-calisir" />;
}
`
    );
    fs.writeFileSync(
      path.join(enDir, "page.tsx"),
      `import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";
import { ServicePageView } from "@/components/ServicePage";

const data = getContent("en").services["${sp.enSlug}"];

export const metadata = pageMetadata({
  title: data.meta.title,
  description: data.meta.description,
  path: "/en/${sp.enSlug}",
  locale: "en",
});

export default function Page() {
  return <ServicePageView data={data} locale="en" howHref="/en/how-it-works" />;
}
`
    );
  }
  console.log("wrote", spokes.length * 2, "page.tsx files");
}

function patchI18n() {
  let src = fs.readFileSync(path.join(ROOT, "src/lib/i18n.ts"), "utf8");
  // Remove prior spoke pairs if re-running
  const pairStart = "  { tr: \"/kullanim-kosullari\", en: \"/en/terms\" },\n];";
  // Build pairs to insert before closing of LOCALE_PAIRS
  const pairs = spokes
    .map((sp) => `  { tr: "/${sp.trSlug}", en: "/en/${sp.enSlug}" },`)
    .join("\n");

  // Strip any previously added spoke pairs (between terms and ]);
  src = src.replace(
    /(\{ tr: "\/kullanim-kosullari", en: "\/en\/terms" \},)[\s\S]*?(\];)/,
    `$1\n${pairs}\n$2`
  );

  const enRoutes = spokes.map((sp) => `  "/en/${sp.enSlug}",`).join("\n");
  src = src.replace(
    /(\s*"\/en\/terms",)[\s\S]*?(] as const;)/,
    `$1\n${enRoutes}\n$2`
  );

  fs.writeFileSync(path.join(ROOT, "src/lib/i18n.ts"), src);
  console.log("i18n patched");
}

insertServices(path.join(ROOT, "src/content/tr.ts"), "tr");
insertServices(path.join(ROOT, "src/content/en.ts"), "en");
patchParentRelated(path.join(ROOT, "src/content/tr.ts"), "tr");
patchParentRelated(path.join(ROOT, "src/content/en.ts"), "en");
patchNav(path.join(ROOT, "src/content/tr.ts"), "tr");
patchNav(path.join(ROOT, "src/content/en.ts"), "en");
writePages();
patchI18n();
console.log("DONE apply");
