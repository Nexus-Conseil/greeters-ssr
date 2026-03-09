import type { AppLocale } from "@/lib/i18n/config";

export type SiteNavigationItem = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  order: number;
  isVisible: boolean;
};

export type HomeArticle = {
  id: string;
  day: string;
  month: string;
  title: string;
  excerpt: string;
  image: string;
  link: string;
};

export type Testimonial = {
  id: string;
  content: string;
  author: string;
  location: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  date: string;
  src: string;
};

export type Partner = {
  id: string;
  name: string;
  logo: string;
  link: string;
};

export type SocialLink = {
  id: string;
  label: string;
  href: string;
};

export const HEADER_FALLBACK_NAV: SiteNavigationItem[] = [
  { id: "home", label: "ACCUEIL", href: "/", isExternal: false, order: 0, isVisible: true },
  { id: "booking", label: "RENCONTREZ UN GREETER", href: "BOOKING_URL_PLACEHOLDER", isExternal: true, order: 1, isVisible: true },
  { id: "guestbook", label: "LIVRE D’OR", href: "/livre-dor", isExternal: false, order: 2, isVisible: true },
  { id: "donation", label: "FAIRE UN DON", href: "/faire-un-don", isExternal: false, order: 3, isVisible: true },
  { id: "gallery", label: "GALERIE", href: "/galerie", isExternal: false, order: 4, isVisible: true },
  { id: "news", label: "ACTUALITÉS", href: "/actualites", isExternal: false, order: 5, isVisible: true },
  { id: "volunteer", label: "DEVENEZ BÉNÉVOLE", href: "/devenez-benevole", isExternal: false, order: 6, isVisible: true },
];

export const HOME_PAGE_FALLBACK = {
  hero: {
    slogan: "Venez en visiteur, repartez en ami",
    subtitle: "Balades gratuites dans Paris",
    image: "/images/uploads/hero-main.webp",
    imageAlt: "Paris Greeters - Venez en visiteur, repartez en ami",
  },
  intro: {
    title: "Visitez Paris avec un Parisien",
    tagline: "Parisien d’un jour, Parisien toujours",
    ctaText: "s’inscrire pour une balade",
  },
  greeters: {
    title: "Les greeters",
    subtitle: "Venez en visiteur, repartez en ami !",
    paragraphs: [
      "Les Greeters Paris sont des ambassadeurs bénévoles et passionnés qui accueillent avec chaleur des visiteurs du monde entier. Ils proposent des balades gratuites dans Paris et les communes limitrophes.",
      "Chaque rencontre entre un Greeter et ses visiteurs est un moment unique : le partage d’une ville mondialement connue mais aussi la découverte de l’autre et de sa culture. Une occasion de montrer Paris comme l’aiment ses habitants.",
      "Les greeters ne sont pas des guides professionnels. Ne leur demandez pas des visites de musées ou visites historiques !",
    ],
    ctaText: "Rencontrez un Greeter",
    image: "/images/uploads/greeters-balade-1.webp",
    imageAlt: "Les Greeters de Paris lors d’une balade",
    videoThumbnail: "https://i.vimeocdn.com/video/1984451931-f56d4946f5aa304557cbdbfc0c251657c6600138b42e670092d38597918bc7d2-d?mw=800&q=85",
    videoTitle: "Les Greeters de Paris",
    videoId: "1058321109",
  },
  visit: {
    title: "Visiter Paris avec les greeters",
    paragraphs: [
      "Visiter Paris avec les Greeters, c’est une occasion de découvrir des quartiers dont les visiteurs ignorent généralement l’existence ou dans lesquels ils n’auraient pas pensé s’aventurer.",
      "Visiter Paris avec les Greeters, c’est cheminer dans de belles ruelles ou de magnifiques avenues, découvrir des parcs et des points de vue dégagés sur la capitale, vous faire conseiller de bonnes adresses et découvrir un Paris plus juste, plus humain, plus vivant.",
    ],
    image: "/images/uploads/metro-paris.jpg",
    imageAlt: "Métro parisien sur la ligne aérienne",
  },
  actualites: {
    title: "Actualités",
    items: [
      {
        id: "actualite-1",
        day: "19",
        month: "Mai",
        title: "Les Greeters accueillent tous les publics",
        excerpt:
          "Les Greeters accueillent tous les publics sans aucune discrimination, y compris les personnes en situation de handicap, les familles et les visiteurs du monde entier.",
        image: "/images/actualites_handicap.webp",
        link: "/actualites",
      },
      {
        id: "actualite-2",
        day: "06",
        month: "Avr",
        title: "Préparez votre visite avec l’Office du Tourisme",
        excerpt:
          "Préparez votre visite pendant les grands événements parisiens avec l’Office du Tourisme et découvrez toutes les informations utiles pour planifier votre séjour.",
        image: "/images/actualites_jo.jpg",
        link: "/actualites",
      },
    ] as HomeArticle[],
  },
  testimonials: {
    title: "Livre d’or",
    items: [
      {
        id: "testimonial-1",
        content:
          "Nous avons énormément apprécié cette balade. Isabelle nous a fait découvrir son quartier hors des circuits touristiques en intéressant toute la famille. Merci beaucoup !",
        author: "Patrick et ses enfants",
        location: "France",
      },
      {
        id: "testimonial-2",
        content:
          "J’ai passé un super moment. Toutes mes attentes ont été comblées : découverte d’un quartier que je ne connaissais pas, rempli d’histoire et d’anecdotes croustillantes.",
        author: "Isabelle",
        location: "Belgique",
      },
      {
        id: "testimonial-3",
        content:
          "Merci beaucoup. C’était très varié et une vraie découverte. Nous avons beaucoup apprécié la visite !",
        author: "Tamara",
        location: "Suisse",
      },
      {
        id: "testimonial-4",
        content:
          "Nous avons beaucoup apprécié ce moment passé avec Brigitte qui nous a fait découvrir l’histoire de La Défense. Sa passion et sa gentillesse ont rendu cette balade inoubliable.",
        author: "Isabelle",
        location: "France",
      },
    ] as Testimonial[],
  },
  gallery: {
    title: "Galerie",
    items: [
      { id: "gallery-1", title: "Balade dans le Marais avec un greeter", date: "6 juillet 2017", src: "/images/gallery/gallery1.jpg" },
      { id: "gallery-2", title: "Visite Lucie", date: "6 juillet 2017", src: "/images/gallery/gallery2.jpg" },
      { id: "gallery-3", title: "Balade parisienne", date: "26 juin 2017", src: "/images/gallery/gallery3.jpg" },
      { id: "gallery-4", title: "Découverte de Paris", date: "26 juin 2017", src: "/images/gallery/gallery4.jpg" },
      { id: "gallery-5", title: "Balade découverte", date: "26 juin 2017", src: "/images/gallery/gallery5.jpg" },
      { id: "gallery-6", title: "Visiteurs coréens à Belleville", date: "30 mars 2017", src: "/images/gallery/gallery6.jpg" },
      { id: "gallery-7", title: "Trois générations de Mexicaines", date: "30 mars 2017", src: "/images/gallery/gallery7.jpg" },
      { id: "gallery-8", title: "Paris authentique", date: "30 mars 2017", src: "/images/gallery/gallery8.jpg" },
    ] as GalleryImage[],
  },
};

export const SOCIAL_LINKS: SocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/Parisgreeters/" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/paris_greeters/" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@parisiendunjour" },
];

export const PARTNERS: Partner[] = [
  { id: "partner-1", name: "Paris Je t’aime", logo: "/images/partners/paris_tourisme.jpg", link: "https://parisjetaime.com/eng/" },
  { id: "partner-2", name: "BPI – Centre Pompidou", logo: "/images/partners/bpi.jpg", link: "https://www.bpi.fr/" },
  { id: "partner-3", name: "KAYAK", logo: "/images/partners/kayak.png", link: "https://www.kayak.fr/Paris.36014.guide" },
  { id: "partner-4", name: "Panier des Sens", logo: "/images/partners/panier_sens.jpg", link: "https://panierdessens.com/" },
  { id: "partner-5", name: "Paris Je t’aime Office", logo: "/images/partners/paris_je_taime.png", link: "https://parisjetaime.com/" },
  { id: "partner-6", name: "Musée du parfum Fragonard", logo: "/images/partners/fragonard.jpg", link: "https://musee-parfum-paris.fragonard.com/" },
  { id: "partner-7", name: "Global Greeter Network", logo: "/images/partners/global_greeter.png", link: "https://internationalgreeter.org/" },
  { id: "partner-8", name: "France Greeters", logo: "/images/partners/france_greeters.jpg", link: "https://greeters.fr/" },
  { id: "partner-9", name: "Mairie de Paris", logo: "/images/partners/mairie_paris.png", link: "https://www.paris.fr/" },
  { id: "partner-10", name: "Val-de-Marne Tourisme", logo: "/images/partners/val_marne.png", link: "https://www.tourisme-valdemarne.com/" },
  { id: "partner-11", name: "Seine-Saint-Denis Tourisme", logo: "/images/partners/seine_saint_denis.png", link: "https://www.tourisme93.com/" },
];

export const FOOTER_LINKS = [
  { id: "about", label: "Qui sommes-nous ?", href: "/qui-sommes-nous" },
  { id: "volunteer", label: "Devenez bénévole", href: "/devenez-benevole" },
  { id: "press", label: "Presse", href: "/presse" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "legal", label: "Mentions légales", href: "/mentions-legales" },
];

export function getBookingLocale(locale: AppLocale) {
  if (["fr", "en", "de", "es"].includes(locale)) {
    return locale;
  }

  return "en";
}

export function getBookingUrl(locale: AppLocale) {
  return `https://gestion.parisiendunjour.fr/visits/new?nt=pdj&locale=${getBookingLocale(locale)}`;
}