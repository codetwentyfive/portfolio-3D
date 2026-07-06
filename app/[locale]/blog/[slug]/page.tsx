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
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
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

export default async function BlogPostPage({ params: { locale, slug } }: Props) {
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
      <article className="max-w-3xl">
        <Link href="/blog" className="text-sm font-semibold text-blue-600">
          ← {t("blog_back")}
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          {post.date ? formatDate(post.date, locale) : null}
        </p>
        <h1 className="mt-1 head-text">{post.title}</h1>
        {post.locale !== locale && (
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
            {t("blog_locale_fallback")}
          </p>
        )}
        <div className="prose-custom mt-10 flex flex-col gap-5 text-slate-600 leading-7 [&_h2]:subhead-text [&_h2]:mt-6 [&_h3]:text-xl [&_h3]:font-poppins [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_a]:text-sky-700 [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-2">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </section>
  );
}
