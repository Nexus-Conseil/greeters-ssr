# Plan de migration Next.js — à partir du vrai code React/FastAPI existant

## 1) Décisions verrouillées

Choix utilisateur retenus :

- **Base de données cible** : **Supabase PostgreSQL**
- **Stratégie de migration** : **réécriture Next.js complète en one-shot**
- **Authentification cible** : **auth modernisée côté Next.js**
- **Livrables** : mise à jour de `README_DEV.md` + fichier de plan dédié

### Conséquence stratégique
On **ne poursuit pas** le stack actuel en production à long terme.
On s’en sert comme **source fonctionnelle de référence** pour reconstruire un produit équivalent en **Next.js App Router full-stack**.

---

## 2) Source de vérité fonctionnelle

Le code existant à porter provient du repo réel `greeters` et non du handoff Next théorique.

### Frontend à porter
- `frontend/src/App.js`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/hooks/useApi.js`
- `frontend/src/components/admin/*`
- `frontend/src/components/cms/*`
- `frontend/src/components/home/*`
- `frontend/src/components/layout/*`
- `frontend/src/components/pages/*`

### Backend à porter
- `backend/routes/auth.py`
- `backend/routes/pages.py`
- `backend/routes/page_editor.py`
- `backend/routes/menu.py`
- `backend/routes/documents.py`
- `backend/routes/uploads.py`
- `backend/routes/contact.py`
- `backend/routes/home_content.py`
- `backend/routes/chatbot.py`
- `backend/routes/chatbot_admin.py`
- `backend/routes/booking.py`
- `backend/models/*.py`

### Point important
Le plan de migration **ne doit pas inclure SunEditor**.
Le code réel n’utilise pas SunEditor : le CMS actuel repose sur :
- un éditeur structuré par sections/blocs (`PageEditor.jsx`)
- un éditeur IA par prompts (`PageEditorAI.jsx`)

---

## 3) Cible d’architecture Next.js

## 3.1 Stack cible

- **Next.js App Router**
- **React**
- **Route Handlers** pour les APIs
- **Server Components** pour les pages publiques et les écrans admin lisibles côté serveur
- **Client Components** uniquement pour les zones interactives lourdes
- **Supabase PostgreSQL** comme base unique
- **ORM recommandé : Prisma**
- **Authentification server-side** avec cookies HTTP-only + `proxy.ts` (équivalent moderne de middleware sur Next 16)

## 3.2 Principes d’architecture

1. **One-shot** signifie :
   - on construit la nouvelle app Next.js en parallèle,
   - on valide la parité fonctionnelle,
   - puis on bascule,
   - sans conserver durablement la prod sur FastAPI + CRA.

2. **Public = SSR/SEO first**
   - les pages publiques doivent être rendues via App Router,
   - avec metadata générées côté serveur,
   - sans fetch 100% client pour le contenu principal.

3. **Admin = server auth + client islands**
   - layout admin protégé par `proxy.ts`,
   - données chargées côté serveur quand possible,
   - formulaires / éditeurs en composants clients ciblés.

4. **Pas de dépendance SunEditor**
   - soit on garde le modèle actuel sections/blocs,
   - soit on introduit plus tard un éditeur riche moderne,
   - mais ce n’est **pas** une dépendance de la migration initiale.

---

## 4) Arborescence cible recommandée

```text
/app/greeters-next/
├── app/
│   ├── (public)/
│   │   ├── [[...slug]]/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── galerie/page.tsx
│   │   └── ...
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pages/page.tsx
│   │   ├── pages/new/page.tsx
│   │   ├── pages/[id]/page.tsx
│   │   ├── pending/page.tsx
│   │   ├── users/page.tsx
│   │   ├── menu/page.tsx
│   │   ├── documents/page.tsx
│   │   └── chatbot/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── pages/
│   │   ├── menu/
│   │   ├── documents/
│   │   ├── uploads/
│   │   ├── page-editor/
│   │   ├── contact/
│   │   ├── chatbot/
│   │   └── health/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── public/
│   ├── admin/
│   ├── cms/
│   └── shared/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── repositories/
│   ├── services/
│   └── validators/
├── prisma/
│   └── schema.prisma
└── proxy.ts
```

---

## 5) Modèle de données cible — Supabase PostgreSQL

## 5.1 Tables cœur

### `users`
- `id` uuid pk
- `email` text unique
- `name` text
- `password_hash` text
- `role` enum(`super_admin`, `admin`, `editor`)
- `created_by` uuid nullable
- `created_at` timestamptz

### `sessions`
- `id` uuid pk
- `user_id` uuid fk users
- `token_hash` text unique
- `expires_at` timestamptz
- `created_at` timestamptz

### `password_resets`
- `id` uuid pk
- `user_id` uuid fk users
- `email` text
- `token_hash` text unique
- `expires_at` timestamptz
- `created_at` timestamptz

### `pages`
- `id` uuid pk
- `title` text
- `slug` text unique
- `meta_description` text nullable
- `meta_keywords` text nullable
- `sections` jsonb
- `status` enum(`draft`, `pending`, `published`, `archived`)
- `is_in_menu` boolean
- `menu_order` int
- `menu_label` text nullable
- `current_version` int
- `published_version` int nullable
- `created_by` uuid fk users
- `created_at` timestamptz
- `updated_by` uuid fk users nullable
- `updated_at` timestamptz nullable

### `page_versions`
- `id` uuid pk
- `page_id` uuid fk pages
- `version_number` int
- `content` jsonb
- `status` enum(`draft`, `pending`, `published`, `archived`)
- `created_by` uuid fk users
- `created_at` timestamptz
- `approved_by` uuid nullable
- `approved_at` timestamptz nullable
- `rejection_reason` text nullable

### `menus`
- `id` text pk (`main_menu`)
- `items` jsonb
- `updated_by` uuid nullable
- `updated_at` timestamptz nullable

### `documents`
- `id` uuid pk
- `filename` text
- `original_filename` text
- `file_path` text
- `file_size` bigint
- `mime_type` text
- `category` text
- `description` text nullable
- `uploaded_by` text
- `created_at` timestamptz

### `home_sections`
- `id` uuid pk
- `section_type` text unique
- `content` jsonb nullable
- `items` jsonb nullable
- `order` int
- `updated_at` timestamptz

## 5.2 Tables spécifiques à l’édition IA

### `page_contents`
- `id` uuid pk
- `page_id` text unique
- `content` jsonb
- `updated_at` timestamptz

### `page_previews`
- `id` uuid pk
- `page_id` text
- `new_content` jsonb
- `status` enum(`pending`, `validated`, `rejected`, `expired`)
- `created_by` uuid fk users
- `created_at` timestamptz

### `page_edits`
- `id` uuid pk
- `page_id` text
- `prompt` text
- `changes_summary` text
- `editor_id` uuid fk users
- `editor_name` text nullable
- `created_at` timestamptz

## 5.3 Décision de migration de données

Comme la cible est **Supabase immédiatement**, il faut :
- **exporter Mongo**,
- **mapper les documents vers PostgreSQL**,
- **charger les JSON de sections / versions / menus / home content en `jsonb`**,
- et **garder les IDs stables** autant que possible pour limiter les risques de casse fonctionnelle.

---

## 6) Authentification cible

## 6.1 Ce qu’on abandonne

Le modèle actuel repose sur :
- JWT exposé au frontend
- stockage dans `localStorage`
- garde côté client via `ProtectedRoute`

## 6.2 Ce qu’on met en place dans Next

### Cible
- **session server-side**
- **cookie HTTP-only sécurisé**
- **`proxy.ts`** pour protéger `/admin/*`
- récupération utilisateur côté serveur pour layouts/pages/admin

### Flux cible
1. `POST /api/auth/login`
2. vérification mot de passe hashé
3. création d’une session en base
4. dépôt d’un cookie de session HTTP-only
5. `proxy.ts` vérifie la session sur les routes admin
6. le rôle (`super_admin` / `admin` / `editor`) est évalué côté serveur

### Pourquoi cette direction
- plus robuste que `localStorage`
- meilleure compatibilité App Router
- suppression du HOC purement client

---

## 7) Cartographie de migration — écrans

## 7.1 Pages publiques à porter en priorité

Depuis `frontend/src/App.js` et les composants publics :

- `/`
- `/galerie`
- `/livre-dor`
- `/faire-un-don`
- `/actualites`
- `/devenez-benevole`
- `/qui-sommes-nous`
- `/contact`
- `/presse`
- `/mentions-legales`
- `/:slug` pour les pages CMS dynamiques

### Cible Next
- pages statiques fortes en `app/(public)/...`
- catch-all `app/(public)/[[...slug]]/page.tsx` pour les pages CMS et aliases
- metadata générées depuis la DB

## 7.2 Admin à porter

Depuis les routes actuelles :

- `/admin/login`
- `/admin`
- `/admin/pages`
- `/admin/pages/new`
- `/admin/pages/[id]`
- `/admin/pending`
- `/admin/users`
- `/admin/menu`
- `/admin/documents`
- `/admin/chatbot`

### Ordre de portage recommandé dans le one-shot
1. login + layout admin
2. dashboard
3. pages CRUD
4. pending approvals
5. users
6. menu
7. documents
8. chatbot

---

## 8) Cartographie de migration — APIs

## 8.1 Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/users`
- `POST /api/auth/users`
- `DELETE /api/auth/users/[id]`

## 8.2 Pages / workflow
- `GET /api/pages`
- `POST /api/pages`
- `GET /api/pages/[id]`
- `PUT /api/pages/[id]`
- `DELETE /api/pages/[id]`
- `GET /api/pages/public`
- `GET /api/pages/by-slug/[slug]`
- `GET /api/pages/pending/list`
- `POST /api/pages/pending/[versionId]/approve`
- `POST /api/pages/pending/[versionId]/reject`
- `GET /api/pages/[id]/versions`
- `POST /api/pages/[id]/rollback/[versionNumber]`

## 8.3 Menu
- `GET /api/menu`
- `PUT /api/menu`
- `POST /api/menu/sync-from-pages`

## 8.4 Documents / uploads
- `GET /api/documents`
- `GET /api/documents/public`
- `POST /api/documents/upload`
- `PUT /api/documents/[id]`
- `DELETE /api/documents/[id]`
- `GET /api/documents/categories`
- `POST /api/uploads/image`

## 8.5 IA / édition
- `GET /api/page-editor/pages`
- `GET /api/page-editor/page/[pageId]`
- `POST /api/page-editor/edit`
- `GET /api/page-editor/preview/[id]`
- `POST /api/page-editor/preview/[id]/validate`
- `POST /api/page-editor/preview/[id]/reject`

## 8.6 Autres domaines
- `POST /api/contact/send`
- `GET/POST /api/home-content/*`
- `GET/POST /api/chatbot/*`
- `GET /api/health`

---

## 9) Plan d’exécution concret

## Phase 0 — Freeze de périmètre (1 jour)

Objectif : verrouiller ce qu’on porte et ce qu’on reporte.

À faire :
- figer la liste des pages publiques
- figer la liste des écrans admin
- figer la liste des endpoints indispensables
- exclure explicitement Google Maps et SunEditor du périmètre

## Phase 1 — Bootstrapping Next + Supabase (1 à 2 jours)

À produire :
- nouvelle app Next.js
- Prisma branché sur Supabase Postgres
- schéma initial
- variables d’environnement serveur
- migrations de base

Résultat attendu :
- l’app démarre
- la DB est accessible
- les tables principales existent

## Phase 2 — Auth modernisée (1 à 2 jours)

À produire :
- schéma `users`, `sessions`, `password_resets`
- login/logout/me
- cookies HTTP-only
- proxy admin
- rôles `super_admin` / `admin` / `editor`

Résultat attendu :
- `/admin/login` fonctionne
- `/admin/*` est protégé côté serveur

## Phase 3 — Modèle de contenu CMS (1 à 2 jours)

À produire :
- tables `pages`, `page_versions`, `menus`
- repository layer côté Next
- CRUD de base pages
- récupération page par slug

Résultat attendu :
- création / modification / suppression de pages
- pages publiées lisibles par slug

## Phase 4 — Pages publiques SSR (2 à 3 jours)

À produire :
- layout public Next
- header/footer migrés
- pages publiques prioritaires migrées
- metadata SEO générées
- pages CMS dynamiques en SSR

Résultat attendu :
- les routes publiques principales s’affichent en SSR
- le contenu CMS publié est visible sans dépendance à un fetch client tardif

## Phase 5 — Admin CMS (2 à 4 jours)

À produire :
- dashboard admin
- liste des pages
- formulaire `new/edit`
- approbations `pending`
- historique de versions / rollback

Résultat attendu :
- un admin peut gérer le cycle de vie d’une page de bout en bout

## Phase 6 — Menu, documents, uploads (1 à 2 jours)

À produire :
- gestion du menu
- synchronisation depuis pages
- documents publics/admin
- upload image/document

Résultat attendu :
- navigation et assets fonctionnent depuis la nouvelle stack

## Phase 7 — Édition IA (2 jours)

À produire :
- portage de `page_editor.py`
- service IA côté Next
- previews stockées en DB
- validation / rejet

Résultat attendu :
- le flux “prompt → preview → valider/rejeter” fonctionne dans Next

## Phase 8 — Data migration et cutover (1 à 2 jours)

À produire :
- script Mongo → Postgres
- import des users/pages/menus/documents/home sections
- validation fonctionnelle complète
- bascule finale vers Next

Résultat attendu :
- la nouvelle app Next devient la source unique de vérité

---

## 10) Ce qu’il faut porter tel quel vs ce qu’il faut refactorer

## À porter presque tel quel
- modèles métiers `Page`, `PageVersion`, `UserRole`
- logique métier CRUD pages
- workflow pending/approve/reject
- logique menu sync
- logique documents/categories
- flux reset password

## À refactorer fortement
- auth JWT + localStorage
- hooks `useApi` purement client
- routing React Router
- rendu public client-side des pages CMS
- SSR FastAPI/Jinja2

## À ne pas porter tel quel
- la structure FastAPI elle-même
- les templates Jinja2
- la garde admin purement client

---

## 11) Définition de done minimale

La migration peut être considérée comme sur une trajectoire acceptable si :

- l’app Next.js tourne seule comme frontend + backend
- Supabase PostgreSQL remplace MongoDB pour les entités cœur
- auth admin fonctionne via cookies HTTP-only + `proxy.ts`
- les pages publiques clés sont rendues côté serveur
- CRUD pages fonctionne
- workflow pending fonctionne
- menu/documents/uploads fonctionnent
- édition IA fonctionne sans dépendre du backend FastAPI

---

## 12) Risques principaux

1. **Migration DB Mongo → Postgres**
   - le champ `sections` doit être proprement conservé en `jsonb`

2. **One-shot rewrite**
   - forte pression de parité fonctionnelle avant bascule

3. **Auth**
   - attention aux rôles admin/editor/super_admin et à la gestion des sessions

4. **Édition IA**
   - nécessite de réimplémenter proprement le service applicatif côté Next

5. **Uploads/documents**
   - il faut décider si les fichiers restent sur disque ou migrent ensuite vers Supabase Storage

---

## 13) Prochaine étape recommandée

La prochaine étape la plus rentable est :

### Étape suivante recommandée
**Rédiger la matrice de portage détaillée écran/API/table par écran/API/table**, puis démarrer l’implémentation dans cet ordre :

1. scaffold Next + Prisma + Supabase
2. auth modernisée
3. pages + menu
4. public SSR
5. admin CMS
6. IA / documents / chatbot

Si vous le souhaitez, je peux maintenant produire cette **matrice de portage ultra-détaillée**, prête pour exécution développeur.