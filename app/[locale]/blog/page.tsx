import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { getAllPosts } from "@/lib/blog";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: t("blog_meta_title"),
    description: t("blog_meta_description"),
    alternates: {
      canonical: `https://chingis.dev/${locale}/blog`,
      languages: {
        de: "https://chingis.dev/de/blog",
        en: "https://chingis.dev/en/blog",
        "x-default": "https://chingis.dev/de/blog",
      },
    },
  };
}

const formatDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
  }).format(new Date(date));

export default async function BlogPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const posts = await getAllPosts(locale);

  return (
    <section className="max-container">
      <h1 className="head-text">
        {t("blog_heading")}{" "}
        <span className="gradient_text font-semibold drop-shadow">
          {t("blog_heading_span")}
        </span>
      </h1>
      <p className="mt-5 text-slate-500">{t("blog_intro")}</p>

      {posts.length === 0 ? (
        <p className="mt-16 text-slate-500">{t("blog_empty")}</p>
      ) : (
        <div className="mt-14 flex flex-col gap-10">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <p className="text-sm text-slate-500">
                  {post.date ? formatDate(post.date, locale) : null}
                </p>
                <h2 className="mt-1 text-2xl font-poppins font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                  {post.title}
                </h2>
                <p className="mt-2 text-slate-500">{post.description}</p>
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="mt-3 inline-block font-semibold text-blue-600">
                  {t("blog_read_more")} →
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
