# Feuille de Route - HoldingManager PHI Studios

## Version Actuelle : 2.0.0-beta

---

## Phase 1 : Sprint 6 - Tests & Déploiement (En cours)

### 1.1 Tests
- [x] Configuration Vitest pour tests unitaires ✅
- [x] Tests composants critiques (forms, tables, auth) ✅
- [x] Configuration Playwright pour tests E2E ✅
- [x] Tests parcours utilisateur (login, CRUD, workflows) ✅
- [ ] Couverture de code > 80%

### 1.2 Migration Données (Effectué Sprints 1-2)
- [x] Script migration MySQL → Supabase ✅
- [x] Migration utilisateurs (Supabase Auth) ✅
- [x] Validation intégrité données ✅
- [x] Tests de non-régression ✅

### 1.3 Déploiement
- [x] Configuration Vercel (variables env) ✅
  - `vercel.json` : configuration Next.js avec headers de sécurité
  - `.env.local.example` : documentation des variables requises
  - Région : `cdg1` (Paris)
- [ ] Déploiement staging
- [ ] Tests UAT (User Acceptance Testing)
- [ ] Déploiement production
- [ ] Configuration domaine personnalisé

### 1.4 Sécurité Base de Données (Pré-production)
- [x] Corriger `search_path` des fonctions PostgreSQL (11 fonctions) ✅
  - `update_updated_at_column`, `calculate_facture_ligne_totals`, `update_facture_totals`
  - `handle_new_user`, `get_user_filiales`, `user_has_filiale_access`
  - `calculate_devis_ligne_amounts`, `update_devis_totals`, `update_devis_updated_at`
  - `generate_devis_numero`, `generate_facture_numero`
  - Migration : `supabase/migrations/20260210_fix_functions_search_path.sql`
- [x] Renforcer les politiques RLS (Row Level Security) ✅
  - Remplacé `USING (true)` par des conditions basées sur les rôles
  - Implémenté l'accès par filiale selon `user_affectations`
  - Fonctions helpers : `is_admin_user()`, `user_filiale_ids()`
  - Tables sécurisées : roles, pays, services, users, filiales, employes, clients, contrats, factures, transactions, workflows, alertes, notifications
  - Migration : `supabase/migrations/20260210_fix_rls_policies.sql`
- [ ] Audit sécurité des permissions

### 1.5 Régénération Types TypeScript Supabase
- [ ] Régénérer les types avec `supabase gen types typescript`
- [ ] Intégrer les nouvelles tables :
  - `demandes_clients`, `demandes_messages`, `demandes_fichiers`, `demandes_historique`
  - `report_templates`, `report_history`
  - `notification_preferences`, `push_subscriptions`
  - `devis`, `devis_lignes`
  - `commandes_outsourcing`, `fournisseurs`
- [ ] Supprimer le workaround `createUntypedClient()` après régénération
- [ ] Mettre à jour tous les fichiers utilisant le client non typé

---

## Phase 2 : Améliorations Prioritaires

### 2.1 Génération de Documents PDF
- [x] Factures PDF avec template PHI Studios ✅
- [x] Contrats PDF avec template PHI Studios ✅
- [x] Rapports financiers mensuels/annuels ✅
- [x] Devis PDF ✅

### 2.2 Notifications Temps Réel
- [x] Supabase Realtime pour alertes ✅
- [x] Notifications push navigateur ✅
- [x] Badge compteur non-lus dans header ✅
- [x] Préférences notifications utilisateur ✅

### 2.3 Export de Données
- [x] Export Excel transactions ✅
- [x] Export Excel clients ✅
- [x] Export Excel factures ✅
- [x] Rapports personnalisés ✅

---

## Phase 3 : Portail Client ✅ (Implémenté)

### 3.1 Concept
Créer un espace dédié aux clients pour soumettre leurs demandes directement dans l'application, évitant les canaux informels (WhatsApp, appels téléphoniques) et assurant une transparence d'information en interne.

### 3.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PORTAIL CLIENT                             │
│  (Interface simplifiée accessible aux clients)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE DEMANDES                          │
│  - Nouvelle demande (formulaire)                                │
│  - Suivi de mes demandes                                        │
│  - Historique des interventions                                 │
│  - Documents partagés                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTAGE AUTOMATIQUE                          │
│  - Détection du service concerné                                │
│  - Attribution au responsable                                   │
│  - Notification équipe                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ROBOTIQUE │        │ DIGITAL  │        │OUTSOURC. │
    │  #e72572 │        │  #fcd017 │        │  #0f2080 │
    └──────────┘        └──────────┘        └──────────┘
```

### 3.3 Fonctionnalités Détaillées

#### Côté Client
- **Authentification client** : Compte séparé avec accès limité
- **Dashboard client** : Vue de ses projets en cours
- **Soumettre une demande** :
  - Sélection du service (Robotique/Digital/Outsourcing)
  - Description du besoin
  - Pièces jointes (documents, images)
  - Niveau d'urgence
  - Date souhaitée
- **Suivi des demandes** :
  - Statut en temps réel
  - Historique des échanges
  - Timeline des actions
- **Documents partagés** :
  - Accès aux livrables
  - Téléchargement des factures

#### Côté Interne (PHI Studios)
- **Réception des demandes** :
  - Notification instantanée au responsable service
  - Alerte aux employés concernés
  - Intégration dans le tableau de bord
- **Traitement** :
  - Assignation à un employé
  - Estimation délai/coût
  - Communication avec le client
- **Suivi** :
  - Tableau Kanban par service
  - Métriques de performance (temps de réponse, satisfaction)

### 3.4 Tables Supabase à Créer

```sql
-- Comptes clients (extension de la table clients)
ALTER TABLE clients ADD COLUMN email_portail VARCHAR(255);
ALTER TABLE clients ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE clients ADD COLUMN portail_actif BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN derniere_connexion_portail TIMESTAMP;

-- Demandes clients
CREATE TABLE demandes_clients (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  service_type VARCHAR(50) NOT NULL, -- 'robotique', 'digital', 'outsourcing'
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  urgence VARCHAR(20) DEFAULT 'normale', -- 'basse', 'normale', 'haute', 'urgente'
  statut VARCHAR(50) DEFAULT 'nouvelle', -- 'nouvelle', 'en_cours', 'en_attente', 'terminee', 'annulee'
  date_souhaitee DATE,
  assignee_id INTEGER REFERENCES employes(id),
  filiale_id INTEGER REFERENCES filiales(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages/échanges sur les demandes
CREATE TABLE demandes_messages (
  id SERIAL PRIMARY KEY,
  demande_id INTEGER REFERENCES demandes_clients(id),
  auteur_type VARCHAR(20) NOT NULL, -- 'client', 'employe'
  auteur_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  pieces_jointes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pièces jointes demandes
CREATE TABLE demandes_fichiers (
  id SERIAL PRIMARY KEY,
  demande_id INTEGER REFERENCES demandes_clients(id),
  nom_fichier VARCHAR(255) NOT NULL,
  type_fichier VARCHAR(100),
  taille INTEGER,
  url_stockage VARCHAR(500) NOT NULL,
  uploaded_by_type VARCHAR(20), -- 'client', 'employe'
  uploaded_by_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.5 Avantages

| Avantage | Description |
|----------|-------------|
| **Centralisation** | Toutes les demandes au même endroit |
| **Traçabilité** | Historique complet des échanges |
| **Transparence** | Client voit l'avancement en temps réel |
| **Efficacité** | Routing automatique vers le bon service |
| **Professionnalisme** | Image moderne et organisée |
| **Réduction charge** | Moins d'appels/WhatsApp à gérer |
| **Métriques** | Données sur temps de réponse, satisfaction |

### 3.6 Estimation Effort
- **Backend** : 2-3 semaines
- **Frontend Client** : 2 semaines
- **Intégration Interne** : 1 semaine
- **Tests & Documentation** : 1 semaine

---

## Phase 4 : Fonctionnalités Avancées (Long Terme)

### 4.1 Module Budgets & Prévisions
- [ ] Budgets par filiale/service/projet
- [ ] Suivi des dépenses vs budget en temps réel
- [ ] Alertes dépassement (seuils configurables : 80%, 100%)
- [ ] Rapports budgétaires mensuels/trimestriels
- [ ] Prévisions budgétaires basées sur l'historique
- [ ] Analyse des écarts budget vs réel
- [ ] Réallocation budgétaire inter-services

### 4.2 Tableau de Bord Avancé (Analytics)
- [ ] **KPIs personnalisables**
  - Création de KPIs custom par utilisateur
  - Widgets drag-and-drop
  - Sauvegarde de configurations favorites
- [ ] **Graphiques interactifs avancés**
  - Heatmaps (activité par jour/heure)
  - Funnel charts (conversion devis → facture)
  - Sankey diagrams (flux financiers)
  - Treemaps (répartition CA par service/client)
- [ ] **Comparaisons temporelles**
  - Période précédente (mois, trimestre, année)
  - Même période année précédente
  - Benchmark personnalisable
- [ ] **Prévisions & Intelligence**
  - Prédiction CA mensuel (modèle ML)
  - Détection d'anomalies (dépenses inhabituelles)
  - Scoring clients (risque d'impayé)
  - Recommandations automatiques
- [ ] **Tableaux de bord par rôle**
  - Dashboard Directeur : vue consolidée holding
  - Dashboard Responsable : focus service
  - Dashboard Comptable : focus financier
  - Dashboard Commercial : focus clients/devis

### 4.3 Gestion de Projets
- [ ] Module projets transversal (multi-services)
- [ ] Gantt chart interactif
- [ ] Suivi temps passé par projet
- [ ] Rentabilité projet en temps réel
- [ ] Jalons et livrables
- [ ] Gestion des ressources (planning employés)
- [ ] Intégration avec les demandes clients

### 4.4 CRM Avancé
- [ ] Pipeline commercial visuel (Kanban)
- [ ] Historique complet interactions client
- [ ] Scoring et segmentation clients
- [ ] Campagnes email automatisées
- [ ] Rappels et relances automatiques
- [ ] Intégration calendrier (RDV, meetings)
- [ ] Analyse satisfaction client (NPS, CSAT)

### 4.5 Intégrations Externes
- [ ] **API publique REST/GraphQL**
  - Documentation OpenAPI
  - Authentification OAuth 2.0
  - Rate limiting et quotas
- [ ] **Webhooks événements**
  - Nouvelle facture, paiement reçu
  - Changement statut demande
  - Alerte dépassement budget
- [ ] **Import/Export automatisé**
  - Import CSV/Excel en masse
  - Export planifié (quotidien, hebdomadaire)
  - Synchronisation bidirectionnelle
- [ ] **Intégration comptabilité**
  - Export vers logiciels comptables (Sage, Ciel)
  - Format FEC (Fichier des Écritures Comptables)
  - Synchronisation bancaire (Open Banking)
- [ ] **Intégrations tierces**
  - Slack/Teams (notifications)
  - Google Calendar / Outlook
  - Zapier / Make (automatisations)
  - E-signature (DocuSign, Yousign)

### 4.6 Application Mobile
- [ ] Application React Native (iOS & Android)
- [ ] Authentification biométrique
- [ ] Notifications push natives
- [ ] Mode hors-ligne avec synchronisation
- [ ] Scanner de documents (OCR factures)
- [ ] Signature électronique sur mobile
- [ ] Dashboard compact responsive

### 4.7 Gestion Documentaire (GED)
- [ ] Archivage centralisé documents
- [ ] Versioning automatique
- [ ] Recherche full-text dans les documents
- [ ] OCR automatique des documents scannés
- [ ] Workflows validation documents
- [ ] Intégration e-signature
- [ ] Conformité RGPD (rétention, suppression)

### 4.8 Ressources Humaines (RH)
- [ ] Gestion des congés et absences
- [ ] Suivi des heures travaillées
- [ ] Évaluations annuelles
- [ ] Gestion des formations
- [ ] Organigramme dynamique
- [ ] Onboarding automatisé
- [ ] Offboarding et transfert de responsabilités

### 4.9 Inventaire & Assets
- [ ] Gestion du parc matériel (équipements robotique)
- [ ] Suivi des licences logicielles
- [ ] Maintenance préventive planifiée
- [ ] QR codes pour inventaire rapide
- [ ] Alertes expiration garantie/contrat
- [ ] Amortissement automatique

### 4.10 Multi-Holding & Internationalisation
- [ ] Support multi-holding (groupe de sociétés)
- [ ] Consolidation financière inter-holdings
- [ ] Multi-devises avec conversion automatique
- [ ] Multi-langues (FR, EN, ES, PT)
- [ ] Conformité fiscale multi-pays
- [ ] Rapports consolidés groupe

---

## Changelog

### v2.0.0-beta (Actuel)
- Migration complète vers Next.js 14 + Supabase
- Modules : Filiales, Employés, Clients, Factures, Contrats, Transactions
- Services : Robotique, Digital, Outsourcing
- Workflows d'approbation
- Système d'alertes
- Administration (Utilisateurs, Paramètres)
- **Génération PDF Factures** ✅
- **Génération PDF Contrats** ✅
- **Export Excel** (Transactions, Clients, Factures) ✅
- **Notifications Temps Réel** (Supabase Realtime) ✅

### Corrections Techniques (10 février 2026)
- **Types TypeScript Supabase** : Correction des erreurs de typage pour les nouvelles tables
  - Création de `createUntypedClient()` dans `src/lib/supabase/client.ts` comme workaround
  - Tables concernées : `demandes_clients`, `report_templates`, `devis`, `fournisseurs`, etc.
  - Mise à jour de 20+ fichiers pour utiliser le client non typé
  - **Mise à jour manuelle** de `src/types/database.ts` avec les tables manquantes :
    - `report_templates`, `push_subscriptions`, `notification_preferences`
    - `user_affectations`, `budgets`, `paiements`
- **Configuration Vitest** : Correction conflit version vite/vitest avec cast `as any`
- **Build de production** : Toutes les erreurs TypeScript résolues, build réussi
- **Sécurité PostgreSQL** : Correction du `search_path` sur 11 fonctions
  - Migration : `supabase/migrations/20260210_fix_functions_search_path.sql`
- **Politiques RLS renforcées** : Accès basé sur rôles et affectations filiales
  - Migration : `supabase/migrations/20260210_fix_rls_policies.sql`
  - Fonctions helpers : `is_admin_user()`, `user_filiale_ids()`
- **Configuration Vercel** : Ajout de `vercel.json` avec headers de sécurité

### Phase 3 - Portail Client (10 février 2026)
- **Portail Client** : Espace dédié aux clients pour soumettre et suivre leurs demandes
  - `src/app/(portail)/layout.tsx` : Layout global du portail
  - `src/app/(portail)/login/page.tsx` : Authentification client séparée
  - `src/app/(portail)/(dashboard)/layout.tsx` : Layout dashboard client avec navigation
  - `src/app/(portail)/(dashboard)/page.tsx` : Tableau de bord client
  - `src/app/(portail)/(dashboard)/demandes/page.tsx` : Liste des demandes du client
  - `src/app/(portail)/(dashboard)/demandes/nouveau/page.tsx` : Formulaire de nouvelle demande
  - `src/app/(portail)/(dashboard)/demandes/[id]/page.tsx` : Détail demande avec messagerie
- **Gestion Interne des Demandes** : Interface pour les employés
  - `src/app/(dashboard)/demandes/page.tsx` : Liste toutes les demandes clients
  - `src/app/(dashboard)/demandes/[id]/page.tsx` : Gestion demande (statut, assignation, estimation)
  - Sidebar : Nouveau lien "Demandes Clients" dans la navigation
- **Base de Données** :
  - `supabase/migrations/20260210_create_portail_client.sql` : Tables demandes_clients, messages, fichiers, historique
  - `supabase/migrations/20260210_demandes_notifications.sql` : Triggers notifications automatiques
  - Extension table `clients` avec colonnes portail (email_portail, portail_user_id, portail_actif)
- **Notifications Automatiques** :
  - Notification aux responsables lors d'une nouvelle demande
  - Notification à l'employé lors de l'assignation
  - Notification au client lors du changement de statut
  - Notification bidirectionnelle sur les messages
- **Types TypeScript** : `src/types/database.ts` mis à jour avec types portail

### Améliorations Phase 2 (9 février 2026)
- **Notifications Push Navigateur** : Système complet de notifications push Web
  - `src/lib/hooks/usePushNotifications.ts` : Hook de gestion des subscriptions push
  - `src/components/notifications/PushNotificationToggle.tsx` : Toggle activation/désactivation
  - `src/app/api/push/send/route.ts` : API d'envoi de notifications push
  - `public/sw.js` : Service Worker pour réception des notifications
  - `supabase/migrations/20260209_create_push_subscriptions.sql` : Table des abonnements
  - Intégration dans le dropdown NotificationBell
- **Préférences Notifications Utilisateur** : Interface de configuration
  - `src/lib/hooks/useNotificationPreferences.ts` : Hook de gestion des préférences
  - `src/app/(dashboard)/parametres/notifications/page.tsx` : Page de configuration complète
  - `supabase/migrations/20260209_create_notification_preferences.sql` : Table des préférences
  - Paramètres : types de notifications, sévérité minimum, canaux, horaires
  - Sidebar : Nouveau menu "Paramètres" avec lien "Notifications"
- **Rapports Personnalisés** : Système de templates de rapports
  - `src/app/(dashboard)/finance/rapports/personnalises/page.tsx` : Liste des templates
  - `src/app/(dashboard)/finance/rapports/personnalises/nouveau/page.tsx` : Création de template
  - `supabase/migrations/20260209_create_custom_reports.sql` : Tables report_templates et report_history
  - Sections configurables : synthèse financière, factures, transactions, clients
  - Templates publics et privés avec partage
  - Sidebar : Lien "Rapports perso." dans le menu Finance

### Corrections & Améliorations (7 février 2026)
- **Dashboard** : Correction du cache Next.js (`force-dynamic`) pour afficher les données fraîches
- **Dashboard** : Meilleure gestion des erreurs Supabase avec valeurs par défaut
- **Dashboard** : Tendances dynamiques basées sur les données réelles (au lieu de valeurs hardcodées)
- **Header** : Intégration simplifiée du composant NotificationBell
- **PDF Factures & Contrats** : Intégration du logo officiel PHI Studios (image) au lieu du texte
- **PDF** : Nouveau utilitaire `src/lib/pdf/logo.ts` pour charger et mettre en cache le logo
- **Rapports Financiers PDF** : Nouveau module de génération de rapports financiers
  - `src/lib/pdf/rapport-pdf.ts` : Générateur de rapport PDF avec synthèse financière
  - `src/app/(dashboard)/finance/rapports/page.tsx` : Interface de configuration et génération
  - Sidebar : Ajout du lien "Rapports" dans le menu Finance
- **Module Devis** : Nouveau système complet de gestion des devis
  - `src/lib/pdf/devis-pdf.ts` : Générateur PDF avec template jaune distinctif
  - `src/app/(dashboard)/finance/devis/page.tsx` : Liste et gestion des devis
  - `src/types/database.ts` : Types `devis` et `devis_lignes` ajoutés
  - `supabase/migrations/20260207_create_devis_tables.sql` : Migration SQL avec triggers
  - Sidebar : Ajout du lien "Devis" dans le menu Finance
  - Statuts workflow : brouillon → envoyé → accepté/refusé → converti en facture

---

## Fonctionnalités Implémentées (Détail)

### Modules Core
| Module | Statut | Fichiers Clés |
|--------|--------|---------------|
| Authentification | ✅ | `src/app/(auth)/login`, `register` |
| Filiales | ✅ | `src/app/(dashboard)/filiales/*` |
| Employés | ✅ | `src/app/(dashboard)/employes/*` |
| Dashboard | ✅ | `src/app/(dashboard)/page.tsx` |

### Module Finance
| Fonctionnalité | Statut | Fichiers Clés |
|----------------|--------|---------------|
| Clients CRUD | ✅ | `src/app/(dashboard)/finance/clients/*` |
| **Devis CRUD** | ✅ | `src/app/(dashboard)/finance/devis/*` |
| **Devis PDF** | ✅ | `src/lib/pdf/devis-pdf.ts` |
| Factures CRUD | ✅ | `src/app/(dashboard)/finance/factures/*` |
| **Factures PDF** | ✅ | `src/lib/pdf/facture-pdf.ts`, `src/components/finance/DownloadFacturePDF.tsx` |
| Contrats CRUD | ✅ | `src/app/(dashboard)/finance/contrats/*` |
| **Contrats PDF** | ✅ | `src/lib/pdf/contrat-pdf.ts`, `src/components/finance/DownloadContratPDF.tsx` |
| Transactions | ✅ | `src/app/(dashboard)/finance/transactions/*` |
| **Rapports PDF** | ✅ | `src/lib/pdf/rapport-pdf.ts`, `src/app/(dashboard)/finance/rapports/*` |
| Dashboard Finance | ✅ | `src/components/finance/FinanceDashboardCharts.tsx` |
| **Export Excel** | ✅ | `src/lib/export/excel.ts`, `src/components/common/ExportButton.tsx` |

### Services PHI Studios
| Service | Couleur | Statut |
|---------|---------|--------|
| Robotique | `#E72572` | ✅ |
| Digital | `#FCD017` | ✅ |
| Outsourcing | `#0F2080` | ✅ |

### Workflows & Alertes
| Fonctionnalité | Statut | Fichiers Clés |
|----------------|--------|---------------|
| Demandes workflow | ✅ | `src/app/(dashboard)/workflows/*` |
| Approbations | ✅ | `src/lib/workflows/engine.ts` |
| Générateur alertes | ✅ | `src/lib/alertes/generator.ts` |
| **Notifications Realtime** | ✅ | `src/lib/hooks/useNotifications.ts`, `src/components/layouts/NotificationBell.tsx` |

### Portail Client
| Fonctionnalité | Statut | Fichiers Clés |
|----------------|--------|---------------|
| Authentification client | ✅ | `src/app/(portail)/login/page.tsx` |
| Dashboard client | ✅ | `src/app/(portail)/(dashboard)/page.tsx` |
| Soumission demandes | ✅ | `src/app/(portail)/(dashboard)/demandes/nouveau/page.tsx` |
| Suivi demandes | ✅ | `src/app/(portail)/(dashboard)/demandes/[id]/page.tsx` |
| Messagerie client | ✅ | Intégré dans détail demande |
| Gestion interne | ✅ | `src/app/(dashboard)/demandes/*` |
| Notifications auto | ✅ | `supabase/migrations/20260210_demandes_notifications.sql` |

### Composants UI
| Composant | Description | Fichier |
|-----------|-------------|---------|
| DataTable | Table avec tri, filtres, pagination | `src/components/common/DataTable.tsx` |
| PageHeader | En-tête de page standardisé | `src/components/common/PageHeader.tsx` |
| StatsCard | Cartes statistiques | `src/components/common/StatsCard.tsx` |
| StatusBadge | Badges de statut colorés | `src/components/common/StatusBadge.tsx` |
| Sidebar | Navigation latérale | `src/components/layouts/Sidebar.tsx` |
| Header | En-tête avec notifications | `src/components/layouts/Header.tsx` |

---

---

## Priorités de Développement

### Court Terme (Sprint 6 - 2 semaines)
1. Régénération types TypeScript Supabase
2. Correction fonctions PostgreSQL (search_path)
3. Renforcement politiques RLS
4. Déploiement staging puis production

### Moyen Terme (3-6 mois)
1. Tableau de bord avancé avec KPIs personnalisables
2. Module budgets et prévisions
3. CRM avancé (pipeline, scoring)
4. Application mobile (MVP)

### Long Terme (6-12 mois)
1. Intégrations externes (API, webhooks, comptabilité)
2. Gestion documentaire (GED)
3. Module RH complet
4. Multi-holding et internationalisation

---

*Dernière mise à jour : 10 février 2026*
*Projet : HoldingManager PHI Studios v2.0*
