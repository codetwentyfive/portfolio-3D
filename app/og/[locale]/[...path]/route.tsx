import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { planets } from "@/components/scenes/planets/planet-data";
import { getPublishedTranslations, publicationPages } from "@/lib/publication-text";
import { seoConfig } from "@/seo/config";
import { routing, type Locale } from "@/src/i18n/routing";

// Local MDX and local artwork require Node. ImageResponse supplies its bundled
// Noto Sans font; cards make no remote image or font requests.
export const runtime = "nodejs";

type Props = { params: Promise<{ locale: string; path: string[] }> };
type Card = {
  title: string;
  description: string;
  section: string;
  path: string;
  detail: string;
  image?: string;
};

const colors = { paper: "#e9eae5", ink: "#202421", accent: "#a34526", muted: "#626e62", line: "#b0b6ac" };

function excerpt(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

async function resolveCard(locale: Locale, segments: string[]): Promise<Card | null> {
  if (segments.length === 2 && segments[0] === "blog") {
    const post = (await getPublishedTranslations(locale)).find((entry) => entry.slug === segments[1]);
    return post ? {
      title: post.title,
      description: post.description,
      section: locale === "de" ? "Notizen aus der Praxis" : "Field notes",
      path: `/blog/${post.slug}`,
      detail: post.tags.slice(0, 2).join(" / "),
      image: post.image,
    } : null;
  }
  const requestedPath = segments.length === 1 && segments[0] === "home" ? "/" : `/${segments.join("/")}`;
  const entry = publicationPages.find(([, page]) => page.path === requestedPath);
  if (!entry) return null;
  const [key, page] = entry;
  const project = planets.find((planet) => planet.caseStudy === page.path);
  return {
    title: project?.name[locale] ?? page[locale].title.split(" | ")[0],
    description: page[locale].description,
    section: project
      ? locale === "de" ? "Ausgewählte Arbeit" : "Selected work"
      : locale === "de" ? "Entwicklung & Beratung" : "Engineering & consulting",
    path: page.path,
    detail: project?.status?.[locale] ?? (locale === "de" ? "Karlsruhe · Weltweit remote" : "Karlsruhe · Remote worldwide"),
    image: page.image ?? (key === "home" || key === "projects" ? seoConfig.pages.denkpause.image : undefined),
  };
}

async function localArtwork(source?: string): Promise<string | undefined> {
  // Content authors can select local artwork, but never trigger a remote fetch.
  if (!source?.startsWith("/images/")) return undefined;
  const publicRoot = path.join(process.cwd(), "public");
  const file = path.resolve(publicRoot, `.${source}`);
  if (!file.startsWith(`${publicRoot}${path.sep}`)) return undefined;
  try {
    const bytes = await readFile(file);
    const png = await sharp(bytes)
      .trim({ threshold: 12 })
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    // A missing optional image must not break the title's social preview.
    return undefined;
  }
}

export async function GET(_request: Request, { params }: Props) {
  const { locale: requestedLocale, path: segments } = await params;
  if (!routing.locales.includes(requestedLocale as Locale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = requestedLocale as Locale;
  const card = await resolveCard(locale, segments);
  if (!card) return new Response("Not found", { status: 404 });
  const artwork = await localArtwork(card.image);
  const titleSize = card.title.length > 78 ? 44 : card.title.length > 48 ? 52 : 66;
  const domain = new URL(seoConfig.siteUrl).hostname.replace(/^www\./, "");

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: colors.paper, color: colors.ink, padding: "38px 48px", flexDirection: "column", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${colors.ink}`, paddingBottom: 20 }}>
        <div style={{ display: "flex", fontSize: 23, letterSpacing: -0.8 }}>{seoConfig.siteName.replace(/\.$/, "")}<span style={{ color: colors.accent }}>.</span></div>
        <div style={{ display: "flex", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: colors.muted }}>{card.section} / {locale.toUpperCase()}</div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 36 }}>
        <div style={{ display: "flex", width: 620, flexDirection: "column", paddingBottom: 6 }}>
          <div style={{ display: "flex", width: 50, height: 5, background: colors.accent, marginBottom: 22 }} />
          <div style={{ display: "flex", fontSize: titleSize, letterSpacing: -2.6, lineHeight: 1.07, fontWeight: 400 }}>{card.title}</div>
          <div style={{ display: "flex", fontSize: 22, lineHeight: 1.45, color: colors.muted, marginTop: 25 }}>{excerpt(card.description, 185)}</div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 438, height: 396, alignItems: "center", justifyContent: "center" }}>
          {artwork ? (
            // next/image is unnecessary inside a server-rendered PNG.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork} alt="" width={438} height={396} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", position: "relative", width: 340, height: 340, border: `1px solid ${colors.line}`, borderRadius: 170, alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", position: "absolute", width: 280, height: 280, border: `1px solid ${colors.line}`, borderRadius: 140 }} />
              <div style={{ display: "flex", width: 204, height: 240, border: `1px solid ${colors.ink}`, background: colors.paper, transform: "rotate(-9deg)", alignItems: "center", justifyContent: "center", boxShadow: "12px 12px 0 #d8dcd2" }}>
                <div style={{ display: "flex", fontSize: 135, letterSpacing: -10, color: colors.accent }}>C.</div>
              </div>
              <div style={{ display: "flex", position: "absolute", right: -8, top: 27, width: 24, height: 24, borderRadius: 12, background: colors.accent }} />
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${colors.line}`, paddingTop: 17, fontSize: 14, color: colors.muted }}>
        <div style={{ display: "flex" }}>{domain}/{locale}{card.path === "/" ? "" : card.path}</div>
        <div style={{ display: "flex", maxWidth: 450, color: colors.ink }}>{card.detail}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      // URLs keep the same content identity across edits; allow revalidation.
      headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
    },
  );
}
