# 🏀 Gestionnaire Équipe U11F2 - Basket

> Application web moderne pour organiser et gérer les matchs de l'équipe de basket U11F2

[![Netlify Status](https://api.netlify.com/api/v1/badges/dac5e195-7a76-4f34-9990-4acfca5c6985/deploy-status)](https://app.netlify.com/sites/basket-u11f2/deploys)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://stellisense.com)

## 📱 Aperçu

Cette application permet aux parents et entraîneurs de l'équipe U11F2 d'organiser facilement tous les aspects logistiques des matchs de basket, de la gestion des maillots au covoiturage en passant par l'organisation des goûters.

### 🚀 [Voir l'application en direct →](https://stellisense.com)

![Screenshot](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Basket+Team+Manager)

## ✨ Fonctionnalités

### 📅 Gestion des matchs
- **Calendrier interactif** avec navigation mensuelle
- **Informations complètes** : club adverse, heure, adresse
- **Visualisation claire** des matchs programmés

### 👥 Organisation des équipes
- **👕 Référent maillots** : Assignation du parent responsable
- **🚗 Covoiturage** : Gestion de 3 voitures avec conducteurs
- **🍪 Goûters** : Organisation des responsables

### 📊 Base de données
- **💾 Sauvegarde automatique** avec base de données Neon (PostgreSQL)
- **🔄 Synchronisation** en temps réel
- **💿 Sauvegarde locale** de secours

### 📱 Interface utilisateur
- **📱 Design responsive** (mobile, tablette, desktop)
- **🎨 Interface moderne** avec Tailwind CSS
- **⚡ Interactions fluides** avec React

## 👥 Équipe U11F2 (Saison 25/26)

L'application gère les informations de contact pour toute l'équipe 

## 🛠️ Technologies utilisées

### Frontend
- **[React 18](https://reactjs.org/)** - Bibliothèque d'interface utilisateur
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitaire
- **[Babel](https://babeljs.io/)** - Transpilation JavaScript

### Backend
- **[Netlify Functions](https://www.netlify.com/products/functions/)** - API serverless
- **[Neon](https://neon.tech/)** - Base de données PostgreSQL serverless
- **[@neondatabase/serverless](https://github.com/neondatabase/serverless)** - Client base de données

### Infrastructure
- **[Netlify](https://www.netlify.com/)** - Hébergement et déploiement
- **[GitHub](https://github.com/)** - Gestion du code source
- **Domaine personnalisé** : [stellisense.com](https://stellisense.com)

## 📂 Structure du projet

```
basket-team-manager-u11f2/
├── 📄 index.html              # Application React (SPA)
├── 📄 package.json            # Dépendances et scripts
├── 📄 netlify.toml            # Configuration Netlify
├── 📄 README.md               # Documentation
├── 📄 .gitignore              # Fichiers ignorés par Git
└── 📁 netlify/
    └── 📁 functions/
        ├── 📄 matches.mts     # API gestion des matchs
        └── 📄 init-db.mts     # Initialisation base de données
```

## 🚀 Déploiement

### Déploiement automatique
L'application se déploie automatiquement sur Netlify à chaque push sur la branche `main`.

### Variables d'environnement
Configurez la variable suivante dans Netlify :
- `DATABASE_URL` : URL de connexion à la base de données Neon

### Initialisation
Après le premier déploiement, initialisez la base de données :
```bash
curl -X POST https://stellisense.com/api/init-db
```

## 🔧 Installation locale

Si vous souhaitez lancer l'application en local :

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/basket-team-manager-u11f2.git
cd basket-team-manager-u11f2

# Installer les dépendances
npm install

# Démarrer en mode développement
netlify dev
```

L'application sera disponible sur `http://localhost:8888`

## 📖 API

### Endpoints disponibles

#### `GET /api/matches`
Récupère tous les matchs enregistrés.

**Réponse :**
```json
{
  "matches": {
    "2025-09-27": {
      "club": "OC Cesson",
      "address": "ESB - 49 avenue de Dezerseul - Cesson Sévigné",
      "time": "14:00",
      "jerseyParent": "Parent Emma",
      "drivers": ["Parent Lila", "Parent Stella", "Parent Cléa"],
      "snackParents": ["Parent Eve", "Parent Valentine"]
    }
  }
}
```

#### `POST /api/matches`
Sauvegarde ou met à jour un match.

**Requête :**
```json
{
  "date": "2025-09-27",
  "matchData": {
    "club": "OC Cesson",
    "address": "ESB - 49 avenue de Dezerseul - Cesson Sévigné",
    "time": "14:00",
    "jerseyParent": "Parent Emma",
    "drivers": ["Parent Lila", "", ""],
    "snackParents": ["Parent Eve", ""]
  }
}
```

#### `POST /api/init-db`
Initialise la structure de la base de données.

## 📊 Base de données

### Schéma de la table `matches`

```sql
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    club VARCHAR(255) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    time VARCHAR(10) NOT NULL DEFAULT '',
    jersey_parent VARCHAR(255) NOT NULL DEFAULT '',
    drivers TEXT NOT NULL DEFAULT '["","",""]',
    snack_parents TEXT NOT NULL DEFAULT '["",""]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Utilisation

### Pour les parents
1. **Consultez le calendrier** pour voir les matchs à venir
2. **Cliquez sur une date** pour voir/modifier les détails du match
3. **Assignez-vous** comme conducteur ou responsable du goûter
4. **Consultez la liste** des contacts des autres parents

### Pour l'entraîneur/manager
1. **Ajoutez de nouveaux matchs** en cliquant sur les dates
2. **Modifiez les informations** (club adverse, heure, lieu)
3. **Organisez la logistique** (maillots, transport, goûter)
4. **Suivez l'organisation** grâce au résumé visuel

## 🔒 Sécurité et confidentialité

- **🔐 Données chiffrées** en transit (HTTPS)
- **💾 Sauvegarde sécurisée** sur Neon (PostgreSQL)
- **🚫 Pas d'authentification** requise (accès libre pour les parents)
- **📞 Contacts visibles** uniquement pour les membres de l'équipe

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** ce repository
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Committez** vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrez** une Pull Request

## 🐛 Signaler un bug

Si vous rencontrez un problème :

1. **Vérifiez** que le problème n'existe pas déjà dans les [Issues](../../issues)
2. **Créez** une nouvelle issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Captures d'écran si applicable
   - Navigateur et appareil utilisés

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Vincent Quéré**
- 📧 Email : vincent.quere@gmail.com
- 🐙 GitHub : [@VOTRE_USERNAME](https://github.com/VOTRE_USERNAME)

## 🙏 Remerciements

- **L'équipe U11F2** pour leur confiance
- **Les parents** pour leur implication
- **Netlify** pour l'hébergement gratuit
- **Neon** pour la base de données

---

<div align="center">

**[⬆️ Retour en haut](#-gestionnaire-équipe-u11f2---basket)**

Fait avec ❤️ pour l'équipe de basket U11F2

[🌐 Voir l'application](https://stellisense.com) • [📚 Documentation](../../wiki) • [🐛 Reporter un bug](../../issues)

</div>
