import type { Locale } from "@/content/types";
import { getContent } from "@/content";
import { PageHero } from "@/components/PageHero";
import { StudioLink } from "@/components/StudioLink";
import { ContactForm } from "@/components/ContactForm";

export function ContactPageView({ locale }: { locale: Locale }) {
  const { contact } = getContent(locale);
  return (
    <>
      <PageHero title={contact.title} lead={contact.lead} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <ContactForm />
        <aside className="space-y-6">
          <p className="text-sm leading-relaxed text-cream/60">{contact.aside}</p>
          <StudioLink />
        </aside>
      </div>
    </>
  );
}
