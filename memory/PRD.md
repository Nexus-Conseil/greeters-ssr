# PRD — Greeters reprise avec auth Supabase runtime stabilisée

## Problème d’origine
- Finaliser l’auth DB Supabase runtime
- Valider les flux authentifiés réels : login admin, création/édition live, publication et affichage public/menu
- Continuer le portage CMS Next.js dans `/app/greeters`

## Décisions d’architecture
- Runtime Prisma conservé dans `lib/db/prisma.ts`
- Base live Supabase branchée via **transaction pooler 6543**
- `DATABASE_URL` configurée avec `pgbouncer=true&sslmode=no-verify` pour compatibilité Prisma/Supavisor
- `DIRECT_DATABASE_URL` conservée à part, mais le runtime web s’appuie désormais sur le pooler transactionnel stable
- Mode édition corrigé : le slug n’est plus auto-réécrit lors d’un simple changement de titre sur une page existante

## Implémenté
- Diagnostic complet des trois chaînes DB :
  - session pooler 5432 rejetait l’auth
  - transaction pooler 6543 accepte la connexion
  - direct host non joignable depuis cet environnement
- Correction runtime Supabase/Prisma en `.env` : `DATABASE_URL` => transaction pooler + `pgbouncer=true`
- Seed admin live validé pour `contact@nexus-conseil.ch`
- Login admin réel validé (`/api/auth/login`, `/api/auth/me`, UI `/admin/login`)
- Flux CMS live validés :
  - création d’une page publiée en base réelle
  - édition live d’une page existante
  - mise à jour visible côté menu public
  - rendu SSR public de la page publiée
- Correction du bug d’édition relevé par testing agent : changement de titre sans mutation implicite du slug en mode édition
- Pages de validation créées en live :
  - `page-live-nexus-test`
  - `page-ui-live-20260309-2`

## Vérifications réalisées
- `next build` OK
- login API réel 200
- `/api/auth/me` avec cookie réel 200
- `/api/pages` authentifié 200
- création UI live `/admin/pages/new` OK
- édition UI live `/admin/pages/[id]` OK
- page publique SSR `/page-ui-live-20260309-2` affiche bien le contenu mis à jour
- menu public affiche les entrées créées/publiées depuis le CMS
- testing agent iteration 6 : le bug slug auto-muté a été identifié puis corrigé ensuite en self-test

## P0
- Nettoyer/normaliser les pages de validation créées pour les tests live
- Ajouter un écran d’administration du menu (ordre, renommage, suppression) relié aux données live
- Renforcer le rendu public pour les slugs multi-segments si requis par le backlog

## P1
- Durcir le typage partagé du renderer CMS (remplacer les parties permissives restantes)
- Ajouter uploads médias réels pour les blocs image
- Étendre les tests E2E authentifiés de création/édition/publication

## P2
- Porter documents, contact, home sections avancées, IA/chatbot et migration de données métier

## Next tasks
1. Nettoyer les pages/menu créés pour les validations live
2. Ajouter la gestion admin complète du menu public
3. Étendre l’éditeur à davantage de types de blocs et médias
4. Couvrir le workflow complet par tests E2E persistants
