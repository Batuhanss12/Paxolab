/**
 * Local SEO route smoke: checks every LOCALE_PAIRS path has a page.tsx.
 * Run: node scripts/seo-route-smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i18n = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
const pairs = [...i18n.matchAll(/\{\s*tr:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g)].map((m) => ({
  tr: m[1],
  en: m[2],
}));

const missing = [];
for (const { tr, en } of pairs) {
  if (tr === "/") {
    if (!fs.existsSync(path.join(root, "src/app/page.tsx"))) missing.push(tr);
    continue;
  }
  if (tr === "/kvkk") continue; // legal page may share patterns
  const trPage = path.join(root, "src/app", tr.replace(/^\//, ""), "page.tsx");
  if (!fs.existsSync(trPage)) missing.push(`TR ${tr}`);
  if (en === "/en") {
    if (!fs.existsSync(path.join(root, "src/app/en/page.tsx"))) missing.push("EN /en");
    continue;
  }
  const enSlug = en.replace(/^\/en\//, "").replace(/^\/en$/, "");
  const enPage = path.join(root, "src/app/en", enSlug, "page.tsx");
  if (en.endsWith("/privacy") && tr === "/kvkk") continue;
  if (!fs.existsSync(enPage)) missing.push(`EN ${en}`);
}

if (missing.length) {
  console.error("Missing page.tsx for:", missing);
  process.exit(1);
}
console.log(`OK ${pairs.length} locale pairs have page files.`);
