# Paris Greeters CMS - PRD

## Problème Original
Récupérer le projet stocké sur https://github.com/Nexus-Conseil/greeters-ssr avec le dump SQL fourni.

## Architecture
- **Frontend**: Next.js 16.1.6 (dossier `/app/greeters`)
- **Backend API**: FastAPI Python (authentification via cookies HTTP-only)
- **Base de données**: PostgreSQL
- **Service Port 3000**: Next.js (frontend + pages SSR) via supervisor
- **Service Port 8001**: FastAPI (API `/api/*` via proxy nginx)

## Ce qui a été implémenté
### Session 1 - Setup initial
- [x] Clone du projet GitHub Nexus-Conseil/greeters-ssr
- [x] Installation PostgreSQL et création de la base greeters_db
- [x] Migration Prisma et import des données dump JSON
- [x] Configuration backend Python avec PostgreSQL (psycopg2)
- [x] Authentification compatible entre Python et Next.js (cookies HMAC)
- [x] Import de 94 pages, 2 utilisateurs, 17 sessions IA, 34 messages IA

### Session 2 - Corrections UI/UX
- [x] Démarrage automatique de Next.js via supervisor
- [x] Slogan "Venez en visiteur, repartez en ami" responsive:
  - Desktop: 1 ligne
  - Tablet: 2 lignes ("Venez en visiteur," + "repartez en ami")
  - Mobile: 4 lignes (mot par mot)
- [x] Amélioration qualité des images (jpeg au lieu de webp compressé)
- [x] Titres "Actualités", "Livre d'or", "Galerie" centrés
- [x] Remplacement photo basse qualité (groupe-espagnol.png) sur pages Presse et Galerie
- [x] Page Contact: texte intro sur fond blanc, formulaire sur section gris clair

## Données importées
- **Users**: 2 (admin@greeters.local, contact@nexus-conseil.ch)
- **Pages**: 94 pages publiées en français
- **AI Sessions**: 17 sessions de génération de contenu
- **AI Messages**: 34 messages de conversation IA

## Identifiants
- **Admin**: admin@greeters.local / admin123
- **Clé Gemini**: AIzaSyC-fBM9LUOEqHCHUjJvi7r3dl6YXqEVAik

## Prochaines étapes possibles
- P1: Tester la génération de pages via IA Gemini
- P2: Configurer les traductions multilingues
- P3: Ajouter des tests automatisés

## Date
12 Mars 2026
