/** Shared content shape for TR / EN locales. */

export type Locale = "tr" | "en";

export type NavLink = { href: string; label: string };

export type FaqItem = { q: string; a: string };

export type HowToStep = { name: string; text: string };

export type ServicePage = {
  slug: string;
  meta: { title: string; description: string };
  hero: { title: string; lead: string };
  sections: { title: string; body: string }[];
  related: { href: string; label: string }[];
  faqs?: FaqItem[];
  howto?: { name: string; description: string; steps: HowToStep[] };
  serviceName: string;
  serviceType: string;
};

export type LegalDoc = {
  meta: { title: string; description: string };
  title: string;
  updated: string;
  sections: { title: string; body: string }[];
};

export type SiteContent = {
  brand: {
    name: string;
    tagline: string;
    engine: string;
    email: string;
  };
  nav: {
    services: string;
    how: string;
    examples: string;
    pricing: string;
    faq: string;
    contact: string;
    openStudio: string;
    logIn: string;
    signUp: string;
    menu: string;
    links: NavLink[];
    primary: NavLink[];
  };
  footer: {
    blurb: string;
    product: string;
    company: string;
    legal: string;
    legalLinks: NavLink[];
    contactLabel: string;
    copyright: (y: number) => string;
  };
  home: {
    meta: { title: string; description: string };
    hero: {
      eyebrow: string;
      title: string;
      lead: string;
      primaryCta: string;
      secondaryCta: string;
      askPlaceholder: string;
      stageHint: string;
    };
    valueProps: { href: string; title: string; text: string }[];
    hubsTitle: string;
    hubsLead: string;
    hubs: NavLink[];
    extraHubs: NavLink[];
    ctaTitle: string;
    ctaLead: string;
  };
  services: Record<string, ServicePage>;
  howItWorks: {
    meta: { title: string; description: string };
    title: string;
    lead: string;
    steps: { n: string; title: string; text: string }[];
    cta: string;
  };
  examples: {
    meta: { title: string; description: string };
    title: string;
    lead: string;
    badge: string;
    items: { title: string; category: string; text: string; href?: string }[];
  };
  pricing: {
    meta: { title: string; description: string };
    title: string;
    lead: string;
    note: string;
    packs: {
      id: string;
      credits: number;
      priceTry: number;
      label: string;
      hint: string;
      featured?: boolean;
    }[];
    usage: { action: string; cost: string }[];
    usageTitle: string;
    creditsUnit: string;
    studioCta: string;
  };
  faq: {
    meta: { title: string; description: string };
    title: string;
    lead: string;
    items: { q: string; a: string }[];
  };
  contact: {
    meta: { title: string; description: string };
    title: string;
    lead: string;
    emailLabel: string;
    subjects: string[];
    form: { name: string; subject: string; message: string; submit: string };
    aside: string;
  };
  legal: {
    privacy: LegalDoc;
    kvkk?: LegalDoc;
    terms: LegalDoc;
  };
  ui: {
    relatedTitle: string;
    openStudio: string;
    backHome: string;
    fromPrice: string;
    tryMonth: string;
    howSecondary: string;
    faqTitle: string;
  };
};
