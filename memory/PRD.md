# PRD — Reprise Greeters après lots 03 à 05 (socle)

## Problème d’origine
- Reprendre la migration Greeters en s’appuyant sur le handoff `/app/README_DEV.md`
- Continuer après les lots 00 à 02 dans `/app/greeters`
- Avancer sur les repositories/services métier, les APIs pages P0 et le shell admin/public

## Décisions d’architecture
- Cible maintenue : `/app/greeters`
- Stack maintenue : Next.js App Router + TypeScript + Prisma + Supabase/PostgreSQL
- Session serveur HTTP-only conservée avec `proxy.ts`
- Portage P0 structuré par couches : repositories Prisma → services métier → routes API → shell UI
- Shell public/admin lancé sans casser l’auth déjà en place

## Implémenté
- Synchronisation locale du repo `greeters-ssr` dans `/app` et reprise du repo source métier `greeters`
- Repositories Prisma ajoutés pour users, sessions, password resets, pages, versions, page contents, previews, edits, menu, documents et home sections
- Services métier ajoutés pour pages et menu, plus bases utilitaires documents/page-editor/contact
- APIs Next.js ajoutées : `/api/health`, `/api/pages`, `/api/pages/[id]`, `/api/pages/public`, `/api/pages/by-slug/[slug]`, pending approve/reject, versions, rollback
- Shell admin/public démarré : layout admin avec sidebar, dashboard, liste pages, validations, accueil public, top bar, header/footer, placeholders publics mono-segment
- Refactor auth partiel : login/session branchés sur les nouveaux repositories users/sessions
- Validation réalisée : `yarn install`, `yarn prisma:generate`, `eslint`, `next build`, smoke UI + API scope demandé, rapport `/app/test_reports/iteration_4.json`

## P0
- Brancher un vrai `DATABASE_URL` / `AUTH_SECRET` de projet pour tester les routes pages connectées à Prisma en environnement réel
- Porter le formulaire création/édition de page et l’historique de versions côté UI
- Connecter le shell public au vrai menu CMS et aux pages publiées

## P1
- Porter le CRUD pages complet avec éditeur de sections/blocs
- Finaliser le workflow pending / reject / rollback côté interface
- Ajouter les routes publiques dynamiques SSR pour les pages CMS

## P2
- Porter menu avancé, documents/uploads, users admin, contact, IA, chatbot
- Préparer les scripts de migration de données Mongo → Supabase
- Renforcer les métriques dashboard et la couverture de tests métier authentifiés

## Next tasks
1. Créer les écrans `/admin/pages/new` et `/admin/pages/[id]`
2. Brancher le menu public sur `lib/services/menu.ts`
3. Ajouter les route handlers menu/documents/contact selon le backlog
4. Préparer un seed/admin réel pour les tests d’authentification bout en bout
