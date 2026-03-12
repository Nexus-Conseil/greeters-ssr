# Audit complémentaire — écart exact entre la documentation Greeters et les fichiers réellement versionnés

## 1) Conclusion exécutive

L’écart n’est pas seulement "partiel" : il est **structurel**.

- La documentation Greeters décrit une **application Next.js full-stack avancée**.
- Les fichiers réellement versionnés dans le dépôt décrivent **un starter Emergent minimal React CRA + FastAPI + Mongo**.
- Le dossier `greeters` n’est **pas un dossier de sources applicatives versionnées** : c’est un **gitlink de submodule** pointant vers le commit `977b48bfdadf178755d18a16255c6661d4d8d3a1`.
- Le repo **ne contient pas de `.gitmodules`**, donc ce submodule n’est pas reconstructible automatiquement depuis ce dépôt.

=> En pratique, **la documentation Greeters semble décrire un code qui n’a pas été versionné ici**, ou qui a été poussé comme submodule incomplet / non configuré.

---

## 2) Méthode d’audit

Audit réalisé sur :
- l’arbre Git distant cloné dans `/tmp/greeters-ssr-remote`
- les fichiers synchronisés dans `/app`
- l’historique Git complet du dépôt distant

Contrôles effectués :
- inventaire des fichiers trackés à `HEAD`
- recherche des chemins annoncés par le handoff
- vérification des dépendances frontend
- vérification de la stack backend réellement présente
- relecture des documents historiques (`README_DEV.md`, `memory/PRD.md`, `.emergent/summary.txt`, `test_reports/*.json`)
- analyse de l’historique commit par commit

---

## 3) Ce que le dépôt contient réellement à `HEAD`

## 3.1 Code réellement présent

### Frontend versionné
- `frontend/package.json`
- `frontend/src/App.js`
- `frontend/src/index.js`
- `frontend/src/App.css`
- `frontend/src/index.css`
- `frontend/src/components/ui/*`

### Backend versionné
- `backend/server.py`
- `backend/requirements.txt`

### Documentation / historique
- `README_DEV.md`
- `memory/PRD.md`
- `.emergent/summary.txt`
- `test_reports/iteration_1.json`
- `test_reports/iteration_2.json`

## 3.2 Nature réelle de la stack

### Frontend
- **Create React App** via `react-scripts`
- **pas de `next`** dans `frontend/package.json`
- **pas de `typescript`**
- **pas de `suneditor-react`**
- **pas de `@supabase/supabase-js`**

### Backend
- **FastAPI** dans `backend/server.py`
- **Motor / MongoDB** dans `backend/server.py`
- endpoints réels limités à :
  - `GET /api/`
  - `POST /api/status`
  - `GET /api/status`

---

## 4) Écart exact claim-by-claim

| Claim documentaire | Réalité dans les fichiers versionnés | Verdict |
|---|---|---|
| "Le projet continue dans une application Next.js existante" | Aucun fichier Next.js tracké. Pas de `next.config.*`, pas de `app/`, pas de `layout.tsx`, pas de pages App Router. | Faux dans ce repo |
| "Le projet est en full-stack Next.js" | Le frontend tracké utilise `react-scripts`; le backend tracké est un `FastAPI` séparé. | Faux |
| "Le CMS editor SunEditor est le P0" | Aucun `suneditor-react` dans les dépendances et aucun composant `SunEditor.tsx` versionné. | Faux / non vérifiable |
| `src/app/admin/editor/[id]/page.tsx` existe | Chemin absent du dépôt | Faux |
| `src/components/SunEditor.tsx` existe | Chemin absent du dépôt | Faux |
| `src/app/layout.tsx` existe | Chemin absent du dépôt | Faux |
| `src/utils/withAuth.tsx` existe | Chemin absent du dépôt | Faux |
| `src/lib/api.ts` existe | Chemin absent du dépôt | Faux |
| `.env.local` existe | Aucun `.env.local` tracké ; seulement `backend/.env` et `frontend/.env` | Faux |
| "La base cible est SupaBase" | Aucune dépendance Supabase et aucun code d’intégration Supabase versionné | Faux |
| "Des routes API Next.js ont été créées" | Aucun `app/api/**` ou route handler Next tracké | Faux |
| "Des pages publiques SSR ont été migrées" | Aucun code SSR Next présent ; frontend actuel = simple SPA placeholder | Faux |
| "Le vrai projet est dans `/app/greeters/frontend` et `/app/greeters/backend`" | `greeters` n’est pas un dossier de code versionné exploitable, mais un gitlink de submodule | Trompeur / incomplet |

---

## 5) Vérifications factuelles clés

## 5.1 Les fichiers mentionnés dans le handoff utilisateur sont absents

Chemins explicitement recherchés dans le dépôt :

- `src/app/admin/editor/[id]/page.tsx` → **absent**
- `src/components/SunEditor.tsx` → **absent**
- `src/app/layout.tsx` → **absent**
- `src/utils/withAuth.tsx` → **absent**
- `src/lib/api.ts` → **absent**
- `.env.local` → **absent**
- `frontend/app` → **absent**
- `greeters/frontend` → **absent en tant que fichiers trackés accessibles**
- `greeters/backend` → **absent en tant que fichiers trackés accessibles**

## 5.2 Le `package.json` contredit directement la documentation Next

Dépendances vérifiées dans `frontend/package.json` :

- `next` → **absent**
- `typescript` → **absent**
- `suneditor-react` → **absent**
- `@supabase/supabase-js` → **absent**
- `mongodb` → **absent** côté frontend
- `react-scripts` → **présent**

=> Le frontend actuellement versionné est **un projet CRA**, pas un projet Next.

## 5.3 Le backend tracké contredit la cible "Next.js only"

`backend/server.py` contient :
- une instance `FastAPI()`
- un `APIRouter(prefix="/api")`
- une connexion `AsyncIOMotorClient`
- des endpoints minimalistes de type starter

=> Le backend réellement versionné est **encore FastAPI**, pas un backend unifié dans Next Route Handlers.

---

## 6) Le point le plus important : `greeters` est un submodule incomplet

Le chemin `greeters` n’est pas un répertoire normal de code dans Git.

À `HEAD`, Git le référence comme :
- mode `160000`
- commit cible `977b48bfdadf178755d18a16255c6661d4d8d3a1`

Cela signifie :
- `greeters` est un **gitlink** (submodule)
- pas un dossier classique contenant des fichiers versionnés dans ce repo principal

### Problème critique
Le repo **ne contient pas de `.gitmodules`**.

Conséquence :
- Git connaît l’existence d’un sous-projet `greeters`
- mais **n’a aucune URL officielle pour le récupérer**
- donc le contenu réel supposé de `greeters` est **indisponible depuis ce dépôt seul**

### Interprétation la plus probable
La documentation Greeters décrit **le contenu attendu du submodule `greeters`**, mais ce contenu n’a pas été livré correctement avec le dépôt principal.

---

## 7) Chronologie exacte de divergence doc/code

## 7.1 Commit de base réellement code

### `38456f4`
Ce commit pose la base actuelle :
- `backend/server.py`
- `frontend/package.json`
- `frontend/src/App.js`
- composants UI

=> C’est le **seul vrai commit massif de code applicatif tracké** dans le repo principal.

## 7.2 Apparition du pointeur `greeters`

### `9a5413c`
Ce commit ajoute :
- `greeters` en **mode 160000** (gitlink / submodule)
- `test_reports/iteration_1.json`

=> Le projet Greeters n’a pas été commité comme fichiers normaux ; il a été référencé comme sous-dépôt incomplet.

## 7.3 La documentation Next arrive après, sans code correspondant

### `d7fb733` puis `3ab9aaf`
Mises à jour de `memory/PRD.md`

### `0a38d31`
Ajout de `.emergent/summary.txt`

### `8bbd820`
Ajout de `README_DEV.md`

Ces commits enrichissent la narration de migration Next.js, mais **n’ajoutent pas les fichiers Next revendiqués**.

## 7.4 Conclusion chronologique

L’écart exact est le suivant :

1. Le repo principal contient un **starter React/FastAPI**.
2. Un chemin `greeters` est ensuite ajouté comme **submodule non finalisé**.
3. Après cela, plusieurs documents décrivent un **état avancé Next.js/CMS/SSR**.
4. Mais les fichiers correspondant à cette description **n’apparaissent jamais dans le repo principal**.

---

## 8) Indices annexes qui confirment une mauvaise version de source

## 8.1 `.gitignore` contient des traces anormales du projet manquant

Le `.gitignore` versionné contient des lignes anormales comme :
- `greeters/.git/objects/pack/...`
- `greeters/frontend/node_modules/@next/swc-...`

Ces lignes indiquent fortement qu’un **repo imbriqué `greeters`** ou un environnement Next local a existé quelque part, mais n’a pas été versionné proprement dans ce dépôt principal.

## 8.2 Les test reports parlent d’une app absente

Les rapports :
- `test_reports/iteration_1.json`
- `test_reports/iteration_2.json`

parlent de :
- routes SSR
- pages `/contact`, `/galerie`, `/mentions-legales`
- `/api/health`
- shell admin Next

Or aucune de ces implémentations n’est présente dans les fichiers trackés du repo principal.

=> Ces rapports ont vraisemblablement été générés :
- soit contre un **workspace local différent**,
- soit contre le **contenu du submodule `greeters`** non livré,
- soit contre une version non poussée.

---

## 9) Hypothèse racine la plus crédible

L’explication la plus solide est :

1. Le vrai projet Greeters a été travaillé dans un **repo imbriqué** ou un **dossier Git séparé**.
2. Ce projet a ensuite été ajouté au dépôt principal sous forme de **submodule / gitlink**.
3. La configuration du submodule (`.gitmodules`) n’a pas été commitée.
4. Les handoffs, PRD et rapports de test ont été rédigés **comme si les sources Greeters étaient bien présentes**.
5. Au final, le dépôt principal publié ne contient que :
   - le starter React/FastAPI,
   - le pointeur vers `greeters`,
   - la documentation de migration,
   - mais pas les sources Greeters elles-mêmes.

---

## 10) Ce qu’il faut demander ou récupérer pour combler l’écart

## P0
- L’URL du repo ou sous-repo correspondant au submodule `greeters`
- ou le `.gitmodules` manquant
- ou la branche / archive / export contenant réellement le code Next.js Greeters

## P1
- Le commit exact où les fichiers suivants existaient réellement, si jamais ils ont existé ailleurs :
  - `src/app/admin/editor/[id]/page.tsx`
  - `src/components/SunEditor.tsx`
  - `src/app/layout.tsx`
  - `src/utils/withAuth.tsx`
  - `src/lib/api.ts`

## P2
- Une régénération propre de la documentation à partir du vrai dépôt source une fois les fichiers récupérés

---

## 11) Verdict final exploitable

### Ce qui est exact
- Le dépôt publié contient bien des documents parlant d’une migration Next.js Greeters.
- Le dépôt publié contient bien une entrée `greeters`.

### Ce qui manque réellement
- les fichiers Next.js annoncés
- le code CMS annoncé
- le code SunEditor annoncé
- le code Supabase annoncé
- le code API Next annoncé

### Cause la plus probable
- **Le code Greeters réel n’est pas dans le repo principal ; il est référencé de manière incomplète via un submodule non résolu.**

### Consigne pratique
- **Ne pas démarrer de correction fonctionnelle sur SunEditor, Supabase ou les routes Next tant que les vraies sources `greeters` ne sont pas récupérées.**
