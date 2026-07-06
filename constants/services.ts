import type { Locale } from "@/src/i18n/routing";

export interface ServiceItem {
  key: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  points: Record<Locale, string[]>;
  theme: string;
}

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
      en: "Full-stack web applications with Next.js, TypeScript, and Tailwind — from a clean landing page to a complete product with auth, database, and API.",
      de: "Full-Stack-Webanwendungen mit Next.js, TypeScript und Tailwind — von der sauberen Landingpage bis zum kompletten Produkt mit Auth, Datenbank und API.",
    },
    points: {
      en: [
        "Next.js (App Router), React, TypeScript",
        "PostgreSQL + Prisma, NextAuth",
        "Deployment and CI on Vercel",
      ],
      de: [
        "Next.js (App Router), React, TypeScript",
        "PostgreSQL + Prisma, NextAuth",
        "Deployment und CI auf Vercel",
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
      en: "Online shops that actually sell: product catalogs, carts, checkout, and payment integration — built custom or on top of an existing platform.",
      de: "Onlineshops, die wirklich verkaufen: Produktkatalog, Warenkorb, Checkout und Payment-Integration — individuell gebaut oder auf einer bestehenden Plattform.",
    },
    points: {
      en: [
        "Stripe / PayPal payment flows",
        "Multi-language storefronts",
        "Order, inventory, and email workflows",
      ],
      de: [
        "Stripe- / PayPal-Zahlungsstrecken",
        "Mehrsprachige Storefronts",
        "Bestell-, Lager- und E-Mail-Workflows",
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
        "Claude / OpenAI API integration",
        "RAG, summarization, and extraction pipelines",
        "Self-hosted and privacy-friendly setups",
      ],
      de: [
        "Claude- / OpenAI-API-Integration",
        "RAG-, Zusammenfassungs- und Extraktions-Pipelines",
        "Self-hosted und datenschutzfreundliche Setups",
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
      en: "Websites need a home and someone who answers the phone. I handle hosting, domains, WordPress maintenance, performance, and security updates — so you don't have to.",
      de: "Websites brauchen ein Zuhause und jemanden, der rangeht. Ich kümmere mich um Hosting, Domains, WordPress-Wartung, Performance und Sicherheitsupdates — damit du es nicht musst.",
    },
    points: {
      en: [
        "Hosting setup and migrations",
        "WordPress fixes, plugins, themes",
        "Performance and security hardening",
      ],
      de: [
        "Hosting-Setup und Umzüge",
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
