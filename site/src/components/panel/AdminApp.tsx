"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localeFromPath } from "@/lib/i18n";
import { AUTH_EVENT, loadAuth, logout, studioHandoffUrl, type AuthState } from "@/lib/auth";
import { consoleRequest, type AdminBillingOverview, type AdminStats } from "@/lib/consoleApi";
import { adminBase, adminHref, customerHref, parseAppPath } from "@/lib/panelPaths";
import { EmptyState, ErrorText, NoteText, PanelCard, PanelShell, StatGrid, TableWrap } from "./PanelShell";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  auth_provider?: string;
  balance: number;
};

export function AdminApp() {
  const pathname = usePathname() || "/admin";
  const locale = localeFromPath(pathname);
  const router = useRouter();
  const parsed = parseAppPath(pathname);
  const section = parsed?.segments[0] ?? "";
  const id = parsed?.segments[1];
  const tr = locale !== "en";
  const [session, setSession] = useState<AuthState | null>(null);
  const [studioUrl, setStudioUrl] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    setSession(auth);
    setStudioUrl(auth ? studioHandoffUrl() : "");
    if (!auth) {
      router.replace(locale === "en" ? "/en" : "/");
      return;
    }
    if (auth.user.role !== "admin") {
      router.replace(customerHref(locale));
    }
  }, [locale, router]);

  useEffect(() => {
    function onAuth() {
      const auth = loadAuth();
      setSession(auth);
      if (!auth || auth.user.role !== "admin") {
        router.replace(locale === "en" ? "/en" : "/");
      }
    }
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, [locale, router]);

  if (!session || session.user.role !== "admin") return null;

  const nav = [
    { href: adminHref(locale), label: tr ? "Özet" : "Dashboard", exact: true },
    { href: adminHref(locale, "users"), label: tr ? "Kullanıcılar" : "Users" },
    { href: adminHref(locale, "projects"), label: tr ? "Projeler" : "Projects" },
    { href: adminHref(locale, "sessions"), label: tr ? "Tasarım oturumları" : "Design sessions" },
    { href: adminHref(locale, "credits"), label: tr ? "Krediler" : "Credits" },
    { href: adminHref(locale, "subscriptions"), label: tr ? "Abonelikler" : "Subscriptions" },
    { href: adminHref(locale, "payments"), label: tr ? "Ödemeler" : "Payments" },
    { href: adminHref(locale, "operations"), label: tr ? "Operasyonlar" : "Operations" },
    { href: adminHref(locale, "teams"), label: tr ? "Ekipler" : "Teams" },
    { href: adminHref(locale, "logs"), label: tr ? "Kayıtlar" : "Logs" },
    { href: adminHref(locale, "settings"), label: tr ? "Ayarlar" : "Settings" },
    { href: adminHref(locale, "intelligence"), label: tr ? "Tasarım zekâsı" : "Design intelligence" },
    { href: adminHref(locale, "knowledge"), label: tr ? "Bilgi" : "Knowledge" },
  ];

  const titles: Record<string, string> = {
    "": tr ? "Yönetim" : "Admin",
    users: tr ? "Kullanıcılar" : "Users",
    projects: tr ? "Projeler" : "Projects",
    sessions: tr ? "Tasarım oturumları" : "Design sessions",
    credits: tr ? "Krediler" : "Credits",
    subscriptions: tr ? "Abonelikler" : "Subscriptions",
    payments: tr ? "Ödemeler" : "Payments",
    operations: tr ? "Operasyonlar" : "Operations",
    teams: tr ? "Ekipler" : "Teams",
    logs: tr ? "Kayıtlar" : "Logs",
    settings: tr ? "Ayarlar" : "Settings",
    intelligence: tr ? "Tasarım zekâsı" : "Design intelligence",
    knowledge: tr ? "Bilgi" : "Knowledge",
  };

  return (
    <PanelShell
      locale={locale}
      brand="Grapxor"
      kind="admin"
      title={id ? titles[section] : titles[section] ?? (tr ? "Yönetim" : "Admin")}
      nav={nav}
      currentPath={pathname}
      topRight={
        <>
          <span className="hidden text-xs text-cream/40 sm:inline">{session.user.email}</span>
          <a href={studioUrl} className="text-sm text-cream/60 hover:text-cream" rel="noopener noreferrer">
            {tr ? "Stüdyo" : "Studio"}
          </a>
          <button
            type="button"
            className="text-sm text-cream/60 hover:text-cream"
            onClick={async () => {
              await logout();
              router.replace(locale === "en" ? "/en" : "/");
            }}
          >
            {tr ? "Çıkış" : "Log out"}
          </button>
        </>
      }
    >
      {section === "" && <Overview locale={locale} />}
      {section === "users" && !id && <Users locale={locale} />}
      {section === "users" && id && <UserDetail locale={locale} userId={id} />}
      {section === "projects" && !id && <Projects locale={locale} />}
      {section === "projects" && id && <ProjectDetail locale={locale} projectId={id} />}
      {section === "sessions" && !id && <Sessions locale={locale} />}
      {section === "sessions" && id && <SessionDetail locale={locale} sessionId={id} />}
      {section === "credits" && <Credits locale={locale} />}
      {section === "subscriptions" && <Subscriptions locale={locale} />}
      {section === "payments" && <Payments locale={locale} />}
      {section === "operations" && <Operations locale={locale} />}
      {section === "teams" && <Teams locale={locale} />}
      {section === "logs" && <Logs locale={locale} />}
      {section === "settings" && <Settings locale={locale} />}
      {section === "intelligence" && <Intelligence locale={locale} />}
      {section === "knowledge" && <Knowledge locale={locale} />}
      {section && !titles[section] && (
        <EmptyState>
          <Link href={adminBase(locale)} className="text-copper">
            {tr ? "Özete dön" : "Back"}
          </Link>
        </EmptyState>
      )}
    </PanelShell>
  );
}

function useAdminLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const refresh = useCallback(() => {
    setError(null);
    void loader()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, error, note, setNote, setError, refresh };
}

function Overview({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(async () => {
    const [stats, overview] = await Promise.all([
      consoleRequest<AdminStats>("/api/admin/stats"),
      consoleRequest<AdminBillingOverview>("/api/admin/billing/overview"),
    ]);
    return { stats, overview };
  }, []);
  if (!data) return <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>;
  const { stats, overview } = data;
  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: tr ? "Kullanıcı" : "Users", value: stats.users },
          { label: tr ? "Proje" : "Projects", value: stats.projects },
          { label: tr ? "Ekip" : "Teams", value: stats.organizations ?? 0 },
          { label: tr ? "Ödenen sipariş" : "Paid orders", value: stats.paidOrders },
        ]}
      />
      <StatGrid
        items={[
          { label: tr ? "Aktif abonelik" : "Active subs", value: overview.activeSubscriptions },
          { label: tr ? "Tüketilen kredi" : "Credits used", value: overview.creditsConsumed },
          { label: tr ? "Satın alınan" : "Purchased", value: overview.creditsPurchased },
          { label: tr ? "Abonelik gelir" : "Sub revenue", value: `${overview.subscriptionRevenue.toFixed(0)} ₺` },
        ]}
      />
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function Users({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const [q, setQ] = useState("");
  const { data, error, refresh } = useAdminLoad(
    async () => consoleRequest<{ users: AdminUser[] }>(`/api/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`),
    [q],
  );
  return (
    <PanelCard
      title={tr ? "Kullanıcılar" : "Users"}
      action={
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => refresh()}
          placeholder={tr ? "Ara" : "Search"}
          className="rounded-sm border border-cream/15 bg-ink-975 px-3 py-1.5 text-sm outline-none focus:border-copper"
        />
      }
    >
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : (
        <TableWrap>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cream/35">
              <tr>
                <th className="pb-2">{tr ? "E-posta" : "Email"}</th>
                <th className="pb-2">{tr ? "Rol" : "Role"}</th>
                <th className="pb-2">{tr ? "Bakiye" : "Balance"}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-white/[0.06]">
                  <td className="py-2.5">{u.email}</td>
                  <td className="py-2.5 text-cream/60">{u.role}</td>
                  <td className="py-2.5 tabular-nums">{u.balance}</td>
                  <td className="py-2.5 text-right">
                    <Link href={adminHref(locale, "users", u.id)} className="text-xs text-copper">
                      {tr ? "Detay" : "Detail"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </PanelCard>
  );
}

function UserDetail({ locale, userId }: { locale: "tr" | "en"; userId: string }) {
  const tr = locale !== "en";
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, error, note, setNote, setError, refresh } = useAdminLoad(
    async () =>
      consoleRequest<{
        user: AdminUser;
        balance: number;
        buckets: { included: number; purchased: number; bonus: number };
        reservedCredits: number;
        subscription: { planLabel: string; status: string; monthlyCredits: number } | null;
        projects: { id: string; title: string; updated_at: string }[];
        ledger: { id: string; kind: string; amount: number; createdAt: string }[];
        orders: { id: string; pack_id: string; status: string; credits: number; amount_try: number }[];
        operations: { id: string; operationId: string; creditCost: number; status: string }[];
      }>(`/api/admin/users/${userId}`),
    [userId],
  );

  async function onAdjust(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await consoleRequest<{ balance: number; amount: number }>("/api/admin/credits/adjust", {
        method: "POST",
        body: { userId, amount: Number(amount), reason: reason.trim() || undefined },
      });
      setNote(`${tr ? "Yeni bakiye" : "New balance"}: ${result.balance}`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ayarlama başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function onRole(next: "admin" | "user") {
    setBusy(true);
    try {
      await consoleRequest(`/api/admin/users/${userId}`, { method: "PATCH", body: { role: next } });
      setNote(tr ? "Rol güncellendi." : "Role updated.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rol güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>;
  return (
    <div className="space-y-6">
      <StatGrid
        items={[
          { label: tr ? "Bakiye" : "Balance", value: data.balance },
          { label: tr ? "Rezerve" : "Reserved", value: data.reservedCredits },
          { label: tr ? "Dahil" : "Included", value: data.buckets.included },
          { label: tr ? "Satın alınan" : "Purchased", value: data.buckets.purchased },
        ]}
      />
      <PanelCard title={data.user.email}>
        <p className="text-sm text-cream/50">
          {data.user.role} · {data.user.auth_provider ?? "password"} · {data.subscription?.planLabel ?? (tr ? "plansız" : "no plan")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.user.role === "admin" ? (
            <button type="button" disabled={busy} className="text-sm text-copper" onClick={() => void onRole("user")}>
              {tr ? "Üye yap" : "Make user"}
            </button>
          ) : (
            <button type="button" disabled={busy} className="text-sm text-copper" onClick={() => void onRole("admin")}>
              {tr ? "Admin yap" : "Make admin"}
            </button>
          )}
        </div>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => void onAdjust(e)}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm outline-none focus:border-copper"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tr ? "Gerekçe" : "Reason"}
            className="min-w-[12rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm outline-none focus:border-copper"
          />
          <button type="submit" disabled={busy} className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink-975">
            {tr ? "Kredi ayarla" : "Adjust credits"}
          </button>
        </form>
      </PanelCard>
      <PanelCard title={tr ? "Projeler" : "Projects"}>
        {data.projects.length === 0 ? (
          <EmptyState>{tr ? "Proje yok." : "No projects."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.projects.map((p) => (
              <li key={p.id} className="flex justify-between border-t border-white/[0.06] py-2">
                <Link href={adminHref(locale, "projects", p.id)} className="text-copper">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
      <PanelCard title={tr ? "Defter" : "Ledger"}>
        {data.ledger.length === 0 ? (
          <EmptyState>{tr ? "Kayıt yok." : "No entries."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.ledger.map((row) => (
              <li key={row.id} className="flex justify-between border-t border-white/[0.06] py-2">
                <span>{row.kind}</span>
                <span>{row.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
      <NoteText>{note}</NoteText>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function Projects({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        projects: { id: string; title: string; ownerEmail: string; updated_at: string; user_id: string }[];
      }>("/api/admin/projects"),
    [],
  );
  return (
    <PanelCard title={tr ? "Projeler" : "Projects"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.projects.length === 0 ? (
        <EmptyState>{tr ? "Proje yok." : "No projects."}</EmptyState>
      ) : (
        <TableWrap>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cream/35">
              <tr>
                <th className="pb-2">{tr ? "Ad" : "Name"}</th>
                <th className="pb-2">{tr ? "Sahip" : "Owner"}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.06]">
                  <td className="py-2.5">{p.title}</td>
                  <td className="py-2.5 text-cream/60">{p.ownerEmail}</td>
                  <td className="py-2.5 text-right">
                    <Link href={adminHref(locale, "projects", p.id)} className="text-xs text-copper">
                      {tr ? "İncele" : "Inspect"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </PanelCard>
  );
}

function ProjectDetail({ locale, projectId }: { locale: "tr" | "en"; projectId: string }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        project: { id: string; title: string; created_at: string; updated_at: string; userId: string };
        owner: { email: string; id: string } | null;
        sessions: { id: string; title: string; status: string }[];
        usage: { creditsConsumed: number; operationCount: number };
      }>(`/api/admin/projects/${projectId}`),
    [projectId],
  );
  if (!data) return <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>;
  return (
    <div className="space-y-6">
      <PanelCard title={data.project.title}>
        <p className="text-sm text-cream/50">
          {data.owner?.email ?? data.project.userId} · {data.usage.operationCount} {tr ? "işlem" : "ops"} ·{" "}
          {data.usage.creditsConsumed} kr
        </p>
        {data.owner && (
          <Link href={adminHref(locale, "users", data.owner.id)} className="mt-2 inline-block text-sm text-copper">
            {tr ? "Sahibi aç" : "Open owner"}
          </Link>
        )}
      </PanelCard>
      <PanelCard title={tr ? "Oturumlar" : "Sessions"}>
        {data.sessions.length === 0 ? (
          <EmptyState>{tr ? "Bu projede tasarım oturumu yok." : "No design sessions on this project."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.sessions.map((s) => (
              <li key={s.id} className="border-t border-white/[0.06] py-2">
                <Link href={adminHref(locale, "sessions", s.id)} className="text-copper">
                  {s.title} · {s.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function Sessions({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        sessions: { id: string; title: string; status: string; ownerEmail: string; projectTitle: string }[];
      }>("/api/admin/sessions"),
    [],
  );
  return (
    <PanelCard title={tr ? "Tasarım oturumları" : "Design sessions"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.sessions.length === 0 ? (
        <EmptyState>
          {tr
            ? "Kayıtlı tasarım oturumu yok. Bu tablo, katalog rezervi ile açılan oturumlardan dolar."
            : "No design sessions stored yet."}
        </EmptyState>
      ) : (
        <ul className="text-sm">
          {data.sessions.map((s) => (
            <li key={s.id} className="flex justify-between border-t border-white/[0.06] py-2">
              <Link href={adminHref(locale, "sessions", s.id)} className="text-copper">
                {s.title}
              </Link>
              <span className="text-cream/45">
                {s.ownerEmail} · {s.projectTitle}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function SessionDetail({ locale, sessionId }: { locale: "tr" | "en"; sessionId: string }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        session: { title: string; status: string; brief: unknown; intent: unknown; projectId: string };
        owner: { email: string } | null;
        operations: { id: string; operationId: string; creditCost: number; status: string; outcome: unknown }[];
      }>(`/api/admin/sessions/${sessionId}`),
    [sessionId],
  );
  if (!data) return <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>;
  return (
    <div className="space-y-6">
      <PanelCard title={data.session.title}>
        <p className="text-sm text-cream/50">
          {data.owner?.email} · {data.session.status}
        </p>
        {data.session.brief != null && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-975 p-3 text-xs text-cream/70">
            {JSON.stringify(data.session.brief, null, 2)}
          </pre>
        )}
        {data.session.intent != null && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-975 p-3 text-xs text-cream/70">
            {JSON.stringify(data.session.intent, null, 2)}
          </pre>
        )}
      </PanelCard>
      <PanelCard title={tr ? "İşlemler" : "Operations"}>
        {data.operations.length === 0 ? (
          <EmptyState>{tr ? "İşlem yok." : "No operations."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.operations.map((op) => (
              <li key={op.id} className="flex justify-between border-t border-white/[0.06] py-2">
                <span>
                  {op.operationId} · {op.status}
                </span>
                <span>{op.creditCost} kr</span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function Credits({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        reservations: { id: string; amount: number; status: string; operation: string; ownerEmail: string }[];
      }>("/api/admin/reservations"),
    [],
  );
  return (
    <PanelCard title={tr ? "Kredi rezervleri" : "Credit reservations"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.reservations.length === 0 ? (
        <EmptyState>{tr ? "Rezerv yok." : "No reservations."}</EmptyState>
      ) : (
        <ul className="text-sm">
          {data.reservations.map((r) => (
            <li key={r.id} className="flex justify-between border-t border-white/[0.06] py-2">
              <span>
                {r.ownerEmail} · {r.operation} · {r.status}
              </span>
              <span>{r.amount} kr</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-cream/45">
        {tr
          ? "Bakiye değişikliği kullanıcı detayında deftere yazılır."
          : "Balance changes are ledger-backed on the user detail page."}
      </p>
    </PanelCard>
  );
}

function Subscriptions({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error, note, setNote, setError } = useAdminLoad(
    async () =>
      consoleRequest<{
        subscriptions: {
          id: string;
          status: string;
          planLabel: string;
          ownerEmail: string;
          monthlyCredits: number;
        }[];
      }>("/api/admin/subscriptions"),
    [],
  );
  async function renew(id: string) {
    try {
      await consoleRequest(`/api/admin/subscriptions/${id}/renew`, { method: "POST", body: {} });
      setNote(tr ? "Yenilendi." : "Renewed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yenilenemedi.");
    }
  }
  return (
    <PanelCard title={tr ? "Abonelikler" : "Subscriptions"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.subscriptions.length === 0 ? (
        <EmptyState>{tr ? "Abonelik yok." : "No subscriptions."}</EmptyState>
      ) : (
        <ul className="text-sm">
          {data.subscriptions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] py-2">
              <span>
                {s.ownerEmail} · {s.planLabel} · {s.status} · {s.monthlyCredits} kr
              </span>
              <button type="button" className="text-xs text-copper" onClick={() => void renew(s.id)}>
                {tr ? "Yenile" : "Renew"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <NoteText>{note}</NoteText>
      <ErrorText>{error}</ErrorText>
    </PanelCard>
  );
}

function Payments({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        orders: {
          id: string;
          user_id: string;
          pack_id: string;
          credits: number;
          amount_try: number;
          currency: string;
          status: string;
          created_at: string;
        }[];
      }>("/api/admin/orders?limit=100"),
    [],
  );
  return (
    <PanelCard title={tr ? "Ödemeler" : "Payments"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.orders.length === 0 ? (
        <EmptyState>{tr ? "Sipariş yok." : "No orders."}</EmptyState>
      ) : (
        <TableWrap>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cream/35">
              <tr>
                <th className="pb-2">{tr ? "Paket" : "Pack"}</th>
                <th className="pb-2">{tr ? "Durum" : "Status"}</th>
                <th className="pb-2">{tr ? "Tutar" : "Amount"}</th>
                <th className="pb-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-t border-white/[0.06]">
                  <td className="py-2.5">{o.pack_id}</td>
                  <td className="py-2.5">{o.status}</td>
                  <td className="py-2.5">
                    {o.credits} kr · {o.amount_try} {o.currency}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-cream/45">{o.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </PanelCard>
  );
}

function Operations({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        operations: {
          id: string;
          operation_id: string;
          credit_cost: number;
          status: string;
          ownerEmail: string;
          created_at: string;
        }[];
      }>("/api/admin/operations"),
    [],
  );
  return (
    <PanelCard title={tr ? "Tasarım operasyonları" : "Design operations"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.operations.length === 0 ? (
        <EmptyState>{tr ? "Operasyon kaydı yok." : "No operations yet."}</EmptyState>
      ) : (
        <ul className="text-sm">
          {data.operations.map((op) => (
            <li key={op.id} className="flex justify-between border-t border-white/[0.06] py-2">
              <span>
                {op.ownerEmail} · {op.operation_id} · {op.status}
              </span>
              <span>{op.credit_cost} kr</span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function Teams({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(
    async () =>
      consoleRequest<{
        organizations: { id: string; name: string; slug: string; memberCount: number; seatLimit: number; planLabel: string | null }[];
      }>("/api/admin/orgs"),
    [],
  );
  return (
    <PanelCard title={tr ? "Ekipler" : "Teams"}>
      {!data ? (
        <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
      ) : data.organizations.length === 0 ? (
        <EmptyState>{tr ? "Ekip yok." : "No teams."}</EmptyState>
      ) : (
        <ul className="text-sm">
          {data.organizations.map((o) => (
            <li key={o.id} className="flex justify-between border-t border-white/[0.06] py-2">
              <span>
                {o.name} · {o.slug}
              </span>
              <span>
                {o.memberCount}/{o.seatLimit} · {o.planLabel ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function Logs({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(async () => {
    const [events, refunds, llm] = await Promise.all([
      consoleRequest<{ events: { id: string; event_type: string; amount: number | null; ownerEmail: string; created_at: string }[] }>(
        "/api/admin/events",
      ),
      consoleRequest<{ refunds: { id: string; amount: number; reason: string; ownerEmail: string }[] }>("/api/admin/refunds"),
      consoleRequest<{ costs: { id: string; provider?: string; estimated_cost_usd?: number; created_at: string }[] }>(
        "/api/admin/llm-costs?limit=50",
      ).catch(() => ({ costs: [] })),
    ]);
    return { events: events.events, refunds: refunds.refunds, costs: llm.costs };
  }, []);
  return (
    <div className="space-y-6">
      <PanelCard title={tr ? "Kredi olayları" : "Credit events"}>
        {!data ? (
          <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>
        ) : data.events.length === 0 ? (
          <EmptyState>{tr ? "Olay yok." : "No events."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.events.map((e) => (
              <li key={e.id} className="flex justify-between border-t border-white/[0.06] py-2">
                <span>
                  {e.ownerEmail} · {e.event_type}
                </span>
                <span>{e.amount ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
      <PanelCard title={tr ? "İadeler" : "Refunds"}>
        {!data || data.refunds.length === 0 ? (
          <EmptyState>{tr ? "İade yok." : "No refunds."}</EmptyState>
        ) : (
          <ul className="text-sm">
            {data.refunds.map((r) => (
              <li key={r.id} className="flex justify-between border-t border-white/[0.06] py-2">
                <span>
                  {r.ownerEmail} · {r.reason}
                </span>
                <span>{r.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

function Settings({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const [busy, setBusy] = useState(false);
  const { data, error, note, setNote, setError, refresh } = useAdminLoad(async () => {
    const [plans, operations] = await Promise.all([
      consoleRequest<{ plans: { id: string; label: string; monthlyPrice: number; monthlyCredits: number; enabled: boolean; unlimited?: boolean }[] }>(
        "/api/admin/plans",
      ),
      consoleRequest<{
        operations: { operationId: string; displayName: string; creditCost: number; enabled: boolean }[];
      }>("/api/admin/credit-operations"),
    ]);
    return { plans: plans.plans, operations: operations.operations };
  }, []);

  async function patchCost(operationId: string, creditCost: number) {
    setBusy(true);
    try {
      await consoleRequest(`/api/admin/credit-operations/${operationId}`, {
        method: "PATCH",
        body: { creditCost },
      });
      setNote(tr ? "Maliyet güncellendi." : "Cost updated.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <ErrorText>{error ?? (tr ? "Yükleniyor…" : "Loading…")}</ErrorText>;
  return (
    <div className="space-y-6">
      <PanelCard title={tr ? "Planlar" : "Plans"}>
        <ul className="text-sm">
          {data.plans.map((p) => (
            <li key={p.id} className="flex justify-between border-t border-white/[0.06] py-2">
              <span>{p.label}</span>
              <span>
                {p.unlimited ? (tr ? "sınırsız" : "unlimited") : `${p.monthlyCredits} kr`} · {p.monthlyPrice} ₺
              </span>
            </li>
          ))}
        </ul>
      </PanelCard>
      <PanelCard title={tr ? "Operasyon maliyetleri" : "Operation costs"}>
        <ul className="space-y-2 text-sm">
          {data.operations.map((op) => (
            <li key={op.operationId} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] py-2">
              <span>{op.displayName}</span>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  void patchCost(op.operationId, Number(fd.get("cost")));
                }}
              >
                <input
                  name="cost"
                  defaultValue={op.creditCost}
                  className="w-20 rounded-sm border border-cream/15 bg-ink-975 px-2 py-1 text-sm"
                />
                <button type="submit" disabled={busy} className="text-xs text-copper">
                  {tr ? "Kaydet" : "Save"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </PanelCard>
      <NoteText>{note}</NoteText>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function Intelligence({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  const { data, error } = useAdminLoad(async () => {
    const [sessions, operations] = await Promise.all([
      consoleRequest<{ sessions: unknown[] }>("/api/admin/sessions"),
      consoleRequest<{ operations: unknown[] }>("/api/admin/operations"),
    ]);
    return { sessions: sessions.sessions.length, operations: operations.operations.length };
  }, []);
  return (
    <PanelCard title={tr ? "Tasarım zekâsı" : "Design intelligence"}>
      <p className="text-sm text-cream/55">
        {tr
          ? "Konuşma, brief ve görsel dil stüdyo motorunda yerel çalışır. Sunucuda paylaşılan bir Design Brain kaydı yoktur. Burada yalnızca SQLite’taki gerçek oturum ve operasyon sayıları görünür."
          : "Conversation and visual language run locally in the studio engine. There is no server-side Design Brain store. This page shows only persisted session and operation counts."}
      </p>
      {data && (
        <div className="mt-4">
          <StatGrid
            items={[
              { label: tr ? "Oturum" : "Sessions", value: data.sessions },
              { label: tr ? "Operasyon" : "Operations", value: data.operations },
            ]}
          />
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </PanelCard>
  );
}

function Knowledge({ locale }: { locale: "tr" | "en" }) {
  const tr = locale !== "en";
  return (
    <PanelCard title={tr ? "Tasarım bilgisi" : "Design knowledge"}>
      <p className="text-sm text-cream/55">
        {tr
          ? "Öğrenme ve bilgi adayları stüdyo içindeki yerel motor kapısından geçer; global kurallara doğrudan yazılmaz. Bu veri API/SQLite’ta tutulmadığı için burada sahte bir bilgi tablosu gösterilmiyor."
          : "Learning candidates stay behind the local studio gate and are not stored in the API database, so this page does not invent a knowledge table."}
      </p>
    </PanelCard>
  );
}
