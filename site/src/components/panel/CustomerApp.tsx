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
  buckets?: { included: number; purchased: number; bonus: number; total: number };
};
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
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [studioUrl, setStudioUrl] = useState("");

  const boot = useCallback(() => {
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
      consoleRequest<{ usage?: Usage[]; operations?: Usage[] }>("/api/billing/usage?limit=50").catch(() => ({})),
      consoleRequest<{ ledger?: Ledger[]; transactions?: Ledger[] }>("/api/billing/ledger?limit=50").catch(() => ({})),
      consoleRequest<{ orders: Order[] }>("/api/billing/orders").catch(() => ({ orders: [] })),
      consoleRequest<{ plans: Plan[] }>("/api/billing/plans").catch(() => ({ plans: [] })),
    ])
      .then(([proj, sub, cr, use, led, ord, pl]) => {
        setProjects(proj.projects ?? []);
        setSubscription(sub.subscription ?? null);
        setCredits(cr);
        setUsage(use.usage ?? use.operations ?? []);
        setLedger(led.ledger ?? led.transactions ?? []);
        setOrders(ord.orders ?? []);
        setPlans((pl.plans ?? []).filter((p) => p.enabled !== false));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi."));
  }, [locale, router]);

  useEffect(() => {
    boot();
    window.addEventListener(AUTH_EVENT, boot);
    return () => window.removeEventListener(AUTH_EVENT, boot);
  }, [boot]);

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
                          <a href={studioUrl} className="mr-3 text-xs text-copper" rel="noopener noreferrer">
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
            <PanelCard title={tr ? "Kredi defteri" : "Credit ledger"}>
              {ledger.length === 0 ? (
                <EmptyState>{tr ? "Henüz işlem yok." : "No transactions yet."}</EmptyState>
              ) : (
                <ul className="divide-y divide-white/[0.06] text-sm">
                  {ledger.map((row) => (
                    <li key={row.id} className="flex justify-between gap-3 py-2">
                      <span>{row.kind}</span>
                      <span className={row.amount >= 0 ? "text-copper" : "text-red-300/80"}>
                        {row.amount >= 0 ? "+" : ""}
                        {row.amount}
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
                    <span>-{u.creditCost} kr</span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        )}

        {section === "account" && (
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
