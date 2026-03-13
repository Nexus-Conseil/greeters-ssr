# PRD — Greeters SSR / branche 1303 dans ce workspace

## Problème d'origine
Déployer le site `Nexus-Conseil/greeters-ssr` branche `1303` en Next.js SSR dans ce workspace Emergent, avec Supabase PostgreSQL, chatbot réactivé, proxies FastAPI pour les routes `/api/*` publiques, préparation du domaine futur et préparation d’un diff de merge safe depuis `1203`.

## Choix utilisateur
- Priorité: tout faire dans l’ordre recommandé du handoff
- Clés métier fournies: Supabase, Emailit, Gemini, ShortPixel
- Domaine: préparer `greeters.nexus-conseil.ch` sans l’activer tant que le DNS n’est pas prêt
- Proxys à ajouter: tous ceux listés dans le handoff
- Livrable attendu: app opérationnelle + préparation merge safe `1203`

## Décisions d'architecture
- App Next SSR réelle installée dans `/app/greeters`
- Wrapper supervisor Emergent conservé dans `/app/frontend`, mais reconfiguré pour lancer/build la vraie app Next
- Backend public conservé dans `/app/backend` pour recevoir `/api/*` depuis le domaine public
- Routes publiques `/api/*` gérées côté FastAPI:
  - proxies vers Next pour `health`, `pages/public`, `auth`, `contact`, `pages`, `menu`, `admin/*`
  - endpoints IA admin publics implémentés directement côté FastAPI pour garantir le runtime public dans ce workspace
- Base runtime branchée sur Supabase pooler:
  - `DATABASE_URL` via `aws-1-eu-west-3.pooler.supabase.com:6543`
  - `DIRECT_URL` via `aws-1-eu-west-3.pooler.supabase.com:5432`
- SSL Supabase dans ce workspace configuré avec `sslmode=no-verify` car l’hôte `db.*.supabase.co` ne résout pas ici et `sslmode=require` échouait sur la chaîne self-signed
- Admin IA publique alimentée via `EMERGENT_LLM_KEY` côté FastAPI, car la `GEMINI_API_KEY` fournie par l’utilisateur est rejetée par Google comme clé leakée
- Domaine canonique backend externalisé via `CANONICAL_ROOT_DOMAIN`

## Implémenté
- Clone de la branche `1303` et mise en place de la vraie app Next dans `/app/greeters`
- Reconfiguration du wrapper `/app/frontend` pour build/start Next SSR au lieu du scaffold CRA initial
- Création de `/app/greeters/.env` avec Supabase, Emailit, Gemini, ShortPixel, auth secret et URL de chat preview
- Installation des dépendances Next/Prisma, génération du client Prisma, build production validé
- Validation DB Supabase: connexion Prisma OK, tables et données déjà présentes, seed admin rejoué pour `florence.levot@nexus-conseil.ch`
- Ajout/extension des routes FastAPI publiques:
  - `/api/health`
  - `/api/pages/public`
  - `/api/auth/login`
  - `/api/auth/me`
  - `/api/auth/logout`
  - `/api/contact/send`
  - `/api/pages` + sous-routes
  - `/api/menu` + sous-routes
  - `/api/admin/*`
- Réactivation/validation du chatbot public
- Implémentation publique des endpoints IA admin dans FastAPI:
  - `/api/ai/page-generator`
  - `/api/ai/page-generator/{sessionId}`
  - `/api/ai/seo-optimizer`
- Gestion d’erreur IA améliorée:
  - mapping explicite quota/budget vers HTTP 429
  - retry court sur erreur transitoire
  - modèle allégé `gemini-2.0-flash-lite` pour réduire le coût
- Refonte des emails du formulaire de contact:
  - email admin redesigné, plus clair et plus élégant, avec coordonnées + sujet + message complet
  - email de confirmation auteur ajouté, chaleureux et cohérent avec le style du site
  - signature harmonisée avec Paris Greeters + email + lien vers le site
  - URL publique d’email séparée dans `PUBLIC_SITE_URL`
  - header blanc avec le logo du site
  - pictogrammes email + site web intégrés dans le rendu
  - polices alignées sur celles du site
  - corner-radius aligné sur les boutons du site pour les boutons et cartes email
  - logo public ajouté à la racine du site: `/logo_greeters.png`
  - gabarits email reconstruits à partir du template HTML de référence fourni par le client
  - simplification finale des 2 emails selon consigne métier:
    - auteur: confirmation + copie du message + picto site web uniquement
    - admin: intro + coordonnées + message, sans blocs supplémentaires
  - sujet des 2 emails désormais exactement égal au sujet saisi par l’auteur
- Régression ajoutée pour les templates email via builders TS + tests Python sans envoi réel d’email
- Préparation merge safe documentée dans `/app/memory/MERGE_SAFE_1203_TO_1303.md`
- Tests validés:
  - self-tests complets via preview publique
  - screenshots homepage + login admin + studio IA
  - testing agent: proxies/auth/chat/contact/pages/menu/IA validés
  - testing agent: templates email admin/auteur validés sans appel live à `/api/contact/send`

## Backlog priorisé
### P0
- Remplacer la `GEMINI_API_KEY` métier par une clé Google valide si l’on veut réactiver les handlers IA natifs Next en plus du runtime public FastAPI
- Basculer `NEXT_PUBLIC_CHAT_API_URL` vers `https://greeters.nexus-conseil.ch` dès que le DNS résout, puis `https://greeters.paris` au go-live
- Permettre la gestion admin du destinataire du formulaire de contact (`CONTACT_TO_EMAIL`) au lieu d’un paramètre fixe
- Permettre la gestion admin de l’URL publique utilisée dans les emails si elle doit différer selon l’environnement

### P1
- Modulariser `/app/backend/server.py` en services/routes séparés (proxy, auth, IA, chat)
- Remplacer le mode SSL `no-verify` par une configuration CA propre si l’environnement de déploiement le permet
- Aligner si souhaité les flows IA côté Next interne avec la même stratégie de clé/runtime que le domaine public

### P2
- Nettoyer les artefacts et docs historiques non nécessaires au merge final
- Ajouter plus de garde-fous UX sur les erreurs IA/quota dans l’admin
- Formaliser la procédure de resync schéma/import Supabase dans une doc dédiée

## Next tasks
1. Vérifier la résolution DNS de `greeters.nexus-conseil.ch`
2. Basculer l’URL runtime du chatbot sur le domaine de validation dès que possible
3. Faire valider le merge safe `1203 -> 1303` à partir du document de synthèse
4. Décider si l’IA admin doit rester publique via FastAPI ou être réalignée aussi côté handlers Next
