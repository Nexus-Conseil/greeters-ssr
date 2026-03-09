import { getLocaleFromHost } from "@/lib/i18n/request";
import { renderTourismSitemapXml } from "@/lib/seo/sitemap";

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const locale = getLocaleFromHost(host);
  const xml = await renderTourismSitemapXml(locale);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}