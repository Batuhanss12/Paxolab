type Section = { title: string; body: string };

export function LegalPageView({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-cream">{title}</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-cream/40">{updated}</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-xl text-cream">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/65 sm:text-base">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
