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
        title: "Chingis Zwecker E. | Full Stack Developer | Karlsruhe, Germany",
        description:
          "Full Stack Developer based in Karlsruhe, Germany. Building scalable web applications with React, Next.js, TypeScript, Node.js, and PostgreSQL. Interactive 3D portfolio.",
      },
      de: {
        title: "Chingis Zwecker E. | Full Stack Entwickler | Karlsruhe, Deutschland",
        description:
          "Full Stack Entwickler aus Karlsruhe, Deutschland. Entwicklung skalierbarer Webanwendungen mit React, Next.js, TypeScript, Node.js und PostgreSQL. Interaktives 3D-Portfolio.",
      },
    },
    about: {
      path: "/about",
      en: {
        title: "About Chingis Zwecker E. | Skills & Experience | Full Stack Developer",
        description:
          "Full Stack Developer with expertise in JavaScript, TypeScript, React, Next.js, Node.js, Python, PostgreSQL, Docker, and AI tooling. Experience at beWirken, freelance projects, and self-taught through The Odin Project.",
      },
      de: {
        title: "Ueber Chingis Zwecker E. | Skills & Erfahrung | Full Stack Entwickler",
        description:
          "Full Stack Entwickler mit Expertise in JavaScript, TypeScript, React, Next.js, Node.js, Python, PostgreSQL, Docker und KI-Tools. Erfahrung bei beWirken, freiberufliche Projekte und autodidaktisch durch The Odin Project.",
      },
    },
    projects: {
      path: "/projects",
      en: {
        title: "Projects by Chingis Zwecker E. | Web Development Portfolio",
        description:
          "Portfolio of web development projects including e-commerce platforms, band websites, cleaning company sites, 3D portfolios, and interactive web apps. Built with Next.js, React, TypeScript, and Tailwind CSS.",
      },
      de: {
        title: "Projekte von Chingis Zwecker E. | Webentwicklung Portfolio",
        description:
          "Portfolio von Webentwicklungsprojekten, darunter E-Commerce-Plattformen, Band-Websites, Reinigungsunternehmen-Websites, 3D-Portfolios und interaktive Web-Apps. Entwickelt mit Next.js, React, TypeScript und Tailwind CSS.",
      },
    },
    contact: {
      path: "/contact",
      en: {
        title: "Contact Chingis Zwecker E. | Hire a Full Stack Developer",
        description:
          "Get in touch with Chingis Zwecker E., a Full Stack Developer based in Karlsruhe, Germany. Available for freelance projects, full-time roles, and consulting in web development and AI strategy.",
      },
      de: {
        title: "Kontakt Chingis Zwecker E. | Full Stack Entwickler beauftragen",
        description:
          "Kontaktieren Sie Chingis Zwecker E., einen Full Stack Entwickler aus Karlsruhe, Deutschland. Verfuegbar fuer freiberufliche Projekte, Festanstellungen und Beratung in Webentwicklung und KI-Strategie.",
      },
    },
  },
};
