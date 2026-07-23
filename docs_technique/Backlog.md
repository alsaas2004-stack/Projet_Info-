# Backlog Agile — IcamTrack

**Méthodologie :** Scrum simplifié  
**Sprints :** 2 semaines  
**Statuts :** À faire | En cours | Terminé

---

## Épics

| ID | Épic | Description |
|----|------|-------------|
| E1 | Authentification | Gestion des comptes, connexion, rôles |
| E2 | Catalogue matériel | CRUD des équipements et catégories |
| E3 | Emprunts | Demandes, validation, retour |
| E4 | Notifications | Alertes temps réel |
| E5 | Tableau de bord | Vue synthétique admin |
| E6 | Sécurité | RLS, politiques, protections |
| E7 | Historique | Traçabilité des actions |

---

## User Stories

### Sprint 1 — Fondations (authentification + BDD)

| ID | En tant que | Je veux | Afin de | Priorité | Statut |
|----|-------------|---------|---------|----------|--------|
| US-01 | Étudiant | Créer un compte avec mon email ICAM | Accéder à l'application | Haute | Terminé |
| US-02 | Étudiant | Recevoir un email de confirmation | Valider mon identité | Haute | Terminé |
| US-03 | Utilisateur | Me connecter avec email/mot de passe | Accéder à mon espace | Haute | Terminé |
| US-04 | Utilisateur | Voir un message clair si mon email n'est pas confirmé | Comprendre pourquoi la connexion échoue | Moyenne | Terminé |
| US-05 | Admin | Avoir un compte admin pré-configuré | Gérer l'application dès le départ | Haute | Terminé |

### Sprint 2 — Catalogue matériel

| ID | En tant que | Je veux | Afin de | Priorité | Statut |
|----|-------------|---------|---------|----------|--------|
| US-06 | Admin | Créer une fiche matériel (nom, ref, catégorie, stock) | Référencer les équipements | Haute | Terminé |
| US-07 | Admin | Modifier ou désactiver un matériel | Maintenir le catalogue à jour | Haute | Terminé |
| US-08 | Admin | Gérer les catégories d'équipement | Organiser le catalogue | Moyenne | Terminé |
| US-09 | Étudiant | Consulter la liste des matériels disponibles | Trouver ce dont j'ai besoin | Haute | Terminé |
| US-10 | Étudiant | Filtrer par catégorie et rechercher par nom | Trouver un équipement rapidement | Moyenne | Terminé |
| US-11 | Étudiant | Voir la fiche détaillée d'un matériel | Connaître ses caractéristiques | Moyenne | Terminé |
| US-12 | Admin | Créer des kits (assemblages de composants) | Gérer les ensembles matériels | Basse | Terminé |

### Sprint 3 — Gestion des emprunts

| ID | En tant que | Je veux | Afin de | Priorité | Statut |
|----|-------------|---------|---------|----------|--------|
| US-13 | Étudiant | Ajouter un matériel à mon panier | Composer ma demande | Haute | Terminé |
| US-14 | Étudiant | Indiquer la quantité et la date de retour | Préciser ma demande | Haute | Terminé |
| US-15 | Étudiant | Soumettre ma demande d'emprunt | Formaliser la demande auprès de l'admin | Haute | Terminé |
| US-16 | Étudiant | Consulter l'état de mes demandes | Savoir si ma demande est acceptée | Haute | Terminé |
| US-17 | Admin | Voir toutes les demandes en attente | Traiter les emprunts | Haute | Terminé |
| US-18 | Admin | Accepter ou refuser une demande (avec motif) | Gérer les emprunts | Haute | Terminé |
| US-19 | Admin | Marquer un emprunt comme rendu | Libérer le matériel | Haute | Terminé |
| US-20 | Système | Décrémenter le stock à l'acceptation d'un emprunt | Maintenir la disponibilité à jour | Haute | Terminé |
| US-21 | Système | Réincrémenter le stock au retour | Remettre le matériel disponible | Haute | Terminé |

### Sprint 4 — Notifications et tableau de bord

| ID | En tant que | Je veux | Afin de | Priorité | Statut |
|----|-------------|---------|---------|----------|--------|
| US-22 | Admin | Recevoir une notification quand un étudiant fait une demande | Être alerté sans surveiller l'application | Haute | Terminé |
| US-23 | Étudiant | Recevoir une notification quand ma demande est traitée | Savoir si mon emprunt est accepté/refusé | Haute | Terminé |
| US-24 | Utilisateur | Marquer une notification comme lue | Nettoyer mon espace | Basse | Terminé |
| US-25 | Admin | Voir un tableau de bord avec les KPIs | Piloter le parc matériel | Moyenne | Terminé |
| US-26 | Admin | Voir la répartition disponible/emprunté/indisponible | Connaître l'état global du parc | Moyenne | Terminé |

### Sprint 5 — Sécurité et historique

| ID | En tant que | Je veux | Afin de | Priorité | Statut |
|----|-------------|---------|---------|----------|--------|
| US-27 | Admin | Que les étudiants ne puissent accéder qu'à leurs propres données | Protéger la confidentialité | Haute | Terminé |
| US-28 | Système | Que toute modification de données soit protégée par RLS | Sécuriser la BDD même en cas de bug frontend | Haute | Terminé |
| US-29 | Admin | Consulter l'historique des actions | Assurer la traçabilité | Moyenne | Terminé |
| US-30 | Superadmin | Gérer les rôles des utilisateurs | Promouvoir un étudiant en admin | Basse | Terminé |

---

## Définition of Done (DoD)

Une user story est considérée **Terminée** quand :
- La fonctionnalité fonctionne en production (Vercel)
- Les règles RLS correspondantes sont en place dans Supabase
- L'interface est responsive (mobile et desktop)
- Aucune erreur dans la console navigateur

---

## Bugs résolus

| ID | Description | Priorité | Statut |
|----|-------------|----------|--------|
| BUG-01 | Notifications admin non reçues (RLS bloquait la requête admin IDs) | Critique | Résolu |
| BUG-02 | Matériel passait indisponible dès la première demande même avec stock > 1 | Haute | Résolu |
| BUG-03 | Connexion affichait "mot de passe incorrect" quand l'email n'était pas confirmé | Moyenne | Résolu |
| BUG-04 | Email @2028.icam.fr refusé à l'inscription | Moyenne | Résolu |
