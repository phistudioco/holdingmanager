# HoldingManager v2.0

**Application de gestion de holding pour PHI Studios**

> Promote Human Intelligence - Robotique | Digital | Out Sourcing

---

## Vue d'ensemble

HoldingManager est une application web moderne de gestion de holding développée pour PHI Studios. Elle permet de gérer l'ensemble des activités d'une holding multi-filiales : employés, clients, factures, contrats, workflows d'approbation et alertes.

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, React 18 |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **State** | Zustand, React Query |
| **Forms** | React Hook Form + Zod |
| **Tables** | TanStack Table |
| **Charts** | Recharts |
| **Export** | jsPDF, xlsx |

## Installation

### Prérequis

- Node.js >= 18.0.0
- npm ou yarn
- Compte Supabase

### Configuration

1. **Cloner le projet**
```bash
git clone <repository-url>
cd holdingmanager-v2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env.local` à la racine :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `npm run format` | Formate le code avec Prettier |
| `npm run type-check` | Vérifie les types TypeScript |

## Structure du projet

```
holdingmanager-v2/
├── src/
│   ├── app/                      # Routes Next.js (App Router)
│   │   ├── (auth)/               # Routes authentification
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/          # Routes protégées
│   │   │   ├── page.tsx          # Dashboard principal
│   │   │   ├── filiales/         # Gestion filiales
│   │   │   ├── employes/         # Gestion employés
│   │   │   ├── finance/          # Module finance
│   │   │   │   ├── clients/
│   │   │   │   ├── factures/
│   │   │   │   ├── contrats/
│   │   │   │   └── transactions/
│   │   │   ├── services/         # Services PHI Studios
│   │   │   │   ├── robotique/
│   │   │   │   ├── digital/
│   │   │   │   └── outsourcing/
│   │   │   ├── workflows/        # Workflows approbation
│   │   │   ├── alertes/          # Système d'alertes
│   │   │   └── admin/            # Administration
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # Composants shadcn/ui
│   │   ├── layouts/              # Sidebar, Header
│   │   ├── common/               # Composants partagés
│   │   ├── filiales/             # Composants filiales
│   │   ├── employes/             # Composants employés
│   │   └── finance/              # Composants finance
│   ├── lib/
│   │   ├── supabase/             # Clients Supabase
│   │   │   ├── client.ts         # Client navigateur
│   │   │   └── server.ts         # Client serveur
│   │   ├── auth/                 # Gestion authentification & rôles
│   │   │   ├── permissions.ts    # Définition des rôles et permissions
│   │   │   ├── useUser.ts        # Hook utilisateur
│   │   │   └── AuthContext.tsx   # Contexte d'authentification
│   │   ├── workflows/            # Moteur de workflows
│   │   ├── alertes/              # Générateur d'alertes
│   │   ├── utils.ts              # Utilitaires (cn, etc.)
│   │   └── pdf/                  # Génération PDF
│   └── types/
│       └── database.ts           # Types Supabase
├── public/                       # Assets statiques
│   ├── logo.png
│   └── logo-icon.png
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Modules

### 1. Dashboard
- Vue d'ensemble de la holding
- Statistiques principales (filiales, employés, factures)
- Actions rapides
- Alertes récentes
- Accès aux 3 services PHI Studios

### 2. Filiales
- Liste des filiales avec vue grille/liste
- Création/édition de filiale
- Informations complètes (adresse, contact, directeur)
- Statuts : Actif, Inactif, En création

### 3. Employés
- Liste des employés avec filtres
- Vue grille (cards) et vue liste (table)
- Recherche par nom, matricule, email
- Filtres par filiale et statut
- Pagination

### 4. Finance

#### Clients
- Gestion clients (Entreprise/Particulier)
- Informations légales (SIRET, TVA, etc.)
- Conditions commerciales
- Historique factures

#### Factures
- Création factures avec lignes dynamiques
- Types : Facture, Avoir, Acompte, Proforma
- Statuts : Brouillon, Envoyée, Partiellement payée, Payée, Annulée
- Génération PDF
- Gestion des paiements

#### Contrats
- Types : Service, Maintenance, Licence, Location
- Gestion des périodicités
- Reconduction automatique
- Alertes d'expiration

#### Transactions
- Revenus et dépenses
- Catégorisation
- Liaison avec factures
- Suivi du solde

### 5. Services PHI Studios

#### Robotique
- Couleur : Rose (#E72572)
- Gestion des projets d'automatisation

#### Digital
- Couleur : Jaune (#FCD017)
- Solutions logicielles

#### Out Sourcing
- Couleur : Bleu (#0F2080)
- Services externalisés

### 6. Workflows
- Demandes d'approbation multi-niveaux
- Types : Achat, Congé, Formation, Autre
- Suivi des étapes
- Historique des décisions

### 7. Alertes
- Alertes automatiques
- Niveaux de sévérité : Basse, Moyenne, Haute, Critique
- Notifications en temps réel
- Marquage lu/non-lu

## Authentification & Inscription

### Comment s'inscrire et se connecter

L'application utilise **Supabase Auth** pour l'authentification. Tous les utilisateurs se connectent via la même page `/login`.

#### Pour les nouveaux utilisateurs (Employés)

1. Accéder à `/register`
2. Remplir le formulaire (nom, prénom, email, mot de passe)
3. Confirmer l'email (si configuré dans Supabase)
4. Se connecter via `/login`
5. **Rôle par défaut** : `employe` (niveau 20)

> **Note** : Les nouveaux inscrits reçoivent automatiquement le rôle "employé" grâce au trigger Supabase.

#### Pour les administrateurs (Super Admin, Admin)

Les comptes administrateurs sont créés de deux façons :

**Option A - Promotion d'un utilisateur existant :**
```sql
-- Dans Supabase SQL Editor
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nom = 'super_admin')
WHERE email = 'admin@phistudios.com';
```

**Option B - Création directe dans Supabase :**
1. Aller dans Supabase > Authentication > Users
2. Cliquer "Add User"
3. Renseigner email et mot de passe
4. Dans la table `users`, assigner le rôle souhaité

#### Pour les directeurs et responsables

Les rôles intermédiaires sont assignés par un administrateur :

```sql
-- Promouvoir en directeur
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nom = 'directeur')
WHERE email = 'directeur@filiale.com';

-- Promouvoir en responsable
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nom = 'responsable')
WHERE email = 'responsable@service.com';
```

### Récapitulatif des accès par rôle

| Rôle | Comment obtenir ce rôle | Accès principal |
|------|------------------------|-----------------|
| **Employé** | Inscription libre via `/register` | Dashboard, Workflows, Alertes |
| **Responsable** | Assigné par un admin | + Finance, Services |
| **Directeur** | Assigné par un admin | + Filiales, Contrats, Approbations |
| **Admin** | Assigné par super_admin | + Gestion utilisateurs |
| **Super Admin** | Configuration initiale | Accès total |

### Page de connexion

Tous les utilisateurs utilisent la même page `/login` :

1. Entrer l'email
2. Entrer le mot de passe
3. Cliquer "Se connecter"

Après connexion, l'utilisateur est redirigé vers le **Dashboard** et la **sidebar s'adapte automatiquement** selon son rôle.

### Mot de passe oublié

1. Sur `/login`, cliquer "Mot de passe oublié ?"
2. Entrer l'email
3. Recevoir le lien de réinitialisation par email
4. Définir un nouveau mot de passe

---

## Gestion des Rôles & Permissions

L'application implémente un système de rôles hiérarchique pour contrôler l'accès aux fonctionnalités.

### Hiérarchie des rôles

| Rôle | Niveau | Description |
|------|--------|-------------|
| **super_admin** | 100 | Accès total à toutes les fonctionnalités |
| **admin** | 80 | Gestion utilisateurs et filiales |
| **directeur** | 60 | Gestion de sa filiale, employés, contrats, approbations |
| **responsable/manager** | 40 | Gestion de son service, clients, factures |
| **employe** | 20 | Consultation et soumission de demandes |

### Accès par rôle

| Fonctionnalité | Employé | Responsable | Directeur | Admin |
|----------------|:-------:|:-----------:|:---------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Employés (consultation) | ✅ | ✅ | ✅ | ✅ |
| Workflows | ✅ | ✅ | ✅ | ✅ |
| Alertes | ✅ | ✅ | ✅ | ✅ |
| Finance (clients, factures) | ❌ | ✅ | ✅ | ✅ |
| Services | ❌ | ✅ | ✅ | ✅ |
| Contrats | ❌ | ❌ | ✅ | ✅ |
| Filiales | ❌ | ❌ | ✅ | ✅ |
| Administration | ❌ | ❌ | ❌ | ✅ |

### Utilisation dans le code

```tsx
import { useAuth } from '@/lib/auth'
import { ProtectedRoute, AdminOnly } from '@/components/auth'

// Hook d'authentification
const { user, role, hasPermission, isAtLeast } = useAuth()

// Vérifier une permission
if (hasPermission('factures', 'create')) {
  // L'utilisateur peut créer des factures
}

// Vérifier un niveau de rôle
if (isAtLeast('directeur')) {
  // L'utilisateur est au moins directeur
}

// Protéger un composant
<ProtectedRoute requiredRole="directeur">
  <GestionContrats />
</ProtectedRoute>

// Affichage conditionnel
<AdminOnly>
  <BoutonSupprimer />
</AdminOnly>
```

### Configuration des rôles utilisateur

Pour assigner un rôle à un utilisateur dans Supabase :

```sql
-- Promouvoir un utilisateur en admin
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nom = 'admin')
WHERE email = 'utilisateur@example.com';

-- Vérifier les rôles disponibles
SELECT * FROM roles ORDER BY niveau DESC;
```

## Thème & Design

### Couleurs PHI Studios

| Variable | Couleur | Hex |
|----------|---------|-----|
| Primary | Bleu PHI | `#0F2080` |
| Accent | Rose | `#E72572` |
| Highlight | Jaune | `#FCD017` |
| Robotique | Rose | `#E72572` |
| Digital | Jaune | `#FCD017` |
| Outsourcing | Bleu | `#0F2080` |

### Polices

- **Titres** : Poppins (600, 700)
- **Corps** : Inter (400, 500, 600)

### Responsive Design

L'application est entièrement responsive avec :
- Mobile : < 640px (sm)
- Tablette : 640px - 1024px (md, lg)
- Desktop : > 1024px (xl)

Fonctionnalités responsive :
- Sidebar drawer sur mobile
- Tables avec scroll horizontal
- Grids adaptatifs
- Formulaires responsives

## Base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `roles` | Rôles utilisateurs (super_admin, admin, directeur, etc.) |
| `users` | Utilisateurs de l'application (liés à Supabase Auth) |
| `user_affectations` | Affectations utilisateurs aux filiales/services |
| `filiales` | Entités de la holding |
| `employes` | Personnel |
| `clients` | Clients (entreprises/particuliers) |
| `factures` | Documents de facturation |
| `facture_lignes` | Lignes de factures |
| `contrats` | Contrats clients |
| `transactions` | Mouvements financiers |
| `workflow_types` | Configuration des types de workflows |
| `workflow_demandes` | Demandes d'approbation |
| `workflow_approbations` | Étapes d'approbation |
| `alertes` | Alertes système |
| `notifications` | Notifications personnelles utilisateurs |
| `services` | Services PHI Studios |
| `pays` | Référentiel pays (180+ pays) |

### Migrations SQL

Les fichiers de migration se trouvent dans `supabase/migrations/` :

| Fichier | Description |
|---------|-------------|
| `000_complete_schema.sql` | Schéma complet de la base de données |
| `001_auth_trigger.sql` | Trigger création automatique profil utilisateur |

## Déploiement

### Vercel (recommandé)

1. Connecter le repository à Vercel
2. Configurer les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Déployer

### Docker (optionnel)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Roadmap

### Complété
- [x] Sprint 1 : Fondations & Infrastructure
- [x] Sprint 2 : Authentification & Modules Core
- [x] Sprint 3 : Module Finance - Partie 1
- [x] Sprint 4 : Module Finance - Partie 2 & Services
- [x] Corrections responsive design
- [x] Sprint 5 : Workflows & Alertes
- [x] Système de rôles et permissions (RBAC)
- [x] Sidebar adaptative selon le rôle
- [x] Trigger création automatique profil utilisateur

### En cours
- [ ] Sprint 6 : Tests, Migration & Déploiement

### À venir
- [ ] Real-time notifications (Supabase Realtime)
- [ ] Export Excel avancé
- [ ] Mode sombre
- [ ] Filtrage des données par filiale selon affectation

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## Licence

Propriétaire - PHI Studios © 2024-2026

---

**Développé avec Claude Code pour PHI Studios**
