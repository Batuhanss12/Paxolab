import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCallback } from "@/components/AuthCallback";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function EnAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-cream/45">Loading…</div>}>
      <AuthCallback locale="en" />
    </Suspense>
  );
}
