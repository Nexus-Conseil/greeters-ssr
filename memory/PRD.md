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
- Extension du schéma `Page` pour un vrai studio SEO complet : `metaTitle`, `canonicalUrl`, `robotsDirective`, champs Open Graph, champs Twitter, `focusKeyword`, `secondaryKeywords`, `schemaOrgJson`, `imageRecommendations`, `sitemapPriority`, `sitemapChangeFreq`.
- Ajout d’un **studio SEO complet** dans `/admin/pages/new` et `/admin/pages/[id]` avec édition manuelle, aperçu enrichi et optimisation IA Gemini via `POST /api/ai/seo-optimizer`.
- L’IA SEO propose désormais : meta title, meta description, canonical, robots, OG, Twitter, schema.org JSON-LD, recommandations d’alt/nommage image, priorité + fréquence sitemap.
- L’accueil est désormais davantage branché au CMS structuré : `getHomePageContent()` lit une page CMS publiée de slug `/` si elle existe, avant de retomber sur `home_sections` puis sur le fallback statique.
- Le bootstrap public couvre maintenant aussi la home CMS : après rerun, `pagesCreated=9` (home par locale) et `pagesUpdated=81`.
- Les routes publiques principales injectent maintenant du JSON-LD (`StructuredDataScript`) et utilisent la couche SEO page par page pour leurs métadonnées.
- Le sitemap SEO a été affiné : filtrage des pages `noindex`, ajout de `changefreq` et `priority`, maintien du host localisé.
- Sweep responsive étendu : vérification multi-breakpoints sans overflow horizontal et ajustements CSS sur topbar, hero, title bands, grilles et conteneurs.
- Upload/suppression d’images depuis l’éditeur de page sans médiathèque : `POST /api/admin/images/upload`, optimisation ShortPixel lossless prioritaire avec fallback local Sharp, stockage local sous `/uploads/cms/...`.
- Nettoyage automatique des fichiers orphelins : lorsqu’une image n’est plus référencée par aucune page ou aucun champ SEO, son dossier est supprimé du serveur (`cleanupOrphanedManagedImages`).
- Génération automatique d’OG images hyper réalistes via Gemini image generation pour les pages FR existantes et les futures créations, avec stockage local sous `/uploads/og/...`.
- Automatisation SEO/OG existante et future : batch `POST /api/admin/seo/auto-sync` exécuté sur les 10 pages FR existantes + auto-enrichissement lors de `POST /api/pages`.
- L’IA SEO choisit maintenant le `schema.org` le plus pertinent par page et génère le JSON-LD final, en plus des métadonnées, alt/images et recommandations SEO.
- Les pages institutionnelles restantes (`qui-sommes-nous`, `faire-un-don`, `devenez-benevole`, `presse`, `mentions-legales`) lisent désormais le contenu CMS publié via `DynamicPageRenderer` lorsqu’il existe.
- Le périmètre public prérempli est désormais de **90 pages** = **10 slugs publics (dont `/`) × 9 locales**, et **9 menus** = **1 menu public localisé par langue**.
- Reprise de la passe UI/UX publique à partir de la CSR : topbar avec CTA glow animé, retour haut avec easing progressif, toggle mobile du header en crossfade icône/MENU, footer plus fidèle avec icônes sociales et barre basse animée.
- Le footer public est maintenant conditionnel comme dans la CSR : partenaires visibles sur `/`, masqués sur `/galerie` tandis que le bloc social reste affiché selon la route.
- Intégration de MultiLipi dans le `head` global avec les 9 liens `hreflang` de production `greeters.nexus-conseil.ch` + script exact fourni par l’utilisateur (`726562fe-f615-404a-b985-a73e661ee3dc`).
- Passe pixel-perfect finale route par route sur le frontend public : navigation desktop renforcée avec fallback fidèle à la CSR, `/actualites` et `/galerie` converties en titres blancs centrés sans bandeau vert, grille d’actualités image-top restaurée, containers étroits rétablis sur les pages institutionnelles, formulaire contact et largeurs des pages rapprochés de la CSR.
- Correctif critique du preview Emergent : le service `/app/frontend` proxyfiait toutes les routes non-API vers `127.0.0.1:3100` sans serveur derrière, ce qui causait `Error occurred while trying to proxy`. Le proxy démarre désormais automatiquement l’app Next.js `/app/greeters` sur `3100`, puis sert correctement les routes publiques via le port preview `3000`.
- Passe performance mobile orientée production : baisse agressive des qualités d’images publiques, tailles `sizes` plus fines par contexte (hero / demi-colonne / cartes / galerie), suppression du `unoptimized` sur la vignette vidéo, désactivation du prefetch non critique sur de nombreux liens visibles, `content-visibility` sur les sections sous la ligne de flottaison et réduction des animations continues sur mobile.
- Mise en cache serveur du contenu public : `findPublicPageBySlug`, `getMenu` et `getHomePageContent` sont maintenant appuyés sur `unstable_cache` avec tags de revalidation ; les mutations CMS/menu revalident ces tags automatiquement.
- Protocole Lighthouse mobile automatisé ajouté : script `scripts/lighthouse-mobile-reference.sh` + documentation `docs/lighthouse-mobile-protocol.md`, avec campagnes multi-runs, synthèse best/median/average/worst et seuil médian configurable pour détecter les régressions.
- Ajustements UI supplémentaires : espacement accru entre le titre social du footer et les icônes, bouton CMS de `/devenez-benevole` harmonisé avec les CTA glow verts du site, galerie resserrée et rapprochée visuellement du live (titre, container, coins, rythme vertical).
- Diagnostic chatbot confirmé : le chatbot public n’a pas “cassé”, il n’a simplement pas été porté dans la SSR ; il existe dans la CSR de référence mais n’est pas monté dans l’app publique Next.js actuelle.

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
- Rapport de test complet OK : `/app/test_reports/iteration_12.json`
  - studio SEO admin, `/api/ai/seo-optimizer`, home CMS hybride, sitemap enrichi, JSON-LD, Emailit, protection admin : PASS
- Validation frontend finale OK via agent dédié
  - `/admin/pages/new`, `/admin/pages/[id]`, `/contact`, routes publiques, redirect admin : PASS
- Validation backend finale OK via agent dédié
  - `/api/ai/seo-optimizer`, `/api/admin/bootstrap/public-content`, `/sitemap.xml`, `/api/contact/send`, `/api/pages*` : PASS
- Rapport complet OK : `/app/test_reports/iteration_13.json`
  - upload image, auto SEO/OG, studio SEO, sitemap enrichi, Emailit, sécurité admin, routes publiques : PASS
- Retest backend ciblé OK
  - upload image OK, `POST /api/pages` retourne bien les champs SEO/OG auto-populés, contact Emailit OK
- Validation frontend ciblée OK : `/app/test_reports/iteration_14.json`
  - home visible, topbar/header/footer ajustés, footer conditionnel, MultiLipi présent dans le `head` : PASS
  - note de test : les erreurs MultiLipi en localhost sont attendues tant que le domaine autorisé de production n’est pas utilisé
- Validation frontend finale OK via agent UI + smoke tests locaux
  - navigation complète, `/actualites` et `/galerie` conformes, pages à bandeau vert cohérentes, menu mobile OK, aucun écran blanc
- Validation preview interne OK
  - `http://127.0.0.1:3000/` et `/actualites` répondent maintenant en `200` via le proxy preview
  - screenshot smoke OK via le port preview `3000`
- Validation performance locale en mode production
  - `yarn build` OK puis Lighthouse mobile local sur `next start` : score stabilisé **96–97/100**, avec un meilleur run à **97/100**
  - TTFB local de la home abaissé à ~20–30 ms après mise en cache, LCP mobile mesuré autour de ~2.6 s sur le meilleur run
- Validation frontend après optimisation performance : agent UI OK sur `/`, `/actualites`, `/galerie` + menu mobile, sans régression fonctionnelle ni visuelle majeure
- Validation UI complémentaire OK
  - footer social spacing PASS
  - `/galerie` structure cohérente et plus proche du live PASS
  - `/devenez-benevole` CTA glow CMS PASS après correctif `globals.css`
  - protocole Lighthouse script testé localement (génération des rapports + `summary.md` OK)

## Blocages connus
- Aucun blocage majeur sur le flux contact : Emailit est opérationnel sur l’environnement actuel.

## P0
- Connecter davantage le frontend public aux données CMS réelles au lieu du fallback statique, en particulier l’accueil et les pages encore rendues principalement depuis des composants statiques.
- Vérifier la cohérence multilingue réelle (subdomains / variantes preview) sur toutes les pages publiques.
- Réduire les derniers écarts pixel-perfect visibles entre la SSR et `https://greeters.paris`, route par route.
- Finaliser la parité visuelle ultra-fine sur davantage de pages secondaires et sur encore plus de tailles d’écran réelles si l’utilisateur veut une passe de finition exhaustive.
- Valider MultiLipi sur le domaine autorisé final `greeters.nexus-conseil.ch` : en local/preview, la CORS de MultiLipi reste attendue.
- Vérifier en production si MultiLipi réécrit réellement les balises SEO/OG par locale servie, au lieu de supposer une traduction automatique du `<head>`.
- Étendre si souhaité l’automatisation SEO/OG au-delà du corpus FR initial vers toutes les locales préremplies.
- Vérifier côté utilisateur que l’onglet Preview Emergent s’est bien réinitialisé après le correctif (refresh complet / réouverture si cache navigateur côté UI plateforme).
- Mesurer le vrai domaine de production une fois branché, car MultiLipi autorisé en prod pourra encore coûter quelques points Lighthouse réels.
- Décider si le chatbot public historique doit être restauré à l’identique depuis la CSR dans la SSR publique.

## P1
- Étendre le sitemap dynamique avec toutes les pages/articles réellement souhaités au référencement final.
- Nettoyer les contenus/tests historiques en base si nécessaire.
- Reprendre les écrans admin `/admin/pages/new` et `/admin/pages/[id]` pour coller au CMS source.
- Brancher les documents/pages publiques sur des contenus éditables depuis le CMS si souhaité.
- Vérifier route par route quelles pages publiques nommées doivent être enrichies dans le CMS pour dépasser le simple préremplissage initial.
- Ajouter si souhaité encore plus de variantes avancées de schema.org et de règles spécialisées par type de contenu.

## P2
- Finaliser un gestionnaire de menu admin encore plus riche (drag-and-drop avancé / arborescence si besoin).
- Ajouter les raffinements de parité visuelle restants page par page.
- Décider si la génération IA doit rester sur le prompt/format actuel ou être enrichie (templates, édition incrémentale, garde-fous éditoriaux).

## Next tasks
1. Mener une dernière passe pixel-perfect exhaustive page par page / écran par écran si l’utilisateur veut une quasi-parité stricte finale.
2. Valider MultiLipi sur le vrai domaine autorisé puis vérifier explicitement si les méta SEO/OG changent bien par sous-domaine/locale côté HTML servi.
3. Étendre l’automatisation SEO/OG multilingue à toutes les locales préremplies si souhaité.
4. Continuer à remplacer les derniers contenus statiques par des contenus CMS structurés, notamment sur les pages institutionnelles détaillées.
5. Ajuster la stratégie SEO finale (pages à indexer/non indexer, priorités, éventuelles pages utilitaires à exclure).
6. Refaire une passe Lighthouse sur le domaine de production réel et décider ensuite, si nécessaire, d’un traitement spécifique de MultiLipi pour viser 98–100 mobile.
7. Si souhaité par l’utilisateur, porter ensuite le chatbot public depuis la CSR vers la SSR avec comportement et style équivalents.
