"use client";

import { useEffect } from "react";

/** Sets <html lang> for nested locale segments (root layout owns <html>). */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev || "tr";
    };
  }, [lang]);
  return null;
}
