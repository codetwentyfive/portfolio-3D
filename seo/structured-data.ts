import type { Post } from "@/lib/blog";
import { PERSON_ID, seoConfig, type SeoLocale, type SeoPageKey } from "./config";
import { absoluteUrl, localizedUrl } from "./urls";

const { siteUrl, siteName, ogImage } = seoConfig;

/** Generic JSON-LD structured data object. */
export type StructuredData = Record<string, unknown>;

/** Prevent an authored string from closing the JSON-LD script element. */
export const serializeStructuredData = (schema: StructuredData) =>
  JSON.stringify(schema).replace(/</g, "\\u003c");

export const personSchema: StructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Chingis Zwecker E.",
  alternateName: ["Chinggis Zwecker E.", "Chinggis Zwecker", "Chingis Zwecker"],
  url: siteUrl,
  image: ogImage,
  jobTitle: "Senior Product Engineer",
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
    "https://chingis.shop",
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
      name: "Ludwig-Maximilians-Universität München",
      department: "Jurisprudence",
    },
  ],
};

export const websiteSchema: StructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  alternateName: ["Chinggis Zwecker E. Portfolio", "Chinggis Dev"],
  description:
    "Portfolio of Chingis Zwecker E. (also known as Chinggis), a Senior Product Engineer based in Karlsruhe, Germany.",
  author: { "@id": PERSON_ID },
  inLanguage: ["en", "de"],
};

export const createWebPageSchema = (
  page: SeoPageKey,
  lang: SeoLocale = "en"
): StructuredData | null => {
  const pageConfig = seoConfig.pages[page];
  if (!pageConfig) return null;

  const langConfig = pageConfig[lang] || pageConfig.en;
  const url = localizedUrl(pageConfig.path, lang);

  return {
    "@context": "https://schema.org",
    "@type": page === "about" ? "ProfilePage" : ["blog", "projects"].includes(page) ? "CollectionPage" : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: langConfig.title,
    description: langConfig.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": PERSON_ID },
    ...(page === "about" ? { mainEntity: { "@id": PERSON_ID } } : {}),
    ...(pageConfig.image ? { primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(pageConfig.image) } } : {}),
    inLanguage: lang,
  };
};

export const createBreadcrumbSchema = (
  page: SeoPageKey,
  lang: SeoLocale = "en"
): StructuredData | null => {
  const pageConfig = seoConfig.pages[page];
  if (!pageConfig || page === "home") return null;

  const langConfig = pageConfig[lang] || pageConfig.en;
  const items = [
    { name: lang === "de" ? "Startseite" : "Home", item: localizedUrl("/", lang) },
    ...(page === "denkpause" ? [{ name: lang === "de" ? "Projekte" : "Projects", item: localizedUrl("/projects", lang) }] : []),
    { name: langConfig.title.split(" | ")[0], item: localizedUrl(pageConfig.path, lang) },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };
};

export const professionalServiceSchema: StructuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteUrl}/#service`,
  name: "Chingis Zwecker E. - Web Development",
  url: siteUrl,
  areaServed: "Worldwide (remote)",
  address: { "@type": "PostalAddress", addressLocality: "Karlsruhe", addressCountry: "DE" },
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

export const createBlogPostingSchema = (post: Post): StructuredData => {
  const url = localizedUrl(`/blog/${post.slug}`, post.locale);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": `${siteUrl}/#website` },
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.dateModified ?? post.date,
    inLanguage: post.locale,
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: siteName,
      url: localizedUrl("/about", post.locale),
    },
    publisher: { "@type": "Person", "@id": PERSON_ID, name: siteName },
    ...(post.image ? { image: absoluteUrl(post.image) } : {}),
    keywords: post.tags,
  };
};

export const createBlogBreadcrumbSchema = (post: Post): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { name: post.locale === "de" ? "Startseite" : "Home", item: localizedUrl("/", post.locale) },
    { name: "Blog", item: localizedUrl("/blog", post.locale) },
    { name: post.title, item: localizedUrl(`/blog/${post.slug}`, post.locale) },
  ].map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
});
