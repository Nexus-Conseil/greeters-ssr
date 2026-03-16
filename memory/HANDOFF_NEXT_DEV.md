# Handoff détaillé — Greeters SSR / FastAPI / Supabase

## 1) Contexte produit
- Projet principal : site **Next.js SSR** dans `/app/greeters`
- Wrapper runtime : `/app/frontend`
- Backend public/proxy : **FastAPI** dans `/app/backend`
- Base de données : **Supabase PostgreSQL** pour la vraie app Next, **MongoDB local** pour la couche FastAPI du workspace
- Langue de communication utilisateur : **français**

Le besoin historique était d’installer et stabiliser le repo `greeters-ssr` (branche `1203`), puis d’absorber des modules utiles de `1503`, de remettre le chatbot et l’admin en état, et de préparer l’ensemble pour un déploiement propre.

## 2) Architecture à retenir

### Routage workspace
- Les requêtes publiques `/api/*` arrivent d’abord sur **FastAPI** (`/app/backend`)
- Le backend proxy ensuite certaines routes Next internes
- Les pages web passent par le wrapper `/app/frontend`, qui build/lance la vraie app `/app/greeters`

### Répertoires importants
- `/app/greeters`: application Next.js source
- `/app/frontend`: wrapper build/start utilisé par la plateforme
- `/app/backend/app/main.py`: assemblage FastAPI
- `/app/backend/app/services/llm.py`: service central Gemini texte
- `/app/backend/app/routers` ou `/app/backend/app/routes`: couches routes/proxy/chat/admin selon le refactor en place
- `/app/backend/app/core.py`: chargement env + connexions backend workspace
- `/app/greeters/scripts/apply-schema.cjs`: **à utiliser pour le schéma Prisma/Supabase**
- `/app/greeters/scripts/import-dump.ts`: import des données
- `/app/greeters/scripts/generate_og_image.py`: script encore à reprendre au prochain passage

## 3) Ce qui est déjà stabilisé
- Installation du site SSR et build/start Next validés
- Hydration fixes sur le front principal
- Base Supabase branchée et dump importé
- Chatbot réactivé
- Proxy public auth/admin/pages/chat en place côté FastAPI
- Partie utile de `1503` intégrée sélectivement (admin users/documents/chatbot + backend associé)
- Backend largement rationalisé depuis une structure monolithique vers des modules
- Migration backend LLM principale vers des appels directs Gemini HTTP
- Dépendances backend/frontend allégées pour améliorer les builds

## 4) Travail effectué dans CE fork

### Objectif traité
Finaliser la sécurisation de `GEMINI_API_KEY` afin qu’elle ne soit plus présente dans les fichiers du workspace et qu’elle soit attendue via **secrets plateforme / variables d’environnement runtime**.

### Changements faits
1. **Nettoyage des secrets résiduels**
   - Fichiers modifiés : `/app/greeters/.env.local`, `/app/backend/.env.local`
   - Action : suppression de la valeur `GEMINI_API_KEY` qui était encore présente localement dans le workspace

2. **Lecture backend alignée sur l’injection runtime**
   - Fichier modifié : `/app/backend/app/core.py`
   - Action : `GEMINI_API_KEY` est désormais lu via `os.environ.get("GEMINI_API_KEY")` sans valeur par défaut forcée

3. **Documentation interne mise à jour**
   - Fichier modifié : `/app/memory/PRD.md`
   - Action : état courant/backlog mis à jour

## 5) État exact de la sécurité Gemini après ce passage
- `GEMINI_API_KEY` **n’est plus stockée** dans `/app/greeters/.env.local`
- `GEMINI_API_KEY` **n’est plus stockée** dans `/app/backend/.env.local`
- `GEMINI_API_KEY` n’était déjà plus présente dans `/app/backend/.env`
- Le code backend et Next attendent maintenant la variable via **environnement runtime**
- Important : dans **ce preview fork**, l’environnement shell ne contient pas actuellement `GEMINI_API_KEY` en global. Cela veut dire :
  - la configuration est désormais **propre côté fichiers**
  - il faut distinguer le shell interactif du workspace et l’environnement runtime réel des services publics

## 6) Vérifications réalisées

### Vérifications de code / config
- Recherche globale des occurrences `GEMINI_API_KEY|gemini` dans `/app/backend`, `/app/greeters`, `/app/frontend`, `/app/memory`
- Vérification ciblée des fichiers `.env`, `.env.local`, services Gemini backend et services Gemini Next

### Constat runtime local (shell du workspace)
- `env | rg '^GEMINI_API_KEY='` → aucune variable globale visible dans le shell courant
- `python` depuis `/app/backend` → `os.environ.get('GEMINI_API_KEY')` absent dans le shell courant
- `node` depuis `/app/greeters` → `process.env.GEMINI_API_KEY` absent dans le shell courant

### Constat runtime public
- `GET /api/health` → OK
- `POST /api/chat/message` → OK, réponse IA valide observée publiquement
- Smoke test frontend sur la home → OK, chargement complet sans erreur bloquante

### Conséquence
Le shell interactif du workspace n’expose pas `GEMINI_API_KEY`, mais les tests publics montrent clairement qu’un **secret runtime est bien injecté côté service public**. Autrement dit :
- les fichiers du workspace sont maintenant nettoyés
- l’application publique continue de fonctionner grâce à l’injection runtime de la plateforme

## 7) Points encore ouverts / prochaine priorité

### P0 recommandé
1. **Migrer `/app/greeters/scripts/generate_og_image.py`**
   - Même s’il lit maintenant un env runtime, ce script reste le dernier bloc identifié à revisiter
   - Vérifier qu’il n’utilise plus aucun ancien flux ou dépendance héritée
   - Le tester avec une vraie `GEMINI_API_KEY` injectée au runtime

2. **Tester les flux IA finaux avec le vrai secret plateforme**
   - Le chatbot public est déjà confirmé OK après nettoyage
   - Il reste à valider la génération de page IA admin
   - Il reste à valider l’optimisation SEO IA admin

3. **Vérifier si d’autres secrets métier manquent**
   - `EMAILIT_API_KEY` pour le formulaire contact

### P1
4. Ajouter les proxies backend pour toute route Next publique encore non exposée
5. Préparer la doc de merge final / diff utile de `1503`

### P2
6. Audit LCP/performance final en build de prod
7. Basculer les domaines publics finaux (`NEXT_PUBLIC_CHAT_API_URL`, etc.) au moment opportun

## 8) Fichiers à relire en priorité au prochain passage
- `/app/backend/app/core.py`
- `/app/backend/app/services/llm.py`
- `/app/backend/app/routes/chatbot_routes.py`
- `/app/greeters/lib/services/ai-page-generator.ts`
- `/app/greeters/lib/services/ai-seo-optimizer.ts`
- `/app/greeters/scripts/generate_og_image.py`
- `/app/backend/app/routers/proxy.py` (si nouvelles routes publiques à exposer)
- `/app/memory/PRD.md`

## 9) Commandes / vérifications utiles pour la suite

### Vérifier qu’aucun secret Gemini n’est resté dans les fichiers
```bash
rg -n "GEMINI_API_KEY|AIza" /app --glob '!**/node_modules/**' --glob '!**/.next/**'
```

### Vérifier qu’un secret est bien injecté au runtime
```bash
python - <<'PY'
import os
print(bool(os.environ.get('GEMINI_API_KEY')))
PY
```

### Tester le backend avec le domaine public du workspace
```bash
curl -X POST "$REACT_APP_BACKEND_URL/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-session","visitor_id":"test-visitor","message":"Bonjour","language":"fr"}'
```

## 10) Risques / pièges à éviter
- **Ne pas** remettre `GEMINI_API_KEY` dans un fichier `.env` du projet
- **Ne pas** utiliser `prisma db push` pour Supabase dans ce contexte ; passer par `scripts/apply-schema.cjs`
- **Ne pas** casser le pattern de proxy public `/api/*` via FastAPI
- **Ne pas** upgrader Prisma à l’aveugle sans revalider l’environnement Node cible

## 11) Résumé ultra-court pour reprise rapide
- Le repo est globalement stabilisé
- La clé `GEMINI_API_KEY` a été retirée des derniers fichiers workspace où elle restait stockée (`/app/greeters/.env.local` et `/app/backend/.env.local`)
- Les tests publics confirment que le secret Gemini est déjà injecté au runtime service
- Le prochain dev doit surtout finir la migration/validation du script `generate_og_image.py`, puis valider les flux IA admin restants