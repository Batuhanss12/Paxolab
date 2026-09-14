import type { SiteContent } from "@/content/types";

/** English copy — professional packaging studio tone. Routes under /en. */

const content: SiteContent = {
  brand: {
    name: "Grapxor",
    tagline: "Professional packaging and label design studio",
    engine: "Grapxor",
    email: "merhaba@grapxor.com",
  },

  nav: {
    services: "Services",
    how: "How it works",
    examples: "Examples",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    openStudio: "Open studio",
    logIn: "Log in",
    signUp: "Sign up",
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
      { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
      { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
      { href: "/en/perfume-box-design", label: "Perfume box" },
      { href: "/en/food-packaging-design", label: "Food packaging" },
      { href: "/en/label-vs-box", label: "Label vs box" },
      { href: "/en/what-is-ai-packaging-design", label: "What is AI packaging design" },
      { href: "/en/how-it-works", label: "How it works" },
      { href: "/en/examples", label: "Examples" },
      { href: "/en/pricing", label: "Pricing" },
      { href: "/en/faq", label: "FAQ" },
      { href: "/en/private-label-food-box-brief", label: "Private-label food brief" },
      { href: "/en/serum-box-size-brief", label: "Serum size brief" },
      { href: "/en/how-grapxor-vector-engine-works", label: "How Grapxor works" },
      { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
      { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
      { href: "/en/contact", label: "Contact" },
    ],
  },

  footer: {
    blurb:
      "Grapxor delivers print-ready packaging, box, and label design. Studio and design engine under one name — final output is vector.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    legalLinks: [
      { href: "/en/privacy", label: "Privacy" },
      { href: "/en/terms", label: "Terms of use" },
    ],
    contactLabel: "Contact",
    copyright: (y: number) => `© ${y} Grapxor. All rights reserved.`,
  },

  home: {
    meta: {
      title: "Packaging & label design studio",
      description:
        "Design boxes, labels, and dielines with Grapxor. The design engine produces print-ready vector artwork. Open the studio and start.",
    },
    hero: {
      eyebrow: "Design studio + engine",
      title: "Design packaging from a brief",
      lead: "Brief the studio — get print-ready box, label, and dieline vectors. Not an image generator — a design engine.",
      primaryCta: "Open studio",
      secondaryCta: "How it works",
      askPlaceholder: "Ask Grapxor…",
      stageHint: "Dieline preview",
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
      { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
      { href: "/en/food-packaging-design", label: "Food packaging" },
      { href: "/en/perfume-box-design", label: "Perfume box" },
      { href: "/en/pricing", label: "Pricing" },
    ],
    extraHubs: [
      { href: "/en/label-vs-box", label: "Label vs box" },
      { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      { href: "/en/what-is-ai-packaging-design", label: "What is AI packaging design" },
      { href: "/en/examples", label: "Examples" },
      { href: "/en/contact", label: "Contact" },
    ],
    ctaTitle: "Start producing in the studio",
    ctaLead:
      "Write your brief and let Grapxor produce a print-ready vector surface. Credits and packs live inside the studio.",
  },

  services: {
    "packaging-design": {
      slug: "packaging-design",
      meta: {
        title: "Professional packaging design studio",
        description:
          "Structure brand packaging with Grapxor: form, surface, and print prep in one studio. Vector output from the Grapxor engine.",
      },
      hero: {
        title: "Packaging design",
        lead: "Product protection, shelf presence, and print reality meet in one brief. Grapxor lets you advance both structure and face art in the studio.",
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
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
      ],
      faqs: [
        {
          q: "How does Grapxor produce packaging?",
          a: "You clarify the need via chat or a brief; Grapxor produces a vector surface on a dieline. It is a design engine, not an image-generation model. Real work opens in the studio.",
        },
        {
          q: "Is the output vector or an image?",
          a: "Output is vector-first. There is no random image generation; a paneled surface and dieline logic are preserved.",
        },
        {
          q: "Who is it for?",
          a: "Cosmetics, food, accessories, and retail brands; agencies and in-house teams. Use the studio when you want structure and graphics before prototyping.",
        },
        {
          q: "Where do I see pricing?",
          a: "Credit packs are summarized on the pricing page; purchase completes inside the studio. This site informs.",
        },
      ],
      serviceName: "Packaging design",
      serviceType: "PackagingDesign",
    },
    "box-design": {
      slug: "box-design",
      meta: {
        title: "Professional box design studio",
        description:
          "Professional box design: structure, surface graphics, and dieline. Move print-ready inside the Grapxor studio.",
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
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/dieline", label: "Dieline" },
      ],
      faqs: [
        {
          q: "Do structure and graphics move together on a box?",
          a: "Yes. Dieline logic is preserved on common forms such as tuck-end and auto-lock bottoms; graphics sit by panel and fold.",
        },
        {
          q: "Is the file print-ready?",
          a: "The engine keeps vector surfaces and cut/fold lines close to production language. Material, color, and preflight approval still happen with your printer.",
        },
        {
          q: "Which box forms can I use?",
          a: "Name common folding-carton forms (for example tuck-end or auto-bottom) in the brief. For custom forms, share dimensions and constraints in the studio.",
        },
        {
          q: "How do I start?",
          a: "Open a project in the studio, pick a product type, and write the brief. The marketing site informs — production happens in the studio.",
        },
      ],
      serviceName: "Box design",
      serviceType: "BoxDesign",
    },
    "label-design": {
      slug: "label-design",
      meta: {
        title: "Print-ready label design studio",
        description:
          "Readable, print-ready label design for bottles and products. From brief to vector in the Grapxor studio.",
      },
      hero: {
        title: "Label design",
        lead: "Hierarchy, legal copy space, and brand identity balance on a small surface. Keep labels orderly and producible with Grapxor.",
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
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "How is label design different from box design?",
          a: "A label is the primary face of a bottle, jar, or tube; a box is folding secondary packaging. If you are unsure, see the label-vs-box guide.",
        },
        {
          q: "Are legal texts written automatically?",
          a: "No. Mandatory copy is the brand’s and advisor’s responsibility. The studio helps you leave readable zones; accuracy stays with you.",
        },
        {
          q: "Is the output print-tolerant?",
          a: "The goal is a print-tolerant vector layout. Material and color approval happen with the printer. Grapxor is a design engine, not an image model.",
        },
        {
          q: "Can I design a cosmetics bottle label?",
          a: "Yes — brief it in label mode. If you also need an outer carton, use the cosmetics and box pages together; work opens in the studio.",
        },
      ],
      serviceName: "Label design",
      serviceType: "LabelDesign",
    },
    dieline: {
      slug: "dieline",
      meta: {
        title: "Packaging dieline design guide",
        description:
          "Packaging dielines: cut, fold, and glue lines. Production-minded structure with Grapxor.",
      },
      hero: {
        title: "Dieline",
        lead: "A dieline is the production language of packaging. The Grapxor studio advances design on that structure — a paneled surface, not a random image.",
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
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/faq", label: "FAQ" },
      ],
      faqs: [
        {
          q: "What is a dieline?",
          a: "A dieline is the production language of cut, fold, and glue lines. Grapxor advances design on that structure — not a random image.",
        },
        {
          q: "How does Grapxor use the dieline?",
          a: "Share product type and dimensions in the brief; the engine produces a structure-aware vector surface. Tighten copy and graphics through revisions.",
        },
        {
          q: "How is this different from the print-ready dieline page?",
          a: "This page explains the concept and structure. See print-ready dieline for export and preflight focus — it is not a copy of the same content.",
        },
        {
          q: "Is it guaranteed at every printer?",
          a: "No. The goal is vector structure close to production language; material and preflight approval belong to your printer.",
        },
      ],
      howto: {
        name: 'Work with a dieline in Grapxor',
        description: 'Dieline-focused studio flow for the concept hub.',
        steps: [
          { name: 'Choose the form', text: 'Box or label structure.' },
          { name: 'Enter sizes', text: 'Clear values in mm.' },
          { name: 'Generate', text: 'Vector surface on the dieline.' },
          { name: 'Check', text: 'Cut/crease consistency.' },
          { name: 'Go to export guidance', text: 'See the print-ready dieline / SVG spoke.' },
        ],
      },
      serviceName: "Dieline",
      serviceType: "Dieline",
    },
    "cosmetic-packaging-design": {
      slug: "cosmetic-packaging-design",
      meta: {
        title: "Cosmetic packaging design",
        description:
          "Cosmetic box and label design: shelf presence, brand voice, and print prep. Grapxor studio.",
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
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/perfume-box-design", label: "Perfume box" },
      ],
      faqs: [
        {
          q: "Does this page also cover serum and cream boxes?",
          a: "The cosmetics hub frames the category. The serum/cream box vertical goes deeper on those SKUs; both pages link into the studio.",
        },
        {
          q: "Should label and box be designed together?",
          a: "On most cosmetics SKUs the bottle label and outer carton share one brand system. Use the label and box pages together when needed.",
        },
        {
          q: "Does Grapxor generate images?",
          a: "No. Grapxor is a vector design engine: brief → dieline + artwork. If you only need a moodboard image, other tools may fit better.",
        },
        {
          q: "Is the INCI list added automatically?",
          a: "No. Copy accuracy is the brand’s responsibility. The studio helps you leave readable space on small panels.",
        },
      ],
      serviceName: "Cosmetic packaging design",
      serviceType: "CosmeticPackaging",
    },
    "perfume-box-design": {
      slug: "perfume-box-design",
      meta: {
        title: "Perfume box design",
        description:
          "Perfume carton and secondary packaging design. Structure, surface, and dieline together with Grapxor.",
      },
      hero: {
        title: "Perfume box design",
        lead: "A perfume box carries the brand on shelf and at the gift moment. Produce a balanced form-and-typography surface in the Grapxor studio.",
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
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
      ],
      faqs: [
        {
          q: "How is a perfume box different from general box design?",
          a: "It uses the same box and dieline logic; the focus is bottle silhouette, brand name, and gift-moment panels.",
        },
        {
          q: "Where is structure defined?",
          a: "The dieline and print-ready dieline pages explain cut/fold language. Graphics are produced on the dieline in the studio.",
        },
        {
          q: "Is the output vector?",
          a: "Yes. Grapxor is a vector design engine, not an image model. Real work opens in the studio.",
        },
        {
          q: "Where do I see pricing?",
          a: "Credits are summarized on the pricing page; purchase happens inside the studio.",
        },
      ],
      serviceName: "Perfume box design",
      serviceType: "PerfumeBoxDesign",
    },
    "food-packaging-design": {
      slug: "food-packaging-design",
      meta: {
        title: "Food packaging design",
        description:
          "Design food boxes and labels from brief to vector in the Grapxor studio. The engine produces print-ready surfaces — a design engine, not an image model.",
      },
      hero: {
        title: "Food packaging design",
        lead: "Move food box and label surfaces from brief to vector. Grapxor builds shelf-legible, print-oriented layouts — a design engine, not an image model.",
      },
      sections: [
        {
          title: "Shelf and legibility",
          body: "Food packaging must make product name, net quantity, and key facts easy to scan. In the Grapxor studio you break the brief into panels and keep hierarchy calm.",
        },
        {
          title: "Box and label together",
          body: "Bottle labels and outer cartons often share one brand system. Use the box design or label design pages as needed — or the label-vs-box guide if you are still deciding.",
        },
        {
          title: "From brief to dieline + vector",
          body: "The flow starts with chat or a brief; Grapxor produces vector artwork on a dieline. The marketing site informs — real design work opens in the studio.",
        },
        {
          title: "Print readiness",
          body: "The goal is a production-aware surface, not a random image. See the dieline and print-ready dieline pages for structure and export focus; questions: merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/private-label-food-box-brief", label: "Private-label food brief" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/label-design", label: "Label design" },
      ],
      faqs: [
        {
          q: "How does Grapxor produce food packaging?",
          a: "You clarify the need via chat or a brief; Grapxor produces a dieline plus vector surface. It is a print-oriented design engine, not a random image model.",
        },
        {
          q: "Are legal food texts written automatically in the studio?",
          a: "Legal and compliance copy is the brand’s and advisor’s responsibility. The studio helps you leave panel space and hierarchy; you verify content accuracy.",
        },
        {
          q: "Can the output go to a printer?",
          a: "The goal is a print-oriented vector surface aligned with a dieline. Printer preflight and materials still need separate confirmation — see the dieline and print-ready dieline pages.",
        },
        {
          q: "Should I choose a label or a box?",
          a: "It depends on product form. If you are unsure, use the label-vs-box guide and the related service pages; you can run both in one brand system.",
        },
        {
          q: "Is Grapxor an image generator?",
          a: "No. Grapxor is a packaging design engine: brief → dieline + vector artwork. The marketing site explains; design work happens in the studio.",
        },
      ],
      serviceName: "Food packaging design",
      serviceType: "FoodPackaging",
    },
    "serum-cream-box-design": {
      slug: "serum-cream-box-design",
      meta: {
        title: "Serum and cream box design",
        description:
          "Design serum and cream cartons from brief to vector in the Grapxor studio. The engine builds print-oriented surfaces on a dieline — not an image model.",
      },
      hero: {
        title: "Serum and cream box design",
        lead: "Clean carton surfaces for serum and cream SKUs. Move your brief to dieline + vector in the Grapxor studio — a design engine, not an image model.",
      },
      sections: [
        {
          title: "Serum box focus",
          body: "Narrow bottle silhouette, product type, and volume should sit in clear panels. Typography and whitespace usually carry a premium feel more safely than heavy effects.",
        },
        {
          title: "Cream box focus",
          body: "For jar or tube secondary packaging, benefit lines and variant separation must stay legible. Keep set cartons in one visual language across SKUs.",
        },
        {
          title: "Label and box as one system",
          body: "Bottle or jar labels and the outer carton should share brand language. Use the label design and cosmetic packaging pages together when needed.",
        },
        {
          title: "From brief to vector",
          body: "Start with chat or a brief; Grapxor produces vector artwork on a dieline. The marketing site informs — design opens in the studio. Questions: merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Is there a separate page for serum vs cream?",
          a: "This hub covers both product types, with distinct serum and cream sections. Use the cosmetic packaging page for broader category needs.",
        },
        {
          q: "Does Grapxor generate images?",
          a: "No. Grapxor is a design engine that turns a brief into dieline + vector artwork — not an image-generation model. Work opens in the studio.",
        },
        {
          q: "Is the INCI list added automatically?",
          a: "Copy accuracy is the brand’s responsibility. The studio helps you leave readable space on small panels.",
        },
        {
          q: "Do I also need a label?",
          a: "Bottle or jar labels often share language with the outer carton. If you are unsure, see the label-vs-box guide.",
        },
        {
          q: "How is this different from a perfume box?",
          a: "Perfume box is a separate vertical; serum/cream focuses on care-line and benefit hierarchy. You can produce both with the box + dieline flow.",
        },
      ],
      serviceName: "Serum and cream box design",
      serviceType: "SerumCreamBox",
    },
    "what-is-ai-packaging-design": {
      slug: "what-is-ai-packaging-design",
      meta: {
        title: "What is AI packaging design?",
        description:
          "What is AI packaging design? Grapxor is a vector design engine: brief to dieline + artwork — not an image-generation model.",
      },
      hero: {
        title: "What is AI packaging design?",
        lead: "“AI packaging” is often confused with image generation. Grapxor is a design engine that turns chat and briefs into dieline + vector artwork — not an image-gen model.",
      },
      sections: [
        {
          title: "Image model vs vector engine",
          body: "Image models output stylized raster pictures. Grapxor builds print-oriented vector surfaces on packaging panels and a dieline. That difference shapes what you can send toward production.",
        },
        {
          title: "The Grapxor flow",
          body: "You clarify the need via chat or a brief; the studio produces dieline + artwork and you revise there. This marketing site informs — real work opens in the studio.",
        },
        {
          title: "When this approach fits",
          body: "If box, label, and dieline should move as one system, a vector engine is the right frame. If you only need a moodboard image, other tools may fit better.",
        },
      ],
      related: [
        { href: "/en/ai-vs-design-agency-packaging", label: "AI vs design agency" },
        { href: "/en/how-grapxor-vector-engine-works", label: "How Grapxor works" },
        { href: "/en/ai-packaging-myths", label: "AI packaging myths" },
        { href: "/en/how-it-works", label: "How it works" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      ],
      faqs: [
        {
          q: "Is AI packaging design the same as image generation?",
          a: "Many tools treat it that way. Grapxor is a vector design engine: chat or brief → dieline + artwork. It is not an image-gen model.",
        },
        {
          q: "Does it work via chat?",
          a: "Yes. You clarify the need via chat or a brief; generation and revision continue in the studio. This marketing site only informs.",
        },
        {
          q: "Why does the dieline matter?",
          a: "A dieline is the production language of packaging; panels, cuts, and folds depend on it. Our dieline page explains the structural side.",
        },
        {
          q: "When is this approach a fit?",
          a: "When box, label, and dieline should move as one system. If you only need a moodboard image, other tools may fit better.",
        },
        {
          q: "Is it free?",
          a: "Credit use is explained on the pricing page. See the studio for current packs; questions: merhaba@grapxor.com.",
        },
      ],
      serviceName: "What is AI packaging design",
      serviceType: "AiPackagingExplainer",
    },
    "print-ready-dieline": {
      slug: "print-ready-dieline",
      meta: {
        title: "Print-ready dieline",
        description:
          "Print-ready dieline with an SVG-minded export focus. Grapxor: brief to vector surface — the production companion to our dieline page.",
      },
      hero: {
        title: "Print-ready dieline",
        lead: "Treat the dieline as more than a concept: vector export and preflight awareness. Grapxor turns briefs into dieline + vector artwork — a design engine, not an image model.",
      },
      sections: [
        {
          title: "What print-ready means here",
          body: "The goal is a paneled surface aligned with cut/fold language and movable as vectors. Press material and color approval still happen with your printer — we do not claim “guaranteed at every plant” or invent PDF/X certification.",
        },
        {
          title: "SVG and vector mindset",
          body: "Scalable paths, separating cut from graphics, and panel layout matter in production. Raster “fake dieline” pictures are not a substitute for production language.",
        },
        {
          title: "How this relates to the dieline page",
          body: "See our dieline page (/en/dieline) for structure and concepts. This page complements it with export and preflight focus — it is not a duplicate. Production starts in the Grapxor studio.",
        },
        {
          title: "High-level checklist themes",
          body: "Review safe area, cut-vs-art separation, and type legibility before you ask the printer. For current export options, open the studio or email merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/how-to-send-svg-dieline-to-printer", label: "Send SVG to printer" },
        { href: "/en/reading-a-tuck-end-dieline", label: "Reading a tuck-end dieline" },
        { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "How is this different from the dieline page?",
          a: "The dieline page explains the concept and the studio’s structural role. This page focuses on export, SVG/vector mindset, and high-level preflight themes.",
        },
        {
          q: "Is the output SVG?",
          a: "Grapxor produces vector-first work; export details can vary by studio version. Open the studio or email merhaba@grapxor.com for current formats.",
        },
        {
          q: "Does Grapxor run preflight?",
          a: "The studio is designed for print-oriented surfaces and dieline alignment. Final press preflight and material approval still happen with your production partner.",
        },
        {
          q: "Is Grapxor drawing pictures?",
          a: "No. Grapxor is a design engine that turns a brief into dieline + vector artwork — not an image-generation model.",
        },
        {
          q: "What does print-ready mean here?",
          a: "A paneled surface that matches cut/fold language and can move as vectors. There is no “guaranteed at every plant” or invented PDF/X claim.",
        },
      ],
            howto: {
        name: 'Steps to a print-oriented dieline',
        description: 'From dieline concept to export and preflight.',
        steps: [
        { name: 'Define the dieline need', text: 'Cut, crease, glue lines are production language.' },
        { name: 'Enter brief and sizes', text: 'Clarify form and mm values in studio.' },
        { name: 'Generate', text: 'Grapxor outputs a paneled vector surface.' },
        { name: 'Preflight and export', text: 'Pass checks, then take SVG/vector.' },
        { name: 'Printer approval', text: 'Final sign-off is with you/the printer.' },
      ],
      },
serviceName: "Print-ready dieline",
      serviceType: "PrintReadyDieline",
    },
    "label-vs-box": {
      slug: "label-vs-box",
      meta: {
        title: "Label vs box: how to choose",
        description:
          "Not sure label vs box? Compare both Grapxor modes and move from brief to dieline + vector with Grapxor — a design engine, not an image model.",
      },
      hero: {
        title: "Label or box?",
        lead: "Product form and the moment of sale drive the choice. Grapxor treats label and box as distinct modes — often used together in one brand system. Grapxor produces vectors from your brief, not image-gen art.",
      },
      sections: [
        {
          title: "Choose label if…",
          body: "If you are designing the primary face of a bottle, jar, or tube, start in label mode. See the label design page for legible hierarchy and print-oriented layout.",
        },
        {
          title: "Choose box if…",
          body: "If you need a folding carton, set, gift pack, or on-shelf box silhouette, think box mode and dieline. Box design and dieline pages cover the structural side.",
        },
        {
          title: "Often both",
          body: "In cosmetics and food, bottle labels and outer cartons share one language. The packaging design hub and category pages frame that combined need.",
        },
        {
          title: "Clarify in the studio",
          body: "Write form and goal via chat or brief; Grapxor produces dieline + vector artwork. The marketing site informs — work opens in the studio. Questions: merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/when-to-use-label-and-box-together", label: "Label and box together" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
        { href: "/en/bottle-wrap-label", label: "Bottle wrap label" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Is a label enough for a bottle, or do I also need a box?",
          a: "A label is often enough for the primary face of a bottle or jar. Add a carton (secondary pack) when you need an on-shelf box silhouette, a set, or a gift moment.",
        },
        {
          q: "Can I do both in the same studio session?",
          a: "You can name both needs in the brief; label and box are distinct studio modes that support one brand system. The flow is chat → brief → vector surface.",
        },
        {
          q: "Is a dieline only required for boxes?",
          a: "For folding cartons and similar structures, the dieline is central. Labels use a different cut/shape, but a print-oriented vector layout still matters.",
        },
        {
          q: "Does Grapxor pick label or box automatically?",
          a: "You clarify product form and goal in the brief. Grapxor is not an image model; it is a design engine that produces dieline + vector artwork from what you specify.",
        },
        {
          q: "Where should I go if I am still unsure?",
          a: "Use the criteria on this page, then open label design or box design. If it is still unclear, email merhaba@grapxor.com or continue in studio chat.",
        },
      ],
      serviceName: "Label vs box",
      serviceType: "LabelVsBox",
    },
    "private-label-food-box-brief": {
      slug: "private-label-food-box-brief",
      meta: {
        title: "Private-label food box brief",
        description:
          "Clarify size, panels, legal space, and brand kit in a private-label food box brief. Grapxor: brief → dieline + vector.",
      },
      hero: {
        title: "Private-label food box brief",
        lead: "Before print, capture product name, net quantity, SKU, dimensions, and panel reserves in the brief. Grapxor turns brief into dieline + vector art — a design engine, not an image model.",
      },
      sections: [
        {
          title: "Must-haves in the brief",
          body: "Without product name, net quantity, SKU, target shelf, and box dimensions (L/W/H or a dieline reference), artwork will not sit on panels. If unknown, note printer/die dimensions in the brief.",
        },
        {
          title: "Structure vs surface",
          body: "Dieline / carton style is structure; color, type, and logo are surface. Separate them in the brief. See dieline and print-ready dieline pages for structure.",
        },
        {
          title: "Legal-field panel reserve",
          body: "Reserve panels for mandatory info fields. Content accuracy is the brand’s and adviser’s responsibility; the studio helps with readable layout.",
        },
        {
          title: "Brand kit and Grapxor flow",
          body: "Attach logo, color, and type notes to the brief. Flow: chat → brief → dieline + vector artwork. The marketing site informs; production opens in the studio. Questions: merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/dieline", label: "Dieline" },
      ],
      faqs: [
        {
          q: "Are dimensions required in a private-label brief?",
          a: "Yes — without L/W/H or a dieline reference, artwork will not fit panels. If you do not know them yet, note printer/die size in the brief.",
        },
        {
          q: "Does Grapxor fill the brief for me?",
          a: "Chat helps clarify needs; legal copy and brand decisions stay yours. Output is dieline + vector surface.",
        },
        {
          q: "For private label, label or box?",
          a: "Depends on format. If unsure, see label vs box and the food hub; a common pattern is bottle label + outer carton.",
        },
      ],
      serviceName: "Private-label food box brief",
      serviceType: "PrivateLabelFoodBoxBrief",
    },
    "food-label-mandatory-info-fields": {
      slug: "food-label-mandatory-info-fields",
      meta: {
        title: "Mandatory food label info fields",
        description:
          "A designer checklist for typical mandatory food-label fields. Not legal advice; Grapxor helps with layout space.",
      },
      hero: {
        title: "Mandatory food label info fields",
        lead: "Frame which fields need space on the label surface in design language. This page is not legal advice — Grapxor produces panel layout and vector art; you own content accuracy.",
      },
      sections: [
        {
          title: "Design vs compliance",
          body: "This is a layout and readability checklist; current regulation is the brand’s and adviser’s responsibility. There is no “automatically compliant label” claim.",
        },
        {
          title: "Typical fields",
          body: "Product name, ingredients, net quantity, origin, storage, and manufacturer/importer often need space. Lists vary by sales country — verify locally.",
        },
        {
          title: "Readability and hierarchy",
          body: "On small labels, mandatory fields come first. If they do not fit, note moving content to a back panel, carton, or secondary label in the brief.",
        },
        {
          title: "Panel reserve and Grapxor",
          body: "Grapxor helps reserve space and produce print-oriented vector surfaces; you approve content. Open the studio or email merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/private-label-food-box-brief", label: "Private-label brief" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      ],
      faqs: [
        {
          q: "Does Grapxor auto-write legal copy?",
          a: "No. The studio helps reserve readable panel space; content accuracy stays with you and your adviser.",
        },
        {
          q: "What if everything does not fit a small label?",
          a: "Set hierarchy: mandatory fields first. Note moving overflow to a secondary face (back panel, carton, extra label) in the brief.",
        },
        {
          q: "Which country is this checklist for?",
          a: "It is a general design checklist; requirements vary by sales market. Verify local regulation separately.",
        },
      ],
      serviceName: "Mandatory food label info fields",
      serviceType: "FoodLabelMandatoryFields",
    },
    "snack-box-vs-pouch": {
      slug: "snack-box-vs-pouch",
      meta: {
        title: "Snack packaging: box or pouch?",
        description:
          "Decision criteria for snack box vs pouch: shelf, protection, brand feel. Grapxor: brief → vector surface.",
      },
      hero: {
        title: "Snack packaging: box or pouch?",
        lead: "Shelf stance, protection, filling line, and brand feel drive the format. Write the choice into the Grapxor brief; Grapxor produces structure + vector surface — not image-gen.",
      },
      sections: [
        {
          title: "Decision criteria",
          body: "Weigh shelf silhouette, barrier needs, line fit, and gift/set feel in one brief. There is no hard claim that “pouch is always cheaper.”",
        },
        {
          title: "Box options",
          body: "Folding cartons offer structure, dieline, and set/gift potential. Box design and dieline pages complete the structure side.",
        },
        {
          title: "Pouch / flexible and both",
          body: "Pouches can excel for surface area and barrier; inner pouch + outer carton is common. If unsure, see the label vs box guide.",
        },
        {
          title: "Write the format into the brief",
          body: "State format, size, and print method clearly. Grapxor advances each surface with dieline + vector logic. Studio CTA · merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/private-label-food-box-brief", label: "Private-label brief" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Which snack format looks more “premium”?",
          a: "It depends on shelf and brand language. Folding cartons often read as gift/set; pouches can be strong for fast consumption and barrier.",
        },
        {
          q: "Inner pouch + outer carton in one Grapxor project?",
          a: "Separate the two surfaces clearly in the brief. Grapxor proceeds per surface with dieline + vector logic; keep one brand system.",
        },
        {
          q: "Do pouches have a dieline too?",
          a: "Flexible packs may use a different die/template language. Put size and print method in the brief; see the print-ready hub.",
        },
      ],
      serviceName: "Snack box vs pouch",
      serviceType: "SnackBoxVsPouch",
    },
    "serum-box-size-brief": {
      slug: "serum-box-size-brief",
      meta: {
        title: "Serum box size brief",
        description:
          "Size brief for a serum carton that fits the bottle: tolerance, panels, dropper notes. Grapxor: dieline + vector.",
      },
      hero: {
        title: "Serum box size brief",
        lead: "Think bottle dimensions versus inner clearance with tolerance. On Grapxor, list panels in the brief; Grapxor produces dieline + vector — no invented “every serum is X mm” table.",
      },
      sections: [
        {
          title: "Bottle vs inner clearance",
          body: "Note height including cap, body diameter/width, and protrusions. Clearance tolerance is finalized with die and material; printer approval is a separate step.",
        },
        {
          title: "Panel list",
          body: "Enumerate front, back, side, and lid/tuck panels in the brief. Add a protection note for dropper or pump protrusion.",
        },
        {
          title: "Brief template",
          body: "Write volume (ml), rough size, brand language, and regulatory fields. Guessing structure without size is risky — update the dieline when the die is final.",
        },
        {
          title: "Dieline + surface in Grapxor",
          body: "Grapxor is a vector design engine. Bridge to cosmetic, box, and dieline pages. Studio · merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/dieline", label: "Dieline" },
      ],
      faqs: [
        {
          q: "How should I measure the bottle?",
          a: "Note height including cap, body diameter/width, and the most critical protrusion. Add a physical sample or tech drawing to the brief when possible.",
        },
        {
          q: "Can Grapxor make a box without dimensions?",
          a: "Guessing structure is risky. At least give target volume (ml) and rough size; update the dieline when the die is locked.",
        },
        {
          q: "Is a serum box the same as a perfume box?",
          a: "Structure can be similar; panel copy, regulation, and product silhouette differ. See the related cosmetic / perfume pages.",
        },
      ],
      serviceName: "Serum box size brief",
      serviceType: "SerumBoxSizeBrief",
    },
    "cream-jar-label": {
      slug: "cream-jar-label",
      meta: {
        title: "Cream jar label design",
        description:
          "Cream jar labels: curved surface, wrap/spot, INCI hierarchy. Grapxor produces print-oriented vector art.",
      },
      hero: {
        title: "Cream jar label design",
        lead: "Choose wrap or spot for jar geometry; place ingredients/INCI with hierarchy. Grapxor is not image-gen — it produces print-oriented vector surfaces.",
      },
      sections: [
        {
          title: "Wrap vs spot",
          body: "Add diameter, label height, and overlap notes to the brief. Validate with a physical mock or printer template before press.",
        },
        {
          title: "Ingredients / INCI hierarchy",
          body: "Balance benefit, variant, and legal copy on a small face. Content accuracy is the brand’s responsibility.",
        },
        {
          title: "Lid / base labels and outer carton",
          body: "Note lid-top or base-label scenarios in the brief. Ecommerce and gift sets often add an outer carton — see label vs box.",
        },
        {
          title: "Vector surface with Grapxor",
          body: "Keep one brand language with label design and the serum/cream hub. Studio · merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/label-vs-box", label: "Label vs box" },
      ],
      faqs: [
        {
          q: "How is jar curvature accounted for?",
          a: "Add diameter, label height, and overlap to the brief. Validate with a physical mock or printer template before print.",
        },
        {
          q: "Is a label enough, or do I need a box too?",
          a: "Depends on channel and brand language. Ecommerce and gift sets often add an outer carton — see the decision page.",
        },
        {
          q: "Does Grapxor produce a 3D jar?",
          a: "Focus is print-oriented vector surface and structure language; the marketing site informs, design happens in the studio.",
        },
      ],
      serviceName: "Cream jar label design",
      serviceType: "CreamJarLabel",
    },
    "skincare-set-box": {
      slug: "skincare-set-box",
      meta: {
        title: "Skincare set box design",
        description:
          "Skincare set boxes: multi-SKU, inserts, gift and unboxing. Grapxor: brief → dieline + artwork.",
      },
      hero: {
        title: "Skincare set box design",
        lead: "Gather multiple products on one brand surface. Write set contents, insert needs, and outer panel copy into the brief; Grapxor produces dieline + vector.",
      },
      sections: [
        {
          title: "Set contents and layout",
          body: "Clarify which SKUs sit in which order. Keep component labels and outer carton copy as separate brief lines.",
        },
        {
          title: "Insert vs plain carton",
          body: "Inserts are common for fragile bottles and unboxing. Note materials in the brief; final die is validated with the printer.",
        },
        {
          title: "Gift and ecommerce face",
          body: "The outer face can carry gift feel and opening experience. For ecommerce, think durability alongside the related spoke.",
        },
        {
          title: "Brief → Grapxor",
          body: "Bridge to the cosmetic hub, box design, and dieline pages. Studio · merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
      ],
      faqs: [
        {
          q: "Is each product label designed separately in a set box?",
          a: "Usually yes — primary pack labels and outer carton panels are separate brief lines. Keep one brand system.",
        },
        {
          q: "Is an insert required?",
          a: "Often preferred for fragile bottles and unboxing. Write insert need and material notes into the brief.",
        },
        {
          q: "Should a set box be ecommerce-ship ready?",
          a: "Depends on channel. If ecommerce-led, add durability and opening experience to the brief; see the ecommerce spoke.",
        },
      ],
      serviceName: "Skincare set box design",
      serviceType: "SkincareSetBox",
    },
    "ai-vs-design-agency-packaging": {
      slug: "ai-vs-design-agency-packaging",
      meta: {
        title: "AI packaging vs design agency",
        description:
          "When AI packaging vs a design agency? Grapxor vector engine vs image-gen; honest limits and hybrid use.",
      },
      hero: {
        title: "AI packaging or a design agency?",
        lead: "Compare on speed, dieline/structure, brand strategy, and revision. Grapxor does not claim to replace agencies; Grapxor produces print-oriented vector surfaces from a brief.",
      },
      sections: [
        {
          title: "Comparison axes",
          body: "Weigh speed, structure/dieline, brand strategy, and revision in one frame. There is no hard “always cheaper/faster” claim.",
        },
        {
          title: "Image-gen vs Grapxor",
          body: "Image-gen produces stylized pixels. Grapxor is not Midjourney/DALL·E; it is a vector design engine on packaging panels and dielines.",
        },
        {
          title: "Agency and Grapxor strengths",
          body: "Agencies excel at strategy, campaigns, and complex systems. Grapxor excels at brief → print-oriented surface in a studio engine. Hybrid use is common.",
        },
        {
          title: "Hybrid scenarios",
          body: "Agency sets brand language; Grapxor produces dieline + vector — or the reverse. Parent hub and myths spoke clarify the split. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/what-is-ai-packaging-design", label: "What is AI packaging?" },
        { href: "/en/how-grapxor-vector-engine-works", label: "How Grapxor works" },
        { href: "/en/ai-packaging-myths", label: "AI packaging myths" },
        { href: "/en/packaging-design", label: "Packaging design" },
        { href: "/en/how-it-works", label: "How it works" },
      ],
      faqs: [
        {
          q: "Does Grapxor replace an agency?",
          a: "No such claim. It is a studio engine from packaging brief to vector surface; broad brand strategy may still need an agency.",
        },
        {
          q: "Can I bring agency output into Grapxor?",
          a: "You can carry brand kit and sizes into the brief. The goal is print-oriented structure + surface.",
        },
        {
          q: "What do “AI packaging” searchers confuse?",
          a: "Often image generation with dieline/vector design. The parent hub and myths spoke clarify that split.",
        },
      ],
      serviceName: "AI vs design agency packaging",
      serviceType: "AiVsDesignAgencyPackaging",
    },
    "how-grapxor-vector-engine-works": {
      slug: "how-grapxor-vector-engine-works",
      meta: {
        title: "How the Grapxor vector engine works",
        description:
          "Grapxor vector engine: chat → brief → dieline + artwork. Not image-gen; Grapxor studio design engine.",
      },
      hero: {
        title: "How the Grapxor vector engine works",
        lead: "Grapxor is a packaging design engine that produces dieline + vector artwork from a brief — not an image model. The marketing site informs; the studio designs.",
      },
      sections: [
        {
          title: "Vector engine vs image model",
          body: "Image models produce stylized pixels. Grapxor produces print-oriented vectors in panel and dieline language.",
        },
        {
          title: "Flow: chat → brief → dieline + artwork",
          body: "Clarify needs via chat or brief; generation and revision continue in the studio. Aligned with the how-it-works page.",
        },
        {
          title: "What it produces / does not",
          body: "Produces: dieline-aware vector surfaces. Does not: random moodboard images, auto legal copy, or “instant print guarantee.”",
        },
        {
          title: "Next: preflight",
          body: "Use the print-ready dieline hub and preflight checklist before printer approval. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/what-is-ai-packaging-design", label: "What is AI packaging?" },
        { href: "/en/ai-vs-design-agency-packaging", label: "AI vs design agency" },
        { href: "/en/ai-packaging-myths", label: "AI packaging myths" },
        { href: "/en/how-it-works", label: "How it works" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      ],
      faqs: [
        {
          q: "Is Grapxor an image generator?",
          a: "No. It is a packaging design engine that produces dieline + vector artwork from a brief.",
        },
        {
          q: "Is chat required?",
          a: "Chat/brief clarifies needs; final decisions and legal copy stay with you.",
        },
        {
          q: "Can I send output to the printer immediately?",
          a: "The goal is print-oriented vector; printer preflight and material approval are separate — see the print-ready dieline hub.",
        },
      ],
            howto: {
        name: 'How to use the Grapxor vector engine',
        description: 'From chat/brief to vector artwork on a dieline.',
        steps: [
        { name: 'Clarify the brief', text: 'Product type, sizes, brand notes; chat helps.' },
        { name: 'Pick template/dieline', text: 'Structure panels in production language.' },
        { name: 'Run Grapxor', text: 'Final print surface is a vector engine—not a random image model.' },
        { name: 'Revise', text: 'Tighten copy and layout through iterations.' },
        { name: 'Export / continue in studio', text: 'Credits and packs live in the studio.' },
      ],
      },
serviceName: "How the Grapxor vector engine works",
      serviceType: "FormaVectorEngineExplainer",
    },
    "ai-packaging-myths": {
      slug: "ai-packaging-myths",
      meta: {
        title: "AI packaging myths",
        description:
          "AI packaging myths: pretty image ≠ print, dielines still matter, legal copy is not auto-correct. Grapxor sets realistic expectations.",
      },
      hero: {
        title: "AI packaging myths",
        lead: "Separate common misconceptions with short “reality” answers. Grapxor positions itself as a vector design engine — marketing explains, the studio produces.",
      },
      sections: [
        {
          title: "Myth: AI = pretty random image → press",
          body: "Reality: Image-model output differs from dieline + vector surface. Preflight before print is required.",
        },
        {
          title: "Myth: You no longer need a dieline",
          body: "Reality: Without cut/fold language, panel production is risky. See dieline and print-ready hubs.",
        },
        {
          title: "Myth: Legal copy comes out auto-correct",
          body: "Reality: Content accuracy is brand and adviser responsibility. The studio reserves space; you approve copy.",
        },
        {
          title: "Myth: Agencies / designers disappear",
          body: "Reality: Broad strategy and campaigns may still need an agency. Grapxor focuses on packaging brief → vector surface. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/what-is-ai-packaging-design", label: "What is AI packaging?" },
        { href: "/en/how-grapxor-vector-engine-works", label: "How Grapxor works" },
        { href: "/en/ai-vs-design-agency-packaging", label: "AI vs design agency" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
        { href: "/en/faq", label: "FAQ" },
      ],
      faqs: [
        {
          q: "Is every AI-made pack print-ready?",
          a: "No. Image-model output differs from dieline + vector surface. Preflight is required before print.",
        },
        {
          q: "How does Grapxor handle these myths?",
          a: "It positions Grapxor as a vector design engine; the marketing site explains, the studio produces.",
        },
        {
          q: "What should I do after reading the myths?",
          a: "Read the parent hub and the “how Grapxor works” spoke, then try a brief in the studio.",
        },
      ],
      serviceName: "AI packaging myths",
      serviceType: "AiPackagingMyths",
    },
    "how-to-send-svg-dieline-to-printer": {
      slug: "how-to-send-svg-dieline-to-printer",
      meta: {
        title: "How to send an SVG dieline to printer",
        description:
          "SVG dieline handoff notes: package contents, layers/stroke/mm, printer questions. No universal format guarantee.",
      },
      hero: {
        title: "How to send an SVG dieline to your printer",
        lead: "An export and communication checklist — no claim that “SVG just works everywhere.” Grapxor produces print-oriented vector/dieline; you send files and run preflight.",
      },
      sections: [
        {
          title: "SVG and other formats",
          body: "SVG is a scalable vector source; many printers prefer PDF. Keep the source and convert to their requested export.",
        },
        {
          title: "What belongs in the handoff pack?",
          body: "Dieline, artwork, unit (mm), cut/crease separation, and material notes. SVG alone is usually not enough.",
        },
        {
          title: "Layers / stroke / units",
          body: "Do not mix cut with graphics; check strokes and mm units. See the preflight checklist spoke.",
        },
        {
          title: "Five printer questions and next step",
          body: "Ask preferred format, color profile, bleed, material, and proof process. After Grapxor output, you send the files. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
        { href: "/en/reading-a-tuck-end-dieline", label: "Reading a tuck-end dieline" },
        { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Is SVG alone enough?",
          a: "Usually no. Artwork, units, cut/crease separation, and material notes are also needed; ask the printer’s preferred format.",
        },
        {
          q: "Does Grapxor upload to the printer account?",
          a: "No. The studio produces print-oriented vector/dieline; you send files and run preflight.",
        },
        {
          q: "What if they want PDF?",
          a: "Many printers prefer PDF. Keep SVG as source/vector and convert to their requested export.",
        },
      ],
            howto: {
        name: 'Prepare an SVG dieline for your printer',
        description: 'Check Grapxor output before sending to print. Final printer approval is yours and the printer’s.',
        steps: [
        { name: 'Lock size and structure', text: 'Put box type and mm sizes in the brief so panels fit the dieline.' },
        { name: 'Generate in studio', text: 'Grapxor builds a vector surface with dieline logic—not an image model.' },
        { name: 'Read preflight', text: 'Fix warnings; bad panels/sizes cost money.' },
        { name: 'Export SVG/vector', text: 'Package the file the way your printer asks.' },
        { name: 'Confirm with the printer', text: 'Cut, crease, stock, and color profile are signed off there.' },
      ],
      },
serviceName: "How to send an SVG dieline to printer",
      serviceType: "SvgDielineToPrinter",
    },
    "reading-a-tuck-end-dieline": {
      slug: "reading-a-tuck-end-dieline",
      meta: {
        title: "How to read a tuck-end dieline",
        description:
          "Tuck-end dielines: cut, crease, bleed, and panels. Educational guide; no universal line-color standard.",
      },
      hero: {
        title: "How to read a tuck-end dieline",
        lead: "Learn folding-carton dieline language: cut, crease, bleed, and front/back/side/flap panels. Printers may code lines differently — no single universal standard claimed.",
      },
      sections: [
        {
          title: "What is tuck-end?",
          body: "A common folding carton with tucks at the ends. Basic flap logic is similar; size and glue details vary by die.",
        },
        {
          title: "Cut, crease, bleed",
          body: "Cut is the outer edge, crease is the fold, bleed is overflow. Artwork sits on printable panel faces — do not mix it with structural lines.",
        },
        {
          title: "Panels and glue",
          body: "Recognize front / back / side / flap panels. Grain and glue flap are high-level brief notes.",
        },
        {
          title: "Specify tuck-end in the brief (Grapxor)",
          body: "Name the carton style in the brief; the engine works with dieline + vector surface logic. Final die is validated with the printer. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
        { href: "/en/how-to-send-svg-dieline-to-printer", label: "Send SVG to printer" },
        { href: "/en/packaging-preflight-checklist", label: "Preflight checklist" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Does tuck-end look the same on every box?",
          a: "Basic flap logic is similar; size, grain, and glue details vary by die.",
        },
        {
          q: "Where does copy sit on a dieline?",
          a: "Artwork sits on printable panel faces; do not confuse it with cut lines and bleed. See the preflight checklist.",
        },
        {
          q: "Does Grapxor produce tuck-end?",
          a: "You specify carton style in the brief; the engine works with dieline + vector surface logic. Final die is validated with the printer.",
        },
      ],
            howto: {
        name: 'How to read a tuck-end dieline',
        description: 'Identify front, sides, and flaps on a tuck-end box dieline.',
        steps: [
        { name: 'Know the structure', text: 'Front/back L×H, sides W×H, flaps L×W.' },
        { name: 'Find the front panel', text: 'Primary brand/product face.' },
        { name: 'Separate sides/spine', text: 'Depth panels often carry variant info.' },
        { name: 'Check flaps and locks', text: 'Tuck flaps and consistency lines.' },
        { name: 'Apply in studio', text: 'Pick a tuck-end template and generate vector art.' },
      ],
      },
serviceName: "Reading a tuck-end dieline",
      serviceType: "TuckEndDielineReading",
    },
    "packaging-preflight-checklist": {
      slug: "packaging-preflight-checklist",
      meta: {
        title: "Packaging preflight checklist",
        description:
          "Packaging preflight before print: size, bleed, fonts, color questions. Printer approval required; no 100% guarantee.",
      },
      hero: {
        title: "Packaging preflight checklist",
        lead: "Scan structure and artwork checks to avoid costly errors. A checklist is a start; printer approval is required. Grapxor aims at sound structure/surface — no “auto-pass preflight” claim.",
      },
      sections: [
        {
          title: "Why preflight?",
          body: "Wrong size, bleed, or fonts get expensive on press. This list is a start; printer standards vary.",
        },
        {
          title: "Structure checks",
          body: "Check size, dieline match, and bleed. Bridge to dieline and SVG handoff spokes.",
        },
        {
          title: "Artwork and color",
          body: "Review fonts, overprint notes, and raster resolution if any. Ask the printer for profile/spot — no universal profile promise.",
        },
        {
          title: "Your steps after Grapxor",
          body: "After studio output: checklist + printer preflight. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
        { href: "/en/how-to-send-svg-dieline-to-printer", label: "Send SVG to printer" },
        { href: "/en/reading-a-tuck-end-dieline", label: "Reading a tuck-end dieline" },
        { href: "/en/dieline", label: "Dieline" },
        { href: "/en/packaging-design", label: "Packaging design" },
      ],
      faqs: [
        {
          q: "Who runs preflight?",
          a: "You + the printer. Grapxor produces print-oriented vector/dieline; final preflight follows printer standards.",
        },
        {
          q: "Does the checklist include color profile?",
          a: "Yes, as a question: ask the printer’s required profile/spot. There is no single universal profile promise.",
        },
        {
          q: "Does Grapxor auto-pass preflight?",
          a: "No such claim. Goal is sound structure and surface; you validate with checklist and printer.",
        },
      ],
            howto: {
        name: 'Packaging preflight checklist',
        description: 'Dieline and artwork checks before print. Honest gates—not fake guarantees.',
        steps: [
        { name: 'Verify dimensions', text: 'Do L/W/H or dieline refs match the brief?' },
        { name: 'Check panel copy', text: 'Brand, product, mandatory fields on the right panels?' },
        { name: 'Review cut and crease', text: 'Is the dieline clear in production language?' },
        { name: 'Barcode/logo honesty', text: 'Barcodes only from your data—never invented.' },
        { name: 'Final pass before export', text: 'Open the SVG/vector and visually check.' },
      ],
      },
serviceName: "Packaging preflight checklist",
      serviceType: "PackagingPreflightChecklist",
    },
    "when-to-use-label-and-box-together": {
      slug: "when-to-use-label-and-box-together",
      meta: {
        title: "When to use label and box together",
        description:
          "When to use label and box together: bottle+carton, sets, gifts. Parallel surfaces with Grapxor.",
      },
      hero: {
        title: "When to use label and box together",
        lead: "Run primary (product) and secondary (carton) faces in one brand language with different information density. Both are not required on every SKU — decide by scenario.",
      },
      sections: [
        {
          title: "Typical scenarios",
          body: "Bottle + outer carton, jar + set, gift, and ecommerce unboxing are common combinations.",
        },
        {
          title: "Role split",
          body: "The label is the primary product face; the carton is secondary protection and shelf/gift face. Distribute information density accordingly.",
        },
        {
          title: "Brand system",
          body: "Same language, different panels. Write both surfaces as separate brief lines; see label and box pages.",
        },
        {
          title: "Parallel surfaces with Grapxor",
          body: "Grapxor advances each surface with dieline/vector logic. Start from the parent decision hub. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
        { href: "/en/bottle-wrap-label", label: "Bottle wrap label" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Can I start with a label and add a box later?",
          a: "Yes. Keep brand language consistent from the start; redistribute panel copy when the carton is added.",
        },
        {
          q: "Does using both double the cost?",
          a: "No fixed figure; it means two production items. See pricing and get a printer quote.",
        },
        {
          q: "Can Grapxor produce both in one brand system?",
          a: "Separate each surface in the brief. Grapxor proceeds per surface with dieline/vector logic.",
        },
      ],
      serviceName: "When to use label and box together",
      serviceType: "LabelAndBoxTogether",
    },
    "ecommerce-box-design": {
      slug: "ecommerce-box-design",
      meta: {
        title: "Ecommerce box design",
        description:
          "Ecommerce boxes: unboxing, protection, shelf vs ship. Grapxor: brief → dieline + vector; no ship testing claim.",
      },
      hero: {
        title: "Ecommerce box design",
        lead: "For DTC / online sales, think unboxing and protection together. Grapxor produces structure + vector; drop/ship tests stay with you / logistics — no “zero damage” claim.",
      },
      sections: [
        {
          title: "Shelf carton vs ship carton",
          body: "On-shelf silhouette and ship durability can carry different priorities; they need not be identical.",
        },
        {
          title: "Unboxing panels",
          body: "Plan first impression, inserts, and stickers in the brief. For brand experience, consider a custom carton or sleeve.",
        },
        {
          title: "Protection and primary pack",
          body: "Note voids and fragile-product needs. Clarify label vs outer carton via the decision hub.",
        },
        {
          title: "Brief → Grapxor",
          body: "Bridge to box design, dieline, and print-ready pages. Studio · merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/when-to-use-label-and-box-together", label: "Label and box together" },
        { href: "/en/bottle-wrap-label", label: "Bottle wrap label" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
      ],
      faqs: [
        {
          q: "Should ecommerce and shelf cartons be the same?",
          a: "They can be, but not required. Ship durability and unboxing may prioritize differently than shelf.",
        },
        {
          q: "Is a label on a shipper enough?",
          a: "For some SKUs, yes. For brand experience, consider a custom carton or sleeve — see the decision hub.",
        },
        {
          q: "Does Grapxor run ship tests?",
          a: "No. The design engine produces structure + vector; drop/ship tests stay with you / logistics partners.",
        },
      ],
      serviceName: "Ecommerce box design",
      serviceType: "EcommerceBoxDesign",
    },
    "bottle-wrap-label": {
      slug: "bottle-wrap-label",
      meta: {
        title: "Bottle wrap label design",
        description:
          "Bottle wrap labels: size, overlap, seam, and layout. Grapxor print-oriented vector; no material guarantee.",
      },
      hero: {
        title: "Bottle wrap label design",
        lead: "Know wrap vs front/back; derive open label size and overlap from diameter × height. Grapxor produces print-oriented vector — no “auto wrap for every bottle” claim.",
      },
      sections: [
        {
          title: "Wrap vs front/back",
          body: "A 360° wrap is one surface; front/back is a two-panel system. State which you want in the brief.",
        },
        {
          title: "Size and overlap",
          body: "Diameter × height → open label size + overlap. Write target overlap in the brief; validate with printer/application line.",
        },
        {
          title: "Seam and legal fields",
          body: "Avoid critical logos or barcodes in the seam/overlap zone. Plan legal/ingredient fields and reading direction; content accuracy is yours.",
        },
        {
          title: "Wrap + outer carton",
          body: "If information does not fit, use a second label or carton panels — see the “both together” spoke. merhaba@grapxor.com.",
        },
      ],
      related: [
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/when-to-use-label-and-box-together", label: "Label and box together" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
      ],
      faqs: [
        {
          q: "How much overlap should a wrap label have?",
          a: "It depends on material and application. Write target overlap in the brief; validate with printer/application line.",
        },
        {
          q: "What if wrap cannot fit enough information?",
          a: "Use type hierarchy, a second label, or outer carton panels — see the “both together” spoke.",
        },
        {
          q: "Does Grapxor give a 360° bottle mock?",
          a: "Focus is print-oriented vector surface. The marketing site informs; production is in studio, physical validation with the printer.",
        },
      ],
      serviceName: "Bottle wrap label design",
      serviceType: "BottleWrapLabel",
    },
  },
  howItWorks: {
    meta: {
      title: "How the Grapxor studio works",
      description:
        "Grapxor studio workflow: brief, generation, revision, and credits — step by step.",
    },
    title: "How it works",
    lead: "The Grapxor marketing site informs; real design work happens in the studio. The flow below summarizes a typical session.",
    steps: [
      {
        n: "01",
        title: "Clarify the brief",
        text: "Capture product type, dimensions, brand notes, and constraints — by writing or chatting. The engine only generates from a structured brief.",
      },
      {
        n: "02",
        title: "Engine generation",
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
      title: "Packaging and label design examples",
      description:
        "Illustrative Grapxor packaging and label scenarios. Real projects are made in the studio — not an image-generation model.",
    },
    title: "Examples",
    lead: "These are illustrative scenarios — not real client work. Each card links to a related hub or spoke; production happens in the studio from your brief.",
    badge: "Sample",
    items: [
      {
        title: "Serum box — matte face",
        category: "Cosmetics",
        text: "Single-SKU tuck-end carton; product name and volume on the front, calm typography. Grapxor outputs vector surfaces.",
        href: "/en/serum-cream-box-design",
      },
      {
        title: "Olive oil bottle label",
        category: "Food / label",
        text: "Vertical label with zones for origin and volume, limited palette. Food legibility first.",
        href: "/en/food-packaging-design",
      },
      {
        title: "Niche perfume outer carton",
        category: "Perfume",
        text: "Minimal brand lockup, side-panel notes, balanced space for gift shelves. Structure + face together.",
        href: "/en/perfume-box-design",
      },
      {
        title: "Accessory ecommerce box",
        category: "Ecommerce",
        text: "Compact ship-friendly carton; single-color print scenario, clear brand panel.",
        href: "/en/ecommerce-box-design",
      },
      {
        title: "Private-label snack carton",
        category: "Food",
        text: "PL-focused carton brief: product name, net-quantity zone, calm hierarchy.",
        href: "/en/private-label-food-box-brief",
      },
      {
        title: "Cream jar wrap label",
        category: "Cosmetics / label",
        text: "Around-the-jar wrap; INCI/list and brand block in separate zones.",
        href: "/en/cream-jar-label",
      },
      {
        title: "Bottle wrap label — one color",
        category: "Label",
        text: "Cylindrical wrap with glue overlap and reading direction considered.",
        href: "/en/bottle-wrap-label",
      },
      {
        title: "Skincare set box",
        category: "Cosmetics",
        text: "Two-product set carton; inner layout and outer brand face on clear panels.",
        href: "/en/skincare-set-box",
      },
    ],
  },

  pricing: {
    meta: {
      title: "Grapxor credit packs and pricing",
      description:
        "Grapxor credit packs: 50, 150, and 400 credits. Purchase completes via studio billing.",
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
      title: "Grapxor FAQ: studio, credits, dielines",
      description:
        "FAQ on Grapxor, credits, dielines, and studio use.",
    },
    title: "Frequently asked questions",
    lead: "Short answers on Grapxor, the studio, and credits.",
    items: [
      {
        q: "What is Grapxor?",
        a: "Grapxor is one product: a packaging design studio and design engine under a single name. This marketing site informs; production happens in the studio.",
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
      title: "Contact Grapxor studio",
      description: "Get in touch with Grapxor. Email form for support and partnerships.",
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
        title: "Grapxor privacy policy",
        description: "Grapxor privacy policy summary.",
      },
      title: "Privacy policy",
      updated: "Last updated: September 2026",
      sections: [
        {
          title: "Scope",
          body: "This is a short summary for the Grapxor marketing site. studio accounts and payments may be covered by separate privacy notices.",
        },
        {
          title: "Data we collect",
          body: "If you send a contact email, your name, email, and message are transmitted by email. If analytics are added later, the cookie notice will be updated.",
        },
        {
          title: "Contact",
          body: "For privacy requests, email merhaba@grapxor.com.",
        },
      ],
    },
    terms: {
      meta: {
        title: "Grapxor terms of use",
        description: "Grapxor site terms of use summary.",
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
    faqTitle: "Frequently asked questions",
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
