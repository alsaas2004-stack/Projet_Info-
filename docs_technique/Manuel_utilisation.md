# Manuel d'utilisation — IcamTrack

**Application :** https://icam-track.vercel.app

---

## 1. Accès à l'application

Ouvrir un navigateur (Chrome, Firefox, Edge) et se rendre sur :  
**https://icam-track.vercel.app**

---

## 2. Créer un compte

1. Sur la page de connexion, cliquer sur **"Créer un compte"**
2. Remplir le formulaire :
   - **Nom** : votre prénom et nom
   - **Email** : doit être une adresse ICAM (`@icam.fr` ou `@YYYY.icam.fr`, ex : `alex.dupont@2028.icam.fr`)
   - **Mot de passe** : au moins 6 caractères
3. Cliquer sur **"S'inscrire"**
4. Ouvrir votre boîte mail ICAM et cliquer sur le **lien de confirmation** reçu
5. Revenir sur l'application et se connecter

> **Important :** Si vous essayez de vous connecter sans avoir cliqué sur le lien de confirmation, un message vous le signalera.

---

## 3. Se connecter

1. Entrer votre adresse email et mot de passe
2. Cliquer sur **"Se connecter"**

En cas d'oubli du mot de passe, cliquer sur **"Mot de passe oublié"** pour recevoir un lien de réinitialisation.

---

## 4. Interface étudiant

### 4.1 Parcourir le catalogue

La page **Matériels** liste tous les équipements disponibles.

- Utiliser la **barre de recherche** pour filtrer par nom
- Utiliser le **menu déroulant des catégories** pour filtrer par famille
- Chaque carte affiche : nom, catégorie, état (disponible / en attente / emprunté) et stock restant

### 4.2 Faire une demande d'emprunt

1. Cliquer sur un matériel **disponible**
2. Sur la page détail, choisir la **quantité** (dans la limite du stock)
3. Cliquer sur **"Ajouter au panier"**
4. Répéter pour chaque équipement souhaité
5. Aller dans le **Panier** (icône en haut à droite)
6. Vérifier la liste des matériels
7. Indiquer la **date de retour prévue**
8. Cliquer sur **"Soumettre la demande"**

La demande passe en statut `en_attente`. Un administrateur la traitera prochainement.

### 4.3 Suivre ses emprunts

La page **Mes emprunts** affiche toutes vos demandes avec leur statut :

| Statut | Signification |
|--------|---------------|
| En attente | La demande est soumise, en attente de traitement |
| En cours | La demande est acceptée, le matériel est en votre possession |
| Refusé | La demande a été refusée (motif affiché) |
| Rendu | Le matériel a été retourné |

### 4.4 Notifications

La cloche en haut de l'écran affiche les notifications non lues :
- Confirmation d'acceptation ou de refus de vos demandes
- Cliquer sur une notification pour la marquer comme lue

---

## 5. Interface administrateur

### 5.1 Tableau de bord

La page d'accueil affiche :
- Nombre total de matériels actifs
- Répartition disponible / emprunté / indisponible
- Emprunts en cours
- Demandes en attente

### 5.2 Traiter les demandes d'emprunt

1. Aller sur la page **Emprunts**
2. Les demandes `en_attente` apparaissent en premier
3. Pour **accepter** : cliquer sur ✓ — le stock se décrémente automatiquement
4. Pour **refuser** : cliquer sur ✗ et saisir un motif (visible par l'étudiant)
5. Quand le matériel est rendu : cliquer sur **"Marquer comme rendu"** — le stock se réincrémente

### 5.3 Gérer le catalogue matériel

**Ajouter un matériel**
1. Page **Matériels** → bouton **"+ Nouveau matériel"**
2. Remplir : nom, référence, description, catégorie, stock initial
3. Ajouter une image (optionnel)
4. Cocher **"Est un kit"** si le matériel est un assemblage de composants
5. Enregistrer

**Modifier un matériel**
- Cliquer sur le matériel → bouton **"Modifier"**

**Désactiver un matériel**
- Un matériel désactivé n'apparaît plus dans le catalogue étudiant mais conserve son historique

### 5.4 Gérer les catégories

Page **Catégories** : ajouter, renommer ou supprimer des catégories d'équipement.

### 5.5 Consulter l'historique

Page **Historique** : liste horodatée de toutes les actions (créations, modifications, emprunts, retours).

---

## 6. Interface superadmin

### 6.1 Gérer les utilisateurs

Page **Utilisateurs** (superadmin uniquement) :
- Voir tous les comptes
- **Activer / désactiver** un compte
- **Changer le rôle** d'un utilisateur (étudiant → admin, admin → superadmin)

---

## 7. Questions fréquentes

**Je n'arrive pas à me connecter alors que mon mot de passe est correct.**  
→ Vérifiez que vous avez cliqué sur le lien de confirmation dans votre boîte mail ICAM.

**Mon email n'est pas accepté à l'inscription.**  
→ L'application accepte uniquement les adresses `@icam.fr` ou `@YYYY.icam.fr` (ex : `@2028.icam.fr`).

**Je vois "emprunté" sur un matériel mais il est présent physiquement.**  
→ Signalez-le à un administrateur qui pourra corriger l'état manuellement.

**Je ne reçois pas les notifications.**  
→ Vérifiez que vous êtes bien connecté et que votre navigateur n'a pas de bloqueur de requêtes réseau actif.
