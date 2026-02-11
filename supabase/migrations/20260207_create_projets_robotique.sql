-- ============================================================
-- MIGRATION: Table projets_robotique
-- Module: Service Robotique PHI Studios
-- ============================================================

-- Table: projets_robotique
CREATE TABLE IF NOT EXISTS projets_robotique (
    id SERIAL PRIMARY KEY,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'en_pause', 'termine', 'annule')),
    date_debut DATE,
    date_fin_prevue DATE,
    budget DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_projets_robotique_filiale ON projets_robotique(filiale_id);
CREATE INDEX IF NOT EXISTS idx_projets_robotique_client ON projets_robotique(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_robotique_statut ON projets_robotique(statut);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_projets_robotique_updated_at ON projets_robotique;
CREATE TRIGGER update_projets_robotique_updated_at
    BEFORE UPDATE ON projets_robotique
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE projets_robotique ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour utilisateurs authentifiés
DROP POLICY IF EXISTS "projets_robotique_select_policy" ON projets_robotique;
CREATE POLICY "projets_robotique_select_policy" ON projets_robotique FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_robotique_insert_policy" ON projets_robotique;
CREATE POLICY "projets_robotique_insert_policy" ON projets_robotique FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projets_robotique_update_policy" ON projets_robotique;
CREATE POLICY "projets_robotique_update_policy" ON projets_robotique FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_robotique_delete_policy" ON projets_robotique;
CREATE POLICY "projets_robotique_delete_policy" ON projets_robotique FOR DELETE TO authenticated USING (true);

-- Commentaire sur la table
COMMENT ON TABLE projets_robotique IS 'Projets du service Robotique PHI Studios';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
