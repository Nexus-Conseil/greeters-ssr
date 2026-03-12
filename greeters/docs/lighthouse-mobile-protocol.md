# Protocole Lighthouse mobile de référence

Objectif : relancer exactement la même mesure après chaque changement critique pour détecter toute régression de performance mobile.

## Référence de mesure

- Toujours mesurer **le domaine de production** ou un environnement de préproduction strictement équivalent.
- Éviter les mesures de référence en mode dev.
- Utiliser **3 passes minimum par route** puis retenir la **médiane** comme valeur de contrôle.

## Script fourni

```bash
bash scripts/lighthouse-mobile-reference.sh https://greeters.nexus-conseil.ch
```

Routes par défaut mesurées :

- `/`
- `/galerie`
- `/actualites`
- `/devenez-benevole`
- `/contact`

Vous pouvez surcharger les routes :

```bash
bash scripts/lighthouse-mobile-reference.sh https://greeters.nexus-conseil.ch "/,/galerie,/actualites"
```

## Seuils recommandés

- Score mobile médian : **>= 95**
- Cible projet : **98–100** sur la home de production
- CLS : aussi proche de `0` que possible
- TBT : idéalement très faible
- LCP : à surveiller en priorité sur la home

## Sorties générées

Les rapports sont enregistrés dans :

```text
/app/greeters/test_reports/lighthouse/<timestamp>/
```

Chaque campagne contient :

- un JSON par run et par route
- un HTML par run et par route
- un `summary.md` avec best / median / average / worst

## Règle de contrôle après changement critique

Relancer ce protocole après chaque modification qui touche :

- images de la home
- scripts tiers
- layout global
- header / footer / topbar
- stratégie de cache
- rendu SSR / données publiques
- chatbot public
- MultiLipi

## Interprétation rapide

- Si la **médiane** baisse de façon durable : il y a régression.
- Si seul le premier run est mauvais mais que les suivants remontent : vérifier le warm cache.
- Si la production chute après ajout d’un script tiers : mesurer avant/après spécifiquement la home.

## Note projet Greeters

MultiLipi et le chatbot public sont des candidats naturels à surveiller, car ils peuvent coûter des points Lighthouse en production réelle même si le rendu visuel reste correct.