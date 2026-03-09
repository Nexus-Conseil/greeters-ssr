# Audit de parité — pages publiques Greeters

Date : 2026-03-09

## Sources comparées
- **Site live** : `https://greeters.paris`
- **Code CSR source** : `/tmp/greeters-remote/frontend/src/components/pages/*.jsx`
- **Version SSR en cours** : `/app/greeters`

## Remarque importante
- Le site live charge automatiquement une variante linguistique anglaise dans l’audit navigateur. Les structures et pages restent bien identifiables, mais certains titres remontent en anglais (`NEWS`, `LEGAL NOTICE`, etc.).
- La migration SSR actuelle reste prioritairement alignée sur le **contenu source CSR français**.

## Inventaire des routes publiques

| Route | CSR source | Live détecté | SSR actuel | Statut |
|---|---|---|---|---|
| `/` | `HomePage.jsx` | OK | migré | OK |
| `/qui-sommes-nous` | `QuiSommesNousPage.jsx` | `WHO ARE WE?` | migré | OK |
| `/actualites` | `ActualitesPage.jsx` | `NEWS` | migré | OK |
| `/galerie` | `GaleriePage.jsx` | `GALLERY` | migré | OK |
| `/livre-dor` | `LivreDorPage.jsx` | `GUESTBOOK` | migré | OK |
| `/faire-un-don` | `FaireUnDonPage.jsx` | `DONATE` | migré | OK |
| `/devenez-benevole` | `DevenezBenevolePage.jsx` | `Become a volunteer Greeter` | migré | OK |
| `/contact` | `ContactPage.jsx` | `CONTACT` | migré | OK UI |
| `/presse` | `PressePage.jsx` | `PRESS` | migré | OK |
| `/mentions-legales` | `MentionsLegalesPage.jsx` | `LEGAL NOTICE` | migré | OK |
| `/mention-legale` | redirection CSR | implicite | migré via redirect | OK |

## Notes de parité par page

### Accueil
- Shell public, hero, intro, Greeters, visite, actualités, témoignages, galerie et footer partenaires migrés.

### Qui sommes-nous ?
- Bloc intro, lien charte, panneau IGA, grille de valeurs, texte explicatif et encart important migrés.

### Actualités
- Grille de cartes avec date, image, titre, extrait et lien migrée.

### Galerie
- Grille complète + lightbox migrées.

### Livre d’or
- Liste de témoignages + navigation par précédent/suivant + points migrée.

### Faire un don
- Blocs PayPal, chèque, virement, don direct et image finale migrés.

### Devenez bénévole
- Hero, image, intro, bénéfices, prérequis et CTA de candidature migrés.

### Contact
- Structure et formulaire migrés.
- **Limite actuelle** : l’envoi email réel n’est pas encore configuré dans l’environnement SSR ; le formulaire répond côté interface, mais la livraison email reste à brancher proprement.

### Presse
- Dossier de presse, galerie d’images libres de droit et contact presse migrés.

### Mentions légales
- Éditeur, charte, responsabilités et hébergement migrés.

## Écarts restants
- Vérifier finement la parité typographique et les espacements route par route par rapport au live.
- Brancher les versions multilingues réelles page par page.
- Finaliser le flux de contact avec un vrai service d’email.