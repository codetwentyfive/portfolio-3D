import { seoConfig } from "./config";

const { siteUrl, siteName, ogImage } = seoConfig;

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: "Chingis Zwecker E.",
  alternateName: ["Chinggis Zwecker E.", "Chinggis Zwecker", "Chingis Zwecker"],
  url: siteUrl,
  image: ogImage,
  jobTitle: "AI Engineer, Developer & IT Architect",
  worksFor: {
    "@type": "Organization",
    name: "beWirken",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Karlsruhe",
    addressCountry: "DE",
  },
  email: "hello@chingis.dev",
  sameAs: [
    "https://github.com/codetwentyfive",
    "https://www.linkedin.com/in/chingis-zwecker/",
  ],
  knowsAbout: [
    "Web Development",
    "AI Consulting",
    "IT Architecture",
    "Legacy System Modernization",
    "E-Commerce",
    "Payment Systems",
    "WordPress",
    "Hosting & Infrastructure",
    "Native App Development",
    "Project Management",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express.js",
    "Python",
    "PHP",
    "PostgreSQL",
    "MongoDB",
    "MySQL",
    "Prisma ORM",
    "Docker",
    "Linux",
    "Nginx",
  ],
  knowsLanguage: [
    { "@type": "Language", name: "English" },
    { "@type": "Language", name: "German" },
    { "@type": "Language", name: "Mongolian" },
  ],
  alumniOf: [
    {
      "@type": "EducationalOrganization",
      name: "University of Passau",
      department: "Cultural Business Studies",
    },
    {
      "@type": "EducationalOrganization",
      name: "Ludwig-Maximilians-Universitaet Muenchen",
      department: "Jurisprudence",
    },
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  alternateName: ["Chinggis Zwecker E. Portfolio", "Chinggis Dev"],
  description:
    "Portfolio of Chingis Zwecker E. (also known as Chinggis), a Full Stack Developer based in Karlsruhe, Germany.",
  author: { "@id": `${siteUrl}/#person` },
  inLanguage: ["en", "de"],
};

export const createWebPageSchema = (page, lang = "en") => {
  const pageConfig = seoConfig.pages[page];
  if (!pageConfig) return null;

  const langConfig = pageConfig[lang] || pageConfig.en;
  const url = `${siteUrl}${pageConfig.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}/#webpage`,
    url,
    name: langConfig.title,
    description: langConfig.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#person` },
    inLanguage: lang,
  };
};

export const createBreadcrumbSchema = (page, lang = "en") => {
  const pageConfig = seoConfig.pages[page];
  if (!pageConfig || page === "home") return null;

  const langConfig = pageConfig[lang] || pageConfig.en;
  const homeConfig = seoConfig.pages.home[lang] || seoConfig.pages.home.en;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeConfig.title.split(" | ")[0],
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: langConfig.title.split(" | ")[0],
        item: `${siteUrl}${pageConfig.path}`,
      },
    ],
  };
};

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteUrl}/#service`,
  name: "Chingis Zwecker E. - Web Development",
  url: siteUrl,
  provider: { "@id": `${siteUrl}/#person` },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 49.0069,
      longitude: 8.4037,
    },
    description: "Karlsruhe, Germany and remote worldwide",
  },
  serviceType: [
    "Web Development",
    "Full Stack Development",
    "Frontend Development",
    "Backend Development",
    "E-Commerce Development",
    "AI Strategy Consulting",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Web Development Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Custom Web Application Development",
          description:
            "Full stack web applications built with React, Next.js, TypeScript, and Node.js",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "E-Commerce Development",
          description:
            "Online stores and platforms with modern tech stacks, payment integration, and SEO optimization",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI Strategy & Implementation",
          description:
            "AI integration, automation, and strategy consulting for businesses",
        },
      },
    ],
  },
};
