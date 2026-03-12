# PRD — Installation Greeters SSR (branche 1203)

## Problème d'origine
Installer ce site Next.js en SSR : https://github.com/Nexus-Conseil/greeters-ssr en sachant que la branche 1203 est la plus récente, mais l'utilisateur n'ose pas merger la PR.

## Choix utilisateur
- Utiliser prioritairement la branche `1203`
- Objectif immédiat : installer et faire tourner le site en SSR
- Souhaite aussi un avis clair sur la pertinence du merge

## Décisions d'architecture
- App cible installée dans `/app/greeters`
- Service frontend Emergent branché sur la nouvelle app Next.js via `/app/frontend/package.json`
- Démarrage en mode dev SSR Next.js sur le port 3000 pour rester compatible avec le workspace
- Fallback local sur `dump.json` pour les lectures publiques (pages, menus, home sections) afin d'éviter une dépendance bloquante à PostgreSQL dans ce workspace
- Script tiers Multilipi désactivé par défaut en local/preview via flag d'environnement

## Implémenté
- Clone et installation de la branche `1203`
- Copie de l'app Next.js SSR dans `/app/greeters`
- Installation des dépendances avec Yarn + génération du client Prisma
- Ajout d'un `.env` local minimal pour permettre le runtime
- Ajout d'un module `dump-fallback.ts` pour alimenter les pages publiques depuis `dump.json`
- Adaptation des repositories `pages`, `menus`, `home-sections` pour utiliser le fallback local
- Désactivation conditionnelle du chatbot si l'API n'est pas configurée
- Correction des warnings `next/image` sur `images.qualities`
- Désactivation conditionnelle du script Multilipi en preview/local pour supprimer les erreurs console
- Vérifications réalisées : `/`, `/contact`, `/qui-sommes-nous`, `/galerie` répondent en 200

## Backlog priorisé
### P0
- Brancher une vraie base PostgreSQL/Supabase pour sortir du fallback `dump.json`
- Décider de la stratégie de merge de la PR 1203 (idéalement ciblée plutôt que blind merge)
- Vérifier les flux interactifs dépendants des APIs (admin, auth, contact)

### P1
- Raccorder les routes interactives au backend réellement exposé par le workspace
- Réactiver Multilipi avec une configuration CORS/preview compatible
- Activer le chatbot avec une API configurée

### P2
- Nettoyer les artefacts non essentiels de la branche (dump, anciens tests, fichiers historiques)
- Revoir le packaging du repo pour éviter le mélange template parent / app Next cible
- Ajouter une procédure d'import de données claire et reproductible

## Next tasks
1. Choisir si le merge doit porter tout le diff `1203` ou seulement l'app Next `/greeters` + le wiring de lancement
2. Brancher la vraie base de données
3. Tester les flux non publics (admin, auth, contact)
4. Préparer un nettoyage du diff avant merge final
