import { buildLocaleUrl, type AppLocale } from "@/lib/i18n/config";
import { extractImageRecommendationsFromSections } from "@/lib/seo/page-seo";
import { PagesServiceError, type PageInput, type SeoImageRecommendation } from "@/lib/services/pages";

type SeoOptimizationResponse = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  canonicalUrl: string;
  robotsDirective: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string | null;
  schemaOrgJson: string;
  sitemapPriority: number;
  sitemapChangeFreq: string;
  imageRecommendations: SeoImageRecommendation[];
  optimizationSummary: string;
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new PagesServiceError(500, "La clé Gemini est absente de la configuration serveur.");
  }
  return apiKey;
}

function extractJsonString(raw: string) {
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw;
}

function createSeoSchema() {
  return {
    type: "object",
    required: [
      "metaTitle",
      "metaDescription",
      "focusKeyword",
      "secondaryKeywords",
      "canonicalUrl",
      "robotsDirective",
      "ogTitle",
      "ogDescription",
      "twitterTitle",
      "twitterDescription",
      "schemaOrgJson",
      "sitemapPriority",
      "sitemapChangeFreq",
      "imageRecommendations",
      "optimizationSummary",
    ],
    properties: {
      metaTitle: { type: "string" },
      metaDescription: { type: "string" },
      focusKeyword: { type: "string" },
      secondaryKeywords: { type: "string" },
      canonicalUrl: { type: "string" },
      robotsDirective: { type: "string" },
      ogTitle: { type: "string" },
      ogDescription: { type: "string" },
      ogImageUrl: { type: "string" },
      ogImageAlt: { type: "string" },
      twitterTitle: { type: "string" },
      twitterDescription: { type: "string" },
      twitterImageUrl: { type: "string" },
      schemaOrgJson: { type: "string" },
      sitemapPriority: { type: "number" },
      sitemapChangeFreq: { type: "string" },
      optimizationSummary: { type: "string" },
      imageRecommendations: {
        type: "array",
        items: {
          type: "object",
          required: ["blockId", "currentSrc", "suggestedFileName", "suggestedAlt", "suggestedTitle", "reason"],
          properties: {
            blockId: { type: "string" },
            currentSrc: { type: "string" },
            suggestedFileName: { type: "string" },
            suggestedAlt: { type: "string" },
            suggestedTitle: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  };
}

function sanitizeOptimizationResult(result: Partial<SeoOptimizationResponse>, page: PageInput): SeoOptimizationResponse {
  const fallbackImages = extractImageRecommendationsFromSections(page.sections, page.slug);
  const fallbackCanonical = buildLocaleUrl(page.locale, page.slug);
  const sanitizeImageUrl = (value: string | null | undefined) => {
    if (!value || !value.startsWith("http")) {
      return null;
    }

    return value.includes("URL de l'image") ? null : value;
  };
  const canonicalUrl = result.canonicalUrl?.includes("greeters.paris") ? result.canonicalUrl : page.canonicalUrl || fallbackCanonical;

  return {
    metaTitle: result.metaTitle?.trim() || page.metaTitle || page.title,
    metaDescription: result.metaDescription?.trim() || page.metaDescription || page.title,
    focusKeyword: result.focusKeyword?.trim() || page.focusKeyword || page.title,
    secondaryKeywords: result.secondaryKeywords?.trim() || page.secondaryKeywords || "paris greeters, balade paris, visite locale",
    canonicalUrl,
    robotsDirective: result.robotsDirective?.trim() || page.robotsDirective || "index,follow",
    ogTitle: result.ogTitle?.trim() || result.metaTitle?.trim() || page.ogTitle || page.metaTitle || page.title,
    ogDescription: result.ogDescription?.trim() || result.metaDescription?.trim() || page.ogDescription || page.metaDescription || page.title,
    ogImageUrl: sanitizeImageUrl(result.ogImageUrl) || page.ogImageUrl || fallbackImages[0]?.currentSrc || null,
    ogImageAlt: result.ogImageAlt || page.ogImageAlt || fallbackImages[0]?.suggestedAlt || null,
    twitterTitle: result.twitterTitle?.trim() || result.ogTitle?.trim() || page.twitterTitle || page.metaTitle || page.title,
    twitterDescription: result.twitterDescription?.trim() || result.ogDescription?.trim() || page.twitterDescription || page.metaDescription || page.title,
    twitterImageUrl: sanitizeImageUrl(result.twitterImageUrl) || page.twitterImageUrl || sanitizeImageUrl(result.ogImageUrl) || fallbackImages[0]?.currentSrc || null,
    schemaOrgJson: result.schemaOrgJson?.trim() || page.schemaOrgJson || JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: page.title }, null, 2),
    sitemapPriority: typeof result.sitemapPriority === "number" ? Math.max(0, Math.min(1, result.sitemapPriority)) : page.sitemapPriority ?? 0.7,
    sitemapChangeFreq: result.sitemapChangeFreq?.trim() || page.sitemapChangeFreq || "monthly",
    imageRecommendations: Array.isArray(result.imageRecommendations) && result.imageRecommendations.length > 0 ? result.imageRecommendations : fallbackImages,
    optimizationSummary: result.optimizationSummary?.trim() || "Optimisation SEO générée automatiquement via Gemini.",
  };
}

export async function optimizePageSeo(page: PageInput, extraInstructions: string | null, locale: AppLocale) {
  const apiKey = getGeminiApiKey();
  const currentImages = extractImageRecommendationsFromSections(page.sections, page.slug);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `Tu es un expert SEO senior pour Paris Greeters. Tu optimises une page éditoriale touristique, sans sur-optimisation. Réponds uniquement avec un JSON valide. Tu dois proposer : meta title, meta description, focus keyword, secondary keywords, canonical, robots, Open Graph, Twitter, schema.org JSON-LD, image recommendations (filename/alt/title), priorité sitemap et fréquence. Langue cible : ${locale}. Respecte une tonalité naturelle, locale, orientée visiteur humain. Pour schema.org, choisis automatiquement le type LE PLUS pertinent parmi notamment FAQPage, BreadcrumbList, Organization, TouristAttraction, NewsArticle, Event, CollectionPage, ContactPage, ImageGallery, AboutPage, WebPage et génère directement le JSON-LD final le plus approprié pour cette page.`,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                page: {
                  locale: page.locale,
                  title: page.title,
                  slug: page.slug,
                  metaTitle: page.metaTitle,
                  metaDescription: page.metaDescription,
                  metaKeywords: page.metaKeywords,
                  canonicalUrl: page.canonicalUrl,
                  robotsDirective: page.robotsDirective,
                  sections: page.sections,
                  images: currentImages,
                },
                instructions: extraInstructions,
              }),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: createSeoSchema(),
      },
    }),
  });

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!response.ok || typeof text !== "string") {
    const message = payload?.error?.message;
    if (typeof message === "string") {
      throw new PagesServiceError(response.status >= 400 ? response.status : 502, `Gemini SEO : ${message}`);
    }

    throw new PagesServiceError(502, "Gemini n’a pas retourné d’optimisation SEO exploitable.");
  }

  const parsed = JSON.parse(extractJsonString(text)) as Partial<SeoOptimizationResponse>;
  return sanitizeOptimizationResult(parsed, page);
}