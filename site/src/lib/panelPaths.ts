import type { Locale } from "@/content/types";

export type AppKind = "customer" | "admin";

export function isAppChromePath(path: string): boolean {
  return (
    path === "/hesap" ||
    path.startsWith("/hesap/") ||
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/en/account" ||
    path.startsWith("/en/account/") ||
    path === "/en/admin" ||
    path.startsWith("/en/admin/")
  );
}

export function customerBase(locale: Locale): string {
  return locale === "en" ? "/en/account" : "/hesap";
}

export function adminBase(locale: Locale): string {
  return locale === "en" ? "/en/admin" : "/admin";
}

export function parseAppPath(path: string): { kind: AppKind; locale: Locale; segments: string[] } | null {
  if (path === "/hesap" || path.startsWith("/hesap/")) {
    const rest = path === "/hesap" ? "" : path.slice("/hesap/".length);
    return { kind: "customer", locale: "tr", segments: rest ? rest.split("/").filter(Boolean) : [] };
  }
  if (path === "/en/account" || path.startsWith("/en/account/")) {
    const rest = path === "/en/account" ? "" : path.slice("/en/account/".length);
    return { kind: "customer", locale: "en", segments: rest ? rest.split("/").filter(Boolean) : [] };
  }
  if (path === "/admin" || path.startsWith("/admin/")) {
    const rest = path === "/admin" ? "" : path.slice("/admin/".length);
    return { kind: "admin", locale: "tr", segments: rest ? rest.split("/").filter(Boolean) : [] };
  }
  if (path === "/en/admin" || path.startsWith("/en/admin/")) {
    const rest = path === "/en/admin" ? "" : path.slice("/en/admin/".length);
    return { kind: "admin", locale: "en", segments: rest ? rest.split("/").filter(Boolean) : [] };
  }
  return null;
}

export function customerHref(locale: Locale, ...segments: string[]): string {
  const base = customerBase(locale);
  return segments.length ? `${base}/${segments.join("/")}` : base;
}

export function adminHref(locale: Locale, ...segments: string[]): string {
  const base = adminBase(locale);
  return segments.length ? `${base}/${segments.join("/")}` : base;
}

export function swapAppLocale(path: string, target: Locale): string | null {
  const parsed = parseAppPath(path);
  if (!parsed) return null;
  return parsed.kind === "admin"
    ? adminHref(target, ...parsed.segments)
    : customerHref(target, ...parsed.segments);
}
