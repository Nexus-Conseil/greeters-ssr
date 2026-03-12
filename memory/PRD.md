# PRD — Installation Greeters SSR (branche 1203)

## Problème d'origine
Installer ce site Next.js en SSR : https://github.com/Nexus-Conseil/greeters-ssr en sachant que la branche 1203 est la plus récente, mais l'utilisateur n'ose pas merger la PR.

## Choix utilisateur
- Utiliser prioritairement la branche `1203`
- Objectif immédiat : installer et faire tourner le site en SSR
- Puis réactiver le chatbot tel qu'il existait déjà dans le projet

## Décisions d'architecture
- App cible installée dans `/app/greeters`
- Service frontend Emergent branché sur la nouvelle app Next.js via `/app/frontend/package.json`
- Démarrage en mode dev SSR Next.js sur le port 3000 pour rester compatible avec le workspace
- Fallback local sur `dump.json` pour les lectures publiques (pages, menus, home sections) afin d'éviter une dépendance bloquante à PostgreSQL dans ce workspace
- Chatbot réactivé via l'API FastAPI du workspace sur `/api/chat/message`
- Intégration LLM backend via `EMERGENT_LLM_KEY` et `emergentintegrations`, avec persistance Mongo des messages
- Script tiers Multilipi désactivé par défaut en local/preview via flag d'environnement

## Implémenté
- Clone et installation de la branche `1203`
- Copie de l'app Next.js SSR dans `/app/greeters`
- Installation des dépendances avec Yarn + génération du client Prisma
- Ajout d'un `.env` local minimal pour permettre le runtime
- Ajout d'un module `dump-fallback.ts` pour alimenter les pages publiques depuis `dump.json`
- Adaptation des repositories `pages`, `menus`, `home-sections` pour utiliser le fallback local
- Réactivation du chatbot côté frontend via `NEXT_PUBLIC_CHAT_API_URL`
- Implémentation/activation de l'endpoint backend `/api/chat/message`
- Branchement du chatbot à Gemini via `emergentintegrations` + clé universelle Emergent
- Persistance des échanges chatbot dans MongoDB (`chat_messages`)
- Correction des warnings `next/image` sur `images.qualities`
- Désactivation conditionnelle du script Multilipi en preview/local pour supprimer les erreurs console critiques
- Vérifications réalisées : `/`, `/contact`, `/qui-sommes-nous`, `/galerie` répondent en 200 ; chatbot visible, ouvrable et répondant côté UI et API

## Backlog priorisé
### P0
- Brancher une vraie base PostgreSQL/Supabase pour sortir du fallback `dump.json`
- Décider de la stratégie de merge de la PR 1203 (idéalement ciblée plutôt que blind merge)
- Vérifier les flux interactifs non encore validés en profondeur (admin, auth, formulaires métiers)

### P1
- Raccorder les routes interactives complémentaires au backend réellement attendu par le projet
- Réactiver Multilipi avec une configuration CORS/preview compatible si nécessaire
- Consolider la persistance du chatbot si une base métier dédiée est prévue dans le repo d'origine

### P2
- Nettoyer les artefacts non essentiels de la branche (dump, anciens tests, fichiers historiques)
- Revoir le packaging du repo pour éviter le mélange template parent / app Next cible
- Ajouter une procédure d'import de données claire et reproductible
- Nettoyer le warning mineur de preload de police remonté par les tests

## Next tasks
1. Préparer une version de merge ciblé de `1203` contenant seulement les fichiers utiles
2. Brancher la vraie base de données PostgreSQL/Supabase
3. Vérifier les flux admin/auth/contact avancés
4. Nettoyer les artefacts annexes avant merge final
