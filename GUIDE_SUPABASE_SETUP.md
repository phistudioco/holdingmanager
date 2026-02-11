# Guide de Configuration Supabase
## HoldingManager PHI Studios

---

## Étape 1 : Créer un Compte Supabase

1. Allez sur **[supabase.com](https://supabase.com)**
2. Cliquez sur **"Start your project"** (bouton vert)
3. Connectez-vous avec :
   - **GitHub** (recommandé)
   - Google
   - ou Email/Password

---

## Étape 2 : Créer un Nouveau Projet

1. Une fois connecté, cliquez sur **"New Project"**

2. Remplissez les informations :

   | Champ | Valeur |
   |-------|--------|
   | **Organization** | Sélectionnez ou créez une organisation |
   | **Project name** | `holdingmanager-phistudios` |
   | **Database Password** | Générez un mot de passe fort (notez-le !) |
   | **Region** | `West EU (Ireland)` ou la région la plus proche |
   | **Pricing Plan** | Free (pour commencer) |

3. Cliquez sur **"Create new project"**

4. **Attendez 2-3 minutes** que le projet soit provisionné

---

## Étape 3 : Récupérer les Clés API

Une fois le projet créé :

1. Dans le menu de gauche, cliquez sur **⚙️ Settings** (roue dentée)

2. Puis cliquez sur **"API"** dans le sous-menu

3. Vous verrez 3 informations importantes :

### 3.1 Project URL
```
https://xxxxxxxxxx.supabase.co
```
➡️ Copiez cette URL

### 3.2 Anon/Public Key (anon key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh...
```
➡️ C'est la clé **publique** - peut être exposée côté client

### 3.3 Service Role Key (secret)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh...
```
⚠️ C'est la clé **secrète** - NE JAMAIS exposer côté client !

---

## Étape 4 : Configurer le Fichier .env.local

1. Dans le dossier `holdingmanager-v2`, copiez le fichier exemple :

```bash
copy .env.local.example .env.local
```

2. Ouvrez `.env.local` et remplissez les valeurs :

```env
# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuration Application
NEXT_PUBLIC_APP_NAME="HoldingManager"
NEXT_PUBLIC_APP_VERSION="2.0.0"
NEXT_PUBLIC_COMPANY_NAME="PHI Studios"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Étape 5 : Configurer l'Authentification

1. Dans Supabase, allez dans **Authentication** (menu gauche)

2. Cliquez sur **"Providers"**

3. Vérifiez que **Email** est activé (par défaut)

4. Allez dans **"URL Configuration"** :

   | Champ | Valeur |
   |-------|--------|
   | Site URL | `http://localhost:3000` |
   | Redirect URLs | `http://localhost:3000/**` |

5. Cliquez sur **"Save"**

---

## Étape 6 : Créer les Tables de Base

1. Dans Supabase, allez dans **SQL Editor** (menu gauche)

2. Cliquez sur **"New query"**

3. Copiez et exécutez le script SQL suivant :

```sql
-- ============================================================
-- TABLES DE RÉFÉRENCE
-- ============================================================

-- Table des pays
CREATE TABLE IF NOT EXISTS pays (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des services PHI Studios
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    couleur VARCHAR(7) NOT NULL DEFAULT '#6b7280',
    icone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::JSONB,
    niveau INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLES PRINCIPALES
-- ============================================================

-- Table des filiales
CREATE TABLE IF NOT EXISTS filiales (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays_id INTEGER REFERENCES pays(id),
    telephone VARCHAR(20),
    email VARCHAR(100),
    site_web VARCHAR(200),
    directeur_nom VARCHAR(100),
    directeur_email VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'en_creation')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INTEGER REFERENCES roles(id) DEFAULT 1,
    avatar TEXT,
    telephone VARCHAR(20),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    derniere_connexion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des affectations utilisateur-filiale
CREATE TABLE IF NOT EXISTS user_affectations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filiale_id INTEGER REFERENCES filiales(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    role_specifique_id INTEGER REFERENCES roles(id),
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    est_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, filiale_id)
);

-- Table des employés
CREATE TABLE IF NOT EXISTS employes (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id),
    service_id INTEGER REFERENCES services(id),
    matricule VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    date_naissance DATE,
    adresse TEXT,
    poste VARCHAR(100),
    date_embauche DATE NOT NULL,
    date_depart DATE,
    salaire DECIMAL(12, 2),
    photo TEXT,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'en_conge', 'suspendu', 'sorti')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLES FINANCE
-- ============================================================

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('entreprise', 'particulier')),
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays_id INTEGER REFERENCES pays(id),
    siret VARCHAR(20),
    tva_intracommunautaire VARCHAR(20),
    forme_juridique VARCHAR(50),
    delai_paiement INTEGER DEFAULT 30,
    mode_reglement_prefere VARCHAR(50),
    limite_credit DECIMAL(12, 2),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('prospect', 'actif', 'inactif', 'suspendu')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    contrat_id INTEGER,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'facture' CHECK (type IN ('facture', 'avoir', 'acompte', 'proforma')),
    date_emission DATE NOT NULL,
    date_echeance DATE NOT NULL,
    objet TEXT,
    total_ht DECIMAL(12, 2) DEFAULT 0,
    taux_tva DECIMAL(5, 2) DEFAULT 20.00,
    total_tva DECIMAL(12, 2) DEFAULT 0,
    total_ttc DECIMAL(12, 2) DEFAULT 0,
    montant_paye DECIMAL(12, 2) DEFAULT 0,
    statut VARCHAR(30) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'partiellement_payee', 'payee', 'annulee')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des lignes de facture
CREATE TABLE IF NOT EXISTS facture_lignes (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    ordre INTEGER DEFAULT 1,
    description TEXT NOT NULL,
    quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire DECIMAL(12, 2) NOT NULL,
    taux_tva DECIMAL(5, 2) DEFAULT 20.00,
    montant_ht DECIMAL(12, 2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    montant_tva DECIMAL(12, 2) GENERATED ALWAYS AS (quantite * prix_unitaire * taux_tva / 100) STORED,
    montant_ttc DECIMAL(12, 2) GENERATED ALWAYS AS (quantite * prix_unitaire * (1 + taux_tva / 100)) STORED
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    lien TEXT,
    lue BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Insérer les services PHI Studios
INSERT INTO services (nom, description, couleur) VALUES
    ('Robotique', 'Automatisation et solutions robotiques', '#e72572'),
    ('Digital', 'Développement logiciel et plateformes', '#fcd017'),
    ('Out Sourcing', 'Services d''externalisation', '#0f2080')
ON CONFLICT (nom) DO NOTHING;

-- Insérer les rôles de base
INSERT INTO roles (nom, description, permissions, niveau) VALUES
    ('employe', 'Employé standard', '["read:own"]', 1),
    ('responsable', 'Responsable de service', '["read:service", "write:service"]', 2),
    ('directeur', 'Directeur de filiale', '["read:filiale", "write:filiale", "approve:level1"]', 3),
    ('super_admin', 'Super administrateur', '["*"]', 10)
ON CONFLICT (nom) DO NOTHING;

-- Insérer quelques pays
INSERT INTO pays (code, nom) VALUES
    ('FR', 'France'),
    ('TN', 'Tunisie'),
    ('DE', 'Allemagne'),
    ('BE', 'Belgique'),
    ('CH', 'Suisse'),
    ('MA', 'Maroc'),
    ('US', 'États-Unis')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- INDEX POUR PERFORMANCES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employes_filiale ON employes(filiale_id);
CREATE INDEX IF NOT EXISTS idx_employes_service ON employes(service_id);
CREATE INDEX IF NOT EXISTS idx_employes_statut ON employes(statut);
CREATE INDEX IF NOT EXISTS idx_clients_filiale ON clients(filiale_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, lue);

-- ============================================================
-- TRIGGERS POUR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_filiales_updated_at BEFORE UPDATE ON filiales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_employes_updated_at BEFORE UPDATE ON employes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_factures_updated_at BEFORE UPDATE ON factures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

4. Cliquez sur **"Run"** (ou Ctrl+Enter)

5. Vérifiez que tout s'est bien passé (message "Success")

---

## Étape 7 : Activer Row Level Security (RLS)

1. Toujours dans **SQL Editor**, exécutez :

```sql
-- Activer RLS sur les tables principales
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE filiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour users : voir son propre profil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Politique pour notifications : voir ses propres notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique temporaire pour les autres tables (à affiner plus tard)
-- Permet aux utilisateurs authentifiés de lire
CREATE POLICY "Authenticated users can read filiales" ON filiales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read employes" ON employes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read clients" ON clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read factures" ON factures
    FOR SELECT TO authenticated USING (true);
```

---

## Étape 8 : Créer un Utilisateur de Test

1. Dans Supabase, allez dans **Authentication** > **Users**

2. Cliquez sur **"Add user"** > **"Create new user"**

3. Remplissez :

   | Champ | Valeur |
   |-------|--------|
   | Email | `admin@phistudios.com` |
   | Password | `Admin123!` (changez-le !) |
   | Auto Confirm User | ✅ Coché |

4. Cliquez sur **"Create user"**

5. Notez l'**UUID** de l'utilisateur créé

6. Dans **SQL Editor**, insérez le profil :

```sql
-- Remplacez 'UUID_DE_L_UTILISATEUR' par l'UUID copié
INSERT INTO users (id, nom, prenom, email, role_id, statut)
VALUES (
    'UUID_DE_L_UTILISATEUR',
    'Admin',
    'PHI Studios',
    'admin@phistudios.com',
    (SELECT id FROM roles WHERE nom = 'super_admin'),
    'actif'
);
```

---

## Étape 9 : Tester la Configuration

1. Dans le terminal, lancez le projet :

```bash
cd holdingmanager-v2
npm run dev
```

2. Ouvrez **http://localhost:3000**

3. Vous devriez voir la page d'accueil PHI Studios

---

## Vérification Finale

### ✅ Checklist

- [ ] Projet Supabase créé
- [ ] Clés API récupérées
- [ ] Fichier `.env.local` configuré
- [ ] Tables créées dans Supabase
- [ ] RLS activé
- [ ] Utilisateur de test créé
- [ ] Application démarre sans erreur

### 🔗 Liens Utiles

| Ressource | URL |
|-----------|-----|
| Dashboard Supabase | https://supabase.com/dashboard |
| Documentation | https://supabase.com/docs |
| Référence API | https://supabase.com/docs/reference |

---

## Dépannage

### Erreur "Invalid API key"
→ Vérifiez que les clés dans `.env.local` sont correctes (pas d'espaces)

### Erreur "relation does not exist"
→ Les tables n'ont pas été créées. Réexécutez le script SQL.

### Erreur CORS
→ Vérifiez que l'URL du site est bien configurée dans Authentication > URL Configuration

---

*Guide créé pour HoldingManager PHI Studios v2.0*
