"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { localeFromPath } from "@/lib/i18n";
import { login, register, studioHandoffUrl } from "@/lib/auth";

export type AuthModalMode = "login" | "register";

type Props = {
  open: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
  locale?: "tr" | "en";
};

const copy = {
  tr: {
    loginTitle: "Giriş yap",
    registerTitle: "Kayıt ol",
    loginLead: "Hesabınla devam et. Sonra stüdyoyu açabilirsin.",
    registerLead: "Hesap oluştur. Projeler ve krediler bulutta tutulur.",
    email: "E-posta",
    password: "Şifre (min 8)",
    name: "Ad (opsiyonel)",
    submitLogin: "Giriş yap",
    submitRegister: "Kayıt ol",
    busy: "Bekle…",
    switchToRegister: "Hesabın yok mu? Kayıt ol",
    switchToLogin: "Zaten hesabın var mı? Giriş yap",
    success: "Başarılı!",
    openStudio: "Stüdyoya git",
    close: "Kapat",
  },
  en: {
    loginTitle: "Log in",
    registerTitle: "Sign up",
    loginLead: "Continue with your account. Then you can open the studio.",
    registerLead: "Create an account. Projects and credits stay in the cloud.",
    email: "Email",
    password: "Password (min 8)",
    name: "Name (optional)",
    submitLogin: "Log in",
    submitRegister: "Sign up",
    busy: "Please wait…",
    switchToRegister: "No account? Sign up",
    switchToLogin: "Already have an account? Log in",
    success: "Success!",
    openStudio: "Open studio",
    close: "Close",
  },
} as const;

export function AuthModal({ open, mode, onClose, onModeChange, locale: localeProp }: Props) {
  const pathname = usePathname() || "/";
  const locale = localeProp ?? localeFromPath(pathname);
  const t = copy[locale === "en" ? "en" : "tr"];
  const titleId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
      setDone(false);
      setPassword("");
      return;
    }
    setDone(false);
    setError(null);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await register({ email, password, name: name.trim() || undefined });
      } else {
        await login(email, password);
      }
      setDone(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  const panel = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-975/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-sm border border-cream/10 bg-ink-950 p-6 shadow-2xl shadow-black/50">
        {done ? (
          <div className="space-y-4 text-center">
            <p className="font-display text-2xl text-cream">{t.success}</p>
            <a
              href={studioHandoffUrl()}
              className="inline-flex w-full items-center justify-center rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink-975 transition hover:bg-cream-soft"
              rel="noopener noreferrer"
            >
              {t.openStudio}
            </a>
            <button
              type="button"
              className="w-full rounded-full border border-cream/15 px-5 py-2.5 text-sm text-cream/70 transition hover:border-cream/30 hover:text-cream"
              onClick={onClose}
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="font-display text-2xl text-cream">
                  {mode === "register" ? t.registerTitle : t.loginTitle}
                </h2>
                <p className="mt-1 text-sm text-cream/50">
                  {mode === "register" ? t.registerLead : t.loginLead}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xs text-cream/45 transition hover:text-cream"
                onClick={onClose}
                disabled={busy}
              >
                {t.close}
              </button>
            </div>

            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="text-xs uppercase tracking-wider text-cream/45">
                  {t.name}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="text-xs uppercase tracking-wider text-cream/45">
                {t.email}
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="text-xs uppercase tracking-wider text-cream/45">
                {t.password}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink-975 transition hover:bg-cream-soft disabled:opacity-60"
            >
              {busy
                ? t.busy
                : mode === "register"
                  ? t.submitRegister
                  : t.submitLogin}
            </button>

            <button
              type="button"
              className="w-full text-center text-sm text-cream/50 transition hover:text-cream"
              disabled={busy}
              onClick={() => {
                onModeChange(mode === "login" ? "register" : "login");
                setError(null);
              }}
            >
              {mode === "login" ? t.switchToRegister : t.switchToLogin}
            </button>

            {error && (
              <p className="text-center text-sm text-red-300/90" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
