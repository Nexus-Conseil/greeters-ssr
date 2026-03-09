# Backlog d’implémentation séquencé — migration Greeters vers Next.js dans `/app/greeters`

## Règle d’exécution

- **Cible** : `/app/greeters`
- **Approche** : one-shot rewrite
- **Ordre imposé** : suivre les lots dans l’ordre, sans sauter les dépendances
- **Source métier** : repo `greeters` audité

---

## Lot 00 — Préparation du chantier

### Tâche 00.1 — Initialiser la nouvelle app Next.js
**Créer :**
- `/app/greeters/package.json`
- `/app/greeters/tsconfig.json`
- `/app/greeters/next.config.mjs`
- `/app/greeters/.gitignore`
- `/app/greeters/app/layout.tsx`
- `/app/greeters/app/globals.css`

**Résultat attendu :** app Next bootable.

### Tâche 00.2 — Installer la base technique
**Créer :**
- `/app/greeters/prisma/schema.prisma`
- `/app/greeters/lib/db/prisma.ts`
- `/app/greeters/lib/utils.ts`
- `/app/greeters/proxy.ts`

**Résultat attendu :** connexion DB et proxy admin prêts à être branchés.

### Tâche 00.3 — Déclarer l’environnement serveur
**Créer / renseigner :**
- `/app/greeters/.env` ou `.env.local` serveur

**Variables minimales :**
- `SUPABASE_DB_URL`
- `AUTH_SECRET`
- clés mail / IA plus tard

---

## Lot 01 — Schéma Supabase / Prisma

### Tâche 01.1 — Créer les modèles Prisma P0
**Ajouter dans `prisma/schema.prisma` :**
- `User`
- `Session`
- `PasswordReset`
- `Page`
- `PageVersion`
- `Menu`
- `Document`
- `HomeSection`
- `PageContent`
- `PagePreview`
- `PageEdit`

### Tâche 01.2 — Générer et appliquer les migrations
**Créer :**
- migration initiale Prisma

### Tâche 01.3 — Préparer les seeds admin minimaux
**Créer :**
- `/app/greeters/prisma/seed.ts`

**Doit créer :**
- super admin initial
- admin initial si nécessaire

---

## Lot 02 — Couche auth moderne

### Tâche 02.1 — Portage du hashing et des règles mot de passe
**Créer :**
- `/app/greeters/lib/auth/password.ts`
- `/app/greeters/lib/auth/validators.ts`

**Source :** `backend/routes/auth.py`, `models/user.py`

### Tâche 02.2 — Gestion des sessions serveur
**Créer :**
- `/app/greeters/lib/auth/session.ts`
- `/app/greeters/lib/auth/current-user.ts`
- `/app/greeters/lib/auth/permissions.ts`

### Tâche 02.3 — Routes auth P0
**Créer :**
- `/app/greeters/app/api/auth/login/route.ts`
- `/app/greeters/app/api/auth/logout/route.ts`
- `/app/greeters/app/api/auth/me/route.ts`

### Tâche 02.4 — Middleware admin
**Créer / compléter :**
- `/app/greeters/proxy.ts`

**Doit protéger :**
- `/admin`
- `/admin/pages`
- `/admin/users`
- `/admin/pending`
- `/admin/menu`
- `/admin/documents`
- `/admin/chatbot`

### Tâche 02.5 — Écran login admin
**Créer :**
- `/app/greeters/app/admin/login/page.tsx`
- `/app/greeters/components/admin/auth/LoginForm.tsx`

**Source :** `frontend/src/components/admin/AdminLogin.jsx`

---

## Lot 03 — Repositories et services métier

### Tâche 03.1 — Repositories users/auth
**Créer :**
- `/app/greeters/lib/repositories/users.ts`
- `/app/greeters/lib/repositories/sessions.ts`
- `/app/greeters/lib/repositories/password-resets.ts`

### Tâche 03.2 — Repositories pages
**Créer :**
- `/app/greeters/lib/repositories/pages.ts`
- `/app/greeters/lib/repositories/page-versions.ts`
- `/app/greeters/lib/repositories/page-contents.ts`
- `/app/greeters/lib/repositories/page-previews.ts`
- `/app/greeters/lib/repositories/page-edits.ts`

### Tâche 03.3 — Repositories transverses
**Créer :**
- `/app/greeters/lib/repositories/menus.ts`
- `/app/greeters/lib/repositories/documents.ts`
- `/app/greeters/lib/repositories/home-sections.ts`

### Tâche 03.4 — Services métier
**Créer :**
- `/app/greeters/lib/services/pages.ts`
- `/app/greeters/lib/services/menu.ts`
- `/app/greeters/lib/services/documents.ts`
- `/app/greeters/lib/services/page-editor.ts`
- `/app/greeters/lib/services/contact.ts`

---

## Lot 04 — APIs P0 pages et health

### Tâche 04.1 — Health
**Créer :**
- `/app/greeters/app/api/health/route.ts`

### Tâche 04.2 — Pages CRUD cœur
**Créer :**
- `/app/greeters/app/api/pages/route.ts`
- `/app/greeters/app/api/pages/[id]/route.ts`
- `/app/greeters/app/api/pages/public/route.ts`
- `/app/greeters/app/api/pages/by-slug/[slug]/route.ts`

### Tâche 04.3 — Pages workflow
**Créer :**
- `/app/greeters/app/api/pages/pending/list/route.ts`
- `/app/greeters/app/api/pages/pending/[versionId]/approve/route.ts`
- `/app/greeters/app/api/pages/pending/[versionId]/reject/route.ts`
- `/app/greeters/app/api/pages/[id]/versions/route.ts`
- `/app/greeters/app/api/pages/[id]/rollback/[versionNumber]/route.ts`

---

## Lot 05 — Layouts et shell UI

### Tâche 05.1 — Layout global public
**Créer :**
- `/app/greeters/components/public/layout/Header.tsx`
- `/app/greeters/components/public/layout/Footer.tsx`
- `/app/greeters/components/public/layout/TopBar.tsx`

**Source :** `frontend/src/components/layout/*`

### Tâche 05.2 — Layout admin
**Créer :**
- `/app/greeters/app/admin/layout.tsx`
- `/app/greeters/components/admin/layout/AdminShell.tsx`
- `/app/greeters/components/admin/layout/AdminSidebar.tsx`

### Tâche 05.3 — UI partagée
**Créer :**
- `/app/greeters/components/shared/*`
- réutiliser shadcn/ui si souhaité

---

## Lot 06 — Pages publiques SSR

### Tâche 06.1 — Home SSR
**Créer :**
- `/app/greeters/app/(public)/page.tsx`
- `/app/greeters/components/public/home/HomePage.tsx`
- `/app/greeters/components/public/home/*`

### Tâche 06.2 — Pages publiques statiques
**Créer :**
- `/app/greeters/app/(public)/galerie/page.tsx`
- `/app/greeters/app/(public)/livre-dor/page.tsx`
- `/app/greeters/app/(public)/faire-un-don/page.tsx`
- `/app/greeters/app/(public)/actualites/page.tsx`
- `/app/greeters/app/(public)/devenez-benevole/page.tsx`
- `/app/greeters/app/(public)/qui-sommes-nous/page.tsx`
- `/app/greeters/app/(public)/contact/page.tsx`
- `/app/greeters/app/(public)/presse/page.tsx`
- `/app/greeters/app/(public)/mentions-legales/page.tsx`

### Tâche 06.3 — Route CMS dynamique SSR
**Créer :**
- `/app/greeters/app/(public)/[[...slug]]/page.tsx`
- `/app/greeters/components/cms/BlockRenderer.tsx`
- `/app/greeters/components/cms/SectionRenderer.tsx`
- `/app/greeters/components/cms/DynamicPageRenderer.tsx`

---

## Lot 07 — Admin dashboard + pages

### Tâche 07.1 — Dashboard admin
**Créer :**
- `/app/greeters/app/admin/page.tsx`
- `/app/greeters/components/admin/dashboard/AdminDashboard.tsx`

### Tâche 07.2 — Liste des pages
**Créer :**
- `/app/greeters/app/admin/pages/page.tsx`
- `/app/greeters/components/admin/pages/PagesTable.tsx`

### Tâche 07.3 — Formulaire page new/edit
**Créer :**
- `/app/greeters/app/admin/pages/new/page.tsx`
- `/app/greeters/app/admin/pages/[id]/page.tsx`
- `/app/greeters/components/admin/pages/PageEditorForm.tsx`
- `/app/greeters/components/admin/pages/SectionEditor.tsx`
- `/app/greeters/components/admin/pages/BlockEditor.tsx`

**Source :** `PageEditor.jsx`

### Tâche 07.4 — Upload image pour pages
**Créer :**
- `/app/greeters/app/api/uploads/image/route.ts`

---

## Lot 08 — Workflow d’approbation

### Tâche 08.1 — Pending approvals UI
**Créer :**
- `/app/greeters/app/admin/pending/page.tsx`
- `/app/greeters/components/admin/pending/PendingApprovalsTable.tsx`

### Tâche 08.2 — Version history / rollback UI
**Créer :**
- `/app/greeters/components/admin/pages/VersionHistory.tsx`
- `/app/greeters/components/admin/pages/RollbackDialog.tsx`

---

## Lot 09 — Menu

### Tâche 09.1 — APIs menu
**Créer :**
- `/app/greeters/app/api/menu/route.ts`
- `/app/greeters/app/api/menu/sync-from-pages/route.ts`

### Tâche 09.2 — UI menu
**Créer :**
- `/app/greeters/app/admin/menu/page.tsx`
- `/app/greeters/components/admin/menu/MenuEditor.tsx`

---

## Lot 10 — Documents

### Tâche 10.1 — APIs documents
**Créer :**
- `/app/greeters/app/api/documents/route.ts`
- `/app/greeters/app/api/documents/public/route.ts`
- `/app/greeters/app/api/documents/upload/route.ts`
- `/app/greeters/app/api/documents/[id]/route.ts`
- `/app/greeters/app/api/documents/categories/route.ts`

### Tâche 10.2 — UI documents
**Créer :**
- `/app/greeters/app/admin/documents/page.tsx`
- `/app/greeters/components/admin/documents/DocumentsManager.tsx`

---

## Lot 11 — Page editor IA

### Tâche 11.1 — Service IA
**Créer :**
- `/app/greeters/lib/services/ai/page-editor-ai.ts`

### Tâche 11.2 — APIs page editor
**Créer :**
- `/app/greeters/app/api/page-editor/pages/route.ts`
- `/app/greeters/app/api/page-editor/page/[pageId]/route.ts`
- `/app/greeters/app/api/page-editor/edit/route.ts`
- `/app/greeters/app/api/page-editor/preview/[id]/route.ts`
- `/app/greeters/app/api/page-editor/preview/[id]/validate/route.ts`
- `/app/greeters/app/api/page-editor/preview/[id]/reject/route.ts`

### Tâche 11.3 — UI éditeur IA
**Créer :**
- `/app/greeters/components/admin/pages/PageEditorAIClient.tsx`
- `/app/greeters/components/admin/pages/PagePreviewFrame.tsx`

**Source :** `PageEditorAI.jsx`

---

## Lot 12 — Users admin

### Tâche 12.1 — APIs users
**Créer :**
- `/app/greeters/app/api/auth/users/route.ts`
- `/app/greeters/app/api/auth/users/[id]/route.ts`

### Tâche 12.2 — UI users
**Créer :**
- `/app/greeters/app/admin/users/page.tsx`
- `/app/greeters/components/admin/users/UsersManagement.tsx`

---

## Lot 13 — Contact + reset password

### Tâche 13.1 — Contact
**Créer :**
- `/app/greeters/app/api/contact/send/route.ts`

### Tâche 13.2 — Reset password APIs
**Créer :**
- `/app/greeters/app/api/auth/forgot-password/route.ts`
- `/app/greeters/app/api/auth/reset-password/route.ts`

### Tâche 13.3 — UI forgot/reset
**Compléter :**
- `/app/greeters/components/admin/auth/LoginForm.tsx`

---

## Lot 14 — Chatbot et home content

### Tâche 14.1 — Home content
**Créer :**
- `/app/greeters/app/api/home-content/[section]/route.ts`
- `/app/greeters/lib/services/home-content.ts`

### Tâche 14.2 — Chatbot APIs
**Créer :**
- `/app/greeters/app/api/chatbot/message/route.ts`
- `/app/greeters/app/api/chatbot/admin/route.ts`

### Tâche 14.3 — UI chatbot admin
**Créer :**
- `/app/greeters/app/admin/chatbot/page.tsx`
- `/app/greeters/components/admin/chatbot/ChatbotAdmin.tsx`

---

## Lot 15 — Migration de données Mongo → Supabase

### Tâche 15.1 — Script export Mongo
**Créer :**
- `/app/greeters/scripts/export-mongo.ts` ou `.py`

### Tâche 15.2 — Script import Postgres
**Créer :**
- `/app/greeters/scripts/import-postgres.ts`

### Tâche 15.3 — Ordre d’import
**Importer dans l’ordre :**
1. users
2. pages
3. page_versions
4. menus
5. home_sections
6. documents
7. page_contents
8. page_previews
9. page_edits

---

## Lot 16 — Validation finale

### Tâche 16.1 — Parcours à vérifier
- login admin
- dashboard
- liste pages
- créer page
- éditer page
- publier/valider page pending
- page publique par slug en SSR
- menu sync
- documents upload/list/delete
- forgot/reset password
- édition IA preview/validate

### Tâche 16.2 — Critère de bascule
La bascule est autorisée quand :
- toutes les routes publiques clés sont servies par Next
- tout l’admin clé fonctionne sous auth serveur
- Supabase est la source de vérité
- aucune dépendance FastAPI n’est encore requise pour le CMS cœur

---

## Ordre impératif résumé

1. Bootstrap Next
2. Prisma + Supabase
3. Auth moderne + proxy admin
4. APIs pages/auth P0
5. Shell public/admin
6. Pages publiques SSR
7. Pages CRUD admin
8. Workflow pending/versions
9. Menu
10. Documents/uploads
11. Page editor IA
12. Users admin
13. Contact + reset password
14. Chatbot + home content
15. Migration données
16. Validation finale

Ce backlog est conçu pour être exécuté directement, lot par lot, dans `/app/greeters`.