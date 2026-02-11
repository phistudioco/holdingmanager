-- ============================================================
-- MIGRATION: Tables Rapports Personnalisés
-- Module: Rapports Custom
-- ============================================================

-- Table: report_templates
-- Stocke les templates de rapports créés par les utilisateurs
CREATE TABLE IF NOT EXISTS report_templates (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuration du rapport
    type VARCHAR(50) NOT NULL DEFAULT 'finance' CHECK (type IN ('finance', 'clients', 'employes', 'services', 'workflows', 'custom')),

    -- Sections à inclure (JSONB pour flexibilité)
    sections JSONB NOT NULL DEFAULT '[]',
    -- Exemple: ["synthese_financiere", "factures_statut", "transactions_categorie", "top_clients"]

    -- Filtres par défaut
    filiales_ids INTEGER[] DEFAULT '{}',
    periode_type VARCHAR(20) DEFAULT 'mensuel' CHECK (periode_type IN ('mensuel', 'trimestriel', 'annuel', 'personnalise')),

    -- Mise en page
    orientation VARCHAR(20) DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'paysage')),
    inclure_graphiques BOOLEAN DEFAULT true,
    inclure_logo BOOLEAN DEFAULT true,

    -- Partage
    is_public BOOLEAN DEFAULT false,
    shared_with UUID[] DEFAULT '{}',

    -- Métadonnées
    derniere_generation TIMESTAMP WITH TIME ZONE,
    fois_genere INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_public ON report_templates(is_public);

-- Table: report_history
-- Historique des rapports générés
CREATE TABLE IF NOT EXISTS report_history (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES report_templates(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Paramètres utilisés
    nom_rapport VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    filiales_ids INTEGER[],
    sections JSONB,

    -- Fichier généré (optionnel - stocké dans Supabase Storage)
    fichier_url TEXT,
    fichier_taille INTEGER,

    -- Résumé des données
    resume JSONB,
    -- Exemple: { "total_revenus": 50000, "total_depenses": 30000, "nb_factures": 45 }

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_report_history_user ON report_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_template ON report_history(template_id);
CREATE INDEX IF NOT EXISTS idx_report_history_date ON report_history(created_at DESC);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour report_templates
DROP POLICY IF EXISTS "report_templates_select_own_or_shared" ON report_templates;
CREATE POLICY "report_templates_select_own_or_shared" ON report_templates
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR is_public = true
        OR auth.uid() = ANY(shared_with)
    );

DROP POLICY IF EXISTS "report_templates_insert_own" ON report_templates;
CREATE POLICY "report_templates_insert_own" ON report_templates
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "report_templates_update_own" ON report_templates;
CREATE POLICY "report_templates_update_own" ON report_templates
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "report_templates_delete_own" ON report_templates;
CREATE POLICY "report_templates_delete_own" ON report_templates
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Politiques RLS pour report_history
DROP POLICY IF EXISTS "report_history_select_own" ON report_history;
CREATE POLICY "report_history_select_own" ON report_history
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "report_history_insert_own" ON report_history;
CREATE POLICY "report_history_insert_own" ON report_history
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "report_history_delete_own" ON report_history;
CREATE POLICY "report_history_delete_own" ON report_history
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Commentaires
COMMENT ON TABLE report_templates IS 'Templates de rapports personnalisés par utilisateur';
COMMENT ON TABLE report_history IS 'Historique des rapports générés';

-- ============================================================
-- Données initiales - Templates par défaut (publics)
-- ============================================================

-- Template: Rapport Financier Mensuel
INSERT INTO report_templates (
    user_id,
    nom,
    description,
    type,
    sections,
    periode_type,
    is_public
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Rapport Financier Mensuel',
    'Synthèse mensuelle des finances avec revenus, dépenses et factures',
    'finance',
    '["synthese_financiere", "factures_statut", "transactions_categorie", "top_clients"]',
    'mensuel',
    true
) ON CONFLICT DO NOTHING;

-- Template: Rapport Trimestriel Complet
INSERT INTO report_templates (
    user_id,
    nom,
    description,
    type,
    sections,
    periode_type,
    is_public
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Rapport Trimestriel Complet',
    'Analyse trimestrielle détaillée avec graphiques et tendances',
    'finance',
    '["synthese_financiere", "evolution_mensuelle", "factures_statut", "transactions_categorie", "top_clients", "comparaison_periode"]',
    'trimestriel',
    true
) ON CONFLICT DO NOTHING;

-- Template: Rapport Clients
INSERT INTO report_templates (
    user_id,
    nom,
    description,
    type,
    sections,
    periode_type,
    is_public
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Analyse Clients',
    'Rapport détaillé sur les clients et leur activité',
    'clients',
    '["liste_clients", "top_clients", "clients_nouveaux", "factures_par_client"]',
    'mensuel',
    true
) ON CONFLICT DO NOTHING;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
