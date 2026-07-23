# IcamTrack

Application web de gestion d'emprunts de matériel pédagogique — ICAM  
**EC06-SNI-ProjInfo · Mai 2026**

**Application en ligne :** https://icam-track.vercel.app

---

## Stack technique

- **Frontend :** React 18 + Vite + Tailwind CSS
- **Backend :** Supabase (PostgreSQL + Auth + RLS)
- **Déploiement :** Vercel (CD depuis GitHub `main`)

---

## Structure du dépôt

```
Projet_Info-/
├── src/              # Code source React (pages, composants, contextes)
├── BDD/              # Base de données
│   ├── Schema.sql           # Script complet (tables, RLS, fonctions, trigger)
│   └── *.png                # Capture du schéma Supabase
├── docs/             # Documentation
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

## Documentation

- [Rapport de projet](docs/Rapport.md)
- [Manuel d'utilisation](docs/Manuel_utilisation.md)
- [Backlog Agile](docs/Backlog.md)
- [Schéma BDD](BDD/Schema.sql)
