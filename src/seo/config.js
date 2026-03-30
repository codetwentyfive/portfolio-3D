const SITE_URL = "https://chingis.dev";
const SITE_NAME = "Chingis Zwecker E.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const seoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  ogImage: OG_IMAGE,

  pages: {
    home: {
      path: "/",
      en: {
        title: "Chingis Zwecker E. | AI Engineer · Developer · IT Architect",
        description:
          "I build, fix, and modernize — web apps, e-commerce, payment systems, legacy codebases, native apps, hosting, WordPress, and AI workflows. Based in Karlsruhe, shipping solutions across the full stack and beyond.",
      },
      de: {
        title: "Chingis Zwecker E. | KI-Engineer · Entwickler · IT-Architekt",
        description:
          "Ich baue, repariere und modernisiere — Webanwendungen, E-Commerce, Zahlungssysteme, Legacy-Systeme, native Apps, Hosting, WordPress und KI-Workflows. Aus Karlsruhe, Loesungen ueber den gesamten Stack hinaus.",
      },
    },
    about: {
      path: "/about",
      en: {
        title: "About | Chingis Zwecker E. — What I Bring to the Table",
        description:
          "Developer who ships across domains — modern frontends, robust backends, legacy rescue, infrastructure, AI integration, and project management. The kind of person you call when it needs to work, not just look good on a whiteboard.",
      },
      de: {
        title: "Ueber mich | Chingis Zwecker E. — Was ich mitbringe",
        description:
          "Entwickler, der ueber Domaenen hinweg liefert — moderne Frontends, robuste Backends, Legacy-Rettung, Infrastruktur, KI-Integration und Projektmanagement. Der, den man ruft, wenn es funktionieren soll — nicht nur auf dem Whiteboard gut aussehen.",
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
          "E-Commerce-Plattformen, Firmenwebsites, interaktive 3D-Erlebnisse, KI-Agentensysteme und mehr. Jedes Projekt loest ein echtes Problem — vom ersten Konzept bis zum Produktiv-Deploy.",
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
        title: "Kontakt | Chingis Zwecker E. — Sprechen wir ueber Ihr Projekt",
        description:
          "Ein Projekt im Kopf? Ich nehme neue Kunden fuer Freelance und Beratung an — Webentwicklung, Legacy-Modernisierung, KI-Strategie und IT-Architektur. Aus Karlsruhe, weltweit remote verfuegbar.",
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
          "Gebuendelte Seite fuer Impressum und Datenschutzerklaerung der Portfolio-Website von Chingis Zwecker E.",
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
          "Impressum und Anbieterkennzeichnung fuer die beruflich ausgerichtete Portfolio-Website von Chingis Zwecker E. nach deutschen Informationspflichten.",
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
          "Datenschutzerklaerung fuer die Portfolio-Website von Chingis Zwecker E. mit Hinweisen zu Vercel-Hosting, Sprachspeicher im Browser und dem optionalen EmailJS-Kontaktformular.",
      },
    },
  },
};
