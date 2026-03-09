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
- Migration des pages publiques : `/qui-sommes-nous`, `/actualites`, `/galerie`, `/livre-dor`, `/faire-un-don`, `/devenez-benevole`, `/contact`, `/presse`, `/mentions-legales`.
- Ajout du redirect `/mention-legale` → `/mentions-legales` pour coller au comportement CSR.
- Refonte du shell public partagé : `Header`, `TopBar`, `Footer`, layout public réutilisable et composants dédiés par page.
- Ajout d’un système de contenu fallback pour la home branchable plus tard au CMS/home sections.
- Ajout d’un audit de parité live/CSR/SSR : `/app/AUDIT_PARITE_PAGES_PUBLIQUES_GREETERS.md`.
- Ajout/normalisation des `data-testid` sur tous les éléments interactifs et éléments critiques visibles.
- Mise à jour du branding global (`metadata`, fontes, CSS public dédié `app/public-site.css`).

## Validation réalisée
- `eslint` OK sur `/app/greeters`
- `yarn tsc --noEmit` OK
- Rapport de test frontend OK : `/app/test_reports/iteration_8.json`
  - accueil, navigation, CTA topbar, carrousel témoignages, lightbox galerie, responsive mobile : PASS
- Rapport de test frontend OK : `/app/test_reports/iteration_9.json`
  - toutes les pages publiques migrées + redirect + galerie/lightbox + livre d’or + formulaire contact UI : PASS

## Blocages connus
- Intégration Gemini toujours **bloquée côté quota/facturation** tant que l’API Google ne répond pas sans `RESOURCE_EXHAUSTED`.

## P0
- Connecter davantage le frontend public aux données CMS réelles au lieu du fallback statique.
- Vérifier la cohérence multilingue réelle (subdomains / variantes preview) sur toutes les pages publiques.
- Remplacer le flux de contact **MOCKÉ** par un vrai envoi email ou une persistance métier.

## P1
- Brancher sitemap dynamique `/sitemap.xml` par langue.
- Nettoyer les contenus/tests historiques en base si nécessaire.
- Reprendre les écrans admin `/admin/pages/new` et `/admin/pages/[id]` pour coller au CMS source.
- Brancher les documents/pages publiques sur des contenus éditables depuis le CMS si souhaité.

## P2
- Finaliser un gestionnaire de menu admin encore plus riche (drag-and-drop avancé / arborescence si besoin).
- Ajouter les raffinements de parité visuelle restants page par page.

## Next tasks
1. Brancher les pages publiques et l’accueil aux vraies données CMS au lieu du fallback statique.
2. Implémenter un vrai traitement du formulaire de contact.
3. Reprendre la parité CMS/admin (création/édition pages, menu, workflow).
4. Revenir sur Gemini uniquement après confirmation utilisateur que le quota/facturation est rétabli.
