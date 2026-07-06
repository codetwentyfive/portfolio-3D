import type { StructuredData } from "@/seo/structured-data";

const JsonLd = ({ schemas }: { schemas: (StructuredData | null)[] }) => {
  const filtered = schemas.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <>
      {filtered.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
};

export default JsonLd;
