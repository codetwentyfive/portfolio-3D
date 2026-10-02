import { buildPublicationText, publicationTextHeaders } from "@/lib/publication-text";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildPublicationText(true), { headers: publicationTextHeaders });
}
