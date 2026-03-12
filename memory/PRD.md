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
- **Traduction**: MultiLipi (chargé en `lazyOnload`)
- **Carrousels**: react-slick

## Répertoire principal
`/app/greeters/`

## Ce qui est implémenté

### Pages publiques (Tailwind pixel-perfect) — 12 Mars 2026
Toutes les pages publiques réécrites avec les classes Tailwind exactes du code CSR de référence.

### Corrections UI — 12 Mars 2026
- Favicon remplacé par PNG du CSR (icon.png + apple-icon.png)
- Icônes réseaux sociaux : carrées avec coins arrondis (border-radius: 0.75rem)
- Carrousel partenaires : espacement uniforme (gap: 3rem, flex-shrink-0, h-auto)

### Optimisations performance — 12 Mars 2026
- Image héro : `fetchPriority="high"` ajouté pour améliorer LCP
- Logos partenaires : `width`/`height` explicites (200x48) pour éviter CLS
- Contraste texte : tagline (#555 au lieu de #7d7d7d), outline-link (#3a6d18 au lieu de #5a8c2c), news-date (#4a7a25 au lieu de #5b8d30)
- Touch targets : dots témoignages agrandis à 24x24px minimum
- MultiLipi : chargé via `next/script` strategy `lazyOnload` au lieu de defer dans head

### Tests
- Testing agent iteration 15: **100% frontend** (12 pages validées)
- PageSpeed score avant optimisations: 96 (mobile)

## Backlog priorité

### P1 (Important)
- [ ] Réintégrer le chatbot public depuis le code CSR
- [ ] Vérifier SEO multilingue avec MultiLipi

### P2 (Future)
- [ ] Sitemap dynamique multilingue
- [ ] Génération SEO par IA (Gemini)
- [ ] Gestionnaire de menus drag-and-drop admin

## Credentials
- Admin: `contact@nexus-conseil.ch` / `Greeters&58!2026`
- Preview URL: `https://greeters-ssr-rebuild.preview.emergentagent.com`
