import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { routing, type Locale } from "@/src/i18n/routing";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const POST_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(de|en)\.mdx$/;

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  dateModified?: string;
  image: string;
  imageAlt: string;
  tags: string[];
}

export interface Post extends PostFrontmatter {
  slug: string;
  locale: Locale;
  availableLocales: Locale[];
  content: string;
}

const isoDate = (value: unknown, field: string, file: string): string => {
  const date = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error(`${file}: ${field} must be a valid YYYY-MM-DD date`);
  }
  return date;
};

const parsePost = (slug: string, locale: Locale, raw: string, availableLocales: Locale[]): Post => {
  const { data, content } = matter(raw);
  const file = `${slug}.${locale}.mdx`;
  if (typeof data.title !== "string" || !data.title.trim() ||
    typeof data.description !== "string" || !data.description.trim()) {
    throw new Error(`${file}: published articles require a title and description`);
  }
  const date = isoDate(data.date, "date", file);
  const dateModified = data.dateModified ? isoDate(data.dateModified, "dateModified", file) : undefined;
  if (dateModified && dateModified < date) {
    throw new Error(`${file}: dateModified cannot precede publication`);
  }
  if (typeof data.image !== "string" || !data.image.trim() ||
    typeof data.imageAlt !== "string" || !data.imageAlt.trim()) {
    throw new Error(`${file}: published articles require a representative image and imageAlt`);
  }
  return {
    slug,
    locale,
    availableLocales,
    title: data.title.trim(),
    description: data.description.trim(),
    date,
    dateModified,
    image: data.image.trim(),
    imageAlt: data.imageAlt.trim(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
  };
};

const readPostFile = async (slug: string, locale: Locale) => {
  try {
    return await fs.readFile(path.join(BLOG_DIR, `${slug}.${locale}.mdx`), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

export async function getPostSlugs(): Promise<string[]> {
  let files: string[];
  try {
    files = await fs.readdir(BLOG_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return [...new Set(files.flatMap((file) => {
    const match = POST_FILE.exec(file);
    return match ? [match[1]] : [];
  }))].sort();
}

// The UI can show a fallback; metadata and the sitemap use only real translations.
export async function getPost(slug: string, locale: Locale): Promise<Post | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const translations = await Promise.all(
    routing.locales.map(async (language) => ({ language, raw: await readPostFile(slug, language) })),
  );
  const available = translations.filter((translation) => translation.raw !== null);
  const selected = available.find((translation) => translation.language === locale) ?? available[0];
  return selected?.raw !== undefined && selected.raw !== null
    ? parsePost(slug, selected.language, selected.raw, available.map(({ language }) => language))
    : null;
}

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPost(slug, locale)));
  return posts
    .filter((post): post is Post => post !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
