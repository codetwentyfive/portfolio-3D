import type { Locale } from "@/src/i18n/routing";

export interface ServiceItem {
  key: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  points: Record<Locale, string[]>;
  theme: string;
}

export interface ProcessStep {
  key: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const serviceProcess: ProcessStep[] = [
  {
    key: "intro",
    title: {
      en: "Intro call",
      de: "Kennenlernen",
    },
    description: {
      en: "A short, free first conversation: what do you need, what already exists, what is the goal?",
      de: "Ein kurzes, kostenloses Erstgespräch: Was brauchst du, was gibt es schon, was ist das Ziel?",
    },
  },
  {
    key: "proposal",
    title: {
      en: "Proposal",
      de: "Angebot",
    },
    description: {
      en: "Clear scope with a fixed price or day rate. No surprises on the invoice.",
      de: "Klarer Umfang mit Festpreis oder Tagessatz. Keine Überraschungen auf der Rechnung.",
    },
  },
  {
    key: "build",
    title: {
      en: "Build",
      de: "Umsetzung",
    },
    description: {
      en: "Short feedback loops with live previews you can click through while I work.",
      de: "Kurze Feedback-Schleifen mit Live-Vorschauen, die du schon während der Umsetzung anklicken kannst.",
    },
  },
  {
    key: "care",
    title: {
      en: "After launch",
      de: "Nach dem Launch",
    },
    description: {
      en: "I stay reachable: maintenance, updates, and new features when you need them.",
      de: "Ich bleibe erreichbar: Wartung, Updates und neue Features, wenn du sie brauchst.",
    },
  },
];

// Follows the existing constants pattern: per-locale objects, resolved in the page.
export const services: ServiceItem[] = [
  {
    key: "web-apps",
    theme: "btn-back-blue",
    title: {
      en: "Web App Development",
      de: "Web-App-Entwicklung",
    },
    description: {
      en: "Full-stack web applications, from a clean landing page to a complete product with auth, database, and API. I pick the stack that fits your project, not the other way around.",
      de: "Full-Stack-Webanwendungen, von der sauberen Landingpage bis zum kompletten Produkt mit Auth, Datenbank und API. Ich wähle den Stack, der zu deinem Projekt passt — nicht umgekehrt.",
    },
    points: {
      en: [
        "Frontend: React, Next.js, TypeScript, and whatever your codebase already uses",
        "Backend & data: Node.js, PHP, REST/GraphQL APIs, PostgreSQL, MySQL, MongoDB",
        "Auth, testing, CI/CD — production-grade from day one",
      ],
      de: [
        "Frontend: React, Next.js, TypeScript und was deine Codebasis schon nutzt",
        "Backend & Daten: Node.js, PHP, REST-/GraphQL-APIs, PostgreSQL, MySQL, MongoDB",
        "Auth, Testing, CI/CD — von Anfang an produktionsreif",
      ],
    },
  },
  {
    key: "ecommerce",
    theme: "btn-back-green",
    title: {
      en: "E-Commerce & Payments",
      de: "E-Commerce & Payments",
    },
    description: {
      en: "Online shops that actually sell: product catalog, cart, checkout, payments, and the data flows behind them — on WooCommerce or built custom.",
      de: "Onlineshops, die wirklich verkaufen: Produktkatalog, Warenkorb, Checkout, Payments und die Datenflüsse dahinter — auf WooCommerce oder individuell gebaut.",
    },
    points: {
      en: [
        "Payment integration: Stripe, PayPal & Novalnet",
        "WooCommerce and custom multi-language storefronts",
        "Customer data pipelines & CRM integrations",
        "Product and sales data: imports, exports, reporting",
      ],
      de: [
        "Payment-Integration: Stripe, PayPal & Novalnet",
        "WooCommerce und individuelle mehrsprachige Storefronts",
        "Kundendaten-Pipelines & CRM-Anbindungen",
        "Produkt- und Verkaufsdaten: Importe, Exporte, Reporting",
      ],
    },
  },
  {
    key: "legacy",
    theme: "btn-back-orange",
    title: {
      en: "Legacy Modernization",
      de: "Legacy-Modernisierung",
    },
    description: {
      en: "I take over codebases nobody wants to touch: audit, stabilize, migrate. Old jQuery, PHP, or aging SPAs become maintainable, modern stacks — step by step, without a risky big bang.",
      de: "Ich übernehme Codebasen, die niemand mehr anfassen will: analysieren, stabilisieren, migrieren. Altes jQuery, PHP oder alternde SPAs werden Schritt für Schritt zu wartbaren, modernen Stacks — ohne riskanten Big Bang.",
    },
    points: {
      en: [
        "Code audits and refactoring plans",
        "Framework migrations (e.g. SPA → Next.js)",
        "Test coverage where none existed",
      ],
      de: [
        "Code-Audits und Refactoring-Pläne",
        "Framework-Migrationen (z. B. SPA → Next.js)",
        "Testabdeckung, wo vorher keine war",
      ],
    },
  },
  {
    key: "ai",
    theme: "btn-back-pink",
    title: {
      en: "AI Integration & Workflows",
      de: "AI-Integration & Workflows",
    },
    description: {
      en: "Practical AI where it saves real time: LLM features in your product, automated content pipelines, internal assistants, and agent workflows — with a clear eye on cost and data privacy.",
      de: "Praktische AI dort, wo sie wirklich Zeit spart: LLM-Features im Produkt, automatisierte Content-Pipelines, interne Assistenten und Agent-Workflows — mit klarem Blick auf Kosten und Datenschutz.",
    },
    points: {
      en: [
        "Model-agnostic: Claude, OpenAI, Gemini, or self-hosted open-source models",
        "RAG, summarization, and extraction pipelines",
        "Agent workflows and automation, privacy-friendly by design",
      ],
      de: [
        "Modell-agnostisch: Claude, OpenAI, Gemini oder self-hosted Open-Source-Modelle",
        "RAG-, Zusammenfassungs- und Extraktions-Pipelines",
        "Agent-Workflows und Automatisierung, datenschutzfreundlich gedacht",
      ],
    },
  },
  {
    key: "hosting",
    theme: "btn-back-yellow",
    title: {
      en: "Hosting, WordPress & Care",
      de: "Hosting, WordPress & Betreuung",
    },
    description: {
      en: "Websites need a home and someone who answers the phone. I handle hosting, domains, WordPress maintenance, performance, and security updates — on your infrastructure or mine.",
      de: "Websites brauchen ein Zuhause und jemanden, der rangeht. Ich kümmere mich um Hosting, Domains, WordPress-Wartung, Performance und Sicherheitsupdates — auf deiner Infrastruktur oder meiner.",
    },
    points: {
      en: [
        "Setup & migrations: Hetzner, Cloudways, Vercel, Docker, classic web hosting",
        "WordPress fixes, plugins, themes",
        "Performance and security hardening",
      ],
      de: [
        "Setup & Umzüge: Hetzner, Cloudways, Vercel, Docker, klassisches Webhosting",
        "WordPress-Fixes, Plugins, Themes",
        "Performance- und Security-Härtung",
      ],
    },
  },
  {
    key: "3d",
    theme: "btn-back-black",
    title: {
      en: "3D & Interactive Experiences",
      de: "3D & interaktive Erlebnisse",
    },
    description: {
      en: "Websites that people remember: interactive 3D scenes, animations, and playful interfaces with Three.js and React Three Fiber — like the island on this site.",
      de: "Websites, die im Kopf bleiben: interaktive 3D-Szenen, Animationen und verspielte Interfaces mit Three.js und React Three Fiber — wie die Insel auf dieser Seite.",
    },
    points: {
      en: [
        "Three.js / React Three Fiber scenes",
        "Optimized 3D assets for the web",
        "Motion design and micro-interactions",
      ],
      de: [
        "Three.js- / React-Three-Fiber-Szenen",
        "Optimierte 3D-Assets fürs Web",
        "Motion Design und Mikro-Interaktionen",
      ],
    },
  },
];
