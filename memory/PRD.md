# PRD — Greeters CMS: sitemap multilingue, menu admin, IA Gemini

## Problème d’origine
- Créer un sitemap touristique structuré sur `/sitemap.xml`, un par langue via sous-domaines
- Ne lister que les pages utiles aux touristes (accueil, pages internes, articles/blog)
- Ajouter le lien sitemap dans le footer
- Nettoyer les pages de validation live
- Ajouter un vrai gestionnaire de menu admin
- Intégrer le chat IA CMS qui génère des pages touristiques cohérentes mais variées avec Gemini

## Décisions d’architecture
- Sitemap servi dynamiquement par `app/sitemap.xml/route.ts` en fonction du host/sous-domaine
- Locales gérées par `lib/i18n/config.ts` et `lib/i18n/request.ts`
- Pages métier rendues locales via champ `locale` + contrainte `(locale, slug)`
- Menus séparés par langue via clé `main_menu:{locale}`
- IA Gemini branchée côté serveur via Generative Language API et transformée en blocks CMS compatibles

## Implémenté
- Nettoyage live effectué : suppression des anciennes pages de validation créées pour les tests
- Sitemap multilingue en place sur `/sitemap.xml` pour `greeters.paris`, `en.greeters.paris`, `de`, `es`, `it`, `ja`, `nl`, `pt-pt`, `zh-hans`
- Sitemap filtré pour ne garder que les contenus à intérêt touristique (homepage + pages utiles + blog/articles)
- Lien footer ajouté vers `/sitemap.xml`
- Gestionnaire de menu admin réel livré dans `/admin/menu` : langue, ajout, renommage, visibilité, liens externes, ordre, sync depuis pages publiées
- Support langue ajouté à l’édition de pages et aux APIs pages/menu/public
- Chat IA Gemini livré dans `/admin/ai-pages` avec génération de brouillon, conversation, preview et création de page vers le CMS
- Génération IA stabilisée : modèle `gemini-2.0-flash`, schéma simplifié, mapping automatique vers sections/blocs supportés
- UX AI améliorée avec état de chargement visible pendant la génération

## Validation réalisée
- `next build` OK
- Tests manuels + screenshots : footer sitemap, admin menu, studio IA avec brouillon généré visible
- Testing agent iteration 7 : 7/7 tests backend passés sur sitemap/menu/IA/cleanup
- Bug UI IA détecté par testing agent corrigé ensuite : loading state explicite pendant la génération

## P0
- Créer plusieurs vraies pages touristiques par langue pour nourrir les sitemaps réels
- Étendre la génération IA à des articles/blog et pages internes multi-langues
- Ajouter l’édition admin complète du menu par drag-and-drop si souhaité

## P1
- Ajouter routes publiques multi-segments si la stratégie éditoriale l’exige
- Renforcer le typage strict du renderer CMS et des drafts IA
- Ajouter upload d’images réel pour remplacer les URLs distantes générées par IA

## P2
- Étendre le workflow IA (itérations sur un même draft, régénération ciblée d’une section, tonalité par langue)
- Ajouter tests E2E persistants sur génération IA + création CMS + visibilité sitemap

## Next tasks
1. Générer/éditer les premières pages touristiques réelles par langue dans le CMS
2. Ajouter un mode “Créer la page et publier” depuis le studio IA
3. Enrichir le sitemap avec davantage de pages/blog multilingues réels
4. Ajouter une gestion plus avancée du menu public par langue
