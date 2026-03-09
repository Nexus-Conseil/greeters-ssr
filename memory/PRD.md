# PRD — Reprise Greeters après portage éditeur/pages SSR

## Problème d’origine
- Continuer la migration Greeters dans `/app/greeters`
- Porter les repositories/services métier, les APIs pages, le shell admin/public
- Ajouter l’éditeur de pages sections/blocs, les écrans admin `/admin/pages/new` et `/admin/pages/[id]`
- Connecter le menu public aux données CMS et rendre les pages publiques SSR dynamiques
- Brancher les écrans live sur PostgreSQL Supabase projet

## Décisions d’architecture
- Stack conservée : Next.js App Router + TypeScript + Prisma + Supabase/PostgreSQL
- Couches maintenues : repositories Prisma → services → route handlers → UI/admin/public
- Pages publiques SSR servies côté App Router avec fallback public si la DB n’est pas accessible
- Menu public connecté au service CMS `getMenu()` avec fallback sur pages publiées puis navigation statique
- Éditeur CMS admin construit en client-side pour composer sections/blocs puis sauvegarder via APIs Next

## Implémenté
- `.env` projet ajouté dans `/app/greeters` avec URLs Supabase, `AUTH_SECRET`, seed admin
- Repositories/services P0 déjà posés complétés par la synchronisation menu depuis les pages publiées
- APIs ajoutées/complétées : menu GET/PUT + sync, pages CRUD/public/pending/versions/rollback
- Éditeur complet de pages livré :
  - `/admin/pages/new`
  - `/admin/pages/[id]`
  - composition sections/blocs (titre, texte, image URL, bouton)
  - gestion SEO/menu
  - prévisualisation live
  - historique de versions avec rollback
- Vue `/admin/pages` enrichie avec création + édition
- Rendu CMS public ajouté avec `DynamicPageRenderer`
- Menu public branché au CMS via `Header` serveur
- Pages publiques SSR dynamiques mono-segment activées via `app/[slug]/page.tsx`
- Home SSR connectée au slug `/` si une page publique existe, sinon fallback shell
- Tests/validation réalisés : ESLint, `next build`, screenshots public/login/redirect, testing agent iteration_5 OK sur scope non authentifié

## Blocage actuel
- Le branchement live Supabase n’est pas finalisé : Prisma runtime répond toujours `Authentication failed against the database server` sur le pooler avec les credentials fournis
- Conséquence : les flux authentifiés CMS connectés à la vraie DB (login réel, create/edit live, versions live) ne sont pas encore validables bout en bout

## P0
- Corriger définitivement l’auth Prisma ↔ Supabase pooler/runtime avec les bons credentials DB ou la bonne chaîne de connexion
- Re-tester login admin réel puis création/édition/publication de page sur la base projet
- Ajouter un rendu public multi-segments si le contenu CMS le requiert

## P1
- Ajouter upload média réel / document storage pour les blocs image
- Finaliser l’administration du menu avec réordonnancement manuel et liens externes
- Renforcer le typage strict du renderer CMS et des payloads sections/blocs

## P2
- Porter contact, documents, home sections avancées, IA/chatbot et migrations de données métier
- Ajouter davantage de tests E2E authentifiés CMS

## Next tasks
1. Recevoir/valider la chaîne Supabase DB exacte qui authentifie réellement Prisma au runtime
2. Tester `contact@nexus-conseil.ch` sur `/admin/login` en live puis créer une première page CMS
3. Vérifier la publication d’une page et sa remontée automatique dans le menu public
4. Étendre le renderer dynamique aux cas multi-segments si nécessaire
