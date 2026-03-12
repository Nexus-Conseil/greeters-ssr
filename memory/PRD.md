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
- **Chatbot IA**: Gemini 2.5 Flash (via emergentintegrations + clé API Gemini)
- **SEO IA**: Gemini 2.0 Flash (via direct API call + clé API Gemini)
- **Traduction**: MultiLipi (chargé en `lazyOnload`)
- **Carrousels**: react-slick

## Ce qui est implémenté

### Pages publiques (Tailwind pixel-perfect) — 12 Mars 2026
Toutes les pages publiques réécrites avec les classes Tailwind du code CSR.

### Chatbot public — 12 Mars 2026
- Backend: API `/api/chat/message` (FastAPI + Gemini via emergentintegrations)
- Frontend: ChatBot, ChatButton, ChatWindow avec chargement différé (zero PageSpeed impact)
- 6 langues, vouvoiement, quick replies, bouton réservation, Markdown

### Sitemap dynamique multilingue — 12 Mars 2026
- `/sitemap.xml` génère 117 URLs (13 pages × 9 langues)
- Chaque URL inclut les `xhtml:link rel="alternate"` pour les 9 langues
- Cache-Control: 1h

### Génération SEO par IA (Gemini) — 12 Mars 2026
- Endpoint admin: `/api/admin/seo/auto-sync`
- Gemini 2.0 Flash génère: meta title, meta description, focus keyword, schema.org JSON-LD, OG tags, Twitter cards, image recommendations
- Sanitization des résultats avec fallbacks

### Corrections UI — 12 Mars 2026
- Favicon PNG du CSR
- Icônes réseaux sociaux carrées coins arrondis
- Carrousel partenaires espacement uniforme
- Dropdown langues chatbot: texte lisible (noir sur blanc)

### Optimisations performance
- Image héro: fetchPriority="high"
- Partner logos: width/height explicites
- Contraste texte renforcé, touch targets agrandis
- MultiLipi: lazyOnload

### Tests
- Iteration 15: 100% frontend (12 pages)
- Iteration 16: 100% backend + frontend (chatbot)

## Backlog

### P1
- [ ] Vérifier SEO multilingue avec MultiLipi

### P2
- [ ] Gestionnaire de menus drag-and-drop admin

## Credentials
- Admin: `contact@nexus-conseil.ch` / `Greeters&58!2026`
- Preview: `https://greeters-ssr-rebuild.preview.emergentagent.com`
- Gemini API Key: dans `.env` et `/app/backend/.env`
