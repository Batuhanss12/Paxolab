"use client";

import { usePathname } from "next/navigation";
import { getContent } from "@/content";
import { localeFromPath } from "@/lib/i18n";

export function ContactForm() {
  const pathname = usePathname() || "/";
  const locale = localeFromPath(pathname);
  const { brand, contact } = getContent(locale);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const subject = String(fd.get("subject") || "Paxolab");
    const message = String(fd.get("message") || "");
    const body =
      locale === "en" ? `Name: ${name}\n\n${message}` : `Ad: ${name}\n\n${message}`;
    const url = `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  return (
    <form
      className="space-y-4 rounded-sm border border-cream/10 bg-ink-900/40 p-6"
      onSubmit={onSubmit}
    >
      <div>
        <label htmlFor="name" className="text-xs uppercase tracking-wider text-cream/45">
          {contact.form.name}
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
        />
      </div>
      <div>
        <label htmlFor="subject" className="text-xs uppercase tracking-wider text-cream/45">
          {contact.form.subject}
        </label>
        <select
          id="subject"
          name="subject"
          className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
          defaultValue={contact.subjects[0]}
        >
          {contact.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="text-xs uppercase tracking-wider text-cream/45">
          {contact.form.message}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="mt-1 w-full rounded-sm border border-cream/15 bg-ink-975 px-3 py-2 text-sm text-cream outline-none focus:border-copper"
        />
      </div>
      <button
        type="submit"
        className="inline-flex rounded-sm bg-copper px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-copper-bright"
      >
        {contact.form.submit}
      </button>
      <p className="text-xs text-cream/40">
        {contact.emailLabel}:{" "}
        <a className="text-copper hover:underline" href={`mailto:${brand.email}`}>
          {brand.email}
        </a>
      </p>
    </form>
  );
}
