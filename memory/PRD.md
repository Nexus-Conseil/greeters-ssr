# PRD — État de reprise après audit + exécution des lots 00 à 02

## Problème d’origine
- Identifier la vraie source Greeters
- Corriger l’écart entre la doc et le code réel
- Définir puis démarrer une vraie migration Next.js à partir du produit React/FastAPI existant

## Décisions verrouillées
- Nouvelle cible dans `/app/greeters`
- Next.js App Router + TypeScript
- Supabase PostgreSQL + Prisma
- Réécriture one-shot
- Auth moderne côté serveur avec `proxy.ts`
- Pas de Google Maps
- Pas de SunEditor

## Implémenté
- Audit complet du repo source et des écarts documentaires
- Production des documents de planification et de portage
- Création du squelette Next.js dans `/app/greeters`
- Schéma Prisma initial + migration SQL + seed admin
- Application de la migration SQL initiale côté Supabase
- Lot 02 complet : login/logout/me, session HTTP-only, proxy admin, `/admin/login`, `/admin`
- Validation build/lint + validation auth E2E

## Ce qui fonctionne déjà
- L’app Next.js compile et build
- La DB Prisma est branchée au runtime
- Le seed admin fonctionne via variables d’environnement
- Login admin et dashboard protégé fonctionnent

## P0
- Créer les repositories/services métier
- Porter les APIs pages P0
- Démarrer le vrai shell admin/public

## P1
- Porter le CRUD pages complet
- Porter le workflow pending/versions/rollback
- Commencer les pages publiques SSR

## P2
- Porter menu, documents/uploads, users admin, IA, contact, chatbot
- Préparer la migration Mongo → Supabase des données métier