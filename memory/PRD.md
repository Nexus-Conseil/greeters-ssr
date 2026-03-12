# Paris Greeters CMS - PRD

## Problème Original
Récupérer le projet stocké sur https://github.com/Nexus-Conseil/greeters-ssr avec le dump SQL fourni.

## Architecture
- **Frontend**: Next.js 16.1.6 (dossier `/app/greeters`)
- **Backend API**: FastAPI Python (authentification via cookies HTTP-only)
- **Base de données**: PostgreSQL
- **Service Port 3000**: Next.js (frontend + pages SSR)
- **Service Port 8001**: FastAPI (API `/api/*` via proxy nginx)

## Ce qui a été implémenté
- [x] Clone du projet GitHub Nexus-Conseil/greeters-ssr
- [x] Installation PostgreSQL et création de la base greeters_db
- [x] Migration Prisma et import des données dump JSON
- [x] Configuration backend Python avec PostgreSQL (psycopg2)
- [x] Authentification compatible entre Python et Next.js (cookies HMAC)
- [x] Import de 94 pages, 2 utilisateurs, 17 sessions IA, 34 messages IA

## Données importées
- **Users**: 2 (admin@greeters.local, contact@nexus-conseil.ch)
- **Pages**: 94 pages publiées en français
- **AI Sessions**: 17 sessions de génération de contenu
- **AI Messages**: 34 messages de conversation IA

## Identifiants
- **Admin**: admin@greeters.local / admin123
- **Clé Gemini**: AIzaSyC-fBM9LUOEqHCHUjJvi7r3dl6YXqEVAik

## Prochaines étapes possibles
- P0: Stabiliser le démarrage automatique de Next.js via supervisor
- P1: Tester la génération de pages via IA Gemini
- P2: Configurer les traductions multilingues
- P3: Ajouter des tests automatisés

## Date
12 Mars 2026
