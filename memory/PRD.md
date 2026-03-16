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
- Intégration sélective sécurisée de la branche `1503` : on reprend les modules admin utiles et les extensions backend associées, sans merger les artefacts `.env`, `.emergent`, tests et audits historiques

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
- AUTH_SECRET final fort généré et appliqué
- Compte admin final `florence.levot@nexus-conseil.ch` créé/mis à jour en `SUPER_ADMIN`
- Proxy public des routes auth Next (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) via FastAPI pour permettre le login sur le domaine public
- Flux final admin/auth validés en API + UI (login, session, accès `/admin`, logout, 401 post-logout)
- Merge sélectif des nouveautés utiles de `1503` : back-office admin chatbot/documents/utilisateurs + services et routes Next associées
- Extension backend issue de `1503` intégrée : proxies/API supplémentaires pour admin, chatbot session, contact/pages/menu/IA, tout en conservant les réglages locaux Supabase/auth/chatbot
- Schéma Prisma étendu avec `ChatbotPromptVersion` et appliqué incrémentalement via `scripts/apply-schema.cjs`
- Correctif build déploiement: downgrade de `prisma` + `@prisma/client` vers `6.19.0` (compatible Node 20.18.1) et suppression de `@prisma/adapter-pg` pour revenir au client Prisma standard
- Allègement du wrapper frontend `/app/frontend`: suppression du gros arbre de dépendances CRA/Shadcn désormais inutile, scripts conservés pour build/start de `/app/greeters`
- Allègement backend `requirements.txt`: retrait des dépendances de dev et de paquets runtime non utilisés pour réduire le temps d’installation au déploiement
- Chatbot frontend enrichi avec persistance de session visiteur (`localStorage`/cookie) et endpoint `/api/chat/session/{session_id}` validé
- Validation complète post-merge `1503` : `/admin/users`, `/admin/documents`, `/admin/chatbot`, `/api/admin/users`, `/api/admin/documents`, `/api/admin/chatbot/settings`, `/api/chat/session/{session_id}`

## Backlog priorisé
### P0
- Compléter les clés métier encore absentes pour les flux non-auth (Emailit contact, Gemini IA admin si ces fonctionnalités doivent être actives)
- Basculer `NEXT_PUBLIC_CHAT_API_URL` vers `https://greeters.nexus-conseil.ch` dès que le domaine de validation résout effectivement, puis vers `https://greeters.paris` au go-live
- Refactoriser `/app/backend/server.py` par domaines (auth proxy, chatbot, admin, pages/menu/IA) pour réduire le risque de régression future
- Vérifier le prochain déploiement Emergent après les correctifs Prisma + allègement des installs; si un échec subsiste, investiguer alors la connectivité runtime vers Supabase ou un blocage infra spécifique plutôt que le build Node

### P1
- Remplacer le script d'application de schéma par une stratégie de migration Prisma fully-managed si l'environnement de déploiement offre un endpoint direct compatible
- Nettoyer les anciens artefacts/logs de phase dev
- Sortir les éventuels endpoints tiers restés codés en dur vers des variables d'environnement dédiées

### P2
- Optimiser encore le hero mobile/LCP
- Nettoyer les fichiers historiques non nécessaires de la branche
- Formaliser une procédure d'import/rebuild DB documentée

## Next tasks
1. Fournir/configurer les clés métier encore manquantes (Emailit, Gemini admin, éventuellement ShortPixel)
2. Basculer l'URL de chat sur le domaine de validation dès que `greeters.nexus-conseil.ch` est résolu
3. Préparer un diff de merge/documentation finale maintenant que le lot utile de `1503` est absorbé
4. Si nécessaire, convertir la stratégie Prisma en migrations déployables classiques selon l'environnement cible
