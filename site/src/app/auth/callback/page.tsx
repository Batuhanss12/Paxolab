import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCallback } from "@/components/AuthCallback";

export const metadata: Metadata = {
  title: "Giriş",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-cream/45">Yükleniyor…</div>}>
      <AuthCallback locale="tr" />
    </Suspense>
  );
}
