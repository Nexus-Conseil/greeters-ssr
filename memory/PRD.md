# PRD — Greeters Paris SSR Migration

## Problème original
Migration "pixel-perfect" de l'application React CSR (`https://greeters.paris`) vers Next.js SSR. L'interface doit être ABSOLUMENT IDENTIQUE au site de production.

## Architecture technique
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Style**: Tailwind CSS v4.2.1 + CSS custom `@layer components` (`public-site.css`)
- **Base de données**: PostgreSQL via Prisma (Supabase)
- **Images**: Cloudinary via `next-cloudinary`
- **Auth**: NextAuth.js
- **Email**: Emailit
- **Traduction**: MultiLipi
- **Carrousels**: react-slick

## Répertoire principal
`/app/greeters/`

## Ce qui est implémenté

### Pages publiques (Tailwind pixel-perfect) — 12 Mars 2026
Toutes les pages publiques réécrites avec les classes Tailwind exactes du code CSR de référence :
- `/qui-sommes-nous` — Titre vert, panneaux gris, IGA panel, grille de valeurs, warning ambre
- `/devenez-benevole` — Hero dark green, image, bénéfices grid, exigences, CTA
- `/faire-un-don` — Titre vert, PayPal/Chèque/Virement/Don direct, image
- `/mentions-legales` — Éditeur, charte avec icônes, responsabilités cards, hébergement
- `/presse` — Dossier de presse, galerie photo 3 cols, contact presse
- `/contact` — Formulaire 2 colonnes, panneau intro gris, envoi via Emailit
- `/actualites` — Grille 3 colonnes articles avec images/dates/extraits
- `/galerie` — Grille 4 colonnes images, lightbox avec navigation
- `/livre-dor` — Testimonials avec Quote icon, navigation dots
- `/` (accueil) — Hero, Intro, Greeters, Visit, Actualités, Testimonials, Gallery

### Infrastructure CSS — 12 Mars 2026
- Installation et configuration Tailwind CSS v4.2.1 avec `@tailwindcss/postcss`
- CSS custom wrappé dans `@layer base` et `@layer components` pour permettre aux utilitaires Tailwind de prendre la priorité
- `PublicPageShell` avec `bg-white` pour isoler le fond blanc des pages publiques

### Backend / CMS
- Authentification admin (NextAuth.js)
- API CMS admin complète
- Envoi d'emails (Emailit)
- Pipeline images (Cloudinary, ShortPixel)
- Script MultiLipi intégré

### Tests
- Testing agent iteration 15: **100% frontend** (12 pages validées)

## Backlog priorité

### P0 (Critique)
- ~~Migration pixel-perfect des pages publiques~~ ✅ FAIT

### P1 (Important)
- [ ] Réintégrer le chatbot public depuis le code CSR
- [ ] Optimisations performance (PageSpeed 98-100 mobile)
- [ ] Vérifier SEO multilingue avec MultiLipi

### P2 (Future)
- [ ] Sitemap dynamique multilingue
- [ ] Génération SEO par IA (Gemini)
- [ ] Gestionnaire de menus drag-and-drop admin

## Credentials
- Admin: `contact@nexus-conseil.ch` / `Greeters&58!2026`
- Preview URL: `https://greeters-ssr-rebuild.preview.emergentagent.com`

## Intégrations tierces
- Supabase (PostgreSQL)
- NextAuth.js
- Emailit
- ShortPixel
- Cloudinary (next-cloudinary)
- Google Gemini API (en pause)
- MultiLipi (script de traduction)
