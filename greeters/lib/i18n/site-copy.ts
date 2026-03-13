import type { SiteNavigationItem } from "@/lib/public-site-data";

import { type AppLocale } from "./config";

export type PublicPageSlugKey =
  | "qui-sommes-nous"
  | "actualites"
  | "galerie"
  | "livre-dor"
  | "faire-un-don"
  | "devenez-benevole"
  | "contact"
  | "presse"
  | "mentions-legales";

type PublicCopy = {
  bookingCta: string;
  footerSocialTitle: string;
  footerPartnersTitle: string;
  footerLinks: Record<"about" | "volunteer" | "press" | "contact" | "legal", string>;
  pageTitles: Record<PublicPageSlugKey, string>;
  navigation: Record<"home" | "booking" | "guestbook" | "donation" | "gallery" | "news" | "volunteer", string>;
};

const NON_FR_COPY: PublicCopy = {
  bookingCta: "Book a walk",
  footerSocialTitle: "Join us on social media",
  footerPartnersTitle: "Our partners",
  footerLinks: {
    about: "Who are we?",
    volunteer: "Become a volunteer",
    press: "Press",
    contact: "Contact",
    legal: "Legal notice",
  },
  pageTitles: {
    "qui-sommes-nous": "Who are we?",
    actualites: "News",
    galerie: "Gallery",
    "livre-dor": "Guestbook",
    "faire-un-don": "Donate",
    "devenez-benevole": "Become a volunteer",
    contact: "Contact",
    presse: "Press",
    "mentions-legales": "Legal notice",
  },
  navigation: {
    home: "HOME",
    booking: "MEET A GREETER",
    guestbook: "GUESTBOOK",
    donation: "DONATE",
    gallery: "GALLERY",
    news: "NEWS",
    volunteer: "BECOME A VOLUNTEER",
  },
};

const PUBLIC_COPY: Record<AppLocale, PublicCopy> = {
  fr: {
    bookingCta: "Réserver une balade",
    footerSocialTitle: "Rejoignez-nous sur les réseaux sociaux",
    footerPartnersTitle: "Nos partenaires",
    footerLinks: {
      about: "Qui sommes-nous ?",
      volunteer: "Devenez bénévole",
      press: "Presse",
      contact: "Contact",
      legal: "Mentions légales",
    },
    pageTitles: {
      "qui-sommes-nous": "Qui sommes-nous ?",
      actualites: "Actualités",
      galerie: "Galerie",
      "livre-dor": "Livre d'or",
      "faire-un-don": "Faire un don",
      "devenez-benevole": "Devenez bénévole",
      contact: "Contact",
      presse: "Presse",
      "mentions-legales": "Mentions légales",
    },
    navigation: {
      home: "ACCUEIL",
      booking: "RENCONTREZ UN GREETER",
      guestbook: "LIVRE D’OR",
      donation: "FAIRE UN DON",
      gallery: "GALERIE",
      news: "ACTUALITÉS",
      volunteer: "DEVENEZ BÉNÉVOLE",
    },
  },
  en: NON_FR_COPY,
  de: {
    ...NON_FR_COPY,
    bookingCta: "Spaziergang buchen",
    footerSocialTitle: "Folgen Sie uns in den sozialen Netzwerken",
    footerPartnersTitle: "Unsere Partner",
    footerLinks: {
      about: "Wer sind wir?",
      volunteer: "Freiwillige werden",
      press: "Presse",
      contact: "Kontakt",
      legal: "Impressum",
    },
    pageTitles: {
      "qui-sommes-nous": "Wer sind wir?",
      actualites: "Nachrichten",
      galerie: "Galerie",
      "livre-dor": "Gästebuch",
      "faire-un-don": "Spenden",
      "devenez-benevole": "Freiwillige werden",
      contact: "Kontakt",
      presse: "Presse",
      "mentions-legales": "Impressum",
    },
    navigation: {
      home: "STARTSEITE",
      booking: "EINEN GREETER TREFFEN",
      guestbook: "GÄSTEBUCH",
      donation: "SPENDEN",
      gallery: "GALERIE",
      news: "NACHRICHTEN",
      volunteer: "FREIWILLIGE WERDEN",
    },
  },
  es: {
    ...NON_FR_COPY,
    bookingCta: "Reservar un paseo",
    footerSocialTitle: "Únete a nosotros en las redes sociales",
    footerPartnersTitle: "Nuestros socios",
    footerLinks: {
      about: "¿Quiénes somos?",
      volunteer: "Hazte voluntario",
      press: "Prensa",
      contact: "Contacto",
      legal: "Aviso legal",
    },
    pageTitles: {
      "qui-sommes-nous": "¿Quiénes somos?",
      actualites: "Noticias",
      galerie: "Galería",
      "livre-dor": "Libro de visitas",
      "faire-un-don": "Donar",
      "devenez-benevole": "Hazte voluntario",
      contact: "Contacto",
      presse: "Prensa",
      "mentions-legales": "Aviso legal",
    },
    navigation: {
      home: "INICIO",
      booking: "CONOCE A UN GREETER",
      guestbook: "LIBRO DE VISITAS",
      donation: "DONAR",
      gallery: "GALERÍA",
      news: "NOTICIAS",
      volunteer: "HAZTE VOLUNTARIO",
    },
  },
  it: {
    ...NON_FR_COPY,
    bookingCta: "Prenota una passeggiata",
    footerSocialTitle: "Seguici sui social network",
    footerPartnersTitle: "I nostri partner",
    footerLinks: {
      about: "Chi siamo?",
      volunteer: "Diventa volontario",
      press: "Stampa",
      contact: "Contatto",
      legal: "Note legali",
    },
    pageTitles: {
      "qui-sommes-nous": "Chi siamo?",
      actualites: "Notizie",
      galerie: "Galleria",
      "livre-dor": "Libro degli ospiti",
      "faire-un-don": "Dona",
      "devenez-benevole": "Diventa volontario",
      contact: "Contatto",
      presse: "Stampa",
      "mentions-legales": "Note legali",
    },
    navigation: {
      home: "HOME",
      booking: "INCONTRA UN GREETER",
      guestbook: "LIBRO DEGLI OSPITI",
      donation: "DONA",
      gallery: "GALLERIA",
      news: "NOTIZIE",
      volunteer: "DIVENTA VOLONTARIO",
    },
  },
  ja: {
    ...NON_FR_COPY,
    bookingCta: "散策を予約する",
    footerSocialTitle: "SNSで私たちをフォローしてください",
    footerPartnersTitle: "パートナー",
    footerLinks: {
      about: "私たちは誰ですか？",
      volunteer: "ボランティアになる",
      press: "プレス",
      contact: "お問い合わせ",
      legal: "法的表記",
    },
    pageTitles: {
      "qui-sommes-nous": "私たちは誰ですか？",
      actualites: "ニュース",
      galerie: "ギャラリー",
      "livre-dor": "ゲストブック",
      "faire-un-don": "寄付する",
      "devenez-benevole": "ボランティアになる",
      contact: "お問い合わせ",
      presse: "プレス",
      "mentions-legales": "法的表記",
    },
    navigation: {
      home: "ホーム",
      booking: "グリーターに会う",
      guestbook: "ゲストブック",
      donation: "寄付する",
      gallery: "ギャラリー",
      news: "ニュース",
      volunteer: "ボランティアになる",
    },
  },
  nl: {
    ...NON_FR_COPY,
    bookingCta: "Een wandeling boeken",
    footerSocialTitle: "Volg ons op sociale media",
    footerPartnersTitle: "Onze partners",
    footerLinks: {
      about: "Wie zijn wij?",
      volunteer: "Vrijwilliger worden",
      press: "Pers",
      contact: "Contact",
      legal: "Juridische kennisgeving",
    },
    pageTitles: {
      "qui-sommes-nous": "Wie zijn wij?",
      actualites: "Nieuws",
      galerie: "Galerij",
      "livre-dor": "Gastenboek",
      "faire-un-don": "Doneren",
      "devenez-benevole": "Vrijwilliger worden",
      contact: "Contact",
      presse: "Pers",
      "mentions-legales": "Juridische kennisgeving",
    },
    navigation: {
      home: "HOME",
      booking: "ONTMOET EEN GREETER",
      guestbook: "GASTENBOEK",
      donation: "DONEREN",
      gallery: "GALERIJ",
      news: "NIEUWS",
      volunteer: "VRIJWILLIGER WORDEN",
    },
  },
  "pt-pt": {
    ...NON_FR_COPY,
    bookingCta: "Reservar um passeio",
    footerSocialTitle: "Junte-se a nós nas redes sociais",
    footerPartnersTitle: "Os nossos parceiros",
    footerLinks: {
      about: "Quem somos?",
      volunteer: "Torne-se voluntário",
      press: "Imprensa",
      contact: "Contacto",
      legal: "Menções legais",
    },
    pageTitles: {
      "qui-sommes-nous": "Quem somos?",
      actualites: "Notícias",
      galerie: "Galeria",
      "livre-dor": "Livro de visitas",
      "faire-un-don": "Fazer um donativo",
      "devenez-benevole": "Torne-se voluntário",
      contact: "Contacto",
      presse: "Imprensa",
      "mentions-legales": "Menções legais",
    },
    navigation: {
      home: "INÍCIO",
      booking: "CONHEÇA UM GREETER",
      guestbook: "LIVRO DE VISITAS",
      donation: "DOAR",
      gallery: "GALERIA",
      news: "NOTÍCIAS",
      volunteer: "TORNE-SE VOLUNTÁRIO",
    },
  },
  "zh-hans": {
    ...NON_FR_COPY,
    bookingCta: "预订漫步",
    footerSocialTitle: "在社交媒体上关注我们",
    footerPartnersTitle: "合作伙伴",
    footerLinks: {
      about: "我们是谁？",
      volunteer: "成为志愿者",
      press: "新闻资料",
      contact: "联系我们",
      legal: "法律声明",
    },
    pageTitles: {
      "qui-sommes-nous": "我们是谁？",
      actualites: "新闻",
      galerie: "画廊",
      "livre-dor": "留言簿",
      "faire-un-don": "捐赠",
      "devenez-benevole": "成为志愿者",
      contact: "联系我们",
      presse: "新闻资料",
      "mentions-legales": "法律声明",
    },
    navigation: {
      home: "首页",
      booking: "认识一位 Greeter",
      guestbook: "留言簿",
      donation: "捐赠",
      gallery: "画廊",
      news: "新闻",
      volunteer: "成为志愿者",
    },
  },
};

export function getPublicCopy(locale: AppLocale) {
  return PUBLIC_COPY[locale];
}

export function getLocalizedPageTitle(locale: AppLocale, slug: PublicPageSlugKey) {
  return getPublicCopy(locale).pageTitles[slug];
}

export function getLocalizedHeaderFallbackNav(locale: AppLocale): SiteNavigationItem[] {
  const copy = getPublicCopy(locale);

  return [
    { id: "home", label: copy.navigation.home, href: "/", isExternal: false, order: 0, isVisible: true },
    { id: "booking", label: copy.navigation.booking, href: "BOOKING_URL_PLACEHOLDER", isExternal: true, order: 1, isVisible: true },
    { id: "guestbook", label: copy.navigation.guestbook, href: "/livre-dor", isExternal: false, order: 2, isVisible: true },
    { id: "donation", label: copy.navigation.donation, href: "/faire-un-don", isExternal: false, order: 3, isVisible: true },
    { id: "gallery", label: copy.navigation.gallery, href: "/galerie", isExternal: false, order: 4, isVisible: true },
    { id: "news", label: copy.navigation.news, href: "/actualites", isExternal: false, order: 5, isVisible: true },
    { id: "volunteer", label: copy.navigation.volunteer, href: "/devenez-benevole", isExternal: false, order: 6, isVisible: true },
  ];
}

export function getLocalizedFooterLinks(locale: AppLocale) {
  const copy = getPublicCopy(locale);

  return [
    { id: "about", label: copy.footerLinks.about, href: "/qui-sommes-nous" },
    { id: "volunteer", label: copy.footerLinks.volunteer, href: "/devenez-benevole" },
    { id: "press", label: copy.footerLinks.press, href: "/presse" },
    { id: "contact", label: copy.footerLinks.contact, href: "/contact" },
    { id: "legal", label: copy.footerLinks.legal, href: "/mentions-legales" },
  ];
}