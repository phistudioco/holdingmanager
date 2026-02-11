-- ============================================================
-- MIGRATION: Table projets_digital
-- Module: Service Digital PHI Studios
-- ============================================================

-- Table: projets_digital
CREATE TABLE IF NOT EXISTS projets_digital (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'site_web' CHECK (type IN ('site_web', 'application', 'ecommerce', 'mobile', 'autre')),
    statut VARCHAR(20) NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'en_pause', 'termine', 'annule')),
    url VARCHAR(500),
    date_debut DATE,
    date_fin_prevue DATE,
    budget DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_projets_digital_filiale ON projets_digital(filiale_id);
CREATE INDEX IF NOT EXISTS idx_projets_digital_client ON projets_digital(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_digital_type ON projets_digital(type);
CREATE INDEX IF NOT EXISTS idx_projets_digital_statut ON projets_digital(statut);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_projets_digital_updated_at ON projets_digital;
CREATE TRIGGER update_projets_digital_updated_at
    BEFORE UPDATE ON projets_digital
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE projets_digital ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour utilisateurs authentifiés
DROP POLICY IF EXISTS "projets_digital_select_policy" ON projets_digital;
CREATE POLICY "projets_digital_select_policy" ON projets_digital FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_digital_insert_policy" ON projets_digital;
CREATE POLICY "projets_digital_insert_policy" ON projets_digital FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projets_digital_update_policy" ON projets_digital;
CREATE POLICY "projets_digital_update_policy" ON projets_digital FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_digital_delete_policy" ON projets_digital;
CREATE POLICY "projets_digital_delete_policy" ON projets_digital FOR DELETE TO authenticated USING (true);

-- Commentaire sur la table
COMMENT ON TABLE projets_digital IS 'Projets du service Digital PHI Studios (sites web, applications, e-commerce, mobile)';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
