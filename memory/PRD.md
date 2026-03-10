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

## Implémenté le 2026-03-10
- Intégration réelle de SendGrid sur `POST /api/contact/send` via `@sendgrid/mail` avec validation, `replyTo`, message HTML/texte et messages d’erreur en français.
- Le flux contact n’est plus **MOCKÉ** : il remonte maintenant l’erreur fournisseur réelle quand SendGrid bloque l’envoi (quota/crédit dépassé sur la clé actuelle).
- Ajout d’un mécanisme de surcharge CMS pour toutes les pages publiques nommées (`contact`, `qui-sommes-nous`, `actualites`, `galerie`, `livre-dor`, `faire-un-don`, `devenez-benevole`, `presse`, `mentions-legales`) : si une page CMS publiée existe avec le même slug, elle remplace le fallback statique.
- Vérification de P2 Gemini : la génération de page IA fonctionne de nouveau avec la clé actuelle, y compris en conversation multi-tour avec `sessionId` persistant.
- Remplacement complet de SendGrid par **Emailit** pour le formulaire de contact (`POST /api/contact/send`) avec envoi réel validé en 200.
- Préremplissage automatique du CMS public : 81 pages localisées créées/mises à jour, 9 menus synchronisés, 5 sections home injectées via `/api/admin/bootstrap/public-content`.
- Localisation du chrome public (topbar/menu/footer) par host pour FR/EN/DE/ES/IT/JA/NL/PT-PT/ZH-HANS et sitemap XML généré par langue/host.
- Correctif de sécurité admin : suppression du conflit `middleware.ts`/`proxy.ts`, redirection serveur des routes `/admin/*` vers `/admin/login`, protection de `GET /api/menu`, et redirection client de secours côté `AdminShell`.
- Ajustement UX : `/admin/login?redirect=...` respecte désormais la destination demandée quand l’utilisateur est déjà authentifié.

## Validation réalisée
- `eslint` OK sur `/app/greeters`
- `yarn tsc --noEmit` OK
- Rapport de test frontend OK : `/app/test_reports/iteration_8.json`
  - accueil, navigation, CTA topbar, carrousel témoignages, lightbox galerie, responsive mobile : PASS
- Rapport de test frontend OK : `/app/test_reports/iteration_9.json`
  - toutes les pages publiques migrées + redirect + galerie/lightbox + livre d’or + formulaire contact UI : PASS
- Smoke UI Playwright local OK sur `/contact` : le formulaire affiche bien l’erreur réelle SendGrid côté interface.
- Rapport de test complet OK : `/app/test_reports/iteration_10.json`
  - contact réel non mocké, surcharge CMS des pages publiques, accès admin, sitemap : PASS
- Tests backend complémentaires OK via agent dédié
  - login admin, `/api/contact/send`, `/api/ai/page-generator`, multi-tour `sessionId`, `/api/menu`, `/sitemap.xml` : PASS
- Self-test Emailit OK : `POST /api/contact/send` retourne 200 avec message de succès réel.
- Self-test bootstrap CMS OK : `/api/admin/bootstrap/public-content` → `homeSectionsUpdated=5`, `pagesCreated=81`, `menusUpdated=9`.
- Rapport de test complet OK : `/app/test_reports/iteration_11.json`
  - Emailit réel, succès UI contact, bootstrap admin, sitemap localisé, chrome multilingue, consommation CMS sur `/contact` : PASS
- Régression sécurité admin validée après correctif
  - `/admin/pages` sans session → 307 vers `/admin/login?redirect=...`
  - `/api/menu` sans session → 401
  - `/api/menu` avec session admin → PASS

## Blocages connus
- Aucun blocage majeur sur le flux contact : Emailit est opérationnel sur l’environnement actuel.

## P0
- Connecter davantage le frontend public aux données CMS réelles au lieu du fallback statique, en particulier l’accueil et les pages encore rendues principalement depuis des composants statiques.
- Vérifier la cohérence multilingue réelle (subdomains / variantes preview) sur toutes les pages publiques.
- Réduire les derniers écarts pixel-perfect visibles entre la SSR et `https://greeters.paris`, route par route.

## P1
- Étendre le sitemap dynamique avec toutes les pages/articles réellement souhaités au référencement final.
- Nettoyer les contenus/tests historiques en base si nécessaire.
- Reprendre les écrans admin `/admin/pages/new` et `/admin/pages/[id]` pour coller au CMS source.
- Brancher les documents/pages publiques sur des contenus éditables depuis le CMS si souhaité.
- Vérifier route par route quelles pages publiques nommées doivent être enrichies dans le CMS pour dépasser le simple préremplissage initial.

## P2
- Finaliser un gestionnaire de menu admin encore plus riche (drag-and-drop avancé / arborescence si besoin).
- Ajouter les raffinements de parité visuelle restants page par page.
- Décider si la génération IA doit rester sur le prompt/format actuel ou être enrichie (templates, édition incrémentale, garde-fous éditoriaux).

## Next tasks
1. Approfondir la parité CMS/admin (`/admin/pages/new`, `/admin/pages/[id]`, workflow éditorial, menus) par comparaison au site/source de référence.
2. Finaliser les derniers écarts pixel-perfect route par route contre `https://greeters.paris`.
3. Brancher encore plus de rendu public sur les contenus CMS structurés (notamment home et pages institutionnelles détaillées).
4. Étendre et affiner le sitemap final selon la stratégie SEO souhaitée.
