import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { seoConfig } from "../seo/config";
import {
  personSchema,
  websiteSchema,
  professionalServiceSchema,
  createWebPageSchema,
  createBreadcrumbSchema,
} from "../seo/structured-data";

const SEO = ({ page = "home", globalSchemas = false }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  const pageConfig = seoConfig.pages[page];
  if (!pageConfig) return null;

  const langConfig = pageConfig[lang] || pageConfig.en;
  const canonicalUrl = `${seoConfig.siteUrl}${pageConfig.path}`;

  const webPageSchema = createWebPageSchema(page, lang);
  const breadcrumbSchema = createBreadcrumbSchema(page, lang);

  const schemas = [];
  if (globalSchemas) {
    schemas.push(personSchema, websiteSchema, professionalServiceSchema);
  }
  if (webPageSchema) schemas.push(webPageSchema);
  if (breadcrumbSchema) schemas.push(breadcrumbSchema);

  return (
    <Helmet>
      <html lang={lang} />
      <title>{langConfig.title}</title>
      <meta name="description" content={langConfig.description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={langConfig.title} />
      <meta property="og:description" content={langConfig.description} />
      <meta property="og:image" content={seoConfig.ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:locale" content={lang === "de" ? "de_DE" : "en_US"} />
      <meta
        property="og:locale:alternate"
        content={lang === "de" ? "en_US" : "de_DE"}
      />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={langConfig.title} />
      <meta name="twitter:description" content={langConfig.description} />
      <meta name="twitter:image" content={seoConfig.ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="Chingis Zwecker E." />
      <meta name="robots" content="index, follow" />
      <meta
        name="keywords"
        content={
          lang === "de"
            ? "Full Stack Entwickler, Webentwickler, Karlsruhe, Deutschland, React, Next.js, TypeScript, Node.js, Freelancer, Webentwicklung"
            : "Full Stack Developer, Web Developer, Karlsruhe, Germany, React, Next.js, TypeScript, Node.js, Freelance, Web Development"
        }
      />
      <meta name="geo.region" content="DE-BW" />
      <meta name="geo.placename" content="Karlsruhe" />

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
