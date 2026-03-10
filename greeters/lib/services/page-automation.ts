import { PageStatus } from "@prisma/client";

import { cleanupOrphanedManagedImages } from "@/lib/media/managed-images";
import { generateOgImageForPage } from "@/lib/media/og-generator";
import { prisma } from "@/lib/db/prisma";
import { updatePageRecord } from "@/lib/repositories/pages";
import { optimizePageSeo } from "@/lib/services/ai-seo-optimizer";
import type { PageResponse } from "@/lib/services/pages";

function getSeoPolicyForSlug(slug: string) {
  if (slug === "/") {
    return { robotsDirective: "index,follow", sitemapPriority: 1, sitemapChangeFreq: "weekly" };
  }

  if (slug === "mentions-legales") {
    return { robotsDirective: "noindex,follow", sitemapPriority: 0.2, sitemapChangeFreq: "yearly" };
  }

  if (["actualites", "devenez-benevole", "faire-un-don", "contact"].includes(slug)) {
    return { robotsDirective: "index,follow", sitemapPriority: 0.8, sitemapChangeFreq: "monthly" };
  }

  return { robotsDirective: "index,follow", sitemapPriority: 0.7, sitemapChangeFreq: "monthly" };
}

export async function automatePageSeoAndOg(page: PageResponse, instructions: string | null = null) {
  const policy = getSeoPolicyForSlug(page.slug);
  const optimization = await optimizePageSeo(
    page,
    [
      instructions,
      `Applique cette politique SEO finale : robots=${policy.robotsDirective}, sitemapPriority=${policy.sitemapPriority}, sitemapChangeFreq=${policy.sitemapChangeFreq}.`,
    ]
      .filter(Boolean)
      .join(" "),
    page.locale,
  );

  const ogImage = await generateOgImageForPage(page).catch((error) => {
    console.error("Génération OG image échouée", error);
    return null;
  });

  await updatePageRecord(page.id, {
    metaTitle: optimization.metaTitle,
    metaDescription: optimization.metaDescription,
    focusKeyword: optimization.focusKeyword,
    secondaryKeywords: optimization.secondaryKeywords,
    canonicalUrl: optimization.canonicalUrl,
    robotsDirective: policy.robotsDirective,
    ogTitle: optimization.ogTitle,
    ogDescription: optimization.ogDescription,
    ogImageUrl: ogImage?.src ?? optimization.ogImageUrl,
    ogImageAlt: optimization.ogImageAlt,
    twitterTitle: optimization.twitterTitle,
    twitterDescription: optimization.twitterDescription,
    twitterImageUrl: ogImage?.src ?? optimization.twitterImageUrl,
    schemaOrgJson: optimization.schemaOrgJson,
    imageRecommendations: optimization.imageRecommendations,
    sitemapPriority: policy.sitemapPriority,
    sitemapChangeFreq: policy.sitemapChangeFreq,
  });

  await cleanupOrphanedManagedImages();
}

export async function automateExistingPublicPages(locale?: string) {
  const pages = await prisma.page.findMany({
    where: {
      status: PageStatus.PUBLISHED,
      ...(locale ? { locale } : {}),
    },
    orderBy: [{ menuOrder: "asc" }, { createdAt: "asc" }],
  });

  let processed = 0;

  for (const page of pages) {
    await automatePageSeoAndOg({
      id: page.id,
      locale: page.locale as PageResponse["locale"],
      title: page.title,
      slug: page.slug,
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
      imageRecommendations: Array.isArray(page.imageRecommendations) ? (page.imageRecommendations as PageResponse["imageRecommendations"]) : [],
      sitemapPriority: page.sitemapPriority,
      sitemapChangeFreq: page.sitemapChangeFreq,
      sections: Array.isArray(page.sections) ? (page.sections as PageResponse["sections"]) : [],
      status: page.status === PageStatus.DRAFT ? "draft" : page.status === PageStatus.PENDING ? "pending" : page.status === PageStatus.ARCHIVED ? "archived" : "published",
      currentVersion: page.currentVersion,
      publishedVersion: page.publishedVersion,
      isInMenu: page.isInMenu,
      menuOrder: page.menuOrder,
      menuLabel: page.menuLabel,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy,
      createdAt: page.createdAt.toISOString(),
      updatedAt: (page.updatedAt ?? page.createdAt).toISOString(),
    });
    processed += 1;
  }

  return { processed };
}