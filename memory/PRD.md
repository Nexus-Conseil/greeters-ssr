# PRD — Greeters CMS: menu drag-and-drop + preview frontend

## Problème d’origine
- Rendre le gestionnaire de menu plus fluide avec un réordonnancement visuel par glisser-déposer
- Permettre de voir le preview du frontend du site pendant l’édition admin

## Décisions d’architecture
- Gestionnaire de menu conservé dans `/admin/menu`
- Réordonnancement visuel implémenté en drag-and-drop natif HTML5, sans dépendance externe
- Preview frontend intégré directement dans le panneau admin via iframe + ouverture dans un nouvel onglet
- Le preview reste piloté par un chemin public simple (`/`, `/galerie`, etc.) pour permettre une vérification rapide côté CMS

## Implémenté
- Cartes du menu rendues déplaçables visuellement avec poignée “Glisser”
- États visuels ajoutés pour l’élément en cours de déplacement et la cible de drop
- Le réordonnancement manuel précédent (Monter/Descendre) reste disponible en complément
- Champ de preview frontend ajouté au gestionnaire de menu pour choisir un chemin public
- Iframe de preview frontend ajoutée dans la colonne latérale de `/admin/menu`
- Lien “Ouvrir le frontend” ajouté pour voir la page choisie dans un nouvel onglet

## Validation réalisée
- `eslint` OK
- `next build` OK
- Vérification visuelle par screenshot : `/admin/menu` montre bien le drag-and-drop et le preview frontend intégré
- Test manuel Playwright : ajout d’items, interaction drag-and-drop, changement du chemin de preview (`/galerie`), iframe frontend visible

## P0
- Ajouter un indicateur d’ordre plus explicite pendant le drop (ligne d’insertion)
- Permettre la sauvegarde immédiate automatique après réordonnancement si souhaité
- Brancher le preview frontend sur des contenus multilingues spécifiques si nécessaire

## P1
- Ajouter un vrai drag-and-drop tactile/mobile
- Prévisualiser un item de menu spécifique ou une URL externe dans un onglet séparé
- Ajouter un historique/annulation des changements de menu

## P2
- Faire évoluer le menu admin vers un mode arborescent si sous-menus requis
- Ajouter diff visuel avant/après sauvegarde

## Next tasks
1. Ajouter une ligne d’insertion pendant le glisser-déposer
2. Sauvegarder automatiquement l’ordre si vous le souhaitez
3. Étendre le preview à des routes publiques multilingues ciblées
4. Enrichir encore l’ergonomie du menu admin
