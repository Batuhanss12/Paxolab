"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { localeFromPath } from "@/lib/i18n";
import { AUTH_EVENT, loadAuth, type AuthState } from "@/lib/auth";
import { consoleRequest, type OrgDetail } from "@/lib/consoleApi";
import { ConsoleCard } from "./ConsoleShell";

type OrgUsageRow = {
  userId: string;
  email: string;
  operationId: string;
  creditCost: number;
  status: string;
  createdAt: string;
};

export function TeamSection() {
  const pathname = usePathname() || "/hesap";
  const locale = localeFromPath(pathname);
  const tr = locale !== "en";
  const panelPath = locale === "en" ? "/en/account" : "/hesap";
  const [session, setSession] = useState<AuthState | null>(() => loadAuth());
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [usage, setUsage] = useState<OrgUsageRow[]>([]);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await consoleRequest<{ organizations: { id: string }[] }>("/api/orgs");
    const current = list.organizations[0];
    if (!current) {
      setDetail(null);
      setUsage([]);
      return;
    }
    setDetail(await consoleRequest<OrgDetail>(`/api/orgs/${current.id}`));
    const u = await consoleRequest<{ usage: OrgUsageRow[] }>(`/api/orgs/${current.id}/usage`).catch(
      () => ({ usage: [] as OrgUsageRow[] }),
    );
    setUsage(u.usage);
  }, []);

  useEffect(() => {
    const auth = loadAuth();
    setSession(auth);
    if (auth) void load().catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi."));
  }, [load]);

  useEffect(() => {
    function onAuth() {
      const auth = loadAuth();
      setSession(auth);
      if (auth) void load();
    }
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, [load]);

  // Invite links are accepted by CustomerApp (?invite=) before this section mounts.

  if (!session) return null;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const auth = session;
    if (!auth) return;
    setBusy(true);
    setError(null);
    try {
      await consoleRequest("/api/orgs", { method: "POST", body: { name } });
      setName("");
      setNote(tr ? "Ekip oluşturuldu." : "Team created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    const auth = session;
    if (!auth || !detail) return;
    setBusy(true);
    setError(null);
    try {
      await consoleRequest(`/api/orgs/${detail.organization.id}/invites`, {
        method: "POST",
        body: { email: inviteEmail, role: inviteRole },
      });
      setInviteEmail("");
      setNote(tr ? "Davet oluşturuldu." : "Invite created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Davet gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  const canManage = detail && (detail.organization.role === "owner" || detail.organization.role === "admin");
  const inviteBase =
    typeof window !== "undefined" ? `${window.location.origin}${panelPath}?invite=` : "";

  return (
    <>
      {!detail && (
        <ConsoleCard title={tr ? "Ekip" : "Team"}>
          <p className="mb-4 text-sm text-cream/50">
            {tr
              ? "İsterseniz ekip kurun. Aktif planın kredisi üyelerle paylaşılır."
              : "Optional. Members share the owner’s active plan credits."}
          </p>
          <form className="flex flex-wrap gap-2" onSubmit={(e) => void onCreate(e)}>
            <input
              className="min-w-[16rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
              placeholder={tr ? "Ekip adı" : "Team name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream disabled:opacity-60"
            >
              {tr ? "Oluştur" : "Create"}
            </button>
          </form>
        </ConsoleCard>
      )}

      {detail && (
        <ConsoleCard title={tr ? `Ekip · ${detail.organization.name}` : `Team · ${detail.organization.name}`}>
          <p className="mb-4 text-sm text-cream/45">
            {detail.organization.memberCount}/{detail.organization.seatLimit} {tr ? "koltuk" : "seats"}
            {detail.organization.planLabel ? ` · ${detail.organization.planLabel}` : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-cream/35">
                <tr>
                  <th className="pb-2">{tr ? "E-posta" : "Email"}</th>
                  <th className="pb-2">{tr ? "Rol" : "Role"}</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {detail.members.map((m) => (
                  <tr key={m.userId} className="border-t border-white/[0.06]">
                    <td className="py-2.5 text-cream">
                      {m.email}
                      {m.name ? <span className="ml-2 text-cream/40">{m.name}</span> : null}
                    </td>
                    <td className="py-2.5 text-cream/60">{m.role}</td>
                    <td className="py-2.5 text-right">
                      {canManage && m.role !== "owner" ? (
                        <button
                          type="button"
                          className="text-xs text-cream/45 hover:text-cream"
                          onClick={() => {
                            void consoleRequest(`/api/orgs/${detail.organization.id}/members/${m.userId}`, {
                              method: "DELETE",
                            })
                              .then(() => load())
                              .catch((err) => setError(err instanceof Error ? err.message : "Silinemedi."));
                          }}
                        >
                          {tr ? "Çıkar" : "Remove"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canManage && (
            <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => void onInvite(e)}>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={tr ? "E-posta ile davet" : "Invite by email"}
                className="min-w-[16rem] flex-1 rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream"
              >
                <option value="member">{tr ? "Üye" : "Member"}</option>
                <option value="admin">{tr ? "Yönetici" : "Admin"}</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream disabled:opacity-60"
              >
                {tr ? "Davet et" : "Invite"}
              </button>
            </form>
          )}
          {canManage && detail.invites.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {detail.invites.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cream/10 px-3 py-2">
                  <span>
                    {inv.email} · {inv.role}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-copper hover:text-copper-bright"
                    onClick={() => void navigator.clipboard.writeText(`${inviteBase}${inv.token}`)}
                  >
                    {tr ? "Linki kopyala" : "Copy link"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ConsoleCard>
      )}
      {detail && usage.length > 0 && (
        <ConsoleCard title={tr ? "Son kullanım" : "Recent usage"}>
          <ul className="text-sm">
            {usage.map((row, i) => (
              <li
                key={`${i}-${row.userId}-${row.createdAt}`}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] py-2"
              >
                <span>
                  {row.email} · {row.operationId} · {row.status}
                </span>
                <span>
                  {row.creditCost} kr ·{" "}
                  {new Date(row.createdAt).toLocaleDateString(tr ? "tr-TR" : "en-US")}
                </span>
              </li>
            ))}
          </ul>
        </ConsoleCard>
      )}
      {note ? <p className="text-sm text-copper">{note}</p> : null}
      {error ? <p className="text-sm text-red-300/90">{error}</p> : null}
    </>
  );
}
