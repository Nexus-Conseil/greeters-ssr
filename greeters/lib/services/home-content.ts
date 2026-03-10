import { getRequestLocale } from "@/lib/i18n/request";
import { listHomeSections } from "@/lib/repositories/home-sections";
import { HOME_PAGE_FALLBACK, type HomeArticle, type Testimonial } from "@/lib/public-site-data";
import { findPublicPageBySlug, type CmsBlock, type PageResponse } from "@/lib/services/pages";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getArticles(value: unknown, fallback: HomeArticle[]) {
  return Array.isArray(value) && value.length > 0 ? (value as HomeArticle[]) : fallback;
}

function getTestimonials(value: unknown, fallback: Testimonial[]) {
  return Array.isArray(value) && value.length > 0 ? (value as Testimonial[]) : fallback;
}

function getSection(page: PageResponse | null, name: string) {
  return page?.sections.find((section) => section.name.toLowerCase() === name.toLowerCase()) ?? null;
}

function getBlock(section: PageResponse["sections"][number] | null, type: CmsBlock["type"], offset = 0) {
  return section?.blocks.filter((block) => block.type === type)[offset] ?? null;
}

function blockString(block: CmsBlock | null, key: string, fallback: string) {
  const value = block?.content?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function splitParagraphs(value: string[], fallback: string[]) {
  return value.length > 0 ? value : fallback;
}

function splitText(block: CmsBlock | null, fallback: string[]) {
  const raw = blockString(block, "text", "");
  if (!raw) {
    return fallback;
  }

  return splitParagraphs(raw.split(/\n{2,}|\n/).map((entry) => entry.trim()).filter(Boolean), fallback);
}

function getHomePageFromCms(page: PageResponse | null) {
  if (!page) {
    return null;
  }

  const hero = getSection(page, "hero");
  const intro = getSection(page, "intro");
  const greeters = getSection(page, "greeters");
  const visit = getSection(page, "visit");
  const gallery = getSection(page, "gallery");
  const newsSections = page.sections.filter((section) => section.name.startsWith("actualites-"));
  const testimonialSections = page.sections.filter((section) => section.name.startsWith("testimonial-"));

  const actualitesItems = newsSections.map((section, index) => ({
    id: section.id,
    day: blockString(getBlock(section, "image"), "caption", HOME_PAGE_FALLBACK.actualites.items[index]?.day ?? "01").split("|")[0]?.trim() || "01",
    month: blockString(getBlock(section, "image"), "caption", HOME_PAGE_FALLBACK.actualites.items[index]?.month ?? "Jan").split("|")[1]?.trim() || "Jan",
    title: blockString(getBlock(section, "heading"), "text", HOME_PAGE_FALLBACK.actualites.items[index]?.title ?? `Actualité ${index + 1}`),
    excerpt: blockString(getBlock(section, "text"), "text", HOME_PAGE_FALLBACK.actualites.items[index]?.excerpt ?? ""),
    image: blockString(getBlock(section, "image"), "src", HOME_PAGE_FALLBACK.actualites.items[index]?.image ?? "/images/actualites_handicap.webp"),
    link: blockString(getBlock(section, "button"), "href", HOME_PAGE_FALLBACK.actualites.items[index]?.link ?? "/actualites"),
  }));

  const testimonialItems = testimonialSections.map((section, index) => ({
    id: section.id,
    content: blockString(getBlock(section, "text"), "text", HOME_PAGE_FALLBACK.testimonials.items[index]?.content ?? ""),
    author: section.name.replace(/^testimonial-\d+/, HOME_PAGE_FALLBACK.testimonials.items[index]?.author ?? `Visiteur ${index + 1}`),
    location: blockString(getBlock(section, "button"), "text", HOME_PAGE_FALLBACK.testimonials.items[index]?.location ?? "Paris"),
  }));

  const galleryItems = (gallery?.blocks ?? [])
    .filter((block) => block.type === "image")
    .map((block, index) => ({
      id: block.id,
      title: blockString(block, "alt", HOME_PAGE_FALLBACK.gallery.items[index]?.title ?? `Galerie ${index + 1}`),
      date: blockString(block, "caption", HOME_PAGE_FALLBACK.gallery.items[index]?.date ?? "2026"),
      src: blockString(block, "src", HOME_PAGE_FALLBACK.gallery.items[index]?.src ?? "/images/gallery/gallery1.jpg"),
    }));

  return {
    hero: {
      ...HOME_PAGE_FALLBACK.hero,
      slogan: blockString(getBlock(hero, "heading"), "text", HOME_PAGE_FALLBACK.hero.slogan),
      subtitle: blockString(getBlock(hero, "text"), "text", HOME_PAGE_FALLBACK.hero.subtitle),
      image: blockString(getBlock(hero, "image"), "src", HOME_PAGE_FALLBACK.hero.image),
      imageAlt: blockString(getBlock(hero, "image"), "alt", HOME_PAGE_FALLBACK.hero.imageAlt),
    },
    intro: {
      ...HOME_PAGE_FALLBACK.intro,
      title: blockString(getBlock(intro, "heading"), "text", HOME_PAGE_FALLBACK.intro.title),
      tagline: blockString(getBlock(intro, "text"), "text", HOME_PAGE_FALLBACK.intro.tagline),
      ctaText: blockString(getBlock(intro, "button"), "text", HOME_PAGE_FALLBACK.intro.ctaText),
    },
    greeters: {
      ...HOME_PAGE_FALLBACK.greeters,
      title: blockString(getBlock(greeters, "heading"), "text", HOME_PAGE_FALLBACK.greeters.title),
      subtitle: blockString(getBlock(greeters, "image"), "caption", HOME_PAGE_FALLBACK.greeters.subtitle),
      paragraphs: splitText(getBlock(greeters, "text"), HOME_PAGE_FALLBACK.greeters.paragraphs),
      ctaText: blockString(getBlock(greeters, "button"), "text", HOME_PAGE_FALLBACK.greeters.ctaText),
      image: blockString(getBlock(greeters, "image"), "src", HOME_PAGE_FALLBACK.greeters.image),
      imageAlt: blockString(getBlock(greeters, "image"), "alt", HOME_PAGE_FALLBACK.greeters.imageAlt),
    },
    visit: {
      ...HOME_PAGE_FALLBACK.visit,
      title: blockString(getBlock(visit, "heading"), "text", HOME_PAGE_FALLBACK.visit.title),
      paragraphs: splitText(getBlock(visit, "text"), HOME_PAGE_FALLBACK.visit.paragraphs),
      image: blockString(getBlock(visit, "image"), "src", HOME_PAGE_FALLBACK.visit.image),
      imageAlt: blockString(getBlock(visit, "image"), "alt", HOME_PAGE_FALLBACK.visit.imageAlt),
    },
    actualites: {
      ...HOME_PAGE_FALLBACK.actualites,
      items: actualitesItems.length > 0 ? actualitesItems : HOME_PAGE_FALLBACK.actualites.items,
    },
    testimonials: {
      ...HOME_PAGE_FALLBACK.testimonials,
      items: testimonialItems.length > 0 ? testimonialItems : HOME_PAGE_FALLBACK.testimonials.items,
    },
    gallery: {
      ...HOME_PAGE_FALLBACK.gallery,
      items: galleryItems.length > 0 ? galleryItems : HOME_PAGE_FALLBACK.gallery.items,
    },
  };
}

export async function getHomePageContent() {
  const locale = await getRequestLocale();
  const homepage = await findPublicPageBySlug("/", locale).catch(() => null);
  const cmsHomepageContent = getHomePageFromCms(homepage);

  if (cmsHomepageContent) {
    return cmsHomepageContent;
  }

  const sections = await listHomeSections().catch(() => []);
  const sectionMap = new Map(sections.map((section) => [section.sectionType, section]));

  const heroSection = sectionMap.get("hero");
  const greetersSection = sectionMap.get("greeters");
  const visitSection = sectionMap.get("visit");
  const actualitesSection = sectionMap.get("actualites");
  const testimonialsSection = sectionMap.get("testimonials");

  const heroContent = isRecord(heroSection?.content) ? heroSection.content : {};
  const greetersContent = isRecord(greetersSection?.content) ? greetersSection.content : {};
  const visitContent = isRecord(visitSection?.content) ? visitSection.content : {};
  const actualitesContent = isRecord(actualitesSection?.content) ? actualitesSection.content : {};
  const testimonialsContent = isRecord(testimonialsSection?.content) ? testimonialsSection.content : {};

  return {
    hero: {
      ...HOME_PAGE_FALLBACK.hero,
      slogan: getString(heroContent.slogan, HOME_PAGE_FALLBACK.hero.slogan),
      subtitle: getString(heroContent.subtitle, HOME_PAGE_FALLBACK.hero.subtitle),
    },
    intro: {
      ...HOME_PAGE_FALLBACK.intro,
      title: getString(heroContent.title, HOME_PAGE_FALLBACK.intro.title),
      tagline: getString(heroContent.tagline, HOME_PAGE_FALLBACK.intro.tagline),
      ctaText: getString(heroContent.cta_text, HOME_PAGE_FALLBACK.intro.ctaText),
    },
    greeters: {
      ...HOME_PAGE_FALLBACK.greeters,
      title: getString(greetersContent.title, HOME_PAGE_FALLBACK.greeters.title),
      subtitle: getString(greetersContent.subtitle, HOME_PAGE_FALLBACK.greeters.subtitle),
      paragraphs: Array.isArray(greetersContent.description) && greetersContent.description.length > 0
        ? (greetersContent.description as string[])
        : HOME_PAGE_FALLBACK.greeters.paragraphs,
      ctaText: getString(greetersContent.cta_text, HOME_PAGE_FALLBACK.greeters.ctaText),
    },
    visit: {
      ...HOME_PAGE_FALLBACK.visit,
      title: getString(visitContent.title, HOME_PAGE_FALLBACK.visit.title),
      paragraphs: Array.isArray(visitContent.paragraphs) && visitContent.paragraphs.length > 0
        ? (visitContent.paragraphs as string[])
        : HOME_PAGE_FALLBACK.visit.paragraphs,
    },
    actualites: {
      ...HOME_PAGE_FALLBACK.actualites,
      title: getString(actualitesContent.title, HOME_PAGE_FALLBACK.actualites.title),
      items: getArticles(actualitesSection?.items ?? actualitesContent.items, HOME_PAGE_FALLBACK.actualites.items),
    },
    testimonials: {
      ...HOME_PAGE_FALLBACK.testimonials,
      title: getString(testimonialsContent.title, HOME_PAGE_FALLBACK.testimonials.title),
      items: getTestimonials(testimonialsSection?.items ?? testimonialsContent.items, HOME_PAGE_FALLBACK.testimonials.items),
    },
    gallery: HOME_PAGE_FALLBACK.gallery,
  };
}