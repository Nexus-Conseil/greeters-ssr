# Diff de merge safe `1203` -> `1303`

## Objectif
Isoler uniquement les changements nécessaires pour la version SSR Next.js + Supabase + chatbot/public API, sans réembarquer les artefacts de debug et les anciens rapports.

## Fichiers à reprendre en priorité
- `backend/server.py`
- `backend/tests/test_deployment_readiness.py`
- `backend/tests/test_chat_api.py`
- `backend/tests/test_auth_admin_final.py`
- `frontend/package.json`
- `frontend/install-greeters.sh`
- `frontend/build-nextjs.sh`
- `frontend/start-nextjs.sh`
- `greeters/app/layout.tsx`
- `greeters/app/page.tsx`
- `greeters/app/[slug]/page.tsx`
- `greeters/components/chatbot/ChatBotLoader.tsx`
- `greeters/components/chatbot/ChatWindow.tsx`
- `greeters/components/chatbot/ChatButton.tsx`
- `greeters/components/public/layout/Header.tsx`
- `greeters/components/public/layout/HeaderClient.tsx`
- `greeters/components/public/layout/TopBar.tsx`
- `greeters/components/public/layout/Footer.tsx`
- `greeters/components/public/layout/FooterClient.tsx`
- `greeters/components/public/layout/PublicPageShell.tsx`
- `greeters/lib/data/dump-fallback.ts`
- `greeters/lib/repositories/pages.ts`
- `greeters/lib/repositories/menus.ts`
- `greeters/lib/repositories/home-sections.ts`
- `greeters/lib/media/config.ts`
- `greeters/next.config.ts`
- `greeters/scripts/apply-schema.cjs`
- `greeters/scripts/import-dump.ts`

## Fichiers à exclure du merge safe
- `.emergent/*`
- `test_reports/*`
- `*.jpeg`
- `backend/.env`
- `frontend/.env`
- `greeters/.env`
- `memory/PRD.md`
- fichiers historiques de debug/tests ad hoc (`backend_test.py`, `regression_test.py`, `quick_seo_test.py`, etc.)
- `greeters/package-lock.json`

## Stratégie recommandée
1. Partir de `1203`
2. Reprendre seulement les fichiers ci-dessus
3. Réinjecter les variables d’environnement hors git
4. Réinstaller les dépendances Next/Prisma
5. Rejouer `node scripts/apply-schema.cjs`
6. Rejouer `npx tsx scripts/import-dump.ts /app/greeters/dump.json`
7. Vérifier `/`, `/contact`, `/api/health`, `/api/pages/public`, `/api/auth/login`, `/api/chat/message`

## Risques à surveiller
- Les routes publiques `/api/*` passent par FastAPI dans ce workspace, pas directement par Next
- `DIRECT_URL` doit rester compatible réseau ici ; l’hôte `db.*.supabase.co` n’est pas résolu dans cet environnement
- Les features Emailit / Gemini / ShortPixel dépendent des clés runtime, pas du code