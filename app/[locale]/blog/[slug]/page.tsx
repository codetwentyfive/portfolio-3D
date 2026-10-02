import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { type Locale } from "@/src/i18n/routing";
import { getPost, getPostSlugs } from "@/lib/blog";
import JsonLd from "@/components/JsonLd";
import { buildBlogMetadata } from "@/seo/metadata";
import { createBlogPostingSchema, createBlogBreadcrumbSchema } from "@/seo/structured-data";

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const posts = await Promise.all((await getPostSlugs()).map((slug) => getPost(slug, "de")));
  return posts.flatMap((post) => post ? post.availableLocales.map((locale) => ({ locale, slug: post.slug })) : []);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);
  if (!post) notFound();
  return buildBlogMetadata(post);
}

const formatDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const post = await getPost(slug, locale);
  if (!post) notFound();
  if (post.locale !== locale) permanentRedirect(`/${post.locale}/blog/${post.slug}`);

  return (
    <section className="max-container">
      <JsonLd schemas={[createBlogPostingSchema(post), createBlogBreadcrumbSchema(post)]} />
      <article>
        <header>
          <Link href="/blog" className="editorial-kicker inline-flex min-h-11 items-center text-ink">
            ← {t("blog_back")}
          </Link>
          <p className="mt-8 editorial-kicker">
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
          </p>
          <h1 className="mt-5 max-w-[980px] font-display text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
            {post.title}
          </h1>
          <p className="mt-7 max-w-[660px] text-lg leading-relaxed text-slate-600">{post.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/about" rel="author" className="inline-flex min-h-11 items-center underline underline-offset-4">
              {locale === "de" ? "Von" : "By"} Chingis Zwecker E.
            </Link>
            {post.dateModified && post.dateModified !== post.date && (
              <span>{locale === "de" ? "Überarbeitet am" : "Updated"} <time dateTime={post.dateModified}>{formatDate(post.dateModified, locale)}</time></span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-b border-slate-300 pb-6">
            {post.tags.map((tag) => <span key={tag} className="journal-tag">{tag}</span>)}
          </div>
          {post.image && (
            <figure className="mx-auto mt-10 max-w-[820px]">
              <Image src={post.image} alt={post.imageAlt ?? ""} width={1200} height={760} sizes="(max-width: 860px) 90vw, 820px" priority className="h-auto w-full rounded-sm" />
              {post.imageAlt && <figcaption className="mt-3 text-sm leading-relaxed text-slate-500">{post.imageAlt}</figcaption>}
            </figure>
          )}
        </header>
        <div className="article-body mt-12"><MDXRemote source={post.content} /></div>
        <footer className="mx-auto mt-16 max-w-[68ch] border-t border-slate-300 pt-6">
          <Link href="/blog" className="journal-link">← {t("blog_back")}</Link>
        </footer>
      </article>
    </section>
  );
}
