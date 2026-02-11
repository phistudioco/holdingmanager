-- ============================================================
-- MIGRATION COMPLÈTE: HoldingManager PHI Studios
-- Toutes les tables de l'application
-- ============================================================
-- Ordre d'exécution respectant les dépendances FK
-- ============================================================

-- ============================================================
-- 1. TABLES DE RÉFÉRENCE (sans dépendances)
-- ============================================================

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    niveau INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: pays
CREATE TABLE IF NOT EXISTS pays (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: services (PHI Studios: Robotique, Digital, OutSourcing)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) NOT NULL DEFAULT '#0F2080',
    icone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. TABLES CORE
-- ============================================================

-- Table: users (liée à Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    avatar TEXT,
    telephone VARCHAR(20),
    statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    derniere_connexion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: filiales
CREATE TABLE IF NOT EXISTS filiales (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays_id INTEGER REFERENCES pays(id),
    telephone VARCHAR(20),
    email VARCHAR(255),
    site_web VARCHAR(255),
    directeur_nom VARCHAR(200),
    directeur_email VARCHAR(255),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_creation' CHECK (statut IN ('actif', 'inactif', 'en_creation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: employes
CREATE TABLE IF NOT EXISTS employes (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    matricule VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    date_naissance DATE,
    adresse TEXT,
    poste VARCHAR(100),
    date_embauche DATE NOT NULL,
    date_depart DATE,
    salaire DECIMAL(15, 2),
    photo TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'en_conge', 'suspendu', 'sorti')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. TABLES FINANCE
-- ============================================================

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entreprise', 'particulier')),
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
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
    limite_credit DECIMAL(15, 2),
    statut VARCHAR(20) NOT NULL DEFAULT 'prospect' CHECK (statut IN ('prospect', 'actif', 'inactif', 'suspendu')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: contrats
CREATE TABLE IF NOT EXISTS contrats (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    numero VARCHAR(50) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (type IN ('service', 'maintenance', 'licence', 'location', 'autre')),
    date_debut DATE NOT NULL,
    date_fin DATE,
    montant DECIMAL(15, 2) NOT NULL,
    periodicite VARCHAR(20) NOT NULL DEFAULT 'mensuel' CHECK (periodicite IN ('mensuel', 'trimestriel', 'semestriel', 'annuel', 'ponctuel')),
    reconduction_auto BOOLEAN DEFAULT FALSE,
    statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'actif', 'suspendu', 'termine', 'resilie')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: factures
CREATE TABLE IF NOT EXISTS factures (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contrat_id INTEGER REFERENCES contrats(id),
    numero VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'facture' CHECK (type IN ('facture', 'avoir', 'acompte', 'proforma')),
    date_emission DATE NOT NULL,
    date_echeance DATE NOT NULL,
    objet TEXT,
    total_ht DECIMAL(15, 2) NOT NULL DEFAULT 0,
    taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20,
    total_tva DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_ttc DECIMAL(15, 2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(15, 2) NOT NULL DEFAULT 0,
    statut VARCHAR(25) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'partiellement_payee', 'payee', 'annulee')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: facture_lignes
CREATE TABLE IF NOT EXISTS facture_lignes (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15, 2) NOT NULL,
    taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20,
    montant_ht DECIMAL(15, 2) NOT NULL DEFAULT 0,
    montant_tva DECIMAL(15, 2) NOT NULL DEFAULT 0,
    montant_ttc DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('revenu', 'depense')),
    categorie VARCHAR(100) NOT NULL,
    montant DECIMAL(15, 2) NOT NULL,
    date_transaction DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    client_id INTEGER REFERENCES clients(id),
    facture_id INTEGER REFERENCES factures(id),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'annulee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. TABLES WORKFLOWS
-- ============================================================

-- Table: workflow_types (optionnel - pour configuration avancée)
CREATE TABLE IF NOT EXISTS workflow_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    icone VARCHAR(50),
    couleur VARCHAR(7) DEFAULT '#0F2080',
    etapes JSONB DEFAULT '[]',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: workflow_demandes
CREATE TABLE IF NOT EXISTS workflow_demandes (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('achat', 'conge', 'formation', 'autre')),
    demandeur_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    donnees JSONB DEFAULT '{}',
    montant DECIMAL(15, 2),
    statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_cours', 'approuve', 'rejete', 'annule')),
    etape_actuelle INTEGER DEFAULT 0,
    priorite VARCHAR(20) NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_soumission TIMESTAMP WITH TIME ZONE,
    date_finalisation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: workflow_approbations
CREATE TABLE IF NOT EXISTS workflow_approbations (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER NOT NULL REFERENCES workflow_demandes(id) ON DELETE CASCADE,
    etape INTEGER NOT NULL,
    approbateur_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'rejete')),
    commentaire TEXT,
    date_decision TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. TABLES ALERTES & NOTIFICATIONS
-- ============================================================

-- Table: alertes
CREATE TABLE IF NOT EXISTS alertes (
    id SERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL CHECK (type IN ('facture_impayee', 'facture_echeance', 'contrat_expiration', 'budget_depasse', 'workflow', 'autre')),
    severite VARCHAR(20) NOT NULL DEFAULT 'moyenne' CHECK (severite IN ('basse', 'moyenne', 'haute', 'critique')),
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entite_type VARCHAR(50),
    entite_id INTEGER,
    lue BOOLEAN DEFAULT FALSE,
    traitee BOOLEAN DEFAULT FALSE,
    date_echeance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: notifications (notifications personnelles pour utilisateurs)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien TEXT,
    lue BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. INDEX POUR PERFORMANCES
-- ============================================================

-- Index filiales
CREATE INDEX IF NOT EXISTS idx_filiales_statut ON filiales(statut);

-- Index employes
CREATE INDEX IF NOT EXISTS idx_employes_filiale ON employes(filiale_id);
CREATE INDEX IF NOT EXISTS idx_employes_service ON employes(service_id);
CREATE INDEX IF NOT EXISTS idx_employes_statut ON employes(statut);

-- Index clients
CREATE INDEX IF NOT EXISTS idx_clients_filiale ON clients(filiale_id);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);

-- Index factures
CREATE INDEX IF NOT EXISTS idx_factures_filiale ON factures(filiale_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date_echeance ON factures(date_echeance);

-- Index contrats
CREATE INDEX IF NOT EXISTS idx_contrats_filiale ON contrats(filiale_id);
CREATE INDEX IF NOT EXISTS idx_contrats_client ON contrats(client_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats(statut);
CREATE INDEX IF NOT EXISTS idx_contrats_date_fin ON contrats(date_fin);

-- Index transactions
CREATE INDEX IF NOT EXISTS idx_transactions_filiale ON transactions(filiale_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date_transaction);

-- Index workflow_demandes
CREATE INDEX IF NOT EXISTS idx_workflow_demandes_statut ON workflow_demandes(statut);
CREATE INDEX IF NOT EXISTS idx_workflow_demandes_type ON workflow_demandes(type);
CREATE INDEX IF NOT EXISTS idx_workflow_demandes_demandeur ON workflow_demandes(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_workflow_demandes_filiale ON workflow_demandes(filiale_id);

-- Index workflow_approbations
CREATE INDEX IF NOT EXISTS idx_workflow_approbations_demande ON workflow_approbations(demande_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approbations_approbateur ON workflow_approbations(approbateur_id);

-- Index alertes
CREATE INDEX IF NOT EXISTS idx_alertes_type ON alertes(type);
CREATE INDEX IF NOT EXISTS idx_alertes_severite ON alertes(severite);
CREATE INDEX IF NOT EXISTS idx_alertes_lue ON alertes(lue);
CREATE INDEX IF NOT EXISTS idx_alertes_traitee ON alertes(traitee);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lue ON notifications(lue);

-- ============================================================
-- 7. TRIGGER: Mise à jour automatique de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer aux tables avec updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- 8. TRIGGER: Calcul automatique des totaux facture
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_facture_ligne_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.montant_ht := NEW.quantite * NEW.prix_unitaire;
    NEW.montant_tva := NEW.montant_ht * (NEW.taux_tva / 100);
    NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS calculate_ligne_totals ON facture_lignes;
CREATE TRIGGER calculate_ligne_totals
    BEFORE INSERT OR UPDATE ON facture_lignes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_facture_ligne_totals();

-- Trigger pour mettre à jour les totaux de la facture
CREATE OR REPLACE FUNCTION update_facture_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_total_ht DECIMAL(15, 2);
    new_total_tva DECIMAL(15, 2);
    new_total_ttc DECIMAL(15, 2);
    facture_record factures%ROWTYPE;
BEGIN
    -- Déterminer l'ID de la facture à mettre à jour
    IF TG_OP = 'DELETE' THEN
        SELECT COALESCE(SUM(montant_ht), 0), COALESCE(SUM(montant_tva), 0), COALESCE(SUM(montant_ttc), 0)
        INTO new_total_ht, new_total_tva, new_total_ttc
        FROM facture_lignes
        WHERE facture_id = OLD.facture_id;

        UPDATE factures
        SET total_ht = new_total_ht,
            total_tva = new_total_tva,
            total_ttc = new_total_ttc
        WHERE id = OLD.facture_id;
    ELSE
        SELECT COALESCE(SUM(montant_ht), 0), COALESCE(SUM(montant_tva), 0), COALESCE(SUM(montant_ttc), 0)
        INTO new_total_ht, new_total_tva, new_total_ttc
        FROM facture_lignes
        WHERE facture_id = NEW.facture_id;

        UPDATE factures
        SET total_ht = new_total_ht,
            total_tva = new_total_tva,
            total_ttc = new_total_ttc
        WHERE id = NEW.facture_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_facture_on_ligne_change ON facture_lignes;
CREATE TRIGGER update_facture_on_ligne_change
    AFTER INSERT OR UPDATE OR DELETE ON facture_lignes
    FOR EACH ROW
    EXECUTE FUNCTION update_facture_totals();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pays ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE filiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approbations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques permissives pour utilisateurs authentifiés
-- (À affiner selon vos besoins de sécurité)

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
        -- Politique SELECT
        EXECUTE format('
            DROP POLICY IF EXISTS "%I_select_policy" ON %I;
            CREATE POLICY "%I_select_policy" ON %I FOR SELECT TO authenticated USING (true);
        ', t, t, t, t);

        -- Politique INSERT
        EXECUTE format('
            DROP POLICY IF EXISTS "%I_insert_policy" ON %I;
            CREATE POLICY "%I_insert_policy" ON %I FOR INSERT TO authenticated WITH CHECK (true);
        ', t, t, t, t);

        -- Politique UPDATE
        EXECUTE format('
            DROP POLICY IF EXISTS "%I_update_policy" ON %I;
            CREATE POLICY "%I_update_policy" ON %I FOR UPDATE TO authenticated USING (true);
        ', t, t, t, t);

        -- Politique DELETE
        EXECUTE format('
            DROP POLICY IF EXISTS "%I_delete_policy" ON %I;
            CREATE POLICY "%I_delete_policy" ON %I FOR DELETE TO authenticated USING (true);
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- 10. DONNÉES DE RÉFÉRENCE
-- ============================================================

-- Rôles par défaut
INSERT INTO roles (nom, description, niveau, permissions) VALUES
    ('super_admin', 'Super Administrateur - Accès total', 100, '{"all": true}'),
    ('admin', 'Administrateur', 80, '{"manage_users": true, "manage_filiales": true}'),
    ('directeur', 'Directeur de filiale', 60, '{"manage_employes": true, "approve_workflows": true}'),
    ('manager', 'Manager / Chef de service', 40, '{"manage_team": true}'),
    ('employe', 'Employé standard', 20, '{"view": true}')
ON CONFLICT (nom) DO NOTHING;

-- Services PHI Studios
INSERT INTO services (nom, description, couleur) VALUES
    ('Robotique', 'Automatisation et robotique intelligente', '#E72572'),
    ('Digital', 'Solutions logicielles et digitales', '#FCD017'),
    ('OutSourcing', 'Services externalisés', '#0F2080')
ON CONFLICT DO NOTHING;

-- Liste complète des pays
INSERT INTO pays (code, nom) VALUES
    -- Europe Occidentale
    ('FR', 'France'),
    ('BE', 'Belgique'),
    ('CH', 'Suisse'),
    ('LU', 'Luxembourg'),
    ('DE', 'Allemagne'),
    ('ES', 'Espagne'),
    ('PT', 'Portugal'),
    ('IT', 'Italie'),
    ('GB', 'Royaume-Uni'),
    ('IE', 'Irlande'),
    ('NL', 'Pays-Bas'),
    ('AT', 'Autriche'),
    ('MC', 'Monaco'),
    ('AD', 'Andorre'),
    ('SM', 'Saint-Marin'),
    ('VA', 'Vatican'),
    ('LI', 'Liechtenstein'),
    ('MT', 'Malte'),

    -- Europe du Nord
    ('DK', 'Danemark'),
    ('SE', 'Suède'),
    ('NO', 'Norvège'),
    ('FI', 'Finlande'),
    ('IS', 'Islande'),
    ('EE', 'Estonie'),
    ('LV', 'Lettonie'),
    ('LT', 'Lituanie'),

    -- Europe Centrale et de l''Est
    ('PL', 'Pologne'),
    ('CZ', 'République Tchèque'),
    ('SK', 'Slovaquie'),
    ('HU', 'Hongrie'),
    ('RO', 'Roumanie'),
    ('BG', 'Bulgarie'),
    ('GR', 'Grèce'),
    ('CY', 'Chypre'),
    ('HR', 'Croatie'),
    ('SI', 'Slovénie'),
    ('RS', 'Serbie'),
    ('BA', 'Bosnie-Herzégovine'),
    ('ME', 'Monténégro'),
    ('MK', 'Macédoine du Nord'),
    ('AL', 'Albanie'),
    ('XK', 'Kosovo'),
    ('BY', 'Biélorussie'),
    ('UA', 'Ukraine'),
    ('MD', 'Moldavie'),
    ('RU', 'Russie'),

    -- Amérique du Nord
    ('US', 'États-Unis'),
    ('CA', 'Canada'),
    ('MX', 'Mexique'),

    -- Amérique Centrale et Caraïbes
    ('GT', 'Guatemala'),
    ('BZ', 'Belize'),
    ('HN', 'Honduras'),
    ('SV', 'Salvador'),
    ('NI', 'Nicaragua'),
    ('CR', 'Costa Rica'),
    ('PA', 'Panama'),
    ('CU', 'Cuba'),
    ('JM', 'Jamaïque'),
    ('HT', 'Haïti'),
    ('DO', 'République Dominicaine'),
    ('PR', 'Porto Rico'),
    ('TT', 'Trinité-et-Tobago'),
    ('BB', 'Barbade'),
    ('BS', 'Bahamas'),

    -- Amérique du Sud
    ('BR', 'Brésil'),
    ('AR', 'Argentine'),
    ('CL', 'Chili'),
    ('CO', 'Colombie'),
    ('PE', 'Pérou'),
    ('VE', 'Venezuela'),
    ('EC', 'Équateur'),
    ('BO', 'Bolivie'),
    ('PY', 'Paraguay'),
    ('UY', 'Uruguay'),
    ('GY', 'Guyana'),
    ('SR', 'Suriname'),
    ('GF', 'Guyane Française'),

    -- Afrique du Nord
    ('MA', 'Maroc'),
    ('DZ', 'Algérie'),
    ('TN', 'Tunisie'),
    ('LY', 'Libye'),
    ('EG', 'Égypte'),
    ('MR', 'Mauritanie'),

    -- Afrique de l''Ouest
    ('SN', 'Sénégal'),
    ('CI', 'Côte d''Ivoire'),
    ('ML', 'Mali'),
    ('BF', 'Burkina Faso'),
    ('NE', 'Niger'),
    ('BJ', 'Bénin'),
    ('TG', 'Togo'),
    ('GH', 'Ghana'),
    ('NG', 'Nigeria'),
    ('GN', 'Guinée'),
    ('GW', 'Guinée-Bissau'),
    ('LR', 'Liberia'),
    ('SL', 'Sierra Leone'),
    ('CV', 'Cap-Vert'),

    -- Afrique Centrale
    ('CM', 'Cameroun'),
    ('GA', 'Gabon'),
    ('CG', 'République du Congo'),
    ('CD', 'République Démocratique du Congo'),
    ('GQ', 'Guinée Équatoriale'),
    ('CF', 'République Centrafricaine'),
    ('TD', 'Tchad'),
    ('AO', 'Angola'),

    -- Afrique de l''Est
    ('KE', 'Kenya'),
    ('TZ', 'Tanzanie'),
    ('UG', 'Ouganda'),
    ('RW', 'Rwanda'),
    ('BI', 'Burundi'),
    ('ET', 'Éthiopie'),
    ('SO', 'Somalie'),
    ('DJ', 'Djibouti'),
    ('ER', 'Érythrée'),
    ('SD', 'Soudan'),
    ('SS', 'Soudan du Sud'),

    -- Afrique Australe
    ('ZA', 'Afrique du Sud'),
    ('ZW', 'Zimbabwe'),
    ('ZM', 'Zambie'),
    ('BW', 'Botswana'),
    ('NA', 'Namibie'),
    ('MZ', 'Mozambique'),
    ('MW', 'Malawi'),
    ('MG', 'Madagascar'),
    ('MU', 'Maurice'),
    ('SC', 'Seychelles'),

    -- Moyen-Orient
    ('TR', 'Turquie'),
    ('IR', 'Iran'),
    ('IQ', 'Irak'),
    ('SY', 'Syrie'),
    ('LB', 'Liban'),
    ('JO', 'Jordanie'),
    ('IL', 'Israël'),
    ('PS', 'Palestine'),
    ('SA', 'Arabie Saoudite'),
    ('AE', 'Émirats Arabes Unis'),
    ('QA', 'Qatar'),
    ('KW', 'Koweït'),
    ('BH', 'Bahreïn'),
    ('OM', 'Oman'),
    ('YE', 'Yémen'),
    ('GE', 'Géorgie'),
    ('AM', 'Arménie'),
    ('AZ', 'Azerbaïdjan'),

    -- Asie Centrale
    ('KZ', 'Kazakhstan'),
    ('UZ', 'Ouzbékistan'),
    ('TM', 'Turkménistan'),
    ('TJ', 'Tadjikistan'),
    ('KG', 'Kirghizistan'),
    ('AF', 'Afghanistan'),

    -- Asie du Sud
    ('IN', 'Inde'),
    ('PK', 'Pakistan'),
    ('BD', 'Bangladesh'),
    ('LK', 'Sri Lanka'),
    ('NP', 'Népal'),
    ('BT', 'Bhoutan'),

    -- Asie du Sud-Est
    ('MM', 'Myanmar'),
    ('TH', 'Thaïlande'),
    ('VN', 'Vietnam'),
    ('LA', 'Laos'),
    ('KH', 'Cambodge'),
    ('MY', 'Malaisie'),
    ('SG', 'Singapour'),
    ('ID', 'Indonésie'),
    ('PH', 'Philippines'),
    ('BN', 'Brunei'),
    ('TL', 'Timor Oriental'),

    -- Asie de l''Est
    ('CN', 'Chine'),
    ('JP', 'Japon'),
    ('KR', 'Corée du Sud'),
    ('KP', 'Corée du Nord'),
    ('MN', 'Mongolie'),

    -- Océanie
    ('AU', 'Australie'),
    ('NZ', 'Nouvelle-Zélande'),
    ('FJ', 'Fidji'),
    ('PG', 'Papouasie-Nouvelle-Guinée'),
    ('NC', 'Nouvelle-Calédonie'),
    ('PF', 'Polynésie Française'),

    -- Territoires français d''outre-mer
    ('GP', 'Guadeloupe'),
    ('MQ', 'Martinique'),
    ('RE', 'La Réunion'),
    ('YT', 'Mayotte')
ON CONFLICT (code) DO NOTHING;

-- Types de workflow
INSERT INTO workflow_types (code, nom, description, couleur, etapes) VALUES
    ('achat', 'Demande d''achat', 'Demande d''approbation pour un achat', '#3B82F6', '[{"ordre": 1, "nom": "Validation Chef Service", "role": "chef_service"}, {"ordre": 2, "nom": "Validation Direction", "role": "directeur"}]'),
    ('conge', 'Demande de congé', 'Demande de congé ou absence', '#22C55E', '[{"ordre": 1, "nom": "Validation Responsable", "role": "responsable"}]'),
    ('formation', 'Demande de formation', 'Demande de formation professionnelle', '#A855F7', '[{"ordre": 1, "nom": "Validation RH", "role": "rh"}, {"ordre": 2, "nom": "Validation Direction", "role": "directeur"}]'),
    ('autre', 'Autre demande', 'Demande générale', '#6B7280', '[{"ordre": 1, "nom": "Validation", "role": "responsable"}]')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================================

COMMENT ON TABLE roles IS 'Rôles utilisateurs avec permissions';
COMMENT ON TABLE pays IS 'Référentiel des pays';
COMMENT ON TABLE services IS 'Services PHI Studios (Robotique, Digital, OutSourcing)';
COMMENT ON TABLE users IS 'Utilisateurs de l''application (liés à Supabase Auth)';
COMMENT ON TABLE filiales IS 'Entités/filiales de la holding';
COMMENT ON TABLE employes IS 'Personnel des filiales';
COMMENT ON TABLE clients IS 'Clients (entreprises ou particuliers)';
COMMENT ON TABLE contrats IS 'Contrats clients';
COMMENT ON TABLE factures IS 'Documents de facturation';
COMMENT ON TABLE facture_lignes IS 'Lignes de factures';
COMMENT ON TABLE transactions IS 'Mouvements financiers (revenus/dépenses)';
COMMENT ON TABLE workflow_types IS 'Configuration des types de workflows';
COMMENT ON TABLE workflow_demandes IS 'Demandes de workflow';
COMMENT ON TABLE workflow_approbations IS 'Historique des approbations';
COMMENT ON TABLE alertes IS 'Alertes système automatiques';
COMMENT ON TABLE notifications IS 'Notifications personnelles utilisateurs';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
