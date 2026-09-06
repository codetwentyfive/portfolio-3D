import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { routing, type Locale } from "@/src/i18n/routing";
import { getPost, getPostSlugs } from "@/lib/blog";

interface Props {
  params: { locale: Locale; slug: string };
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: Props): Promise<Metadata> {
  const post = await getPost(slug, locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://chingis.dev/${locale}/blog/${slug}`,
      languages: {
        de: `https://chingis.dev/de/blog/${slug}`,
        en: `https://chingis.dev/en/blog/${slug}`,
        "x-default": `https://chingis.dev/de/blog/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

const formatDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
  }).format(new Date(date));

export default async function BlogPostPage({
  params: { locale, slug },
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const post = await getPost(slug, locale);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: post.locale,
    author: {
      "@type": "Person",
      name: "Chingis Zwecker E.",
      url: "https://chingis.dev",
    },
  };

  return (
    <section className="max-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <Link
          href="/blog"
          className="editorial-kicker inline-flex min-h-11 items-center text-ink"
        >
          ← {t("blog_back")}
        </Link>
        <p className="mt-8 editorial-kicker">
          {post.date ? formatDate(post.date, locale) : null}
        </p>
        <h1 className="mt-5 max-w-[980px] font-display text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
          {post.title}
        </h1>
        <p className="mt-7 max-w-[660px] text-lg leading-relaxed text-slate-600">
          {post.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 border-b border-slate-300 pb-6">
          {post.tags.map((tag) => (
            <span key={tag} className="journal-tag">
              {tag}
            </span>
          ))}
        </div>
        {post.locale !== locale && (
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
            {t("blog_locale_fallback")}
          </p>
        )}
        <div className="article-body mt-12">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </section>
  );
}
