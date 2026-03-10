import type { HomeArticle, GalleryImage, Testimonial } from "@/lib/public-site-data";
import { getRequestLocale } from "@/lib/i18n/request";
import { findPublicPageBySlug, type CmsSection } from "@/lib/services/pages";

type CmsBlock = CmsSection["blocks"][number];

function getSectionsBlocks(page: Awaited<ReturnType<typeof findPublicPageBySlug>>) {
  return page?.sections ?? [];
}

function getFirstBlockOfType(section: CmsSection, type: CmsBlock["type"]) {
  return section.blocks.find((block) => block.type === type);
}

function getTextFromBlock(block: CmsBlock | undefined, key = "text") {
  const value = block?.content?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getTitleFromPage(page: Awaited<ReturnType<typeof findPublicPageBySlug>>, fallbackTitle: string) {
  return page?.title?.trim() || fallbackTitle;
}

export async function getPublishedCmsPage(slug: string) {
  return findPublicPageBySlug(slug, await getRequestLocale()).catch(() => null);
}

export async function getContactCmsContent(fallbackTitle: string, fallbackIntro: string) {
  const page = await getPublishedCmsPage("contact");
  const firstSection = getSectionsBlocks(page)[0];

  return {
    title: getTitleFromPage(page, fallbackTitle),
    intro:
      getTextFromBlock(getFirstBlockOfType(firstSection, "text")) ||
      fallbackIntro,
  };
}

export async function getActualitesCmsContent(fallbackTitle: string, fallbackItems: HomeArticle[]) {
  const page = await getPublishedCmsPage("actualites");

  if (!page) {
    return { title: fallbackTitle, items: fallbackItems };
  }

  const items = page.sections
    .map((section, index) => {
      const heading = getTextFromBlock(getFirstBlockOfType(section, "heading"));
      const text = getTextFromBlock(getFirstBlockOfType(section, "text"));
      const image = getFirstBlockOfType(section, "image");
      const button = getFirstBlockOfType(section, "button");
      const [day = fallbackItems[index]?.day ?? "01", month = fallbackItems[index]?.month ?? "Jan"] = getTextFromBlock(image, "caption").split("|");

      const src = getTextFromBlock(image, "src") || fallbackItems[index]?.image || "/images/uploads/greeters-balade-1.jpg";

      return {
        id: section.id,
        day: day.trim(),
        month: month.trim(),
        title: heading || fallbackItems[index]?.title || `Actualité ${index + 1}`,
        excerpt: text || fallbackItems[index]?.excerpt || "",
        image: src,
        link: getTextFromBlock(button, "href") || fallbackItems[index]?.link || "/actualites",
      } satisfies HomeArticle;
    })
    .filter((item) => item.title);

  return {
    title: getTitleFromPage(page, fallbackTitle),
    items: items.length > 0 ? items : fallbackItems,
  };
}

export async function getGalleryCmsContent(fallbackTitle: string, fallbackItems: GalleryImage[]) {
  const page = await getPublishedCmsPage("galerie");

  if (!page) {
    return { title: fallbackTitle, items: fallbackItems };
  }

  const items = page.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.type === "image")
    .map((block, index) => ({
      id: block.id,
      title: getTextFromBlock(block, "alt") || fallbackItems[index]?.title || `Galerie ${index + 1}`,
      date: getTextFromBlock(block, "caption") || fallbackItems[index]?.date || "2026",
      src: getTextFromBlock(block, "src") || fallbackItems[index]?.src || "/images/uploads/greeters-balade-1.jpg",
    }))
    .filter((item) => item.src);

  return {
    title: getTitleFromPage(page, fallbackTitle),
    items: items.length > 0 ? items : fallbackItems,
  };
}

export async function getGuestbookCmsContent(fallbackTitle: string, fallbackItems: Testimonial[]) {
  const page = await getPublishedCmsPage("livre-dor");

  if (!page) {
    return { title: fallbackTitle, items: fallbackItems };
  }

  const items = page.sections
    .map((section, index) => {
      const quote = getTextFromBlock(getFirstBlockOfType(section, "text"));
      const location = getTextFromBlock(getFirstBlockOfType(section, "button"));

      return {
        id: section.id,
        content: quote || fallbackItems[index]?.content || "",
        author: section.name || fallbackItems[index]?.author || `Visiteur ${index + 1}`,
        location: location || fallbackItems[index]?.location || "Paris",
      } satisfies Testimonial;
    })
    .filter((item) => item.content);

  return {
    title: getTitleFromPage(page, fallbackTitle),
    items: items.length > 0 ? items : fallbackItems,
  };
}