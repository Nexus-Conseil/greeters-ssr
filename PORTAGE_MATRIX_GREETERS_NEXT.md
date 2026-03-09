# Matrice de portage détaillée — Greeters vers Next.js (`/app/greeters`)

## 0) Hypothèse de travail

- **Source métier** : le repo réel `greeters` audité
- **Cible technique** : nouvelle app **Next.js App Router** dans **`/app/greeters`**
- **DB cible** : **Supabase PostgreSQL**
- **Auth cible** : sessions serveur + cookies HTTP-only + `proxy.ts` (équivalent moderne de middleware)
- **Niveau attendu** : prêt à exécuter par lot, écran/API/table par écran/API/table

---

## 1) Matrice de portage — écrans

| Domaine | Écran / route source | Source actuelle | Route cible Next | Fichiers cibles à créer | APIs nécessaires | Tables nécessaires | Règle de done |
|---|---|---|---|---|---|---|---|
| Public | `/` | `frontend/src/components/home/HomePage.jsx` + sections home | `/` | `app/(public)/page.tsx`, `components/public/home/*`, `lib/repositories/home-content.ts` | `GET /api/home-content` ou fetch DB direct serveur | `home_sections`, `menus` | Home SSR avec header/footer + contenu DB |
| Public | `/galerie` | `frontend/src/components/pages/GaleriePage.jsx` | `/galerie` | `app/(public)/galerie/page.tsx`, `components/public/pages/GaleriePage.tsx` | lecture serveur galerie | `home_sections`, `documents` si utilisé | Galerie SSR stable |
| Public | `/livre-dor` | `frontend/src/components/pages/LivreDorPage.jsx` | `/livre-dor` | `app/(public)/livre-dor/page.tsx` | lecture serveur contenu page | `page_contents` ou `pages` | Livre d’or SSR |
| Public | `/faire-un-don` | `frontend/src/components/pages/FaireUnDonPage.jsx` | `/faire-un-don` | `app/(public)/faire-un-don/page.tsx` | lecture serveur contenu page | `pages` / `page_contents` | Page de don SSR |
| Public | `/actualites` | `frontend/src/components/pages/ActualitesPage.jsx` | `/actualites` | `app/(public)/actualites/page.tsx` | `GET /api/home-content/actualites` ou lecture serveur | `home_sections` | Actualités SSR |
| Public | `/devenez-benevole` | `frontend/src/components/pages/DevenezBenevolePage.jsx` | `/devenez-benevole` | `app/(public)/devenez-benevole/page.tsx` | lecture serveur contenu page | `pages` / `page_contents` | Route SSR + règles langue si reprises |
| Public | `/qui-sommes-nous` | `frontend/src/components/pages/QuiSommesNousPage.jsx` | `/qui-sommes-nous` | `app/(public)/qui-sommes-nous/page.tsx` | lecture serveur contenu page | `pages` / `page_contents` | SSR + metadata |
| Public | `/contact` | `frontend/src/components/pages/ContactPage.jsx` | `/contact` | `app/(public)/contact/page.tsx`, `components/public/forms/ContactForm.tsx` | `POST /api/contact/send` | table éventuelle de logs facultative | formulaire SSR + submit OK |
| Public | `/presse` | `frontend/src/components/pages/PressePage.jsx` | `/presse` | `app/(public)/presse/page.tsx` | lecture serveur contenu page / assets | `pages`, `documents` | SSR |
| Public | `/mentions-legales` | `frontend/src/components/pages/MentionsLegalesPage.jsx` | `/mentions-legales` | `app/(public)/mentions-legales/page.tsx` | lecture serveur contenu page | `pages` | SSR |
| Public CMS | `/:slug` | `frontend/src/components/cms/DynamicPage.jsx`, `DynamicPageRenderer.jsx` | `[[...slug]]` | `app/(public)/[[...slug]]/page.tsx`, `components/cms/BlockRenderer.tsx`, `components/cms/SectionRenderer.tsx` | `GET /api/pages/by-slug/[slug]` ou lecture DB serveur | `pages`, `menus` | page CMS publiée rendue en SSR |
| Admin | `/admin/login` | `frontend/src/components/admin/AdminLogin.jsx` | `/admin/login` | `app/admin/login/page.tsx`, `components/admin/auth/LoginForm.tsx` | `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `users`, `sessions`, `password_resets` | login + reset password OK |
| Admin | `/admin` dashboard | `frontend/src/components/admin/AdminDashboard.jsx` | `/admin` | `app/admin/page.tsx` | `GET /api/auth/me`, dashboards/read models | `users`, `pages`, `documents`, `page_versions` | dashboard affiché sous auth |
| Admin | `/admin/pages` | `frontend/src/components/admin/PageEditorAI.jsx` | `/admin/pages` | `app/admin/pages/page.tsx`, `components/admin/pages/PageEditorAIClient.tsx` | `GET /api/page-editor/pages`, `POST /api/page-editor/edit`, preview validate/reject | `pages`, `page_previews`, `page_edits`, `page_contents` | listing + génération IA + preview workflow |
| Admin | `/admin/pages-legacy` | `frontend/src/components/admin/PagesList.jsx` | `/admin/pages-legacy` ou absorbé dans `/admin/pages` | `app/admin/pages-legacy/page.tsx` ou suppression si fusion | `GET /api/pages` | `pages`, `page_versions` | listing CRUD pages consultable |
| Admin | `/admin/pages/new` | `frontend/src/components/admin/PageEditor.jsx` | `/admin/pages/new` | `app/admin/pages/new/page.tsx`, `components/admin/pages/PageEditorForm.tsx` | `POST /api/pages` + uploads | `pages`, `page_versions` | création de page OK |
| Admin | `/admin/pages/:id/edit` | `frontend/src/components/admin/PageEditor.jsx` | `/admin/pages/[id]` | `app/admin/pages/[id]/page.tsx` | `GET /api/pages/[id]`, `PUT /api/pages/[id]`, `POST /api/uploads/image` | `pages`, `page_versions` | édition page OK |
| Admin | `/admin/pending` | `frontend/src/components/admin/PendingApprovals.jsx` | `/admin/pending` | `app/admin/pending/page.tsx` | `GET /api/pages/pending/list`, approve/reject | `page_versions`, `pages`, `users` | workflow approbation OK |
| Admin | `/admin/users` | `frontend/src/components/admin/UsersManagement.jsx` | `/admin/users` | `app/admin/users/page.tsx` | `GET/POST/DELETE /api/auth/users` | `users` | CRUD users par rôle OK |
| Admin | `/admin/menu` | `frontend/src/components/admin/MenuManagement.jsx` | `/admin/menu` | `app/admin/menu/page.tsx` | `GET /api/menu`, `PUT /api/menu`, `POST /api/menu/sync-from-pages` | `menus`, `pages` | gestion menu OK |
| Admin | `/admin/documents` | `frontend/src/components/admin/DocumentsManagement.jsx` | `/admin/documents` | `app/admin/documents/page.tsx` | `GET/POST/PUT/DELETE /api/documents*`, `POST /api/uploads/image` si mutualisé | `documents` | documents CRUD OK |
| Admin | `/admin/chatbot` | `frontend/src/components/admin/ChatbotAdmin.jsx` | `/admin/chatbot` | `app/admin/chatbot/page.tsx` | endpoints chatbot admin | `chatbot_config`, éventuels logs | écran admin chatbot OK |

---

## 2) Matrice de portage — APIs

| Domaine | Endpoint source FastAPI | Fichier source | Route cible Next | Fichiers à créer | Tables cibles | Priorité |
|---|---|---|---|---|---|---|
| Health | `GET /api/health` | `backend/server.py` | `app/api/health/route.ts` | `app/api/health/route.ts` | aucune | P0 |
| Auth | `POST /api/auth/login` | `backend/routes/auth.py` | `app/api/auth/login/route.ts` | `lib/auth/*`, `app/api/auth/login/route.ts` | `users`, `sessions` | P0 |
| Auth | `POST /api/auth/logout` | nouveau en cible | `app/api/auth/logout/route.ts` | `app/api/auth/logout/route.ts` | `sessions` | P0 |
| Auth | `GET /api/auth/me` | `backend/routes/auth.py` | `app/api/auth/me/route.ts` | `app/api/auth/me/route.ts` | `users`, `sessions` | P0 |
| Auth | `POST /api/auth/forgot-password` | `backend/routes/auth.py` | `app/api/auth/forgot-password/route.ts` | route + service mail | `users`, `password_resets` | P1 |
| Auth | `POST /api/auth/reset-password` | `backend/routes/auth.py` | `app/api/auth/reset-password/route.ts` | route + validators | `users`, `password_resets` | P1 |
| Auth | `GET /api/auth/users` | `backend/routes/auth.py` | `app/api/auth/users/route.ts` | route + repository users | `users` | P1 |
| Auth | `POST /api/auth/users` | `backend/routes/auth.py` | `app/api/auth/users/route.ts` | même fichier | `users` | P1 |
| Auth | `DELETE /api/auth/users/[id]` | `backend/routes/auth.py` | `app/api/auth/users/[id]/route.ts` | route delete | `users` | P1 |
| Pages | `GET /api/pages` | `backend/routes/pages.py` | `app/api/pages/route.ts` | route + repository pages | `pages`, `page_versions` | P0 |
| Pages | `POST /api/pages` | `backend/routes/pages.py` | `app/api/pages/route.ts` | même fichier | `pages`, `page_versions` | P0 |
| Pages | `GET /api/pages/[id]` | `backend/routes/pages.py` | `app/api/pages/[id]/route.ts` | route detail | `pages` | P0 |
| Pages | `PUT /api/pages/[id]` | `backend/routes/pages.py` | `app/api/pages/[id]/route.ts` | même fichier | `pages`, `page_versions` | P0 |
| Pages | `DELETE /api/pages/[id]` | `backend/routes/pages.py` | `app/api/pages/[id]/route.ts` | même fichier | `pages`, `page_versions`, `menus` | P1 |
| Pages | `GET /api/pages/public` | `backend/routes/pages.py` | `app/api/pages/public/route.ts` | route public | `pages` | P0 |
| Pages | `GET /api/pages/by-slug/[slug]` | `backend/routes/pages.py` | `app/api/pages/by-slug/[slug]/route.ts` | route by slug | `pages` | P0 |
| Workflow | `GET /api/pages/pending/list` | `backend/routes/pages.py` | `app/api/pages/pending/list/route.ts` | route pending | `page_versions`, `pages`, `users` | P1 |
| Workflow | `POST /api/pages/pending/[versionId]/approve` | `backend/routes/pages.py` | `app/api/pages/pending/[versionId]/approve/route.ts` | route approve | `page_versions`, `pages` | P1 |
| Workflow | `POST /api/pages/pending/[versionId]/reject` | `backend/routes/pages.py` | `app/api/pages/pending/[versionId]/reject/route.ts` | route reject | `page_versions`, `pages` | P1 |
| Workflow | `GET /api/pages/[id]/versions` | `backend/routes/pages.py` | `app/api/pages/[id]/versions/route.ts` | route versions | `page_versions` | P1 |
| Workflow | `POST /api/pages/[id]/rollback/[versionNumber]` | `backend/routes/pages.py` | `app/api/pages/[id]/rollback/[versionNumber]/route.ts` | route rollback | `pages`, `page_versions` | P1 |
| Menu | `GET /api/menu` | `backend/routes/menu.py` | `app/api/menu/route.ts` | route menu | `menus` | P1 |
| Menu | `PUT /api/menu` | `backend/routes/menu.py` | `app/api/menu/route.ts` | même fichier | `menus` | P1 |
| Menu | `POST /api/menu/sync-from-pages` | `backend/routes/menu.py` | `app/api/menu/sync-from-pages/route.ts` | route sync | `menus`, `pages` | P1 |
| Documents | `GET /api/documents` | `backend/routes/documents.py` | `app/api/documents/route.ts` | route docs | `documents` | P1 |
| Documents | `GET /api/documents/public` | `backend/routes/documents.py` | `app/api/documents/public/route.ts` | route public docs | `documents` | P1 |
| Documents | `POST /api/documents/upload` | `backend/routes/documents.py` | `app/api/documents/upload/route.ts` | upload route | `documents` | P1 |
| Documents | `PUT /api/documents/[id]` | `backend/routes/documents.py` | `app/api/documents/[id]/route.ts` | route update/delete | `documents` | P1 |
| Documents | `DELETE /api/documents/[id]` | `backend/routes/documents.py` | `app/api/documents/[id]/route.ts` | même fichier | `documents` | P1 |
| Documents | `GET /api/documents/categories` | `backend/routes/documents.py` | `app/api/documents/categories/route.ts` | route categories | `documents` | P2 |
| Uploads | `POST /api/uploads/image` | `backend/routes/uploads.py` | `app/api/uploads/image/route.ts` | route image upload | stockage fichiers / table facultative | P1 |
| Page Editor | `GET /api/page-editor/pages` | `backend/routes/page_editor.py` | `app/api/page-editor/pages/route.ts` | route list | `pages`, `page_previews`, `page_edits`, `page_contents` | P1 |
| Page Editor | `GET /api/page-editor/page/[pageId]` | `backend/routes/page_editor.py` | `app/api/page-editor/page/[pageId]/route.ts` | route detail | `pages`, `page_contents`, `page_edits`, `page_previews` | P1 |
| Page Editor | `POST /api/page-editor/edit` | `backend/routes/page_editor.py` | `app/api/page-editor/edit/route.ts` | route + AI service | `page_previews`, `page_edits`, `page_contents` | P1 |
| Page Editor | `GET /api/page-editor/preview/[id]` | `backend/routes/page_editor.py` | `app/api/page-editor/preview/[id]/route.ts` | route preview | `page_previews` | P1 |
| Page Editor | `POST /api/page-editor/preview/[id]/validate` | `backend/routes/page_editor.py` | `app/api/page-editor/preview/[id]/validate/route.ts` | route validate | `page_previews`, `page_contents`, `pages` | P1 |
| Page Editor | `POST /api/page-editor/preview/[id]/reject` | `backend/routes/page_editor.py` | `app/api/page-editor/preview/[id]/reject/route.ts` | route reject | `page_previews` | P1 |
| Contact | `POST /api/contact/send` | `backend/routes/contact.py` | `app/api/contact/send/route.ts` | route contact | table log facultative | P1 |
| Home | endpoints home content | `backend/routes/home_content.py` | `app/api/home-content/*` | routes home sections | `home_sections` | P2 |
| Chatbot | endpoints chatbot | `backend/routes/chatbot.py`, `chatbot_admin.py` | `app/api/chatbot/*` | routes chatbot | config + logs | P2 |

---

## 3) Matrice de portage — tables / collections

| Source Mongo / modèle | Références source | Table PostgreSQL cible | Fichiers Next à créer | Migration | Priorité |
|---|---|---|---|---|---|
| `users` | `models/user.py`, `routes/auth.py` | `users` | `prisma/schema.prisma`, `lib/repositories/users.ts`, `lib/auth/*` | exporter + normaliser rôles | P0 |
| `sessions` | `server.py` TTL + auth | `sessions` | `prisma/schema.prisma`, `lib/auth/session.ts` | nouvelle implémentation côté Next | P0 |
| `password_resets` | `routes/auth.py` | `password_resets` | `lib/repositories/password-resets.ts`, routes auth reset | exporter si souhaité, sinon recréer vide | P1 |
| `pages` | `models/page.py`, `routes/pages.py` | `pages` | `lib/repositories/pages.ts`, `lib/services/pages.ts` | exporter en gardant IDs | P0 |
| `page_versions` | `models/page.py`, `routes/pages.py` | `page_versions` | `lib/repositories/page-versions.ts` | exporter en `jsonb` | P1 |
| `menu` / `menus` | `routes/menu.py`, `ssr_pages.py` | `menus` | `lib/repositories/menus.ts` | fusionner vers une table unique | P1 |
| `documents` | `routes/documents.py`, `models/document.py` | `documents` | `lib/repositories/documents.ts` | exporter métadonnées + conserver fichiers | P1 |
| `home_sections` | `routes/home_content.py`, `ssr_pages.py` | `home_sections` | `lib/repositories/home-sections.ts` | exporter `items/content` en `jsonb` | P1 |
| `page_contents` | `routes/page_editor.py`, `ssr_pages.py` | `page_contents` | `lib/repositories/page-contents.ts` | exporter contenu IA/SSR | P1 |
| `page_previews` | `routes/page_editor.py` | `page_previews` | `lib/repositories/page-previews.ts` | exporter previews actives utiles | P1 |
| `page_edits` | `routes/page_editor.py` | `page_edits` | `lib/repositories/page-edits.ts` | exporter historique prompts | P2 |
| `cache_meta` | `routes/pages.py`, `routes/menu.py` | supprimer ou remplacer par revalidation | `lib/cache/revalidate.ts` | ne pas migrer tel quel | P2 |
| `status_checks` | starter/health | `status_checks` facultatif | aucune au départ | ignorer au MVP de migration | P3 |

---

## 4) Dépendances de portage obligatoires

1. **Tables P0 avant écrans P0**
   - `users`
   - `sessions`
   - `pages`

2. **APIs P0 avant admin P0**
   - auth login/me/logout
   - pages list/detail/create/update
   - pages public/by-slug

3. **UI publique avant cutover SEO**
   - layout public
   - header/footer
   - metadata SSR
   - routes publiques clés

4. **Workflow pages avant IA**
   - CRUD pages
   - versions / pending
   - puis page editor IA

---

## 5) Exécution recommandée par vagues

### Vague A — Fondation technique
- bootstrap Next
- Prisma + Supabase
- auth server-side
- proxy admin

### Vague B — Cœur CMS
- tables pages / versions / menus
- endpoints pages/menu
- dashboard admin
- pages list/new/edit

### Vague C — Public SSR
- routes publiques
- page dynamique par slug
- metadata SEO

### Vague D — Workflow avancé
- pending approvals
- rollback versions
- page editor IA

### Vague E — Compléments
- documents/uploads
- chatbot
- contact
- home content

---

## 6) Lecture opérationnelle

Cette matrice est faite pour être utilisée en binôme avec :
- `/app/IMPLEMENTATION_BACKLOG_GREETERS_NEXT.md`

La matrice dit **quoi porter**.
Le backlog séquencé dit **dans quel ordre exact le faire**.