# PRD — Greeters SSR + migration Supabase

## Problème d'origine
Installer ce site Next.js en SSR : https://github.com/Nexus-Conseil/greeters-ssr en sachant que la branche 1203 est la plus récente, mais l'utilisateur n'ose pas merger la PR.

## Choix utilisateur
- Utiliser prioritairement la branche `1203`
- Installer et faire tourner le site en SSR
- Réactiver le chatbot existant
- Préparer ensuite l'app pour un vrai déploiement propre
- Créer une base Supabase PostgreSQL et y importer tout le dump
- Finir par un audit de readiness après migration

## Décisions d'architecture
- App cible installée dans `/app/greeters`
- Frontend wrapper `/app/frontend` converti pour lancer/build la vraie app Next de `/app/greeters`
- Build/start de production Next.js validés
- Base de données réelle branchée sur Supabase PostgreSQL
- `DATABASE_URL` runtime sur pooler 6543, `DIRECT_URL` opérations de schéma sur pooler 5432
- Schéma appliqué via script Node dédié (`scripts/apply-schema.cjs`) car `prisma db push` était bloqué par les contraintes réseau/pooler Supabase dans cet environnement
- Import complet du dump via `scripts/import-dump.ts`
- Fallback `dump.json` désactivé (`GREETERS_USE_DUMP_FALLBACK=0`)
- Les routes `/api` publiques passent par FastAPI dans ce workspace ; les endpoints `/api/health` et `/api/pages/public` y proxient donc l'app Next interne pour rester testables publiquement

## Implémenté
- Installation de la branche `1203` dans `/app/greeters`
- Réactivation du chatbot côté UI + backend FastAPI
- Stabilisation SSR (TopBar, HeaderClient, FooterClient, warnings hydration)
- Connexion à Supabase PostgreSQL
- Application du schéma PostgreSQL réel
- Import complet du dump dans PostgreSQL : users, sessions, pages, versions, menus, home_sections, page_contents, ai_chat_sessions, ai_chat_messages, etc.
- Désactivation du fallback local dump pour le runtime public
- Conversion du frontend wrapper en build/start Next propre avec `postinstall` pour installer les dépendances de `/app/greeters`
- Ajout des endpoints backend `/api/health` et `/api/pages/public` pour les checks publics de readiness
- Vérifications finales réussies : `/`, `/contact`, `/api/health`, `/api/pages/public`, chatbot, build prod Next

## Backlog priorisé
### P0
- Remplacer le secret/admin et les URLs d'environnement par des valeurs finales de production côté plateforme
- Valider les flux admin/auth complets avec identifiants connus côté métier
- Décider de la stratégie finale de merge de `1203` (idéalement ciblée)

### P1
- Remplacer le script d'application de schéma par une stratégie de migration Prisma fully-managed si l'environnement de déploiement offre un endpoint direct compatible
- Nettoyer les anciens artefacts/logs de phase dev
- Sortir les éventuels endpoints tiers restés codés en dur vers des variables d'environnement dédiées

### P2
- Optimiser encore le hero mobile/LCP
- Nettoyer les fichiers historiques non nécessaires de la branche
- Formaliser une procédure d'import/rebuild DB documentée

## Next tasks
1. Injecter les variables finales de production dans l'environnement cible
2. Valider admin/auth/contact avec données réelles et comptes finaux
3. Préparer un diff de merge “safe” de `1203`
4. Si nécessaire, convertir la stratégie Prisma en migrations déployables classiques selon l'environnement cible
