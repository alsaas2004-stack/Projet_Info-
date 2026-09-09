# IcamTrack

Application web de gestion d'emprunts de matériel pédagogique — ICAM  
**EC06-SNI-ProjInfo · Mai 2026**

**Application en ligne :** https://projet-info-livid.vercel.app

Les étudiants réservent et empruntent du matériel (y compris des kits composés de plusieurs éléments), les administrateurs valident ou refusent les demandes. Le stock et l'état du matériel (disponible / en attente / emprunté) sont mis à jour automatiquement selon le cycle de vie de l'emprunt, avec notifications et historique.

---

## Stack technique

- **Frontend :** React 19 + Vite + Tailwind CSS 4, React Router 7, Recharts
- **Backend :** Supabase (PostgreSQL + Auth + Row Level Security)
- **Déploiement :** Vercel (CD depuis GitHub `main`)

---

## Structure du dépôt

```
Projet_Info-/
├── src/              # Code source React (pages, composants, contextes)
├── BDD/              # Base de données
│   ├── Schema.sql           # Script complet (tables, RLS, fonctions, trigger)
│   └── *.png                # Capture du schéma Supabase
├── docs_technique/   # Documentation
│   ├── Rapport.md           # Rapport de projet complet
│   ├── Manuel_utilisation.md # Guide d'utilisation
│   └── Backlog.md           # Backlog Agile
├── public/           # Fichiers statiques
├── package.json
└── vercel.json
```

---

## Lancer le projet en local

```bash
npm install
cp .env.example .env   # puis renseigner les clés Supabase
npm run dev
```

---

## Modèle de données

7 tables PostgreSQL (voir `BDD/Schema.sql` pour le détail complet, et `BDD/PNG/` pour les diagrammes MCD/MLD) :

- **`utilisateur`** — comptes (rôle étudiant / admin / superadmin)
- **`categorie`** — catégories de matériel
- **`materiel`** — matériel disponible, avec stock et état ; peut être un kit (`is_kit`)
- **`kit_composant`** — composition des kits (matériel ↔ matériel, avec quantité)
- **`emprunt`** — demandes d'emprunt et leur cycle de vie (en_attente → en_cours → rendu, ou refusé)
- **`historique`** — journal des actions sur le matériel
- **`notification`** — notifications utilisateur liées aux emprunts

La sécurité repose entièrement sur des **policies RLS** par table (étudiant : accès à ses propres emprunts/notifications ; admin/superadmin : accès élargi), plus un trigger PL/pgSQL qui gère automatiquement le stock et l'état du matériel à chaque changement de statut d'un emprunt.

## Ce que j'ai conçu moi-même

- Le **MCD/MLD** (modélisation des entités, relations, cardinalités — voir `BDD/PNG/`)
- Les **policies RLS** (règles d'accès par rôle pour chaque table)

Le reste du développement (composants React, logique front, mise en forme) a été réalisé avec l'assistance d'un outil d'IA générative (Claude).

## Documentation

- [Rapport de projet](docs_technique/Rapport.md)
- [Manuel d'utilisation](docs_technique/Manuel_utilisation.md)
- [Backlog Agile](docs_technique/Backlog.md)
- [Schéma BDD](BDD/Schema.sql)
