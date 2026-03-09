import { listHomeSections } from "@/lib/repositories/home-sections";
import { HOME_PAGE_FALLBACK, type HomeArticle, type Testimonial } from "@/lib/public-site-data";

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

export async function getHomePageContent() {
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