# README_DEV — Handoff technique complet de reprise

## 1) Résumé exécutif

Le projet **Greeters** avait été présenté comme une migration Next.js déjà avancée. Après audit, ce n’est **pas** ce que contenait réellement le code versionné.

### Vérité technique constatée
- Le repo source `greeters.git` audité sur `main` / commit `977b48bfdadf178755d18a16255c6661d4d8d3a1` est un produit **React SPA + FastAPI + MongoDB**, pas une app Next.js existante.
- La migration Next.js a donc été traitée comme une **reconstruction contrôlée** à partir de la vraie base métier existante.
- La nouvelle cible de travail est maintenant **`/app/greeters`**, qui contient le **nouveau squelette Next.js** destiné à remplacer progressivement le stack React/FastAPI historique.

### Ce qui est déjà fait
- audit complet des repos et de l’écart doc/code,
- plan de migration détaillé,
- matrice de portage et backlog d’implémentation,
- initialisation de la nouvelle app **Next.js 16 + TypeScript + Prisma + Supabase**,
- mise en place du **Lot 00**, du **Lot 01**, puis du **Lot 02**,
- auth moderne fonctionnelle avec :
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - route admin protégée via **`proxy.ts`**,
  - UI `/admin/login` et `/admin`.

### État actuel du produit de migration
Le projet **n’est pas encore une migration métier complète**, mais il dispose désormais d’une **fondation technique saine et testée** pour enchaîner sur le portage du CMS et des pages publiques.

---

## 2) Objectifs de départ

Les objectifs successifs de la mission ont été :

1. **Récupérer et auditer** le repo parent `greeters-ssr`.
2. **Identifier la vraie source métier** liée à Greeters.
3. **Comparer le handoff initial** à la réalité du code versionné.
4. **Établir un plan réaliste** de migration vers Next.js.
5. **Transformer la planification en exécution** dans `/app/greeters`.
6. **Initialiser la nouvelle application cible** et compléter les premiers lots :
   - **Lot 00** : bootstrap projet,
   - **Lot 01** : DB/schema/seed,
   - **Lot 02** : auth moderne + UI login admin.

---

## 3) Ce qui a été découvert pendant l’audit

## 3.1 Sur le repo `greeters-ssr`

Le repo parent ne contenait pas la vraie application Greeters SSR attendue. Il contenait surtout :
- un template Emergent minimal React/FastAPI/Mongo,
- des documents historiques,
- une référence à `greeters` via un sous-projet/gitlink.

## 3.2 Sur le vrai repo `greeters`

Le repo source accessible publiquement, audité sur `main = 977b48...`, ne contenait pas non plus de base Next.js.

### Stack réelle du repo source
- **Frontend** : React SPA (CRA/CRACO)
- **Backend** : FastAPI
- **DB** : MongoDB
- **CMS** : déjà existant en React/FastAPI
- **SSR** : traces FastAPI/Jinja2, mais pas de base Next active

## 3.3 Ce que cela invalide

Le handoff initial parlait notamment de :
- App Router déjà en place,
- fichiers `src/app/...`,
- `SunEditor`,
- `withAuth.tsx`,
- `layout.tsx`,
- `Supabase` déjà branché.

### Verdict
Tout cela était **absent du code versionné**. La bonne stratégie a donc été :

> considérer le repo React/FastAPI existant comme **source fonctionnelle à porter**, et non comme une migration Next.js déjà engagée à terminer.

---

## 4) Décisions d’architecture verrouillées

Les choix produits/utilisateur qui pilotent maintenant la suite sont :

- **Cible frontend/backend** : **Next.js App Router**
- **Stratégie** : **réécriture complète en one-shot**
- **Base de données cible** : **Supabase PostgreSQL**
- **ORM** : **Prisma**
- **Auth** : sessions serveur + cookies HTTP-only + **`proxy.ts`**
- **Règle explicite** : **ne pas installer Google Maps**
- **Règle explicite** : **SunEditor sort du périmètre**, car le vrai produit n’en dépend pas

---

## 5) Ce que j’ai produit côté documentation

Les documents de référence créés/mis à jour dans `/app` sont :

### Audit et diagnostic
- `/app/README_DEV.md` — ce handoff complet
- `/app/AUDIT_ECART_GREETERS.md` — audit de l’écart entre la doc Greeters et le code réellement versionné
- `/app/AUDIT_WORKSPACE_LOCAL_GREETERS.md` — audit du workspace local à l’instant où l’écart a été vérifié

### Planification de migration
- `/app/NEXT_MIGRATION_PLAN.md` — stratégie de migration Next.js détaillée
- `/app/PORTAGE_MATRIX_GREETERS_NEXT.md` — matrice de portage écran/API/table
- `/app/IMPLEMENTATION_BACKLOG_GREETERS_NEXT.md` — backlog d’exécution séquencé

### Mémoire de projet
- `/app/memory/PRD.md` — résumé projet/état/next steps

---

## 6) Ce que j’ai exécuté techniquement dans `/app/greeters`

## 6.1 Création de la nouvelle app cible

J’ai créé un nouveau projet **Next.js 16 App Router + TypeScript** dans :

- `/app/greeters`

### Dépendances installées
- `next`
- `react`
- `react-dom`
- `@prisma/client`
- `prisma`
- `@prisma/adapter-pg`
- `bcryptjs`
- `tsx`

### Scripts ajoutés dans `package.json`
- `dev`
- `build`
- `start`
- `lint`
- `prisma:generate`
- `prisma:migrate`
- `prisma:deploy`
- `db:seed`

---

## 6.2 Lot 00 — Bootstrap projet

### Réalisé
- structure Next.js initiale opérationnelle,
- layout global personnalisé,
- page d’accueil de chantier,
- fichiers techniques de base :
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `lib/db/prisma.ts`
  - `lib/utils.ts`
  - `proxy.ts`
  - `prisma.config.ts`

### Résultat
Le projet compile et construit correctement.

---

## 6.3 Lot 01 — Base de données / Prisma / Seed

### Réalisé
- schéma Prisma complet de base créé dans `prisma/schema.prisma`
- migration SQL initiale générée dans :
  - `/app/greeters/prisma/migrations/0001_init/migration.sql`
- seed admin créé dans :
  - `/app/greeters/prisma/seed.ts`

### Tables/modèles posés
- `users`
- `sessions`
- `password_resets`
- `pages`
- `page_versions`
- `menus`
- `documents`
- `home_sections`
- `page_contents`
- `page_previews`
- `page_edits`

### Particularité importante
L’application des migrations Prisma **n’a pas pu être finalisée automatiquement depuis le runner** à cause des contraintes Supabase/pooler/connexion directe.

### Solution retenue
La migration SQL initiale a été **exécutée manuellement côté Supabase**, puis la suite a continué normalement.

### Runtime DB actuel
Le runtime Prisma fonctionne avec la connexion pooler présente dans :
- `/app/greeters/.env`

---

## 6.4 Lot 02 — Auth moderne + login admin

### Réalisé

#### Backend auth Next.js
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

#### Composants auth / session
- hashing et règles mot de passe
- validation d’input login
- création de session en DB
- cookie HTTP-only signé
- lecture de session courante
- destruction de session

#### Protection admin
- **`proxy.ts`** protège `/admin/*`
- redirection vers `/admin/login` si non authentifié
- suppression du cookie si le payload signé est invalide/expiré

#### UI admin minimale fonctionnelle
- `/admin/login`
- `/admin`

### Résultat métier
On a maintenant le **premier vertical fonctionnel** de la migration :

> login admin → création session → accès dashboard protégé → logout

---

## 7) Arborescence utile actuelle dans `/app/greeters`

```text
/app/greeters
├── app/
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts
│   │       ├── logout/route.ts
│   │       └── me/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── admin/
│       └── auth/
│           ├── LoginForm.tsx
│           └── LogoutButton.tsx
├── lib/
│   ├── auth/
│   │   ├── current-user.ts
│   │   ├── password.ts
│   │   ├── session-cookie.ts
│   │   ├── session.ts
│   │   └── validators.ts
│   ├── db/
│   │   └── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── migrations/
│   │   ├── 0001_init/migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed.ts
├── .env
├── next.config.ts
├── prisma.config.ts
├── proxy.ts
└── package.json
```

---

## 8) Cartographie des fichiers importants pour le prochain développeur

## 8.1 Fichiers d’entrée app cible

- `/app/greeters/package.json`
- `/app/greeters/next.config.ts`
- `/app/greeters/prisma.config.ts`
- `/app/greeters/app/layout.tsx`
- `/app/greeters/app/page.tsx`
- `/app/greeters/app/globals.css`

## 8.2 Fichiers DB / Prisma

- `/app/greeters/prisma/schema.prisma`
- `/app/greeters/prisma/migrations/0001_init/migration.sql`
- `/app/greeters/prisma/seed.ts`
- `/app/greeters/lib/db/prisma.ts`

## 8.3 Fichiers auth / session

- `/app/greeters/lib/auth/password.ts`
- `/app/greeters/lib/auth/validators.ts`
- `/app/greeters/lib/auth/session-cookie.ts`
- `/app/greeters/lib/auth/session.ts`
- `/app/greeters/lib/auth/current-user.ts`
- `/app/greeters/proxy.ts`

## 8.4 Fichiers UI auth / admin

- `/app/greeters/app/admin/login/page.tsx`
- `/app/greeters/app/admin/page.tsx`
- `/app/greeters/components/admin/auth/LoginForm.tsx`
- `/app/greeters/components/admin/auth/LogoutButton.tsx`

## 8.5 Fichiers API déjà livrés

- `/app/greeters/app/api/auth/login/route.ts`
- `/app/greeters/app/api/auth/logout/route.ts`
- `/app/greeters/app/api/auth/me/route.ts`

## 8.6 Fichiers de planification utiles pour continuer

- `/app/NEXT_MIGRATION_PLAN.md`
- `/app/PORTAGE_MATRIX_GREETERS_NEXT.md`
- `/app/IMPLEMENTATION_BACKLOG_GREETERS_NEXT.md`
- `/app/memory/PRD.md`

## 8.7 Fichiers du produit source à consulter pendant le portage

Le clone d’audit a été fait dans `/tmp/greeters-remote`. Si ce dossier n’existe plus dans une future session, il faut simplement re-cloner :

- `https://github.com/Nexus-Conseil/greeters.git`

puis rouvrir les mêmes chemins côté repo source.

### Frontend source React/FastAPI
- `/tmp/greeters-remote/frontend/src/App.js`
- `/tmp/greeters-remote/frontend/src/components/admin/PageEditor.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/PageEditorAI.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/PagesList.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/PendingApprovals.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/MenuManagement.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/DocumentsManagement.jsx`
- `/tmp/greeters-remote/frontend/src/components/admin/UsersManagement.jsx`

### Backend source FastAPI
- `/tmp/greeters-remote/backend/routes/auth.py`
- `/tmp/greeters-remote/backend/routes/pages.py`
- `/tmp/greeters-remote/backend/routes/page_editor.py`
- `/tmp/greeters-remote/backend/routes/menu.py`
- `/tmp/greeters-remote/backend/routes/documents.py`
- `/tmp/greeters-remote/backend/routes/uploads.py`
- `/tmp/greeters-remote/backend/routes/contact.py`
- `/tmp/greeters-remote/backend/routes/home_content.py`
- `/tmp/greeters-remote/backend/routes/chatbot.py`
- `/tmp/greeters-remote/backend/routes/chatbot_admin.py`

---

## 9) Variables d’environnement et état infra

## 9.1 Fichier principal côté nouvelle app
- `/app/greeters/.env`

## 9.2 Variables déjà posées
- `DATABASE_URL`
- `SUPABASE_DB_URL`
- `DIRECT_DATABASE_URL`
- `AUTH_SECRET`
- `SEED_ADMIN_NAME`

## 9.3 Variables utilisées pour le seed
Elles ne sont **pas** fixées en dur dans le seed :
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

### Conséquence
Pour recréer/mettre à jour le super admin, le prochain dev doit lancer le seed avec ces variables dans l’environnement.

---

## 10) Ce qui a été testé et validé

## 10.1 Validation technique locale
- `prisma validate`
- `prisma generate`
- `eslint`
- `next build`

## 10.2 Validation fonctionnelle auth
Validé par appels HTTP :
- `GET /api/auth/me` non authentifié → `401`
- `POST /api/auth/login` avec payload invalide → `400`
- `POST /api/auth/login` avec mauvais mot de passe → `401`
- `POST /api/auth/login` avec compte seedé → `200` + cookie HTTP-only
- `GET /api/auth/me` authentifié → `200`
- `GET /admin` authentifié → `200`
- `POST /api/auth/logout` → `200` puis `me` retourne `401`

## 10.3 Validation navigateur
La page `/admin/login` puis le dashboard `/admin` ont été validés visuellement via navigateur automatisé.

## 10.4 Rapport de test autonome
- `/app/test_reports/iteration_3.json`

## 10.5 Régression ajoutée par le testing agent
- `/app/backend/tests/test_greeters_auth_flow.py`

---

## 11) Ce qui reste à faire

La migration est **loin d’être terminée fonctionnellement**. Seule la fondation et le premier vertical auth ont été livrés.

## 11.1 Priorité immédiate — Lot 03 / Lot 04

### À construire ensuite
1. couche repositories/services métier
2. APIs pages P0
3. shell admin/public plus complet
4. routes publiques SSR
5. CRUD pages

### Ordre recommandé immédiat
1. `lib/repositories/*`
2. `lib/services/pages.ts`
3. `app/api/pages/*`
4. `app/admin/pages/*`
5. `components/admin/pages/*`
6. `app/(public)/*`

## 11.2 Lots ensuite

### P1
- workflow `pending` / versions / rollback
- menu
- documents/uploads

### P2
- page editor IA
- users admin
- contact
- home content
- chatbot
- migration de données Mongo → Supabase

---

## 12) Endroits exacts où reprendre selon le sujet

## Si le prochain dev reprend l’auth
- commencer par `lib/auth/*`
- vérifier `proxy.ts`
- vérifier `app/api/auth/*`
- vérifier `app/admin/login/page.tsx`

## Si le prochain dev reprend la DB
- partir de `prisma/schema.prisma`
- relire `prisma/migrations/0001_init/migration.sql`
- relire `lib/db/prisma.ts`
- relire `.env`

## Si le prochain dev reprend le portage CMS/pages
- relire d’abord :
  - `/app/PORTAGE_MATRIX_GREETERS_NEXT.md`
  - `/app/IMPLEMENTATION_BACKLOG_GREETERS_NEXT.md`
- puis ouvrir le code source métier dans `/tmp/greeters-remote/backend/routes/pages.py`
- puis créer les repositories et routes Next correspondants dans `/app/greeters`

## Si le prochain dev reprend les pages publiques SSR
- prendre pour source les composants publics du repo React historique
- implémenter les pages dans `app/(public)/...`
- ne pas faire de fetch 100% client pour le contenu principal publié

---

## 13) Pièges / points d’attention importants

1. **Ne pas repartir du mauvais postulat**
   - la vraie source métier est React/FastAPI, pas un Next déjà prêt

2. **`proxy.ts` et pas `middleware.ts`**
   - sur Next 16, `proxy.ts` est la convention moderne

3. **Le seed n’invente pas d’identifiants**
   - il attend `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`

4. **Migration DB initiale**
   - le SQL initial existe déjà
   - il a été appliqué côté Supabase
   - éviter de le regénérer à l’aveugle sans comparer le schéma distant

5. **Pooler Supabase**
   - le runtime Prisma fonctionne via pooler
   - les migrations Prisma directes depuis le runner restent un sujet infra distinct

6. **Le code historique existe encore ailleurs**
   - `/app/backend` et `/app/frontend` appartiennent au repo parent/template, pas à la nouvelle cible Next
   - la cible active de migration est **`/app/greeters`**

7. **Ne pas réintroduire SunEditor**
   - non justifié par la base réelle du produit

---

## 14) Commandes utiles pour le prochain développeur

Depuis `/app/greeters` :

### Installer / régénérer Prisma
- `yarn prisma validate`
- `yarn prisma generate`

### Construire l’app
- `yarn build`

### Lancer en dev
- `yarn dev`

### Lancer en prod locale
- `yarn start`

### Seeder un admin
- `SEED_ADMIN_EMAIL="..." SEED_ADMIN_PASSWORD="..." yarn db:seed`

---

## 15) Recommandation de reprise très concrète

Si un développeur prend le relais maintenant, l’ordre le plus rentable est :

1. relire `/app/IMPLEMENTATION_BACKLOG_GREETERS_NEXT.md`
2. ouvrir `/app/greeters/prisma/schema.prisma`
3. ouvrir `/app/greeters/lib/auth/*` pour comprendre le vertical déjà posé
4. implémenter la couche repositories/services pages
5. porter `GET/POST /api/pages`
6. porter `/admin/pages`
7. ensuite seulement attaquer les pages publiques SSR

---

## 16) État exact à transmettre en une phrase

> Le projet est maintenant passé d’un audit de réalité à une exécution concrète : la nouvelle base Next.js/Supabase vit dans `/app/greeters`, les lots 00 à 02 sont faits, l’auth admin fonctionne, et la prochaine vraie étape est le portage du cœur CMS/pages.