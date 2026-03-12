# PRD — Greeters Paris SSR Migration

## Problème original
Migration "pixel-perfect" de l'application React CSR (`https://greeters.paris`) vers Next.js SSR.

## Architecture technique
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Style**: Tailwind CSS v4.2.1 + CSS custom `@layer components`
- **Base de données**: PostgreSQL via Prisma (Supabase) + MongoDB (chatbot)
- **Images**: Cloudinary via `next-cloudinary`
- **Auth**: NextAuth.js
- **Email**: Emailit
- **Chatbot IA**: Claude (Anthropic) via emergentintegrations + Emergent LLM Key
- **Traduction**: MultiLipi (chargé en `lazyOnload`)
- **Carrousels**: react-slick

## Répertoire principal
`/app/greeters/` (Next.js) + `/app/backend/` (FastAPI)

## Ce qui est implémenté

### Pages publiques (Tailwind pixel-perfect) — 12 Mars 2026
Toutes les pages publiques réécrites avec les classes Tailwind du code CSR.

### Chatbot public — 12 Mars 2026
- Backend: API `/api/chat/message` (FastAPI + Claude via emergentintegrations)
- Frontend: Composants ChatBot, ChatButton, ChatWindow avec chargement différé
- Chargement: `next/dynamic` ssr:false + `requestIdleCallback` (zéro impact PageSpeed)
- Fonctionnalités: 6 langues, vouvoiement, réponses contextuelles, quick replies, bouton réservation
- Markdown rendering (react-markdown)
- Cache session MongoDB pour historique conversation
- Tests: 100% backend (8/8) + 100% frontend (10/10) — iteration 16

### Optimisations performance — 12 Mars 2026
- Image héro: `fetchPriority="high"`
- Logos partenaires: `width`/`height` explicites
- Contraste texte renforcé
- Touch targets dots agrandis à 24×24px
- MultiLipi: `next/script` strategy `lazyOnload`

### Backend / CMS
- Authentification admin (NextAuth.js)
- API CMS admin complète
- Envoi d'emails (Emailit)
- Pipeline images (Cloudinary, ShortPixel)

### Tests
- Iteration 15: 100% frontend (12 pages)
- Iteration 16: 100% backend + frontend (chatbot)

## Backlog priorité

### P1 (Important)
- [ ] Vérifier SEO multilingue avec MultiLipi

### P2 (Future)
- [ ] Sitemap dynamique multilingue
- [ ] Génération SEO par IA (Gemini)
- [ ] Gestionnaire de menus drag-and-drop admin

## Credentials
- Admin: `contact@nexus-conseil.ch` / `Greeters&58!2026`
- Preview: `https://greeters-ssr-rebuild.preview.emergentagent.com`
