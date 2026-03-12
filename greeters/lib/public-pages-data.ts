import type { GalleryImage, HomeArticle, Testimonial } from "@/lib/public-site-data";

export const ACTUALITES_PAGE_ITEMS: HomeArticle[] = [
  {
    id: "actualites-1",
    day: "19",
    month: "Mai",
    title: "Les Greeters accueillent tous les publics",
    excerpt:
      "Les Greeters accueillent tous les publics sans aucune discrimination, y compris les personnes en situation de handicap, les personnes se déplaçant difficilement et les familles avec enfants.",
    image: "/images/actualites_handicap.webp",
    link: "/actualites",
  },
  {
    id: "actualites-2",
    day: "06",
    month: "Avr",
    title: "Préparez votre visite avec l'Office du Tourisme",
    excerpt:
      "Préparez votre visite pendant les grands événements parisiens avec l'office du tourisme de Paris et découvrez les informations utiles pour organiser votre séjour.",
    image: "/images/actualites_jo.jpg",
    link: "/actualites",
  },
  {
    id: "actualites-3",
    day: "15",
    month: "Mars",
    title: "Nouvelles balades dans le 18ème",
    excerpt:
      "Découvrez nos nouvelles balades dans le 18ème arrondissement, de Montmartre à la Goutte d'Or, avec des Greeters passionnés par ces quartiers authentiques.",
    image: "/images/uploads/balade-montmartre.jpg",
    link: "/actualites",
  },
  {
    id: "actualites-4",
    day: "28",
    month: "Fév",
    title: "Rejoignez notre équipe de bénévoles",
    excerpt:
      "Vous êtes passionné par Paris et aimez partager votre connaissance de la ville ? Rejoignez notre équipe de Greeters bénévoles et faites découvrir Paris autrement.",
    image: "/images/uploads/greeters-balade-1.jpg",
    link: "/actualites",
  },
];

export const GUESTBOOK_ITEMS: Testimonial[] = [
  {
    id: "guestbook-1",
    content:
      "Nous avons énormément apprécié cette balade. Isabelle nous a fait découvrir son quartier hors des circuits touristiques en intéressant toute la famille. Merci beaucoup !",
    author: "Patrick et ses enfants",
    location: "France",
  },
  {
    id: "guestbook-2",
    content:
      "Bonjour Marie-Thérèse, j'ai passé un super moment avec vous. Toutes mes attentes ont été comblées : découverte d'un quartier que je ne connaissais pas, rempli d'histoire et d'anecdotes croustillantes.",
    author: "Isabelle",
    location: "Belgique",
  },
  {
    id: "guestbook-3",
    content:
      "Merci beaucoup. C'était très varié et une vraie découverte. Nous avons beaucoup apprécié la visite ! Si vous passez par chez nous, faites-nous signe.",
    author: "Tamara",
    location: "Suisse",
  },
  {
    id: "guestbook-4",
    content:
      "Nous avons beaucoup apprécié ce moment passé avec Brigitte qui nous a fait découvrir l'histoire de La Défense. Sa passion et sa gentillesse ont fait de cette balade une très belle découverte.",
    author: "Isabelle",
    location: "France",
  },
];

export const GALLERY_PAGE_IMAGES: GalleryImage[] = [
  { id: "gallery-page-1", title: "Balade avec les Greeters", date: "2024", src: "/images/uploads/greeters-balade-1.jpg" },
  { id: "gallery-page-2", title: "Découverte de Paris", date: "2024", src: "/images/uploads/greeters-balade-2.jpg" },
  { id: "gallery-page-3", title: "Visite de quartier", date: "2024", src: "/images/uploads/greeters-balade-3.jpg" },
  { id: "gallery-page-4", title: "Promenade parisienne", date: "2024", src: "/images/uploads/greeters-balade-4.jpg" },
  { id: "gallery-page-5", title: "Balade à Montmartre", date: "2024", src: "/images/uploads/balade-montmartre.jpg" },
  { id: "gallery-page-6", title: "Paris slider 1", date: "2024", src: "/images/uploads/slider-home-1.jpg" },
  { id: "gallery-page-7", title: "Paris slider 2", date: "2024", src: "/images/uploads/slider-home-2.jpg" },
  { id: "gallery-page-8", title: "Paris slider 3", date: "2024", src: "/images/uploads/slider-home-3.jpg" },
  { id: "gallery-page-9", title: "Paris slider 4", date: "2024", src: "/images/uploads/slider-home-4.jpg" },
  { id: "gallery-page-10", title: "Bannière Greeters 1", date: "2024", src: "/images/uploads/greeters-banner-1.jpg" },
  { id: "gallery-page-11", title: "Bannière Greeters 2", date: "2024", src: "/images/uploads/greeters-banner-2.jpg" },
  { id: "gallery-page-12", title: "Groupe espagnol", date: "2024", src: "/images/uploads/groupe-espagnol.png" },
];

export const WHO_WE_ARE_VALUES = [
  "Les Greeters sont bénévoles, ils sont un visage ami pour le(s) visiteur(s).",
  "Les Greeters accueillent des individuels et des groupes jusqu'à 6 personnes.",
  "La rencontre avec un Greeter est entièrement gratuite.",
  "Les Greeters accueillent toute personne, visiteur et bénévole, sans aucune discrimination.",
];

export const VOLUNTEER_BENEFITS = [
  {
    id: "benefit-1",
    title: "Rencontres enrichissantes",
    description: "Échangez avec des visiteurs venus des quatre coins du monde et découvrez leurs cultures.",
  },
  {
    id: "benefit-2",
    title: "Partagez votre passion",
    description: "Faites découvrir les lieux que vous aimez et les histoires qui vous passionnent.",
  },
  {
    id: "benefit-3",
    title: "Redécouvrez votre quartier",
    description: "Voyez Paris avec un regard neuf en préparant vos balades et en les partageant.",
  },
  {
    id: "benefit-4",
    title: "Flexibilité totale",
    description: "Vous choisissez quand et combien de fois par mois vous souhaitez accueillir des visiteurs.",
  },
];

export const VOLUNTEER_REQUIREMENTS = [
  "Habiter Paris ou sa proche banlieue depuis au moins un an",
  "Aimer votre quartier et avoir envie de le faire découvrir",
  "Parler au moins une langue étrangère (anglais, espagnol, allemand, etc.)",
  "Être disponible pour des balades de 2 à 3 heures",
  "Avoir le goût du contact et de l'échange",
];

export const PRESS_PHOTOS = [
  { id: "press-1", title: "Balade avec les Greeters", src: "/images/uploads/greeters-balade-1.jpg", date: "2024" },
  { id: "press-2", title: "Découverte de Paris", src: "/images/uploads/greeters-balade-2.jpg", date: "2024" },
  { id: "press-3", title: "Visite de quartier", src: "/images/uploads/greeters-balade-3.jpg", date: "2024" },
  { id: "press-4", title: "Promenade parisienne", src: "/images/uploads/greeters-balade-4.jpg", date: "2024" },
  { id: "press-5", title: "Balade à Montmartre", src: "/images/uploads/balade-montmartre.jpg", date: "2024" },
  { id: "press-6", title: "Groupe de visiteurs", src: "/images/uploads/groupe-espagnol.png", date: "2024" },
];