# IcamTrack — Rapport de projet

**Module :** EC06-SNI-ProjInfo  
**Date :** Mai 2026  
**Application :** https://icam-track.vercel.app  
**Dépôt GitHub :** https://github.com/alsaas2004-stack/Projet_Info-

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Architecture du système](#2-architecture-du-système)
3. [Manuel d'utilisation](#3-manuel-dutilisation)
4. [Technologies utilisées](#4-technologies-utilisées)
5. [Structure du projet et organisation du code](#5-structure-du-projet-et-organisation-du-code)
6. [Modèle de données](#6-modèle-de-données)
7. [Gestion de la sécurité et des erreurs](#7-gestion-de-la-sécurité-et-des-erreurs)
8. [Conclusion](#8-conclusion)

---

## 1. Introduction

### Contexte

Le département informatique de l'ICAM met à disposition des étudiants différents équipements pédagogiques : composants électroniques, cartes de développement, capteurs, kits de prototypage, etc. Jusqu'à présent, le suivi de ces emprunts reposait sur des pratiques hétérogènes — tableurs partagés, échanges informels, suivi oral — rendant difficile toute vision globale de l'état du parc matériel.

### Problèmes identifiés

- Pertes, oublis ou retours tardifs de matériel
- Conflits d'emprunt sur un même équipement
- Absence de traçabilité des mouvements
- Aucune vision en temps réel de la disponibilité

### Objectifs

IcamTrack est une application web développée pour répondre à ces besoins. Elle permet de :

- Centraliser les informations relatives au matériel
- Suivre les emprunts et les retours en temps réel
- Connaître immédiatement l'état et la disponibilité des équipements
- Conserver un historique fiable des utilisations
- Fournir une vue synthétique via un tableau de bord

---

## 2. Architecture du système

### Vue d'ensemble

IcamTrack repose sur une architecture **client-serveur découplée** :

```
Navigateur (React SPA)
        │
        │ HTTPS / REST + Realtime WebSocket
        ▼
   Supabase (BaaS)
   ├── PostgreSQL (base de données)
   ├── Auth (gestion des utilisateurs)
   ├── PostgREST (API REST automatique)
   └── Realtime (mises à jour temps réel)
        │
        │ déployé sur
        ▼
      Vercel (CDN mondial)
```

### Frontend

Le frontend est une **Single Page Application (SPA)** React compilée par Vite. Il communique exclusivement avec Supabase via le SDK JavaScript officiel (`@supabase/supabase-js`). L'application est statique : aucun serveur Node.js intermédiaire n'est nécessaire.

### Backend

Le backend est entièrement géré par **Supabase** :
- L'API REST est exposée automatiquement par **PostgREST** depuis le schéma PostgreSQL
- L'authentification est gérée par **Supabase Auth** (email/password + confirmation par email)
- Les règles de sécurité sont définies via **Row Level Security (RLS)** directement dans PostgreSQL
- La logique métier complexe (gestion du stock, notifications) est encapsulée dans des **fonctions SQL** et un **trigger**

### Déploiement

L'application est déployée sur **Vercel**. Chaque `git push` sur la branche `main` déclenche automatiquement un nouveau déploiement.

---

## 3. Manuel d'utilisation

### Accès à l'application

L'application est accessible à l'adresse : **https://icam-track.vercel.app**

### Création de compte (étudiant)

1. Aller sur la page de connexion
2. Cliquer sur **"Créer un compte"**
3. Renseigner nom, email ICAM (`@icam.fr` ou `@YYYY.icam.fr`) et mot de passe
4. Valider le lien reçu par email avant de se connecter

### Fonctionnalités étudiant

**Consulter le catalogue**
- La page **Matériels** liste tous les équipements disponibles avec leur état, catégorie et stock
- Un moteur de recherche et des filtres par catégorie permettent de trouver rapidement un équipement

**Faire une demande d'emprunt**
1. Cliquer sur un matériel disponible
2. Choisir la quantité souhaitée
3. Cliquer **"Ajouter au panier"**
4. Aller dans le **Panier**, vérifier la sélection
5. Indiquer la date de retour prévue
6. Soumettre la demande → statut `en_attente`

**Suivre ses emprunts**
- La page **Mes emprunts** affiche l'état de toutes les demandes (en attente, acceptée, refusée, rendue)
- Une notification apparaît dès qu'un admin traite la demande

### Fonctionnalités admin / superadmin

**Gérer les demandes d'emprunt**
- La page **Emprunts** liste toutes les demandes en attente
- L'admin peut **accepter** (passe en `en_cours`, décrémente le stock) ou **refuser** (avec motif)
- Quand le matériel est rendu, passer le statut à `rendu` (réincrémente le stock)

**Gérer le catalogue matériel**
- Créer, modifier ou désactiver un équipement (page **Matériels**)
- Définir les catégories (page **Catégories**)
- Gérer les kits (assemblages de composants)

**Tableau de bord**
- Vue synthétique : nombre de matériels disponibles / empruntés / indisponibles
- Emprunts en cours et demandes en attente
- Accès rapide aux actions les plus fréquentes

**Gestion des utilisateurs (superadmin uniquement)**
- Activer / désactiver un compte
- Modifier le rôle d'un utilisateur (étudiant → admin)

---

## 4. Technologies utilisées

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| Frontend | **React** | 18 | Interface utilisateur (composants, état) |
| Build | **Vite** | 5 | Bundler rapide, hot-reload en dev |
| Style | **Tailwind CSS** | 3 | Styles utilitaires, design responsive |
| Routing | **React Router** | 6 | Navigation entre pages (SPA) |
| Backend | **Supabase** | — | BaaS : PostgreSQL + Auth + API REST |
| Base de données | **PostgreSQL** | 15 | Stockage relationnel, RLS, triggers |
| Déploiement | **Vercel** | — | Hébergement CDN, déploiement continu |
| Versioning | **Git / GitHub** | — | Gestion du code source |

### Justification des choix

**React** a été choisi pour sa popularité, son écosystème riche et la facilité de réutilisation des composants. **Supabase** permet d'avoir un backend complet (BDD, auth, API, temps réel) sans écrire de serveur, ce qui est idéal pour une équipe centrée sur le frontend. **Vercel** offre un déploiement automatique depuis GitHub en quelques secondes.

---

## 5. Structure du projet et organisation du code

```
Projet_Info-/
├── src/                          # Code source de l'application
│   ├── main.jsx                  # Point d'entrée React
│   ├── App.jsx                   # Routeur principal
│   ├── index.css                 # Styles globaux
│   │
│   ├── lib/
│   │   └── supabase.js           # Client Supabase (singleton)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx       # Contexte d'authentification global
│   │   └── CartContext.jsx       # Contexte du panier d'emprunt
│   │
│   ├── components/
│   │   └── PrivateRoute.jsx      # Garde de route (redirige si non connecté)
│   │
│   ├── layouts/
│   │   └── MainLayout.jsx        # Layout avec barre de navigation
│   │
│   └── pages/
│       ├── Login.jsx             # Connexion et inscription
│       ├── Dashboard.jsx         # Tableau de bord
│       ├── Materiels.jsx         # Catalogue matériel
│       ├── DetailMateriel.jsx    # Fiche détaillée d'un matériel
│       ├── NouveauMateriel.jsx   # Formulaire création/édition matériel
│       ├── Categories.jsx        # Gestion des catégories
│       ├── Emprunts.jsx          # Gestion des emprunts (admin)
│       ├── Panier.jsx            # Panier et soumission de demande
│       ├── Historique.jsx        # Historique des actions
│       ├── Notifications.jsx     # Notifications utilisateur
│       ├── Utilisateurs.jsx      # Gestion des utilisateurs (superadmin)
│       └── ResetPassword.jsx     # Réinitialisation du mot de passe
│
├── BDD/
│   ├── Schema.sql                # Script complet : tables, RLS, fonctions, trigger
│   └── supabase-schema-*.png     # Capture du schéma Supabase
│
├── docs/
│   ├── Rapport.md                # Ce rapport
│   ├── Manuel_utilisation.md     # Guide d'utilisation détaillé
│   └── Backlog.md                # Backlog Agile du projet
│
├── public/                       # Fichiers statiques (favicon, icônes)
├── index.html                    # HTML racine
├── package.json                  # Dépendances npm
├── vite.config.js                # Configuration Vite
└── vercel.json                   # Configuration du déploiement Vercel
```

### Patterns utilisés

**Context API** : L'état global (utilisateur connecté, panier) est partagé via des contextes React (`AuthContext`, `CartContext`), évitant le "prop drilling".

**PrivateRoute** : Un composant de garde redirige automatiquement vers `/login` si l'utilisateur n'est pas authentifié, et vers `/dashboard` si un non-admin essaie d'accéder à une page réservée.

**Fonctions SQL SECURITY DEFINER** : La logique métier sensible (récupérer les IDs admins, gérer le stock) est encapsulée dans des fonctions PostgreSQL qui s'exécutent avec les droits du créateur, contournant le RLS de façon contrôlée.

---

## 6. Modèle de données

### Schéma relationnel

La base de données comporte **7 tables** :

| Table | Description |
|-------|-------------|
| `categorie` | Familles de matériel (électronique, mécanique, etc.) |
| `materiel` | Équipements du parc (avec stock, état, is_kit) |
| `kit_composant` | Composition des kits (relation materiel ↔ materiel) |
| `emprunt` | Demandes d'emprunt avec statut et quantité |
| `utilisateur` | Comptes utilisateurs avec rôle (etudiant/admin/superadmin) |
| `historique` | Traçabilité de toutes les actions |
| `notification` | Messages temps réel entre le système et les utilisateurs |

### Relations principales

```
utilisateur ──────────────── emprunt ──────── materiel
                              │                    │
                              └── historique    categorie
                                                    │
                              notification      kit_composant
                              (user ← emprunt)  (kit → composants)
```

### États du matériel

Un matériel peut être dans 4 états :

| État | Signification |
|------|---------------|
| `disponible` | Peut être emprunté |
| `en_attente` | Stock épuisé par des demandes en attente |
| `emprunte` | Stock à zéro, emprunt en cours |
| `indisponible` | Mis hors service manuellement |

### Cycle de vie d'un emprunt

```
en_attente ──(accepté)──► en_cours ──(rendu)──► rendu
           └──(refusé)──► refuse
```

Le trigger `on_emprunt_update` gère automatiquement les mises à jour du stock et de l'état du matériel à chaque transition.

### Script SQL complet

Le fichier `BDD/Schema.sql` contient l'intégralité du schéma : création des tables, activation du RLS, politiques de sécurité, fonctions et trigger.

---

## 7. Gestion de la sécurité et des erreurs

### Authentification

L'authentification est gérée par **Supabase Auth** :
- Inscription uniquement avec une adresse `@icam.fr` ou `@YYYY.icam.fr` (validation regex côté client)
- Confirmation obligatoire par email avant de pouvoir se connecter
- Tokens JWT stockés automatiquement par le SDK Supabase

### Row Level Security (RLS)

Toutes les tables ont le RLS activé. Chaque requête est filtrée automatiquement par PostgreSQL selon le rôle de l'utilisateur connecté :

| Qui | Peut faire quoi |
|-----|-----------------|
| Étudiant | Voir le catalogue, voir ses propres emprunts/notifications, créer des demandes |
| Admin | Tout ce qu'un étudiant peut faire + gérer les emprunts, le matériel, l'historique |
| Superadmin | Tout + gérer les utilisateurs et leurs rôles |

### Fonctions SECURITY DEFINER

Certaines opérations nécessitent de contourner le RLS de façon contrôlée :
- `current_user_role()` : récupère le rôle de l'utilisateur connecté sans exposer la table `utilisateur`
- `get_admin_ids()` : retourne les IDs des admins (utilisé pour les notifications, inaccessible directement aux étudiants)
- `reserver_materiel()`, `liberer_materiel()` : modifient le stock sans exposer des UPDATE directs

### Gestion des erreurs côté client

- Erreur de connexion avec email non confirmé : message explicite invitant à vérifier la boîte mail
- Erreur d'email invalide à l'inscription : vérification du format `@icam.fr` avant envoi
- Erreurs Supabase affichées via des messages contextuels (pas de crash silencieux)

---

## 8. Conclusion

### Bilan

IcamTrack répond aux objectifs fixés dans le cahier des charges :

- **Gestion du matériel** : catalogue complet avec catégories, états, stock et gestion des kits
- **Gestion des emprunts** : workflow complet en_attente → en_cours → rendu avec notifications
- **Traçabilité** : historique horodaté de toutes les actions
- **Tableau de bord** : vision synthétique en temps réel
- **Sécurité** : RLS PostgreSQL garantissant qu'un utilisateur ne voit que ce qu'il est autorisé à voir

### Difficultés rencontrées

- La gestion des politiques RLS Supabase a nécessité une bonne compréhension du comportement de PostgREST (notamment la distinction entre la policy INSERT et le RETURNING *)
- La gestion du stock pour les kits (matériels composés d'autres matériels) a complexifié le trigger et les fonctions de réservation
- La synchronisation entre l'état `etat` du matériel et la quantité en stock a demandé une logique de trigger précise

### Perspectives d'évolution

- Système de rappels automatiques pour les retours tardifs
- Export CSV de l'historique des emprunts
- Application mobile (React Native)
- Scan de QR codes pour identifier le matériel rapidement
