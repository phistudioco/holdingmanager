-- ============================================================
-- MIGRATION: Tables OutSourcing
-- Module: Service Out Sourcing PHI Studios
-- ============================================================

-- ============================================================
-- Table: fournisseurs
-- ============================================================

CREATE TABLE IF NOT EXISTS fournisseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'materiel' CHECK (type IN ('materiel', 'service', 'logistique', 'autre')),
    contact_nom VARCHAR(200),
    contact_email VARCHAR(255),
    contact_telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays VARCHAR(100) DEFAULT 'France',
    statut VARCHAR(20) NOT NULL DEFAULT 'en_evaluation' CHECK (statut IN ('actif', 'inactif', 'en_evaluation')),
    note_qualite INTEGER CHECK (note_qualite >= 0 AND note_qualite <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances fournisseurs
CREATE INDEX IF NOT EXISTS idx_fournisseurs_statut ON fournisseurs(statut);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_type ON fournisseurs(type);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_fournisseurs_updated_at ON fournisseurs;
CREATE TRIGGER update_fournisseurs_updated_at
    BEFORE UPDATE ON fournisseurs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fournisseurs
DROP POLICY IF EXISTS "fournisseurs_select_policy" ON fournisseurs;
CREATE POLICY "fournisseurs_select_policy" ON fournisseurs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "fournisseurs_insert_policy" ON fournisseurs;
CREATE POLICY "fournisseurs_insert_policy" ON fournisseurs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "fournisseurs_update_policy" ON fournisseurs;
CREATE POLICY "fournisseurs_update_policy" ON fournisseurs FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "fournisseurs_delete_policy" ON fournisseurs;
CREATE POLICY "fournisseurs_delete_policy" ON fournisseurs FOR DELETE TO authenticated USING (true);

-- Commentaire sur la table
COMMENT ON TABLE fournisseurs IS 'Fournisseurs du service Out Sourcing PHI Studios';

-- ============================================================
-- Table: commandes_outsourcing
-- ============================================================

CREATE TABLE IF NOT EXISTS commandes_outsourcing (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    fournisseur_id INTEGER NOT NULL REFERENCES fournisseurs(id) ON DELETE CASCADE,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    montant_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'confirmee', 'livree', 'annulee')),
    date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_livraison_prevue DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances commandes
CREATE INDEX IF NOT EXISTS idx_commandes_outsourcing_fournisseur ON commandes_outsourcing(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_outsourcing_filiale ON commandes_outsourcing(filiale_id);
CREATE INDEX IF NOT EXISTS idx_commandes_outsourcing_statut ON commandes_outsourcing(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_outsourcing_date ON commandes_outsourcing(date_commande);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_commandes_outsourcing_updated_at ON commandes_outsourcing;
CREATE TRIGGER update_commandes_outsourcing_updated_at
    BEFORE UPDATE ON commandes_outsourcing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE commandes_outsourcing ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour commandes
DROP POLICY IF EXISTS "commandes_outsourcing_select_policy" ON commandes_outsourcing;
CREATE POLICY "commandes_outsourcing_select_policy" ON commandes_outsourcing FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "commandes_outsourcing_insert_policy" ON commandes_outsourcing;
CREATE POLICY "commandes_outsourcing_insert_policy" ON commandes_outsourcing FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "commandes_outsourcing_update_policy" ON commandes_outsourcing;
CREATE POLICY "commandes_outsourcing_update_policy" ON commandes_outsourcing FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "commandes_outsourcing_delete_policy" ON commandes_outsourcing;
CREATE POLICY "commandes_outsourcing_delete_policy" ON commandes_outsourcing FOR DELETE TO authenticated USING (true);

-- Commentaire sur la table
COMMENT ON TABLE commandes_outsourcing IS 'Commandes fournisseurs du service Out Sourcing PHI Studios';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
