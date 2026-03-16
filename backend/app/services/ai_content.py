import json
import re
import unicodedata
import uuid
from typing import Any, Dict, List

from app.core import CANONICAL_ROOT_DOMAIN, DEFAULT_LOCALE, SUPPORTED_LOCALES
from app.services.llm import run_structured_llm


def normalize_locale(locale: str | None) -> str:
    if not locale:
        return DEFAULT_LOCALE
    normalized = locale.strip().lower()
    return normalized if normalized in SUPPORTED_LOCALES else DEFAULT_LOCALE


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower())
    ascii_only = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", ascii_only)).strip("-") or f"page-{uuid.uuid4().hex[:8]}"


def build_locale_url(locale: str, slug: str) -> str:
    host = CANONICAL_ROOT_DOMAIN if locale == DEFAULT_LOCALE else f"{locale}.{CANONICAL_ROOT_DOMAIN}"
    path = "/" if slug == "/" else f"/{slug.lstrip('/')}"
    return f"https://{host}{path}"


def as_string(value: Any, fallback: str = "") -> str:
    return value.strip() if isinstance(value, str) else fallback


def as_string_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()]


def extract_image_recommendations(page: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations: List[Dict[str, Any]] = []
    slug = as_string(page.get("slug"), f"page-{uuid.uuid4().hex[:8]}")
    for section in page.get("sections", []):
        if not isinstance(section, dict):
            continue
        for block in section.get("blocks", []):
            if not isinstance(block, dict) or block.get("type") != "image":
                continue
            content = block.get("content") if isinstance(block.get("content"), dict) else {}
            current_src = as_string(content.get("src"))
            alt = as_string(content.get("alt"))
            if not current_src:
                continue
            block_id = as_string(block.get("id"), f"block-{uuid.uuid4().hex}")
            recommendations.append(
                {
                    "blockId": block_id,
                    "currentSrc": current_src,
                    "suggestedFileName": f"{slugify(slug)}-{block_id[-6:]}.webp",
                    "suggestedAlt": alt or f"{as_string(page.get('title'), 'Paris Greeters')} — visuel {len(recommendations) + 1}",
                    "suggestedTitle": as_string(page.get("title"), "Paris Greeters"),
                    "reason": "Image utilisée dans la page, à optimiser pour le référencement.",
                }
            )
    return recommendations


def sanitize_generated_page(plan: Dict[str, Any], locale: str) -> Dict[str, Any]:
    title = as_string(plan.get("title"), "Nouvelle page touristique")
    slug = slugify(as_string(plan.get("slug"), title))
    sections_input = plan.get("sections") if isinstance(plan.get("sections"), list) else []
    sections = []

    for section_index, section in enumerate(sections_input[:6]):
        if not isinstance(section, dict):
            continue
        layout = as_string(section.get("layout"), "default")
        if layout not in {"default", "hero", "two-column", "cards", "centered"}:
            layout = "default"
        background = as_string(section.get("background"), "white")
        if background not in {"white", "gray", "green", "image"}:
            background = "white"
        heading = as_string(section.get("heading"), as_string(section.get("name"), f"Section {section_index + 1}"))
        body = as_string(section.get("body"))
        bullet_points = as_string_list(section.get("bulletPoints"))[:4]
        image_url = as_string(section.get("imageUrl"))
        image_alt = as_string(section.get("imageAlt"), heading)
        cta_label = as_string(section.get("ctaLabel"))
        cta_href = as_string(section.get("ctaHref"), "/")
        blocks: List[Dict[str, Any]] = [{"id": f"block-{uuid.uuid4().hex}", "type": "heading", "order": 0, "content": {"text": heading, "level": "h1" if section_index == 0 and layout == "hero" else "h2"}}]
        text_parts = [body.strip(), *[f"• {entry}" for entry in bullet_points if entry.strip()]]
        text_content = "\n\n".join(part for part in text_parts if part)
        if text_content:
            blocks.append({"id": f"block-{uuid.uuid4().hex}", "type": "text", "order": len(blocks), "content": {"text": text_content}})
        if image_url:
            blocks.append({"id": f"block-{uuid.uuid4().hex}", "type": "image", "order": len(blocks), "content": {"src": image_url, "alt": image_alt, "caption": as_string(section.get("name"), heading)}})
        if cta_label:
            blocks.append({"id": f"block-{uuid.uuid4().hex}", "type": "button", "order": len(blocks), "content": {"text": cta_label, "href": cta_href or "/", "style": "primary" if section_index == 0 else "secondary"}})
        sections.append({"id": f"section-{uuid.uuid4().hex}", "name": as_string(section.get("name"), f"Section {section_index + 1}"), "layout": layout, "background": background, "backgroundImage": as_string(section.get("backgroundImage")) or (image_url if background == "image" else None), "blocks": blocks, "order": section_index})

    page = {"locale": locale, "title": title, "slug": slug, "metaTitle": as_string(plan.get("metaTitle"), title), "metaDescription": as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters."), "metaKeywords": as_string(plan.get("metaKeywords"), "paris, greeters, visite, tourisme"), "canonicalUrl": None, "robotsDirective": "index,follow", "ogTitle": as_string(plan.get("ogTitle"), title), "ogDescription": as_string(plan.get("ogDescription"), as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")), "ogImageUrl": next((block["content"]["src"] for section in sections for block in section["blocks"] if block["type"] == "image"), None), "ogImageAlt": next((block["content"].get("alt") for section in sections for block in section["blocks"] if block["type"] == "image"), None), "twitterTitle": as_string(plan.get("twitterTitle"), title), "twitterDescription": as_string(plan.get("twitterDescription"), as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")), "twitterImageUrl": next((block["content"]["src"] for section in sections for block in section["blocks"] if block["type"] == "image"), None), "focusKeyword": as_string(plan.get("focusKeyword")) or None, "secondaryKeywords": as_string(plan.get("secondaryKeywords")) or None, "schemaOrgJson": None, "imageRecommendations": [], "sitemapPriority": 0.7, "sitemapChangeFreq": "monthly", "isInMenu": bool(plan.get("isInMenu", False)), "menuOrder": int(plan.get("menuOrder", 0) or 0), "menuLabel": as_string(plan.get("menuLabel"), title), "sections": sections}
    page["imageRecommendations"] = extract_image_recommendations(page)
    return page


def sanitize_seo_optimization(result: Dict[str, Any], page: Dict[str, Any], locale: str) -> Dict[str, Any]:
    title = as_string(page.get("title"), "Paris Greeters")
    slug = as_string(page.get("slug"), slugify(title))
    image_recommendations = result.get("imageRecommendations") if isinstance(result.get("imageRecommendations"), list) else extract_image_recommendations(page)
    canonical_url = as_string(result.get("canonicalUrl"))
    if "greeters.paris" not in canonical_url:
        canonical_url = as_string(page.get("canonicalUrl")) or build_locale_url(locale, slug)
    return {"metaTitle": as_string(result.get("metaTitle"), as_string(page.get("metaTitle"), title)), "metaDescription": as_string(result.get("metaDescription"), as_string(page.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")), "focusKeyword": as_string(result.get("focusKeyword"), as_string(page.get("focusKeyword"), title)), "secondaryKeywords": as_string(result.get("secondaryKeywords"), as_string(page.get("secondaryKeywords"), "paris greeters, balade paris, visite locale")), "canonicalUrl": canonical_url, "robotsDirective": as_string(result.get("robotsDirective"), as_string(page.get("robotsDirective"), "index,follow")), "ogTitle": as_string(result.get("ogTitle"), as_string(page.get("ogTitle"), as_string(result.get("metaTitle"), title))), "ogDescription": as_string(result.get("ogDescription"), as_string(page.get("ogDescription"), as_string(result.get("metaDescription"), f"Découvrez {title} avec Paris Greeters."))), "ogImageUrl": as_string(result.get("ogImageUrl")) or page.get("ogImageUrl") or (image_recommendations[0].get("currentSrc") if image_recommendations else None), "ogImageAlt": as_string(result.get("ogImageAlt")) or page.get("ogImageAlt") or (image_recommendations[0].get("suggestedAlt") if image_recommendations else None), "twitterTitle": as_string(result.get("twitterTitle"), as_string(page.get("twitterTitle"), as_string(result.get("ogTitle"), title))), "twitterDescription": as_string(result.get("twitterDescription"), as_string(page.get("twitterDescription"), as_string(result.get("ogDescription"), f"Découvrez {title} avec Paris Greeters."))), "twitterImageUrl": as_string(result.get("twitterImageUrl")) or page.get("twitterImageUrl") or (image_recommendations[0].get("currentSrc") if image_recommendations else None), "schemaOrgJson": as_string(result.get("schemaOrgJson"), json.dumps({"@context": "https://schema.org", "@type": "WebPage", "name": title}, ensure_ascii=False, indent=2)), "sitemapPriority": min(max(float(result.get("sitemapPriority", page.get("sitemapPriority", 0.7)) or 0.7), 0.0), 1.0), "sitemapChangeFreq": as_string(result.get("sitemapChangeFreq"), as_string(page.get("sitemapChangeFreq"), "monthly")), "imageRecommendations": image_recommendations, "optimizationSummary": as_string(result.get("optimizationSummary"), "Optimisation SEO générée automatiquement via IA.")}


async def generate_ai_page(prompt: str, locale: str) -> Dict[str, Any]:
    payload = await run_structured_llm(
        session_id=f"ai-page-{uuid.uuid4().hex}",
        system_message="Tu es le directeur artistique et éditorial de Paris Greeters. Retourne uniquement un JSON valide décrivant une page CMS touristique. Champs obligatoires: title, slug, metaDescription, metaKeywords, isInMenu, menuOrder, menuLabel, sections. Chaque section doit contenir name, layout, background, heading, body, bulletPoints, imageUrl, imageAlt, ctaLabel, ctaHref. Layouts autorisés: default, hero, two-column, cards, centered. Backgrounds autorisés: white, gray, green, image. Langue cible: %s. Produis 3 à 6 sections maximum, ton chaleureux, informations concrètes, aucune explication hors JSON." % locale,
        user_message=prompt,
    )
    return sanitize_generated_page(payload, locale)


async def generate_ai_seo(page: Dict[str, Any], locale: str, instructions: str | None) -> Dict[str, Any]:
    payload = await run_structured_llm(
        session_id=f"ai-seo-{uuid.uuid4().hex}",
        system_message="Tu es un expert SEO senior pour Paris Greeters. Retourne uniquement un JSON valide. Champs obligatoires: metaTitle, metaDescription, focusKeyword, secondaryKeywords, canonicalUrl, robotsDirective, ogTitle, ogDescription, ogImageUrl, ogImageAlt, twitterTitle, twitterDescription, twitterImageUrl, schemaOrgJson, sitemapPriority, sitemapChangeFreq, imageRecommendations, optimizationSummary. Langue cible: %s. Utilise greeters.paris comme domaine canonique et un ton naturel, orienté visiteurs." % locale,
        user_message=json.dumps({"page": page, "instructions": instructions}, ensure_ascii=False),
    )
    return sanitize_seo_optimization(payload, page, locale)
