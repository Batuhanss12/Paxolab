import type { SiteContent } from "@/content/types";

/** English copy — professional packaging studio tone. Routes under /en. */

const content: SiteContent = {
  brand: {
    name: "Paxolab",
    tagline: "Professional packaging and label design studio",
    engine: "FORMA",
    email: "merhaba@paxolab.com",
  },

  nav: {
    services: "Services",
    how: "How it works",
    examples: "Examples",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    openStudio: "Open studio",
    menu: "Menu",
    primary: [
      { href: "/en/packaging-design", label: "Packaging" },
      { href: "/en/box-design", label: "Box" },
      { href: "/en/label-design", label: "Label" },
      { href: "/en/how-it-works", label: "How it works" },
      { href: "/en/pricing", label: "Pricing" },
      { href: "/en/faq", label: "FAQ" },
    ],
    links: [
      { href: "/en/packaging-design", label: "Packaging design" },
      { href: "/en/box-design", label: "Box design" },
      { href: "/en/label-design", label: "Label design" },
      { href: "/en/dieline", label: "Dieline" },
      { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
      { href: "/en/perfume-box-design", label: "Perfume box" },
      { href: "/en/how-it-works", label: "How it works" },
      { href: "/en/examples", label: "Examples" },
      { href: "/en/pricing", label: "Pricing" },
      { href: "/en/faq", label: "FAQ" },
      { href: "/en/contact", label: "Contact" },
    ],
  },

  footer: {
    blurb:
      "Paxolab delivers print-ready packaging, box, and label design powered by the FORMA engine. The final output is vector.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    legalLinks: [
      { href: "/en/privacy", label: "Privacy" },
      { href: "/en/terms", label: "Terms of use" },
    ],
    contactLabel: "Contact",
    copyright: (y: number) => `© ${y} Paxolab. All rights reserved.`,
  },

  home: {
    meta: {
      title: "Packaging & label design studio",
      description:
        "Design boxes, labels, and dielines with Paxolab. The FORMA engine produces print-ready vector artwork. Open the studio and start.",
    },
    hero: {
      eyebrow: "Powered by FORMA",
      title: "Design packaging by briefing it",
      lead: "Clarify your box, label, and dieline needs; the Paxolab studio takes the brief and produces a print-ready vector surface. Not an image generator — a design engine.",
      primaryCta: "Open studio",
      secondaryCta: "How it works",
    },
    valueProps: [
      {
        href: "/en/box-design",
        title: "Box design",
        text: "Structure plus graphics for tuck-end, auto-bottom, and custom forms.",
      },
      {
        href: "/en/label-design",
        title: "Label design",
        text: "Readable, print-tolerant layouts for bottles, jars, and product labels.",
      },
      {
        href: "/en/dieline",
        title: "Dieline",
        text: "Cut, fold, and glue lines expressed in production language.",
      },
      {
        href: "/en/how-it-works",
        title: "Revision loop",
        text: "Brief → generate → revise. A repeatable workflow measured in credits.",
      },
    ],
    hubsTitle: "Service pages",
    hubsLead: "Go deeper by product type; every page links into the studio.",
    hubs: [
      { href: "/en/packaging-design", label: "Packaging design" },
      { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
      { href: "/en/perfume-box-design", label: "Perfume box" },
      { href: "/en/pricing", label: "Pricing" },
    ],
    extraHubs: [
      { href: "/en/examples", label: "Examples" },
      { href: "/en/contact", label: "Contact" },
    ],
    ctaTitle: "Start producing in the studio",
    ctaLead:
      "Write your brief and let the FORMA engine produce a print-ready vector surface. Credits and packs live inside the studio.",
  },

  services: {
    "packaging-design": {
      slug: "packaging-design",
      meta: {
        title: "Packaging design",
        description:
          "Structure brand packaging with Paxolab: form, surface, and print prep in one studio. Vector output via FORMA.",
      },
      hero: {
        title: "Packaging design",
        lead: "Product protection, shelf presence, and print reality meet in one brief. Paxolab lets you advance both structure and face art in the studio.",
      },
      sections: [
        {
          title: "What we offer",
          body: "Handle boxes, labels, and related dieline needs in one flow. Write or talk through the brief; the engine produces a print-ready surface. Output is vector-first — not random image generation.",
        },
        {
          title: "Who it’s for",
          body: "Cosmetics, food, electronics accessories, and retail brands; agencies and in-house design teams. Ideal when you want clear structure and graphics before prototyping.",
        },
        {
          title: "Next step",
          body: "Open a project in the studio, pick a product type, and run a first generation. Credit packs are summarized on pricing; purchase completes inside the studio.",
        },
      ],
      related: [
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
      ],
      serviceName: "Packaging design",
      serviceType: "PackagingDesign",
    },
    "box-design": {
      slug: "box-design",
      meta: {
        title: "Box design",
        description:
          "Professional box design: structure, surface graphics, and dieline. Move print-ready inside the Paxolab studio.",
      },
      hero: {
        title: "Box design",
        lead: "Folding carton forms, logo placement, and production lines are considered together. Turn your box brief into something concrete in the studio.",
      },
      sections: [
        {
          title: "Structure + surface",
          body: "Dieline logic is preserved on common forms such as tuck-end and auto-lock bottoms. Graphics sit by panel and fold.",
        },
        {
          title: "Production language",
          body: "Cut and fold lines stay explicit, so the handoff to printer or prototype carries fewer surprises.",
        },
        {
          title: "Related use cases",
          body: "See also our vertical pages for perfume boxes, cosmetic sets, and gift packaging.",
        },
      ],
      related: [
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/perfume-box-design", label: "Perfume box" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/examples", label: "Examples" },
      ],
      serviceName: "Box design",
      serviceType: "BoxDesign",
    },
    "label-design": {
      slug: "label-design",
      meta: {
        title: "Label design",
        description:
          "Readable, print-ready label design for bottles and products. From brief to vector in the Paxolab studio.",
      },
      hero: {
        title: "Label design",
        lead: "Hierarchy, legal copy space, and brand identity balance on a small surface. Keep labels orderly and producible with Paxolab.",
      },
      sections: [
        {
          title: "Focus areas",
          body: "Clear zones for product name, variant, volume, and mandatory copy. Prefer legibility and print tolerance over decoration.",
        },
        {
          title: "With packaging",
          body: "Labels usually belong to the same brand system as the box or bottle wrap. Use the box and label pages together when needed.",
        },
      ],
      related: [
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/how-it-works", label: "How it works" },
      ],
      serviceName: "Label design",
      serviceType: "LabelDesign",
    },
    dieline: {
      slug: "dieline",
      meta: {
        title: "Dieline",
        description:
          "Packaging dielines: cut, fold, and glue lines. Production-minded structure with Paxolab.",
      },
      hero: {
        title: "Dieline",
        lead: "A dieline is the production language of packaging. The Paxolab studio advances design on that structure — a paneled surface, not a random image.",
      },
      sections: [
        {
          title: "Why it matters",
          body: "Wrong fold or cut lines create cost in prototype and print. Clear dimensions and form in the brief make the output usable.",
        },
        {
          title: "How you use it in the studio",
          body: "Share product type and dimensions; the engine produces a structure-aware surface. Tighten copy and layout through revisions.",
        },
      ],
      related: [
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/perfume-box-design", label: "Perfume box" },
        { href: "/en/faq", label: "FAQ" },
      ],
      serviceName: "Dieline",
      serviceType: "Dieline",
    },
    "cosmetic-packaging-design": {
      slug: "cosmetic-packaging-design",
      meta: {
        title: "Cosmetic packaging design",
        description:
          "Cosmetic box and label design: shelf presence, brand voice, and print prep. Paxolab studio.",
      },
      hero: {
        title: "Cosmetic packaging design",
        lead: "Clean hierarchy and a premium feel for serums, creams, and set boxes. Produce your cosmetics brief in the studio.",
      },
      sections: [
        {
          title: "Category needs",
          body: "INCI lists, warnings, and brand promise must fit small panels. In cosmetics, a restrained language that matches materials and finish usually works best.",
        },
        {
          title: "Label + box",
          body: "Bottle label and outer carton belong in one system. Related pages: label design and box design.",
        },
      ],
      related: [
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/perfume-box-design", label: "Perfume box" },
        { href: "/en/examples", label: "Examples" },
      ],
      serviceName: "Cosmetic packaging design",
      serviceType: "CosmeticPackaging",
    },
    "perfume-box-design": {
      slug: "perfume-box-design",
      meta: {
        title: "Perfume box design",
        description:
          "Perfume carton and secondary packaging design. Structure, surface, and dieline together with Paxolab.",
      },
      hero: {
        title: "Perfume box design",
        lead: "A perfume box carries the brand on shelf and at the gift moment. Produce a balanced form-and-typography surface in the Paxolab studio.",
      },
      sections: [
        {
          title: "Focus",
          body: "Clear panels for bottle silhouette, brand name, and variant. Layout that leaves room for materials and print quality rather than heavy effects.",
        },
        {
          title: "Related services",
          body: "Our general box design and dieline pages explain the structural side of the process.",
        },
      ],
      related: [
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/pricing", label: "Pricing" },
      ],
      serviceName: "Perfume box design",
      serviceType: "PerfumeBoxDesign",
    },
  },

  howItWorks: {
    meta: {
      title: "How it works",
      description:
        "Paxolab studio workflow: brief, FORMA generation, revision, and credits — step by step.",
    },
    title: "How it works",
    lead: "The Paxolab marketing site informs; real design work happens in the studio (FORMA). The flow below summarizes a typical session.",
    steps: [
      {
        n: "01",
        title: "Clarify the brief",
        text: "Capture product type, dimensions, brand notes, and constraints — by writing or chatting. The engine only generates from a structured brief.",
      },
      {
        n: "02",
        title: "FORMA generation",
        text: "The print surface is a vector engine. No random image model; dieline logic is preserved.",
      },
      {
        n: "03",
        title: "Revision",
        text: "Tighten copy, layout, and variants through revisions. Every generation and revision spends credits.",
      },
      {
        n: "04",
        title: "Credits & account",
        text: "Sign-up includes starter credits; extra packs are bought in-studio. Guest use may stay local — credit metering applies to signed-in sessions.",
      },
    ],
    cta: "Try the studio",
  },

  examples: {
    meta: {
      title: "Examples",
      description:
        "Paxolab packaging and label examples (illustrative). Real projects are produced in the studio.",
    },
    title: "Examples",
    lead: "These are illustrative scenarios — not real client work. Try the studio with your own brief.",
    badge: "Sample",
    items: [
      {
        title: "Serum carton — matte finish",
        category: "Cosmetics",
        text: "Single-SKU carton, restrained typography, product name and volume on the front panel. Dieline: tuck-end.",
      },
      {
        title: "Olive oil bottle label",
        category: "Label",
        text: "Vertical label with dedicated zones for origin and volume, limited color palette.",
      },
      {
        title: "Niche perfume outer carton",
        category: "Perfume",
        text: "Minimal brand block, scent-family summary on the side panel, balanced space for gift-shelf presence.",
      },
      {
        title: "Accessory e-commerce carton",
        category: "Box",
        text: "Compact auto-bottom form, panels mindful of shipping tolerance, single-color print scenario.",
      },
    ],
  },

  pricing: {
    meta: {
      title: "Pricing",
      description:
        "Paxolab credit packs: 50, 150, and 400 credits. Purchase completes via studio billing.",
    },
    title: "Pricing",
    lead: "Generation and revisions are metered in credits. Packs tie to in-studio billing; payment completes in the studio.",
    note: "Prices match the studio catalog (TRY). Check the studio panel for campaigns or changes.",
    packs: [
      {
        id: "pack_50",
        credits: 50,
        priceTry: 99,
        label: "50 Credits",
        hint: "Trials and short jobs",
      },
      {
        id: "pack_150",
        credits: 150,
        priceTry: 249,
        label: "150 Credits",
        hint: "Steady project flow",
        featured: true,
      },
      {
        id: "pack_400",
        credits: 400,
        priceTry: 599,
        label: "400 Credits",
        hint: "Heavy production periods",
      },
    ],
    usage: [
      { action: "Generate", cost: "3 credits" },
      { action: "Revise", cost: "2 credits" },
      { action: "Sign-up bonus", cost: "50 starter credits" },
    ],
    usageTitle: "Credit usage",
    creditsUnit: "credits",
    studioCta: "View packs in studio",
  },

  faq: {
    meta: {
      title: "Frequently asked questions",
      description:
        "FAQ on Paxolab, FORMA, credits, dielines, and studio use.",
    },
    title: "Frequently asked questions",
    lead: "Short answers on Paxolab, the studio, and credits.",
    items: [
      {
        q: "What’s the difference between Paxolab and FORMA?",
        a: "Paxolab is the product and marketing brand. FORMA is the design engine behind the studio. This site informs; production happens in the studio.",
      },
      {
        q: "Is the output really print-ready?",
        a: "The engine produces a vector surface with dieline logic. Printer specs (CMYK profile, bleed, specialty finishes) still need project-specific validation.",
      },
      {
        q: "How do credits work?",
        a: "In a signed-in session, generate and revise spend credits. Packs are 50 / 150 / 400; purchase completes via studio billing.",
      },
      {
        q: "Can I try as a guest?",
        a: "The studio may offer local use. The credit wallet and cloud sync require a signed-in account.",
      },
      {
        q: "Is it suitable for agencies?",
        a: "Yes — especially when you need a clear brief and fast variants. Final client approval and printer checks remain yours.",
      },
      {
        q: "Is there a Turkish version?",
        a: "Yes — Turkish is the default locale at the site root (no /tr prefix). English pages live under /en.",
      },
    ],
  },

  contact: {
    meta: {
      title: "Contact",
      description: "Get in touch with Paxolab. Email form for support and partnerships.",
    },
    title: "Contact",
    lead: "Write about product, partnership, or support. No backend — your email client opens.",
    emailLabel: "Email",
    subjects: ["General question", "Enterprise / agency", "Technical support", "Other"],
    form: {
      name: "Your name",
      subject: "Subject",
      message: "Your message",
      submit: "Send via email",
    },
    aside:
      "If you need production urgently, open the studio and proceed with a brief; response times vary by business day.",
  },

  legal: {
    privacy: {
      meta: {
        title: "Privacy policy",
        description: "Paxolab privacy policy summary.",
      },
      title: "Privacy policy",
      updated: "Last updated: September 2026",
      sections: [
        {
          title: "Scope",
          body: "This is a short summary for the Paxolab marketing site. Studio (FORMA) accounts and payments may be covered by separate privacy notices.",
        },
        {
          title: "Data we collect",
          body: "If you send a contact email, your name, email, and message are transmitted by email. If analytics are added later, the cookie notice will be updated.",
        },
        {
          title: "Contact",
          body: "For privacy requests, email merhaba@paxolab.com.",
        },
      ],
    },
    terms: {
      meta: {
        title: "Terms of use",
        description: "Paxolab site terms of use summary.",
      },
      title: "Terms of use",
      updated: "Last updated: September 2026",
      sections: [
        {
          title: "Service separation",
          body: "This website is informational. Design generation, credits, and payment happen in the studio app and are governed by its own terms.",
        },
        {
          title: "Content",
          body: "Examples are illustrative. Brand names and imagery must respect third-party rights.",
        },
        {
          title: "Liability",
          body: "Print and production decisions belong to the user. Site content does not create legal or technical warranties.",
        },
      ],
    },
  },

  ui: {
    relatedTitle: "Related pages",
    openStudio: "Open studio",
    backHome: "Home",
    fromPrice: "from",
    tryMonth: "TRY",
    howSecondary: "How it works?",
  },
};

export default content;

export const brand = content.brand;
export const nav = content.nav;
export const footer = content.footer;
export const home = content.home;
export const services = content.services;
export const howItWorks = content.howItWorks;
export const examples = content.examples;
export const pricing = content.pricing;
export const faq = content.faq;
export const contact = content.contact;
export const legal = content.legal;
export const ui = content.ui;
