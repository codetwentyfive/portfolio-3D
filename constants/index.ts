import type { StaticImageData } from "next/image";
import {
  car,
  contact,
  css,
  cleaning,
  estate,
  git,
  github,
  html,
  javascript,
  linkedin,
  mongodb,
  nodejs,
  pricewise,
  react,
  sass,
  nextjs,
  cv,
  snapgram,
  summiz,
  weather,
  tailwindcss,
  threads,
  passau,
  typescript,
  python,
  odin,
  caretaker,
  mountain,
  lmu,
  sketch,
  puzzle,
  express,
  strangeseeds,
  php,
  mysql,
  logo,
  docker,
  prisma,
  postgresql,
  bewirken,
  claude,
  cursor,
  openai,
  localai,
  linux,
  nginx,
  openclaw,
} from "@/assets/icons";

export type Locale = "en" | "de";

export type LocalizedText = Record<Locale, string>;

export interface Skill {
  imageUrl: StaticImageData;
  name: string;
  type: string;
}

export interface Experience {
  title: LocalizedText;
  company_name: LocalizedText;
  icon: StaticImageData;
  iconBg: string;
  date: LocalizedText;
  points: LocalizedText[];
}

export interface SocialLink {
  name: string;
  iconUrl: StaticImageData;
  link: string;
}

export interface Project {
  iconUrl: StaticImageData;
  theme: string;
  name: LocalizedText;
  status?: LocalizedText;
  descriptions: LocalizedText;
  link?: string;
  github?: string;
}

export const skills: Skill[] = [
  {
    imageUrl: javascript,
    name: "JavaScript",
    type: "Frontend",
  },
  {
    imageUrl: typescript,
    name: "TypeScript",
    type: "Frontend",
  },
  {
    imageUrl: python,
    name: "Python",
    type: "Backend",
  },
  {
    imageUrl: react,
    name: "React",
    type: "Frontend",
  },
  {
    imageUrl: nextjs,
    name: "NextJS",
    type: "Frontend",
  },
  {
    imageUrl: nodejs,
    name: "Node.js",
    type: "Backend",
  },
  {
    imageUrl: tailwindcss,
    name: "Tailwind CSS",
    type: "Frontend",
  },
  {
    imageUrl: html,
    name: "HTML",
    type: "Frontend",
  },
  {
    imageUrl: css,
    name: "CSS",
    type: "Frontend",
  },
  {
    imageUrl: sass,
    name: "Sass",
    type: "Frontend",
  },
  {
    imageUrl: express,
    name: "Express.js",
    type: "Backend",
  },
  {
    imageUrl: php,
    name: "PHP",
    type: "Backend",
  },
  {
    imageUrl: postgresql,
    name: "PostgreSQL",
    type: "Database",
  },
  {
    imageUrl: mysql,
    name: "MySQL",
    type: "Database",
  },
  {
    imageUrl: mongodb,
    name: "MongoDB",
    type: "Database",
  },
  {
    imageUrl: prisma,
    name: "Prisma",
    type: "ORM",
  },
  {
    imageUrl: docker,
    name: "Docker",
    type: "DevOps",
  },
  {
    imageUrl: linux,
    name: "Linux",
    type: "DevOps",
  },
  {
    imageUrl: nginx,
    name: "Nginx",
    type: "DevOps",
  },
  {
    imageUrl: git,
    name: "Git",
    type: "Version Control",
  },
  {
    imageUrl: github,
    name: "GitHub",
    type: "Version Control",
  },
  {
    imageUrl: claude,
    name: "Claude",
    type: "AI",
  },
  {
    imageUrl: cursor,
    name: "Cursor",
    type: "AI",
  },
  {
    imageUrl: openai,
    name: "OpenAI Codex",
    type: "AI",
  },
  {
    imageUrl: localai,
    name: "Local AI / LLMs",
    type: "AI",
  },
  {
    imageUrl: openclaw,
    name: "OpenClaw",
    type: "AI",
  },
];

export const experiences: Experience[] = [
  {
    title: {
      en: "Full Stack Developer",
      de: "Full Stack Entwickler",
    },
    company_name: {
      en: "beWirken",
      de: "beWirken",
    },
    icon: bewirken,
    iconBg: "#1a7f37",
    date: {
      en: "February 2025 - now",
      de: "Februar 2025 - heute",
    },
    points: [
      {
        en: "Development and programming for werkbank projects at beWirken",
        de: "Programmierung in werkbank-Aufträgen für beWirken",
      },
      {
        en: "Regular updates and maintenance of beWirken's IT infrastructure",
        de: "Regelmäßige Updates & Pflege der IT-Infrastruktur von beWirken",
      },
      {
        en: "Consulting and sparring on IT infrastructure improvements and IT security",
        de: "Beratung & Sparring zu Pflegemaßnahmen & Verbesserungen der IT-Infrastruktur & IT-Sicherheit",
      },
      {
        en: "Sparring and consulting for the media production team on external client projects",
        de: "Sparring & Beratung für das Medienproduktionsteam für Kund*innenprojekte im Außen",
      },
      {
        en: "AI strategy development and implementation at beWirken",
        de: "KI Sparring, Strategie & Umsetzung bei beWirken",
      },
    ],
  },
  {
    title: {
      en: "Full Stack Developer - Freelance",
      de: "Full Stack Entwickler - Freiberuflich",
    },
    company_name: {
      en: "The Strange Seeds",
      de: "The Strange Seeds",
    },
    icon: strangeseeds,
    iconBg: "#E31937",
    date: {
      en: "September 2024 - now",
      de: "September 2024 - heute",
    },
    points: [
      {
        en: "Development of a dynamic band website using Next.js 14 and TypeScript",
        de: "Entwicklung einer dynamischen Band-Website mit Next.js 14 und TypeScript",
      },
      {
        en: "Integration of real-time concert listings and music streaming services",
        de: "Integration von Echtzeit-Konzertauflistungen und Musik-Streaming-Diensten",
      },
      {
        en: "Implementation of SEO optimizations and structured data",
        de: "Implementierung von SEO-Optimierungen und strukturierten Daten",
      },
      {
        en: "Creation of an interactive image gallery and press kit section",
        de: "Erstellung einer interaktiven Bildergalerie und eines Pressekit-Bereichs",
      },
      {
        en: "Development of responsive design with social media integration",
        de: "Entwicklung eines responsiven Designs mit Social-Media-Integration",
      },
    ],
  },
  {
    title: {
      en: "Full Stack Developer - Freelance",
      de: "Full Stack Entwickler - Freiberuflich",
    },
    company_name: {
      en: "Potera Cleaning",
      de: "Potera Reinigung",
    },
    icon: cleaning,
    iconBg: "#accbe1",
    date: {
      en: "June 2024 - now",
      de: "Juni 2024 - heute",
    },
    points: [
      {
        en: "Development of a modern website for a cleaning company with responsive design and interactive elements",
        de: "Entwicklung einer modernen Website für eine Reinigungsfirma mit responsivem Design und interaktiven Elementen",
      },
      {
        en: "Implementation of a secure contact form for efficient processing of customer inquiries",
        de: "Implementierung eines sicheren Kontaktformulars zur effizienten Verarbeitung von Kundenanfragen",
      },
      {
        en: "Application of SEO strategies to increase search engine visibility",
        de: "Anwendung von SEO-Strategien zur Steigerung der Sichtbarkeit in Suchmaschinen",
      },
      {
        en: "Optimization of website performance through efficient code structure and resource utilization",
        de: "Optimierung der Website-Performance durch effiziente Code-Struktur und Ressourcennutzung",
      },
    ],
  },
  {
    title: {
      en: "Caretaker",
      de: "Angehörigenpflege",
    },
    company_name: {
      en: "Familiy",
      de: "Familie",
    },
    icon: caretaker,
    iconBg: "#2a3988",
    date: {
      en: "September 2022 - now",
      de: "September 2022 - heute",
    },
    points: [
      {
        en: "Taking care of my father, who suffers from broken spine injuries, and assisting with both everyday tasks and managerial responsibilities.",
        de: "Verwaltung der täglichen Angelegenheiten und des Wohlergehens meines pflegebedürftigen Vaters",
      },
    ],
  },
  {
    title: {
      en: "Student - Foundations, Full Stack Javascript",
      de: "Student - Grundlagen, Full Stack JavaScript",
    },
    company_name: {
      en: "The Odin Project & co.",
      de: "The Odin-Projekt & Co.",
    },
    icon: odin,
    iconBg: "#d44b56",
    date: {
      en: "February 2020 - now",
      de: "Februar 2020 - heute",
    },
    points: [
      {
        en: "Learned about how to design and maintain a website from creation to deployment",
        de: "Gelernt, wie man eine Website von der Erstellung bis zum Release entwirft und pflegt",
      },
      {
        en: "Learned Javascript fundamentals",
        de: "Grundlagen von JavaScript gelernt",
      },
      {
        en: "React frameworks",
        de: "React-Frameworks",
      },
      {
        en: "Node.js",
        de: "Node.js",
      },
    ],
  },
  {
    title: {
      en: "Student - Cultural Business Studies",
      de: "Student - Kulturwirtschaft",
    },
    company_name: {
      en: "University of Passau",
      de: "Universität Passau",
    },
    icon: passau,
    iconBg: "#fbc98a",
    date: {
      en: "February 2016 - September 2019",
      de: "Februar 2016 - September 2019",
    },
    points: [],
  },
  {
    title: {
      en: "Student - Jurisprudence",
      de: "Student - Rechtswissenschaften",
    },
    company_name: {
      en: "Ludwig-Maximilians-Universität",
      de: "Ludwig-Maximilians-Universität",
    },
    icon: lmu,
    iconBg: "#00883a",
    date: {
      en: "February 2013 - September 2016",
      de: "Februar 2013 - September 2016",
    },
    points: [],
  },
];

export const socialLinks: SocialLink[] = [
  {
    name: "Contact",
    iconUrl: contact,
    link: "/contact",
  },
  {
    name: "GitHub",
    iconUrl: github,
    link: "https://github.com/codetwentyfive",
  },
  {
    name: "LinkedIn",
    iconUrl: linkedin,
    link: "https://www.linkedin.com/in/chingis-zwecker/",
  },
];

export const projects: Project[] = [
  {
    iconUrl: mountain,
    theme: "btn-back-green",
    name: {
      en: "chingis.shop",
      de: "chingis.shop"
    },
    status: {
      en: "Own Venture",
      de: "Eigenprojekt"
    },
    descriptions: {
      en: "My own e-commerce venture: an online shop for handcrafted goods from Mongolian artisans. Built with Next.js, TypeScript, Prisma, and PostgreSQL, it covers everything a real shop needs — catalog, cart, checkout, auth, and admin — designed, built, and operated by me.",
      de: "Mein eigenes E-Commerce-Projekt: ein Onlineshop für Handwerkskunst mongolischer Kunsthandwerker*innen. Gebaut mit Next.js, TypeScript, Prisma und PostgreSQL, deckt er alles ab, was ein echter Shop braucht — Katalog, Warenkorb, Checkout, Auth und Admin — von mir konzipiert, gebaut und betrieben."
    },
    link: "https://chingis.shop",
  },
  {
    iconUrl: postgresql,
    theme: "btn-back-orange",
    name: {
      en: "E-Commerce Data & Payments",
      de: "E-Commerce-Daten & Payments"
    },
    status: {
      en: "Client work · NDA",
      de: "Kundenprojekte · NDA"
    },
    descriptions: {
      en: "Client work under NDA: payment integrations with Novalnet and Stripe on WooCommerce shops, customer data pipelines between shop, CRM, and email tools, and product and sales data flows — imports, exports, and reporting that keep a store's numbers trustworthy.",
      de: "Kundenarbeit unter NDA: Payment-Integrationen mit Novalnet und Stripe in WooCommerce-Shops, Kundendaten-Pipelines zwischen Shop, CRM und E-Mail-Tools sowie Produkt- und Verkaufsdatenflüsse — Importe, Exporte und Reporting, damit die Zahlen eines Shops stimmen."
    },
  },
  {
    iconUrl: logo,
    theme: "btn-back-purple",
    name: {
      en: "3D Portfolio",
      de: "3D Portfolio"
    },
    descriptions: {
      en: "An immersive 3D portfolio website built with React Three Fiber, featuring interactive 3D models, animations, and a dynamic island environment. Includes multilingual support (EN/DE), custom 3D model optimization, background music controls, and responsive design. The project showcases modern web technologies including React, Three.js, Framer Motion, and i18next for internationalization.",
      de: "Eine immersive 3D-Portfolio-Website, entwickelt mit React Three Fiber, mit interaktiven 3D-Modellen, Animationen und einer dynamischen Inselumgebung. Enthält mehrsprachige Unterstützung (EN/DE), 3D-Modell-Optimierung, Hintergrundmusik-Steuerung und responsives Design. Das Projekt demonstriert moderne Webtechnologien wie React, Three.js, Framer Motion und i18next für Internationalisierung."
    },
    link: "https://chingis.dev/",
    github: "https://github.com/codetwentyfive/portfolio-3D",
  },
  {
    iconUrl: strangeseeds,
    theme: "btn-back-red",
    name: {
      en: "The Strange Seeds",
      de: "The Strange Seeds"
    },
    descriptions: {
      en: "A dynamic band website built with Next.js 14 and TypeScript, featuring real-time gig listings, music integration with Spotify and YouTube embeds, and structured data for SEO. The site includes an interactive image carousel, responsive design, and integration with social media platforms. Key features include automatic gig date formatting, dynamic routing, and a press kit download section.",
      de: "Eine dynamische Band-Website, entwickelt mit Next.js 14 und TypeScript, mit Echtzeit-Konzertauflistungen, Musik-Integration über Spotify und YouTube-Einbettungen sowie strukturierten Daten für SEO. Die Website enthält eine interaktive Bildergalerie, responsives Design und Integration mit Social-Media-Plattformen. Zu den Hauptfunktionen gehören automatische Konzertdatum-Formatierung, dynamisches Routing und einen Pressekit-Download-Bereich."
    },
    link: "https://thestrangeseeds.com",
    github: "https://github.com/codetwentyfive/strange-seeds",
  },
  {
    iconUrl: cleaning,
    theme: "btn-back-blue",
    name: {
      en: "Potera Cleaning",
      de: "Potera Reinigung"
    },
    descriptions: {
      en: "A freelance project for a cleaning company based in Germany. The website showcases their services, client testimonials, and contact information and is made with NextJS, TailwindCSS and nodemailer for the contact form.",
      de: "Ein freiberufliches Projekt für ein Reinigungsunternehmen mit Sitz in Deutschland. Die Website zeigt ihre Dienstleistungen, Kundenbewertungen und Kontaktinformationen und ist mit NextJS, TailwindCSS und nodemailer für das Kontaktformular erstellt worden.",
    },
    link: "https://poterareinigung.de/",
    github: "https://github.com/codetwentyfive/potera",
  },
  {
    iconUrl: docker,
    theme: "btn-back-black",
    name: {
      en: "Self-Hosted AI Assistant",
      de: "Self-Hosted AI-Assistent"
    },
    status: {
      en: "Case Study",
      de: "Case Study"
    },
    descriptions: {
      en: "Personal AI infrastructure on my own hardware: an open-source agent gateway deployed with Docker, wired to Telegram as the interface, with scheduled agents for daily briefings, sandboxed code execution, and local models via Ollama for privacy-sensitive tasks. The same kind of setup I build for clients who want AI without handing their data to third parties.",
      de: "Persönliche AI-Infrastruktur auf eigener Hardware: ein Open-Source-Agent-Gateway, mit Docker deployt und an Telegram als Interface angebunden — mit geplanten Agents für tägliche Briefings, sandboxed Code-Ausführung und lokalen Modellen über Ollama für datensensible Aufgaben. Genau solche Setups baue ich für Kund*innen, die AI ohne Datenabfluss an Dritte wollen."
    },
  },
];
