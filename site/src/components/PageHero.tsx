type Props = {
  eyebrow?: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
};

export function PageHero({ eyebrow, title, lead, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 20% 0%, rgba(196,149,94,0.08), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {eyebrow && (
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-copper">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-[clamp(2rem,3.5vw+0.75rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-cream">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/50 sm:text-lg">
          {lead}
        </p>
        {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
