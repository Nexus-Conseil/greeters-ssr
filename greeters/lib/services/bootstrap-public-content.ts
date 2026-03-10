import type { AuthUser } from "@/lib/auth/session";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { getLocalizedPageTitle, getPublicCopy, type PublicPageSlugKey } from "@/lib/i18n/site-copy";
import {
  ACTUALITES_PAGE_ITEMS,
  GALLERY_PAGE_IMAGES,
  GUESTBOOK_ITEMS,
  PRESS_PHOTOS,
  VOLUNTEER_BENEFITS,
  VOLUNTEER_REQUIREMENTS,
  WHO_WE_ARE_VALUES,
} from "@/lib/public-pages-data";
import { HOME_PAGE_FALLBACK } from "@/lib/public-site-data";
import { upsertHomeSectionRecord } from "@/lib/repositories/home-sections";
import { findPageBySlug } from "@/lib/repositories/pages";
import { updateMenu, type MenuItem } from "@/lib/services/menu";
import { createPage, type CmsBlock, type CmsSection, type PageInput, updatePage } from "@/lib/services/pages";

type PageBlueprint = {
  slug: PublicPageSlugKey;
  isInMenu: boolean;
  menuOrder: number;
  menuLabel: (locale: AppLocale) => string | null;
  buildSections: () => CmsSection[];
};

function createBlock(type: CmsBlock["type"], content: CmsBlock["content"], order: number): CmsBlock {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    order,
  };
}

function createSection(name: string, blocks: CmsBlock[], order: number, background = "white", layout = "default"): CmsSection {
  return {
    id: crypto.randomUUID(),
    name,
    layout,
    background,
    backgroundImage: null,
    blocks,
    order,
  };
}

function buildMenuItems(locale: AppLocale): MenuItem[] {
  const copy = getPublicCopy(locale);

  return [
    { id: `menu-home-${locale}`, label: copy.navigation.home, href: "/", isExternal: false, order: 0, isVisible: true },
    { id: `menu-booking-${locale}`, label: copy.navigation.booking, href: "BOOKING_URL_PLACEHOLDER", isExternal: true, order: 1, isVisible: true },
    { id: `menu-guestbook-${locale}`, label: copy.navigation.guestbook, href: "/livre-dor", isExternal: false, order: 2, isVisible: true },
    { id: `menu-donation-${locale}`, label: copy.navigation.donation, href: "/faire-un-don", isExternal: false, order: 3, isVisible: true },
    { id: `menu-gallery-${locale}`, label: copy.navigation.gallery, href: "/galerie", isExternal: false, order: 4, isVisible: true },
    { id: `menu-news-${locale}`, label: copy.navigation.news, href: "/actualites", isExternal: false, order: 5, isVisible: true },
    { id: `menu-volunteer-${locale}`, label: copy.navigation.volunteer, href: "/devenez-benevole", isExternal: false, order: 6, isVisible: true },
  ];
}

const PAGE_BLUEPRINTS: PageBlueprint[] = [
  {
    slug: "qui-sommes-nous",
    isInMenu: false,
    menuOrder: 20,
    menuLabel: () => null,
    buildSections: () => [
      createSection("Association", [
        createBlock("heading", { text: "Association Paris Greeters", level: "h2" }, 0),
        createBlock("text", { text: "Association loi 1901 à but non lucratif, « Parisien d'un jour – Paris Greeters » organise des balades gratuites dans la ville de Paris ou dans les communes alentours, accessibles par le métro, hors des sentiers battus et loin des grands axes touristiques." }, 1),
        createBlock("button", { text: "Télécharger la charte", href: "/documents/8cae8c91_charte-2020.pdf", style: "secondary" }, 2),
      ], 0),
      createSection("IGA", [
        createBlock("text", { text: "« Parisien d'un jour - Paris Greeters » est membre de l'International Greeters Association (IGA) et s'engage à respecter ses valeurs fondamentales." }, 0),
      ], 1, "sand"),
      createSection("Nos valeurs", [
        createBlock("heading", { text: "Nos valeurs", level: "h2" }, 0),
        createBlock("text", { text: WHO_WE_ARE_VALUES.join("\n") }, 1),
      ], 2),
      createSection("Important", [
        createBlock("heading", { text: "Important", level: "h3" }, 0),
        createBlock("text", { text: "Les visites proposées par les Greeters sont uniquement des balades amicales dans un quartier fréquenté régulièrement par le Greeter. Nous ne proposons aucune visite de musée ou nécessitant une expertise spécifique." }, 1),
      ], 3, "cream"),
    ],
  },
  {
    slug: "actualites",
    isInMenu: true,
    menuOrder: 5,
    menuLabel: (locale) => getPublicCopy(locale).navigation.news,
    buildSections: () =>
      ACTUALITES_PAGE_ITEMS.map((item, index) =>
        createSection(item.title, [
          createBlock("heading", { text: item.title, level: "h2" }, 0),
          createBlock("text", { text: item.excerpt }, 1),
          createBlock("image", { src: item.image, alt: item.title, caption: `${item.day}|${item.month}` }, 2),
          createBlock("button", { text: "Lire la suite", href: item.link, style: "outline" }, 3),
        ], index),
      ),
  },
  {
    slug: "galerie",
    isInMenu: true,
    menuOrder: 4,
    menuLabel: (locale) => getPublicCopy(locale).navigation.gallery,
    buildSections: () => [
      createSection(
        "Galerie photos",
        GALLERY_PAGE_IMAGES.map((item, index) => createBlock("image", { src: item.src, alt: item.title, caption: item.date }, index)),
        0,
      ),
    ],
  },
  {
    slug: "livre-dor",
    isInMenu: true,
    menuOrder: 2,
    menuLabel: (locale) => getPublicCopy(locale).navigation.guestbook,
    buildSections: () =>
      GUESTBOOK_ITEMS.map((item, index) =>
        createSection(item.author, [
          createBlock("text", { text: item.content }, 0),
          createBlock("button", { text: item.location, href: "/livre-dor", style: "secondary" }, 1),
        ], index, index % 2 === 0 ? "white" : "sand"),
      ),
  },
  {
    slug: "faire-un-don",
    isInMenu: true,
    menuOrder: 3,
    menuLabel: (locale) => getPublicCopy(locale).navigation.donation,
    buildSections: () => [
      createSection("Soutenez les Greeters", [
        createBlock("heading", { text: "Soutenez les Greeters de Paris", level: "h2" }, 0),
        createBlock("text", { text: "Vous avez été satisfait de votre balade avec un bénévole de « Parisien d'un jour – Paris Greeters », alors n'hésitez pas à nous soutenir. Notre association fonctionne uniquement grâce aux dons." }, 1),
        createBlock("image", { src: "/images/uploads/greeters-balade-2.jpg", alt: "Balade avec les Greeters de Paris", caption: "Paris Greeters" }, 2),
      ], 0),
      createSection("PayPal", [
        createBlock("text", { text: "Don en ligne sécurisé : vous n'avez pas besoin d'avoir un compte PayPal, votre carte bancaire suffit." }, 0),
        createBlock("button", { text: "Faire un don", href: "https://www.paypal.com/cgi-bin/webscr", style: "primary" }, 1),
      ], 1),
      createSection("Par chèque", [
        createBlock("text", { text: "À l'ordre de l'association : Trésorier Parisien d'un jour — Maison de la vie associative et citoyenne Paris Centre, Bal N°50 – 5 Rue Perrée, 75003 PARIS (France)." }, 0),
      ], 2),
      createSection("Par virement bancaire", [
        createBlock("text", { text: "Titulaire : Parisien d'un jour, parisien toujours\nN° compte : 5367998L020\nIBAN : FR20 2004 1000 01 53 67 99 8L02 029\nBIC : PSSTFRPPPAR\nBanque : La Banque Postale" }, 0),
      ], 3),
    ],
  },
  {
    slug: "devenez-benevole",
    isInMenu: true,
    menuOrder: 6,
    menuLabel: (locale) => getPublicCopy(locale).navigation.volunteer,
    buildSections: () => [
      createSection("Hero", [
        createBlock("heading", { text: "Partagez votre passion pour Paris avec des visiteurs du monde entier", level: "h2" }, 0),
        createBlock("image", { src: "/images/uploads/devenez-benevole.png", alt: "Devenez bénévole Greeter", caption: "Paris Greeters" }, 1),
      ], 0, "sand"),
      createSection("Rejoignez notre équipe", [
        createBlock("text", { text: "Les Greeters sont des habitants qui font découvrir gratuitement leur quartier, leur ville ou leur région à des visiteurs venus du monde entier. Ce sont des rencontres uniques, authentiques et chaleureuses." }, 0),
        createBlock("text", { text: "En devenant Greeter, vous partagez votre amour de Paris et créez des liens avec des personnes de cultures différentes. C'est une expérience enrichissante qui vous permet de redécouvrir votre propre ville à travers les yeux de vos visiteurs." }, 1),
      ], 1),
      ...VOLUNTEER_BENEFITS.map((item, index) =>
        createSection(item.title, [
          createBlock("heading", { text: item.title, level: "h3" }, 0),
          createBlock("text", { text: item.description }, 1),
        ], index + 2),
      ),
      createSection("Conditions", [
        createBlock("heading", { text: "Pour devenir Greeter, il vous faut :", level: "h2" }, 0),
        createBlock("text", { text: VOLUNTEER_REQUIREMENTS.join("\n") }, 1),
        createBlock("button", { text: "Postuler pour devenir Greeter", href: "https://docs.google.com/forms/d/1R4Q85pNX60rDTLkwO24WYH6nAH2VEd13SvfAEVzgLd0/viewform", style: "primary" }, 2),
      ], VOLUNTEER_BENEFITS.length + 2, "cream"),
    ],
  },
  {
    slug: "contact",
    isInMenu: false,
    menuOrder: 30,
    menuLabel: () => null,
    buildSections: () => [
      createSection("Formulaire de contact", [
        createBlock("text", { text: "Si vous souhaitez savoir où en est votre demande, y apporter des modifications, obtenir un remboursement de votre don ou obtenir plus d'informations sur Parisien d'un jour – Paris Greeters, envoyez-nous un message via le formulaire de contact." }, 0),
      ], 0),
    ],
  },
  {
    slug: "presse",
    isInMenu: false,
    menuOrder: 40,
    menuLabel: () => null,
    buildSections: () => [
      createSection("Dossier de presse", [
        createBlock("heading", { text: "Dossier de presse", level: "h2" }, 0),
        createBlock("button", { text: "Télécharger le dossier de presse (PDF)", href: "/documents/a428d596_dossier-de-presse-FFG-2020.pdf", style: "secondary" }, 1),
      ], 0),
      createSection(
        "Photos libres de droit",
        PRESS_PHOTOS.flatMap((photo, index) => [
          createBlock("image", { src: photo.src, alt: photo.title, caption: photo.date }, index * 2),
          createBlock("text", { text: photo.title }, index * 2 + 1),
        ]),
        1,
      ),
      createSection("Contact presse", [
        createBlock("text", { text: "Pour toute demande d'information ou d'interview, contactez notre service presse : presse@parisgreeters.fr" }, 0),
      ], 2),
    ],
  },
  {
    slug: "mentions-legales",
    isInMenu: false,
    menuOrder: 50,
    menuLabel: () => null,
    buildSections: () => [
      createSection("Éditeur", [
        createBlock("heading", { text: "Éditeur, conception et réalisation", level: "h2" }, 0),
        createBlock("text", { text: "Association « Parisien d'un jour – Paris Greeters »\nMaison de la vie associative et citoyenne du 3e et 4e\nBal N°50 – 5 Rue Perrée\n75003 PARIS (France)\nAssociation à but non lucratif, créée le 27 Novembre 2006\nSIRET : 494 059 827 00043" }, 1),
      ], 0),
      createSection("Charte", [
        createBlock("text", { text: "L'association Parisien d'un jour, membre du réseau international Global Greeters, engage chacun de ses membres adhérents à respecter et à suivre sa charte." }, 0),
        createBlock("button", { text: "Télécharger la Charte des Greeters de « Parisien d'un Jour »", href: "/documents/8cae8c91_charte-2020.pdf", style: "secondary" }, 1),
      ], 1),
      createSection("Responsabilités", [
        createBlock("text", { text: "Responsabilité lors des balades : Les balades se font sous la responsabilité de chacun des participants.\nInformations du site : Les informations mises en ligne étaient correctes au moment de leur publication.\nLiens externes : L'association n'est pas responsable des prestations délivrées par des tiers." }, 0),
      ], 2),
      createSection("Hébergement", [
        createBlock("text", { text: "Ce site est hébergé par Nexus Conseil." }, 0),
      ], 3),
    ],
  },
];

async function bootstrapHomeSections() {
  await upsertHomeSectionRecord("hero", {
    order: 0,
    content: {
      slogan: HOME_PAGE_FALLBACK.hero.slogan,
      subtitle: HOME_PAGE_FALLBACK.hero.subtitle,
      title: HOME_PAGE_FALLBACK.intro.title,
      tagline: HOME_PAGE_FALLBACK.intro.tagline,
      cta_text: HOME_PAGE_FALLBACK.intro.ctaText,
    },
    items: [],
  });

  await upsertHomeSectionRecord("greeters", {
    order: 1,
    content: {
      title: HOME_PAGE_FALLBACK.greeters.title,
      subtitle: HOME_PAGE_FALLBACK.greeters.subtitle,
      description: HOME_PAGE_FALLBACK.greeters.paragraphs,
      cta_text: HOME_PAGE_FALLBACK.greeters.ctaText,
    },
    items: [],
  });

  await upsertHomeSectionRecord("visit", {
    order: 2,
    content: {
      title: HOME_PAGE_FALLBACK.visit.title,
      paragraphs: HOME_PAGE_FALLBACK.visit.paragraphs,
    },
    items: [],
  });

  await upsertHomeSectionRecord("actualites", {
    order: 3,
    content: {
      title: HOME_PAGE_FALLBACK.actualites.title,
      items: HOME_PAGE_FALLBACK.actualites.items,
    },
    items: HOME_PAGE_FALLBACK.actualites.items,
  });

  await upsertHomeSectionRecord("testimonials", {
    order: 4,
    content: {
      title: HOME_PAGE_FALLBACK.testimonials.title,
      items: HOME_PAGE_FALLBACK.testimonials.items,
    },
    items: HOME_PAGE_FALLBACK.testimonials.items,
  });
}

async function upsertLocalizedPage(locale: AppLocale, blueprint: PageBlueprint, user: AuthUser) {
  const title = getLocalizedPageTitle(locale, blueprint.slug);
  const payload: PageInput = {
    locale,
    title,
    slug: blueprint.slug,
    metaDescription: `Paris Greeters — ${title}`,
    metaKeywords: "paris greeters, balade, visite, paris",
    sections: blueprint.buildSections(),
    isInMenu: blueprint.isInMenu,
    menuOrder: blueprint.menuOrder,
    menuLabel: blueprint.menuLabel(locale),
  };

  const existingPage = await findPageBySlug(blueprint.slug, locale);

  if (existingPage) {
    await updatePage(existingPage.id, { ...payload, status: "published" }, user);
    return "updated" as const;
  }

  await createPage(payload, user);
  return "created" as const;
}

export async function bootstrapPublicContent(user: AuthUser) {
  const report = {
    homeSectionsUpdated: 0,
    pagesCreated: 0,
    pagesUpdated: 0,
    menusUpdated: 0,
  };

  await bootstrapHomeSections();
  report.homeSectionsUpdated = 5;

  for (const locale of SUPPORTED_LOCALES) {
    for (const blueprint of PAGE_BLUEPRINTS) {
      const result = await upsertLocalizedPage(locale, blueprint, user);

      if (result === "created") {
        report.pagesCreated += 1;
      } else {
        report.pagesUpdated += 1;
      }
    }

    await updateMenu(buildMenuItems(locale), user.id, locale);
    report.menusUpdated += 1;
  }

  return report;
}