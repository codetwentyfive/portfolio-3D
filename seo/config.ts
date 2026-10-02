const SITE_URL = "https://www.chingis.dev";
// Shared with chingis.shop: the person's identity is stable across canonical-host changes.
export const PERSON_ID = "https://chingis.dev/#person";
const SITE_NAME = "Chingis Zwecker E.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export type SeoLocale = "en" | "de";

export interface PageMeta {
  title: string;
  description: string;
}

/** Page entry: route path plus locale-keyed metadata directly on the object. */
export type PageSeo = { path: string; image?: string } & Record<SeoLocale, PageMeta>;

export type SeoPageKey =
  | "denkpause"
  | "home"
  | "about"
  | "projects"
  | "blog"
  | "services"
  | "contact"
  | "legal"
  | "impressum"
  | "privacy";

export interface SeoConfig {
  siteUrl: string;
  siteName: string;
  ogImage: string;
  pages: Record<SeoPageKey, PageSeo>;
}

export const seoConfig: SeoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  ogImage: OG_IMAGE,

  pages: {
    denkpause: {
      path: "/projects/denkpause",
      image: "/images/worlds/denkpause-v4.webp",
      en: {title: "denk.pause — Architecture, AI Integration & Product Delivery", description: "Ongoing development of denk.pause, a web and iOS app for teachers. External development and consulting on architecture, app structure and AI integration."},
      de: {title: "denk.pause — Architektur, KI-Integration & Produktentwicklung", description: "denk.pause: eine Web- und iOS-App für Lehrkräfte in laufender Entwicklung. Externe Entwicklung und Beratung zu Architektur, App-Struktur und KI-Integration."},
    },
    home: {
      path: "/",
      en: { title: "Chingis Zwecker E. | Senior Product Engineer", description: "Senior Product Engineer building AI-enabled applications from architecture and data integration through production delivery. Explore denk.pause and my approach to product engineering." },
      de: { title: "Chingis Zwecker E. | Senior Product Engineer", description: "Senior Product Engineer für KI-gestützte Anwendungen – von Architektur und Datenintegration bis zur Produktion. denk.pause und meine Arbeit im Product Engineering." },
    },
    about: {
      path: "/about",
      en: {
        title: "About | Chingis Zwecker E. — What I Bring to the Table",
        description:
          "Developer who ships across domains — modern frontends, robust backends, legacy rescue, infrastructure, AI integration, and project management. The kind of person you call when it needs to work, not just look good on a whiteboard.",
      },
      de: {
        title: "Über mich | Chingis Zwecker E. — Was ich mitbringe",
        description:
          "Entwickler, der über Domänen hinweg liefert — moderne Frontends, robuste Backends, Legacy-Rettung, Infrastruktur, KI-Integration und Projektmanagement. Der, den man ruft, wenn es funktionieren soll — nicht nur auf dem Whiteboard gut aussehen.",
      },
    },
    projects: {
      path: "/projects",
      en: {
        title: "Projects | Chingis Zwecker E. — Real Work, Real Results",
        description:
          "E-commerce platforms, company websites, interactive 3D experiences, AI agent systems, and more. Each project solves a real problem — from first concept to production deploy.",
      },
      de: {
        title: "Projekte | Chingis Zwecker E. — Echte Arbeit, echte Ergebnisse",
        description:
          "E-Commerce-Plattformen, Firmenwebsites, interaktive 3D-Erlebnisse, KI-Agentensysteme und mehr. Jedes Projekt löst ein echtes Problem — vom ersten Konzept bis zum Produktiv-Deploy.",
      },
    },
    blog: {
      path: "/blog",
      en: {
        title: "Blog | Chingis Zwecker E.",
        description: "Articles on web development, AI workflows, e-commerce, and modernizing legacy systems.",
      },
      de: {
        title: "Blog | Chingis Zwecker E.",
        description: "Artikel über Webentwicklung, AI-Workflows, E-Commerce und die Modernisierung von Legacy-Systemen.",
      },
    },
    services: {
      path: "/services",
      en: {
        title: "Services | Chingis Zwecker E.",
        description: "Freelance software engineering in Karlsruhe: web apps with Next.js, e-commerce and payments, legacy modernization, AI integration, hosting, and interactive 3D experiences.",
      },
      de: {
        title: "Leistungen | Chingis Zwecker E.",
        description: "Freelance-Softwareentwicklung in Karlsruhe: Web-Apps mit Next.js, E-Commerce und Payments, Legacy-Modernisierung, AI-Integration, Hosting und interaktive 3D-Erlebnisse.",
      },
    },
    contact: {
      path: "/contact",
      en: {
        title: "Contact | Chingis Zwecker E. — Let's Talk About Your Project",
        description:
          "Have a project in mind? I'm taking on new clients for freelance and consulting — web development, legacy modernization, AI strategy, and IT architecture. Based in Karlsruhe, working remotely worldwide.",
      },
      de: {
        title: "Kontakt | Chingis Zwecker E. — Sprechen wir über Ihr Projekt",
        description:
          "Ein Projekt im Kopf? Ich nehme neue Kunden für Freelance und Beratung an — Webentwicklung, Legacy-Modernisierung, KI-Strategie und IT-Architektur. Aus Karlsruhe, weltweit remote verfügbar.",
      },
    },
    legal: {
      path: "/rechtliches",
      en: {
        title: "Legal | Chingis B. Zwecker E.",
        description:
          "Combined legal notice and privacy policy for the professional portfolio website of Chingis Zwecker E.",
      },
      de: {
        title: "Rechtliches | Chingis B. Zwecker E.",
        description:
          "Gebündelte Seite für Impressum und Datenschutzerklärung der Portfolio-Website von Chingis Zwecker E.",
      },
    },
    impressum: {
      path: "/impressum",
      en: {
        title: "Impressum | Chingis B. Zwecker E. - Legal Notice",
        description:
          "Legal notice and provider identification for the professional portfolio website of Chingis Zwecker E. under German disclosure requirements.",
      },
      de: {
        title: "Impressum | Chingis B. Zwecker E. - Anbieterkennzeichnung",
        description:
          "Impressum und Anbieterkennzeichnung für die beruflich ausgerichtete Portfolio-Website von Chingis Zwecker E. nach deutschen Informationspflichten.",
      },
    },
    privacy: {
      path: "/datenschutz",
      en: {
        title: "Privacy Policy | Chingis B. Zwecker E.",
        description:
          "Privacy policy for the professional portfolio website of Chingis Zwecker E., covering Vercel hosting, browser language storage, and the optional EmailJS contact form.",
      },
      de: {
        title: "Datenschutz | Chingis B. Zwecker E.",
        description:
          "Datenschutzerklärung für die Portfolio-Website von Chingis Zwecker E. mit Hinweisen zu Vercel-Hosting, Sprachspeicher im Browser und dem optionalen EmailJS-Kontaktformular.",
      },
    },
  },
};
