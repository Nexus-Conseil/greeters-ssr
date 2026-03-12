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
- `/qui-sommes-nous`, `/devenez-benevole`, `/faire-un-don`, `/mentions-legales`
- `/presse`, `/contact`, `/actualites`, `/galerie`, `/livre-dor`, `/` (accueil)

### Corrections UI — 12 Mars 2026
- Favicon remplacé par PNG du CSR (icon.png + apple-icon.png)
- Icônes réseaux sociaux : carrées avec coins arrondis (border-radius: 0.75rem)
- Carrousel partenaires : espacement uniforme (gap: 3rem, flex-shrink-0, h-auto)

### Infrastructure CSS — 12 Mars 2026
- Tailwind CSS v4.2.1 avec `@tailwindcss/postcss`
- CSS custom wrappé dans `@layer base/components`
- `PublicPageShell` avec `bg-white`

### Backend / CMS
- Authentification admin (NextAuth.js)
- API CMS admin complète
- Envoi d'emails (Emailit)
- Pipeline images (Cloudinary, ShortPixel)
- Script MultiLipi intégré

### Tests
- Testing agent iteration 15: **100% frontend** (12 pages validées)

## Backlog priorité

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
