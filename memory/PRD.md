# PRD — Greeters Paris SSR Migration

## Problème original
Migration "pixel-perfect" de l'application React CSR (`https://greeters.paris`) vers Next.js SSR.

## Architecture technique
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Style**: Tailwind CSS v4.2.1 + CSS custom `@layer components`
- **Base de données**: PostgreSQL via Prisma (Supabase) + MongoDB (chatbot)
- **Chatbot IA**: Gemini 2.5 Flash (emergentintegrations)
- **SEO IA**: Gemini 2.0 Flash (direct API)
- **Auth**: NextAuth.js | **Email**: Emailit | **Images**: Cloudinary | **Traduction**: MultiLipi

## Ce qui est implémenté

### Pages publiques pixel-perfect — 12 Mars 2026
Toutes les pages réécrites avec classes Tailwind du CSR.

### Chatbot public — 12 Mars 2026
- Backend: `/api/chat/message` (FastAPI + Gemini)
- Frontend: chargement différé (requestIdleCallback + next/dynamic ssr:false)
- 6 langues, vouvoiement, quick replies, Markdown, image couple-greeters

### Sitemap dynamique multilingue — 12 Mars 2026
- `/sitemap.xml` : 117 URLs (13 pages × 9 langues) avec xhtml:link alternates

### SEO IA (Gemini) — 12 Mars 2026
- 14/14 pages optimisées : meta title, description, focus keyword, OG tags, schema.org
- Script batch: `/app/greeters/scripts/seo-batch.ts`
- Endpoint admin: `/api/admin/seo/auto-sync`

### Optimisations performance
- fetchPriority="high" héro, width/height partenaires, contraste, touch targets, MultiLipi lazyOnload

### Corrections UI
- Favicon PNG CSR, icônes sociales carrées coins arrondis, espacement partenaires
- Dropdown langues chatbot lisible, image couple rapprochée du bouton

## Backlog
- [ ] Vérifier SEO multilingue avec MultiLipi
- [ ] Gestionnaire de menus drag-and-drop admin

## Credentials
- Admin: `contact@nexus-conseil.ch` / `Greeters&58!2026`
- Preview: `https://greeters-ssr-rebuild.preview.emergentagent.com`
