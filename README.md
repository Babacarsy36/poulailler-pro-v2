# Poulailler Pro

Application web de gestion avicole construite avec `React`, `Vite` et `Firebase`.

Le projet couvre aujourd'hui plusieurs briques métier :
- gestion des volailles par lots
- suivi de la ponte
- gestion de l'aliment
- suivi sanitaire
- finances
- couvoir / incubation

## Stack

- `React 18`
- `Vite 6`
- `Firebase Auth`
- `Firestore`
- `Tailwind CSS 4`
- `Radix UI`
- `Recharts`
- déploiement sur `Vercel`

## Démarrage local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer les variables d'environnement

Copier `.env.example` vers un fichier `.env.local` puis renseigner :

```bash
cp .env.example .env.local
```

Variables attendues :

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 3. Lancer le projet

```bash
npm run dev
```

### 4. Générer la build

```bash
npm run build
```

## Structure de données Firestore

Le projet écrit actuellement dans cette structure :

```txt
users/{uid}/collections/chickens
users/{uid}/collections/eggs
users/{uid}/collections/feed
users/{uid}/collections/health
users/{uid}/collections/finances
users/{uid}/collections/incubation
users/{uid}/settings/preferences
```

Les documents de `collections/*` ont cette forme :

```json
{
  "data": [],
  "lastUpdated": 0
}
```

Le document `settings/preferences` contient :

```json
{
  "poultryType": "poulet",
  "poultryBreed": "goliath",
  "lastUpdated": 0
}
```

## Sécurité Firestore

Les règles sont définies dans `firestore.rules` et référencées par `firebase.json`.

Principes actuels :
- utilisateur authentifié obligatoire
- accès limité à son propre `uid`
- seules les collections métier prévues sont autorisées
- validation minimale des préférences espèce/race

Pour redéployer les règles :

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project poulaillerpro
```

## Déploiement Vercel

Le projet est prévu pour être déployé sur `Vercel`.

Production actuelle :

- `https://poulailler-pro.vercel.app`

Variables à ajouter dans `Project Settings > Environment Variables` :

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Après mise à jour des variables :

```bash
vercel --prod
```

## Fonctionnalités principales

### Gestion d'élevage
- inventaire par lots
- espèce et race sélectionnables
- indicateurs de ponte ajustés
- suivi des stocks d'aliment
- suivi santé avec protocole
- suivi financier

### Couvoir
- création de lots d'incubation
- suivi quotidien
- vue bilan
- vue finances incubation
- FAQ intégrée

### Expérience utilisateur
- mode clair / sombre
- navigation mobile et desktop
- synchronisation Firebase
- stockage local + synchro cloud

## Checklist QA recommandée

Avant une mise en prod, vérifier :

1. Connexion / inscription
- login fonctionne
- création de compte fonctionne
- reset password fonctionne

2. Données métier
- ajout / modification / suppression d'un lot
- enregistrement d'une récolte
- enregistrement d'une opération d'aliment
- ajout d'un soin
- ajout d'une transaction
- ajout d'un lot d'incubation

3. Synchronisation
- refresh navigateur après écriture
- reconnexion avec le même compte
- test avec un second compte pour vérifier l'isolation

4. Navigation
- `/`
- `/inventory`
- `/eggs`
- `/feed`
- `/health`
- `/finances`
- `/incubator`

5. Déploiement
- build Vite OK
- routes SPA répondent bien via Vercel

## Axes d'amélioration encore utiles

- activer Firebase App Check
- renforcer les validations métier
- réduire l'usage de `localStorage` pour les données sensibles
- ajouter des tests automatisés
- enrichir la documentation produit

## Remarques

- Les variables `VITE_*` sont visibles côté frontend. C'est normal pour la config Firebase web.
- La vraie protection des données repose sur les règles Firestore.
- Le projet a été optimisé avec code splitting pour réduire le poids du chargement initial.
