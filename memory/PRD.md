# PRD — Greeters SSR migration fidèle

## Problème d’origine
- Migrer fidèlement le site CSR `Nexus-Conseil/greeters` vers la base Next.js SSR locale.
- Reprendre le **frontend public en priorité**, puis poursuivre page par page jusqu’au CMS/back-office.
- Conserver le CMS/pages/menu déjà amorcé et le reconnecter progressivement au rendu public.

## Source de vérité
- Cible active : `/app/greeters`
- Référence CSR auditée : clone local temporaire de `https://github.com/Nexus-Conseil/greeters`

## Décisions d’architecture
- Le rendu public SSR reste dans Next.js App Router avec routes `/` et `/[slug]`.
- Le header public lit le menu CMS existant via `getMenu()` avec fallback fidèle au site CSR.
- Le contenu de l’accueil passe par un service de fallback (`lib/services/home-content.ts`) afin de garder une base visible même si le CMS/home sections n’est pas encore rempli.
- Les assets critiques du site d’origine sont recopiés dans `/app/greeters/public/images/...` pour permettre une migration visuelle fidèle.

## Implémenté le 2026-03-09
- Migration visuelle de l’accueil public : topbar, sélecteur de langues, logo, navigation, hero, intro, section Greeters, visite, actualités, témoignages, galerie.
- Refonte du shell public partagé : `Header`, `TopBar`, `Footer`, placeholders `/[slug]` harmonisés avec le nouveau style public.
- Ajout d’un système de contenu fallback pour la home branchable plus tard au CMS/home sections.
- Ajout/normalisation des `data-testid` sur tous les éléments interactifs et éléments critiques visibles.
- Mise à jour du branding global (`metadata`, fontes, CSS public dédié `app/public-site.css`).

## Validation réalisée
- `eslint` OK sur `/app/greeters`
- `yarn tsc --noEmit` OK
- Smoke test visuel local OK sur `http://127.0.0.1:3100`
- Rapport de test frontend OK : `/app/test_reports/iteration_8.json`
  - home, navigation, CTA topbar, carrousel témoignages, lightbox galerie, responsive mobile, routes placeholder publiques : PASS

## Blocages connus
- Intégration Gemini toujours **bloquée côté quota/facturation** tant que l’API Google ne répond pas sans `RESOURCE_EXHAUSTED`.

## P0
- Porter la page publique suivante du site CSR (ex. `Qui sommes-nous ?` ou `Actualités`) avec contenu fidèle.
- Connecter davantage le frontend public aux données CMS réelles au lieu du fallback statique.
- Vérifier la cohérence multilingue réelle (subdomains / variantes preview) sur le shell public.

## P1
- Brancher sitemap dynamique `/sitemap.xml` par langue.
- Nettoyer les contenus/tests historiques en base si nécessaire.
- Reprendre les écrans admin `/admin/pages/new` et `/admin/pages/[id]` pour coller au CMS source.

## P2
- Finaliser un gestionnaire de menu admin encore plus riche (drag-and-drop avancé / arborescence si besoin).
- Ajouter les raffinements de parité visuelle restants page par page.

## Next tasks
1. Migrer la prochaine page publique prioritaire depuis le CSR source.
2. Brancher les sections d’accueil aux vraies données CMS/home sections.
3. Poursuivre la parité frontend puis remonter vers l’édition admin des pages.
4. Revenir sur Gemini uniquement après confirmation utilisateur que le quota/facturation est rétabli.
