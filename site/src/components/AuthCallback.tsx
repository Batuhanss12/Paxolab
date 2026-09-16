"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeHandoff } from "@/lib/auth";
import { adminHref, customerHref } from "@/lib/panelPaths";
import { loadAuth } from "@/lib/auth";

export function AuthCallback({ locale }: { locale: "tr" | "en" }) {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const tr = locale !== "en";

  useEffect(() => {
    const failed = params.get("error");
    if (failed) {
      setError(failed);
      return;
    }
    const id = params.get("handoff");
    if (!id) {
      setError(tr ? "Oturum kodu yok." : "Missing sign-in code.");
      return;
    }
    void exchangeHandoff(id)
      .then(() => {
        const auth = loadAuth();
        router.replace(auth?.user.role === "admin" ? adminHref(locale) : customerHref(locale));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Giriş başarısız."));
  }, [params, tr, locale, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {error ? (
        <>
          <h1 className="font-display text-2xl text-cream">{tr ? "Giriş tamamlanamadı" : "Sign-in failed"}</h1>
          <p className="mt-3 text-sm text-red-300/90">{error}</p>
          <button
            type="button"
            className="mt-6 rounded-full border border-cream/20 px-5 py-2 text-sm text-cream"
            onClick={() => router.push(locale === "en" ? "/en" : "/")}
          >
            {tr ? "Ana sayfa" : "Home"}
          </button>
        </>
      ) : (
        <p className="text-sm text-cream/50">{tr ? "Google oturumu alınıyor…" : "Finishing Google sign-in…"}</p>
      )}
    </div>
  );
}
