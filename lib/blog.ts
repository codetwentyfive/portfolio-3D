import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import type { Locale } from "@/src/i18n/routing";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
}

export interface Post extends PostFrontmatter {
  slug: string;
  locale: Locale;
  content: string;
}

const parsePost = (slug: string, locale: Locale, raw: string): Post => {
  const { data, content } = matter(raw);
  return {
    slug,
    locale,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
  };
};

const readPostFile = async (slug: string, locale: Locale) => {
  try {
    return await fs.readFile(path.join(BLOG_DIR, `${slug}.${locale}.mdx`), "utf8");
  } catch {
    return null;
  }
};

export async function getPostSlugs(): Promise<string[]> {
  let files: string[];
  try {
    files = await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }
  const slugs = files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.(de|en)\.mdx$/, ""));
  return [...new Set(slugs)];
}

// Falls back to the other locale so a post written in one language
// is still reachable from both URL trees.
export async function getPost(slug: string, locale: Locale): Promise<Post | null> {
  const raw = await readPostFile(slug, locale);
  if (raw) return parsePost(slug, locale, raw);

  const fallback: Locale = locale === "de" ? "en" : "de";
  const fallbackRaw = await readPostFile(slug, fallback);
  return fallbackRaw ? parsePost(slug, fallback, fallbackRaw) : null;
}

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPost(slug, locale)));
  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
