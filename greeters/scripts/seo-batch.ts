import { prisma } from "../lib/db/prisma";
import { optimizePageSeo } from "../lib/services/ai-seo-optimizer";
import type { AppLocale } from "../lib/i18n/config";

async function main() {
  const pages = await prisma.page.findMany({
    where: { locale: "fr", status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
  });

  console.log(`\n🔍 ${pages.length} pages publiées (fr) à optimiser\n`);

  let ok = 0;
  let fail = 0;

  for (const page of pages) {
    const slug = page.slug;
    try {
      const sections = (page.contentJson as Array<{ type: string; body?: string; images?: Array<{ src: string; alt?: string }> }>) ?? [];
      const input = {
        locale: page.locale as AppLocale,
        title: page.title,
        slug: page.slug,
        sections,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
        canonicalUrl: page.canonicalUrl,
        robotsDirective: page.robotsDirective,
        ogTitle: page.ogTitle,
        ogDescription: page.ogDescription,
        ogImageUrl: page.ogImageUrl,
        ogImageAlt: page.ogImageAlt,
        twitterTitle: page.twitterTitle,
        twitterDescription: page.twitterDescription,
        twitterImageUrl: page.twitterImageUrl,
        focusKeyword: page.focusKeyword,
        secondaryKeywords: page.secondaryKeywords,
        schemaOrgJson: page.schemaOrgJson,
        sitemapPriority: page.sitemapPriority,
        sitemapChangeFreq: page.sitemapChangeFreq,
        imageRecommendations: [],
      };

      const seo = await optimizePageSeo(input, null, "fr");

      await prisma.page.update({
        where: { id: page.id },
        data: {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeyword: seo.focusKeyword,
          secondaryKeywords: seo.secondaryKeywords,
          canonicalUrl: seo.canonicalUrl,
          robotsDirective: seo.robotsDirective,
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          ogImageUrl: seo.ogImageUrl,
          ogImageAlt: seo.ogImageAlt,
          schemaOrgJson: seo.schemaOrgJson,
          sitemapPriority: seo.sitemapPriority,
          sitemapChangeFreq: seo.sitemapChangeFreq,
        },
      });

      ok++;
      console.log(`✅ ${slug} → ${seo.metaTitle.substring(0, 65)}`);
    } catch (e: unknown) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌ ${slug} → ${msg.substring(0, 80)}`);
    }
  }

  console.log(`\n📊 Résultat : ${ok} OK, ${fail} erreurs\n`);
}

main();
