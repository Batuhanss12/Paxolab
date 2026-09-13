type Props = {
  eyebrow?: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
};

export function PageHero({ eyebrow, title, lead, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-cream/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 40%, rgba(196,149,94,0.08) 100%), repeating-linear-gradient(-12deg, transparent, transparent 24px, rgba(245,240,230,0.02) 24px, rgba(245,240,230,0.02) 25px)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-copper">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl font-display text-4xl leading-[1.1] text-cream sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/65 sm:text-lg">
          {lead}
        </p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
