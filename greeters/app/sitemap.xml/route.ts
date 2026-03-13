import { renderMultilingueSitemapXml } from "@/lib/seo/sitemap";

export async function GET() {
  const xml = await renderMultilingueSitemapXml();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
