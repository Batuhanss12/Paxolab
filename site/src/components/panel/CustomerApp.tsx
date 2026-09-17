"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localeFromPath } from "@/lib/i18n";
import {
  AUTH_EVENT,
  getCreditBalance,
  loadAuth,
  logout,
  saveAuth,
  studioHandoffUrl,
  type AuthState,
} from "@/lib/auth";
import { consoleRequest } from "@/lib/consoleApi";
import { customerBase, customerHref, parseAppPath } from "@/lib/panelPaths";
import { TeamSection } from "@/components/console/TeamSection";
import { EmptyState, ErrorText, NoteText, PanelCard, PanelShell, StatGrid, TableWrap } from "./PanelShell";

type Project = { id: string; title: string; updated_at: string; created_at?: string };
type Sub = {
  id?: string;
  planLabel?: string;
  planId?: string;
  monthlyCredits?: number;
  status?: string;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
} | null;
type Credits = {
  balance: number;
  billingUserId?: string;
  isShared?: boolean;
  buckets?: { included: number; purchased: number; bonus: number; total: number };
};
type Pack = { id: string; credits: number; priceTry: number; label: string; currency: string };
type Usage = {
  id: string;
  operationId: string;
  creditCost: number;
  status: string;
  createdAt?: string;
  created_at?: string;
};
type Ledger = { id: string; kind: string; amount: number; createdAt?: string; created_at?: string };
type Order = {
  id: string;
  pack_id: string;
  credits: number;
  amount_try: number;
  currency: string;
  status: string;
  created_at: string;
};
type Plan = {
  id: string;
  label: string;
  monthlyPrice?: number;
  priceTry?: number;
  monthlyCredits: number;
  unlimited?: boolean;
  enabled?: boolean;
};

/** Invite token stashed before login; accepted once a session exists. */
const INVITE_KEY = "grapxor.pendingInvite.v1";

function stripInviteParam(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("invite")) return;
  params.delete("invite");
  const next = params.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`,
  );
}

export function CustomerApp() {
  const pathname = usePathname() || "/hesap";
  const locale = localeFromPath(pathname);
  const router = useRouter();
  const parsed = parseAppPath(pathname);
  const section = parsed?.segments[0] ?? "";
  const tr = locale !== "en";

  const [session, setSession] = useState<AuthState | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<Sub>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [studioUrl, setStudioUrl] = useState("");

  const boot = useCallback(() => {
    // Stash a pending team invite before any redirect drops the query param.
    if (typeof window !== "undefined") {
      const inviteToken = new URLSearchParams(window.location.search).get("invite");
      if (inviteToken) sessionStorage.setItem(INVITE_KEY, inviteToken);
    }
    const auth = loadAuth();
    setSession(auth);
    setStudioUrl(auth ? studioHandoffUrl() : "");
    if (!auth) {
      router.replace(locale === "en" ? "/en" : "/");
      return;
    }
    void getCreditBalance(auth.token).then(setBalance);
    void Promise.all([
      consoleRequest<{ projects: Project[] }>("/api/projects").catch(() => ({ projects: [] })),
      consoleRequest<{ subscription: Sub }>("/api/billing/subscription").catch(() => ({ subscription: null })),
      consoleRequest<Credits>("/api/billing/credits").catch(() => null),
      consoleRequest<{ usage?: Usage[]; operations?: Usage[] }>("/api/billing/usage?limit=50").catch(
        (): { usage?: Usage[]; operations?: Usage[] } => ({}),
      ),
      consoleRequest<{ ledger?: Ledger[]; transactions?: Ledger[] }>("/api/billing/ledger?limit=50").catch(
        (): { ledger?: Ledger[]; transactions?: Ledger[] } => ({}),
      ),
      consoleRequest<{ orders: Order[] }>("/api/billing/orders").catch(() => ({ orders: [] })),
      consoleRequest<{ plans: Plan[] }>("/api/billing/plans").catch(() => ({ plans: [] })),
      consoleRequest<{ packs: Pack[] }>("/api/billing/packs").catch(() => ({ packs: [] })),
    ])
      .then(([proj, sub, cr, use, led, ord, pl, pk]) => {
        setProjects(proj.projects ?? []);
        setSubscription(sub.subscription ?? null);
        setCredits(cr);
        setUsage(use.usage ?? use.operations ?? []);
        setLedger(led.ledger ?? led.transactions ?? []);
        setOrders(ord.orders ?? []);
        setPlans((pl.plans ?? []).filter((p) => p.enabled !== false));
        setPacks(pk.packs ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi."));
  }, [locale, router]);

  useEffect(() => {
    boot();
    window.addEventListener(AUTH_EVENT, boot);
    return () => window.removeEventListener(AUTH_EVENT, boot);
  }, [boot]);

  // The invite param has been stashed; keep it out of the URL so a refresh
  // cannot replay a consumed invite.
  useEffect(() => {
    stripInviteParam();
  }, []);

  // Accept a stashed invite once a session exists (covers the
  // "invite link → log in on the site → land back on /hesap" path).
  useEffect(() => {
    if (!session) return;
    const token = sessionStorage.getItem(INVITE_KEY);
    if (!token) return;
    sessionStorage.removeItem(INVITE_KEY);
    setBusy(true);
    setError(null);
    consoleRequest(`/api/orgs/invites/${token}/accept`, { method: "POST" })
      .then(() => {
        setNote(tr ? "Davet kabul edildi." : "Invite accepted.");
        router.replace(customerHref(locale, "team"));
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : tr
              ? "Davet alınamadı."
              : "Invite could not be accepted.",
        ),
      )
      .finally(() => setBusy(false));
  }, [session, tr, locale, router]);

  if (!session) return null;

  const nav = [
    { href: customerHref(locale), label: tr ? "Özet" : "Dashboard", exact: true },
    { href: customerHref(locale, "projects"), label: tr ? "Projeler" : "Projects" },
    { href: customerHref(locale, "credits"), label: tr ? "Kredi" : "Credits" },
    { href: customerHref(locale, "subscription"), label: tr ? "Abonelik" : "Subscription" },
    { href: customerHref(locale, "usage"), label: tr ? "Kullanım" : "Usage" },
    { href: customerHref(locale, "account"), label: tr ? "Hesap" : "Account" },
    { href: customerHref(locale, "team"), label: tr ? "Ekip" : "Team" },
  ];

  const titles: Record<string, string> = {
    "": tr ? "Özet" : "Dashboard",
    projects: tr ? "Projeler" : "Projects",
    credits: tr ? "Kredi" : "Credits",
    subscription: tr ? "Abonelik" : "Subscription",
    usage: tr ? "Kullanım" : "Usage",
    account: tr ? "Hesap" : "Account",
    team: tr ? "Ekip" : "Team",
  };

  async function onLogout() {
    await logout();
    router.replace(locale === "en" ? "/en" : "/");
  }

  async function onDeleteProject(id: string) {
    if (!window.confirm(tr ? "Bu projeyi silmek istiyor musunuz?" : "Delete this project?")) return;
    setBusy(true);
    setError(null);
    try {
      await consoleRequest(`/api/projects/${id}`, { method: "DELETE" });
      setNote(tr ? "Proje silindi." : "Project deleted.");
      boot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubscribe(e: FormEvent, planId: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await consoleRequest("/api/billing/subscribe", { method: "POST", body: { planId } });
      setNote(tr ? "Abonelik güncellendi." : "Subscription updated.");
      boot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abonelik başlatılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!window.confirm(tr ? "Aboneliği iptal etmek istiyor musunuz?" : "Cancel this subscription?")) return;
    setBusy(true);
    setError(null);
    try {
      await consoleRequest("/api/billing/cancel", { method: "POST", body: {} });
      setNote(tr ? "Abonelik iptal edildi." : "Subscription cancelled.");
      boot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İptal edilemedi.");
    } finally {
      setBusy(false);
    }
  }

  // Checkout: mock mode completes in place (after a confirm); iyzico redirects
  // to the hosted payment page and returns to the studio (?billing=success).
  async function onTopUp(packId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await consoleRequest<{ orderId: string; paymentPageUrl: string; mode: "mock" | "iyzico" }>(
        "/api/billing/checkout",
        { method: "POST", body: { packId } },
      );
      if (res.mode === "iyzico") {
        window.location.href = res.paymentPageUrl;
        return;
      }
      if (!window.confirm(tr ? "Mock ödemeyi onaylıyor musunuz?" : "Confirm the mock payment?")) {
        boot();
        return;
      }
      const done = await consoleRequest<{ creditsGranted: number; balance: number; alreadyPaid: boolean }>(
        "/api/billing/mock/complete",
        { method: "POST", body: { orderId: res.orderId } },
      );
      setNote(
        done.alreadyPaid
          ? tr
            ? "Bu sipariş zaten ödenmişti."
            : "This order was already paid."
          : `+${done.creditsGranted} kr · ${tr ? "bakiye" : "balance"}: ${done.balance}`,
      );
      boot();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr ? "Ödeme tamamlanamadı." : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await consoleRequest<{ user: AuthState["user"] }>("/api/auth/me", {
        method: "PATCH",
        body: { name: String(fd.get("name") ?? "").trim() || null },
      });
      const auth = loadAuth();
      if (auth) saveAuth({ ...auth, user: res.user });
      setNote(tr ? "Profil güncellendi." : "Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : tr ? "Profil güncellenemedi." : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await consoleRequest("/api/auth/password", {
        method: "POST",
        body: {
          currentPassword: String(fd.get("currentPassword") ?? ""),
          newPassword: String(fd.get("newPassword") ?? ""),
        },
      });
      setNote(tr ? "Şifre güncellendi." : "Password updated.");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr ? "Şifre değiştirilemedi." : "Password change failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelShell
      locale={locale}
      brand="Grapxor"
      kind="customer"
      title={titles[section] ?? (tr ? "Panel" : "Panel")}
      nav={nav}
      currentPath={pathname}
      topRight={
        <>
          {balance !== null && (
            <Link href={customerHref(locale, "credits")} className="text-sm text-copper">
              {balance} {tr ? "kredi" : "credits"}
            </Link>
          )}
          <a
            href={studioUrl}
            className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-ink-975"
            rel="noopener noreferrer"
          >
            {tr ? "Yeni tasarım" : "New design"}
          </a>
          <button type="button" className="text-sm text-cream/60 hover:text-cream" onClick={() => void onLogout()}>
            {tr ? "Çıkış" : "Log out"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {(!section || section === "") && (
          <>
            <StatGrid
              items={[
                { label: tr ? "Kredi" : "Credits", value: balance ?? "—" },
                { label: tr ? "Plan" : "Plan", value: subscription?.planLabel ?? (tr ? "Yok" : "None") },
                { label: tr ? "Projeler" : "Projects", value: projects.length },
                { label: tr ? "Kullanım" : "Usage", value: usage.length },
              ]}
            />
            <PanelCard
              title={tr ? "Son projeler" : "Recent projects"}
              action={
                <Link href={customerHref(locale, "projects")} className="text-sm text-copper">
                  {tr ? "Tümü" : "All"}
                </Link>
              }
            >
              {projects.length === 0 ? (
                <EmptyState>{tr ? "Kayıtlı proje yok. Stüdyoda tasarım oluşturun." : "No projects yet."}</EmptyState>
              ) : (
                <ul className="divide-y divide-white/[0.06] text-sm">
                  {projects.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex justify-between gap-3 py-2.5">
                      <span>{p.title}</span>
                      <span className="text-cream/35">{new Date(p.updated_at).toLocaleString(tr ? "tr-TR" : "en-US")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </>
        )}

        {section === "projects" && (
          <PanelCard
            title={tr ? "Projeler" : "Projects"}
            action={
              <a href={studioUrl} className="text-sm text-copper" rel="noopener noreferrer">
                {tr ? "Yeni tasarım" : "New design"}
              </a>
            }
          >
            {projects.length === 0 ? (
              <EmptyState>{tr ? "Kayıtlı proje yok." : "No saved projects."}</EmptyState>
            ) : (
              <TableWrap>
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-cream/35">
                    <tr>
                      <th className="pb-2">{tr ? "Ad" : "Name"}</th>
                      <th className="pb-2">{tr ? "Güncelleme" : "Updated"}</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id} className="border-t border-white/[0.06]">
                        <td className="py-2.5">{p.title}</td>
                        <td className="py-2.5 text-cream/45">
                          {new Date(p.updated_at).toLocaleString(tr ? "tr-TR" : "en-US")}
                        </td>
                        <td className="py-2.5 text-right">
                          <a href={studioHandoffUrl(p.id)} className="mr-3 text-xs text-copper" rel="noopener noreferrer">
                            {tr ? "Stüdyoda aç" : "Open in studio"}
                          </a>
                          <button
                            type="button"
                            disabled={busy}
                            className="text-xs text-cream/45 hover:text-cream"
                            onClick={() => void onDeleteProject(p.id)}
                          >
                            {tr ? "Sil" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </PanelCard>
        )}

        {section === "credits" && (
          <>
            <StatGrid
              items={[
                { label: tr ? "Bakiye" : "Balance", value: credits?.balance ?? balance ?? "—" },
                { label: tr ? "Aylık dahil" : "Included", value: credits?.buckets?.included ?? "—" },
                { label: tr ? "Satın alınan" : "Purchased", value: credits?.buckets?.purchased ?? "—" },
                { label: tr ? "Bonus" : "Bonus", value: credits?.buckets?.bonus ?? "—" },
              ]}
            />
            {credits?.isShared && (
              <p className="text-sm text-cream/50">
                {tr
                  ? "Fatura cüzdanı ekibin planına bağlı — bu bakiye sahip cüzdanından düşer."
                  : "Billing wallet is shared with your team owner."}
              </p>
            )}
            <PanelCard title={tr ? "Kredi yükle" : "Top up"}>
              {packs.length === 0 ? (
                <EmptyState>{tr ? "Paket listesi boş." : "No packs available."}</EmptyState>
              ) : (
                <ul className="space-y-2 text-sm">
                  {packs.map((pack) => (
                    <li
                      key={pack.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cream/10 px-3 py-2"
                    >
                      <span>
                        {pack.label} · {pack.credits} kr · {pack.priceTry} ₺
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-975"
                        onClick={() => void onTopUp(pack.id)}
                      >
                        {tr ? "Satın al" : "Buy"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
            <PanelCard title={tr ? "Kredi defteri" : "Credit ledger"}>
              {ledger.length === 0 ? (
                <EmptyState>{tr ? "Henüz işlem yok." : "No transactions yet."}</EmptyState>
              ) : (
                <ul className="divide-y divide-white/[0.06] text-sm">
                  {ledger.map((row) => (
                    <li key={row.id} className="flex justify-between gap-3 py-2">
                      <span>{row.kind}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-cream/35">
                          {(row.createdAt ?? row.created_at)
                            ? new Date(row.createdAt ?? row.created_at ?? "").toLocaleDateString(
                                tr ? "tr-TR" : "en-US",
                              )
                            : ""}
                        </span>
                        <span className={row.amount >= 0 ? "text-copper" : "text-red-300/80"}>
                          {row.amount >= 0 ? "+" : ""}
                          {row.amount}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
            <PanelCard title={tr ? "Ödemeler" : "Payments"}>
              {orders.length === 0 ? (
                <EmptyState>{tr ? "Ödeme kaydı yok." : "No payments yet."}</EmptyState>
              ) : (
                <ul className="divide-y divide-white/[0.06] text-sm">
                  {orders.map((o) => (
                    <li key={o.id} className="flex justify-between gap-3 py-2">
                      <span>
                        {o.pack_id} · {o.status}
                      </span>
                      <span>
                        {o.credits} kr · {o.amount_try} {o.currency}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </>
        )}

        {section === "subscription" && (
          <PanelCard title={tr ? "Abonelik" : "Subscription"}>
            {subscription ? (
              <div className="mb-6 space-y-1 text-sm">
                <p>
                  {subscription.planLabel} · {subscription.status}
                </p>
                <p className="text-cream/45">
                  {subscription.monthlyCredits} {tr ? "kr / ay" : "cr / mo"}
                  {subscription.nextRenewalAt
                    ? ` · ${tr ? "yenileme" : "renewal"} ${new Date(subscription.nextRenewalAt).toLocaleDateString(tr ? "tr-TR" : "en-US")}`
                    : ""}
                </p>
                <button type="button" disabled={busy} className="mt-3 text-sm text-cream/50 hover:text-cream" onClick={() => void onCancel()}>
                  {tr ? "İptal et" : "Cancel"}
                </button>
              </div>
            ) : (
              <EmptyState>{tr ? "Aktif abonelik yok." : "No active subscription."}</EmptyState>
            )}
            <ul className="mt-4 space-y-2">
              {plans.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cream/10 px-3 py-2 text-sm">
                  <span>
                    {p.label} · {p.unlimited ? (tr ? "sınırsız" : "unlimited") : `${p.monthlyCredits} kr`} ·{" "}
                    {p.monthlyPrice ?? p.priceTry} ₺
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-975"
                    onClick={(e) => void onSubscribe(e, p.id)}
                  >
                    {tr ? "Seç" : "Choose"}
                  </button>
                </li>
              ))}
            </ul>
          </PanelCard>
        )}

        {section === "usage" && (
          <PanelCard title={tr ? "Tasarım işlemleri" : "Design operations"}>
            {usage.length === 0 ? (
              <EmptyState>
                {tr
                  ? "Henüz tasarım işlemi kaydı yok. Stüdyo kredi düşümü deftere yazılır; oturum satırları Phase 10 rezervinden gelir."
                  : "No design operations recorded yet."}
              </EmptyState>
            ) : (
              <ul className="divide-y divide-white/[0.06] text-sm">
                {usage.map((u) => (
                  <li key={u.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {u.operationId} · {u.status}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-cream/35">
                        {(u.createdAt ?? u.created_at)
                          ? new Date(u.createdAt ?? u.created_at ?? "").toLocaleDateString(
                              tr ? "tr-TR" : "en-US",
                            )
                          : ""}
                      </span>
                      <span>-{u.creditCost} kr</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        )}

        {section === "account" && (
          <>
            <PanelCard title={tr ? "Hesap" : "Account"}>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-cream/40">{tr ? "E-posta" : "Email"}</dt>
                  <dd className="mt-1">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-cream/40">{tr ? "Ad" : "Name"}</dt>
                  <dd className="mt-1">{session.user.name || "—"}</dd>
                </div>
              </dl>
            </PanelCard>
            <PanelCard title={tr ? "Profil düzenle" : "Edit profile"}>
              <form className="flex flex-wrap gap-2" onSubmit={(e) => void onSaveProfile(e)}>
                <input
                  key={session.user.name ?? "no-name"}
                  name="name"
                  defaultValue={session.user.name ?? ""}
                  placeholder={tr ? "Ad" : "Name"}
                  maxLength={80}
                  className="min-w-[12rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink-975 disabled:opacity-60"
                >
                  {tr ? "Kaydet" : "Save"}
                </button>
              </form>
            </PanelCard>
            <PanelCard title={tr ? "Şifre değiştir" : "Change password"}>
              <form className="flex flex-wrap gap-2" onSubmit={(e) => void onChangePassword(e)}>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder={tr ? "Mevcut şifre" : "Current password"}
                  className="min-w-[12rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
                />
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={tr ? "Yeni şifre (min 8)" : "New password (min 8)"}
                  className="min-w-[12rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink-975 disabled:opacity-60"
                >
                  {tr ? "Şifreyi güncelle" : "Update password"}
                </button>
              </form>
            </PanelCard>
          </>
        )}

        {section === "team" && <TeamSection />}

        {section && !titles[section] && (
          <EmptyState>
            {tr ? "Bu bölüm yok." : "This section does not exist."}{" "}
            <Link href={customerBase(locale)} className="text-copper">
              {tr ? "Özete dön" : "Back to dashboard"}
            </Link>
          </EmptyState>
        )}

        <NoteText>{note}</NoteText>
        <ErrorText>{error}</ErrorText>
      </div>
    </PanelShell>
  );
}
