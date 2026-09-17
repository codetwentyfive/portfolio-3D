import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { getAllPosts } from "@/lib/blog";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;

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

export default async function BlogPage(props: Props) {
  const { locale } = await props.params;

  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const posts = await getAllPosts(locale);

  return (
    <section className="max-container">
      <header className="journal-hero">
        <div className="flex items-center justify-between gap-4 editorial-kicker">
          <span>{t("editorial.journal")}</span>
          <span>Chingis / {String(posts.length).padStart(2, "0")}</span>
        </div>
        <h1 className="journal-title">
          {t("blog_heading")}
          <em>{t("blog_heading_span")}</em>
        </h1>
        <span className="journal-register" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <p className="journal-intro">{t("blog_intro")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-16 text-slate-500">{t("blog_empty")}</p>
      ) : (
        <div className="mt-7">
          <p className="editorial-kicker">{t("editorial.index")}</p>
          {posts.map((post, index) => (
            <article key={post.slug} className="journal-entry group">
              <span className="journal-entry-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link href={`/blog/${post.slug}`} className="block min-w-0">
                <p className="editorial-kicker">
                  <time dateTime={post.date}>
                    {post.date ? formatDate(post.date, locale) : null}
                  </time>
                </p>
                <h2 className="journal-entry-title transition-colors group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-4 max-w-[620px] text-sm leading-relaxed text-slate-600 sm:text-base">
                  {post.description}
                </p>
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="journal-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="journal-link">
                  {t("blog_read_more")} <span aria-hidden="true">↗</span>
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
