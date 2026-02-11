-- ============================================================
-- MIGRATION: Portail Client PHI Studios
-- Module: Système de demandes clients
-- ============================================================

-- ============================================================
-- Extension de la table clients pour le portail
-- ============================================================

-- Ajouter les colonnes pour l'accès au portail
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_portail VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portail_actif BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portail_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS derniere_connexion_portail TIMESTAMP WITH TIME ZONE;

-- Index pour la recherche par email portail
CREATE INDEX IF NOT EXISTS idx_clients_email_portail ON clients(email_portail);
CREATE INDEX IF NOT EXISTS idx_clients_portail_user ON clients(portail_user_id);

-- ============================================================
-- Table: demandes_clients
-- ============================================================

CREATE TABLE IF NOT EXISTS demandes_clients (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    filiale_id INTEGER REFERENCES filiales(id) ON DELETE SET NULL,

    -- Détails de la demande
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('robotique', 'digital', 'outsourcing')),
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    urgence VARCHAR(20) DEFAULT 'normale' CHECK (urgence IN ('basse', 'normale', 'haute', 'urgente')),
    date_souhaitee DATE,

    -- Statut et assignation
    statut VARCHAR(50) DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'en_cours', 'en_attente', 'terminee', 'annulee')),
    assignee_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,

    -- Estimation (rempli par l'équipe)
    estimation_heures DECIMAL(10, 2),
    estimation_cout DECIMAL(15, 2),
    date_debut_prevue DATE,
    date_fin_prevue DATE,

    -- Satisfaction client (après clôture)
    note_satisfaction INTEGER CHECK (note_satisfaction >= 1 AND note_satisfaction <= 5),
    commentaire_satisfaction TEXT,

    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_clients_client ON demandes_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_clients_statut ON demandes_clients(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_clients_service ON demandes_clients(service_type);
CREATE INDEX IF NOT EXISTS idx_demandes_clients_assignee ON demandes_clients(assignee_id);
CREATE INDEX IF NOT EXISTS idx_demandes_clients_filiale ON demandes_clients(filiale_id);
CREATE INDEX IF NOT EXISTS idx_demandes_clients_date ON demandes_clients(created_at DESC);

-- Fonction pour générer le numéro de demande
CREATE OR REPLACE FUNCTION generate_demande_numero()
RETURNS TRIGGER AS $$
DECLARE
    annee TEXT;
    sequence_num INTEGER;
BEGIN
    annee := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'DEM-' || annee || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM demandes_clients
    WHERE numero LIKE 'DEM-' || annee || '-%';

    NEW.numero := 'DEM-' || annee || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour auto-générer le numéro
DROP TRIGGER IF EXISTS trigger_generate_demande_numero ON demandes_clients;
CREATE TRIGGER trigger_generate_demande_numero
    BEFORE INSERT ON demandes_clients
    FOR EACH ROW
    WHEN (NEW.numero IS NULL)
    EXECUTE FUNCTION generate_demande_numero();

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_demandes_clients_updated_at ON demandes_clients;
CREATE TRIGGER update_demandes_clients_updated_at
    BEFORE UPDATE ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table: demandes_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS demandes_messages (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER NOT NULL REFERENCES demandes_clients(id) ON DELETE CASCADE,

    -- Auteur du message
    auteur_type VARCHAR(20) NOT NULL CHECK (auteur_type IN ('client', 'employe')),
    auteur_id INTEGER NOT NULL,

    -- Contenu
    message TEXT NOT NULL,
    est_interne BOOLEAN DEFAULT false, -- Message interne (non visible par le client)

    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_messages_demande ON demandes_messages(demande_id);
CREATE INDEX IF NOT EXISTS idx_demandes_messages_auteur ON demandes_messages(auteur_type, auteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_messages_date ON demandes_messages(created_at DESC);

-- ============================================================
-- Table: demandes_fichiers
-- ============================================================

CREATE TABLE IF NOT EXISTS demandes_fichiers (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER NOT NULL REFERENCES demandes_clients(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES demandes_messages(id) ON DELETE SET NULL,

    -- Informations fichier
    nom_fichier VARCHAR(255) NOT NULL,
    type_fichier VARCHAR(100),
    taille INTEGER, -- en bytes
    url_stockage TEXT NOT NULL,

    -- Upload info
    uploaded_by_type VARCHAR(20) NOT NULL CHECK (uploaded_by_type IN ('client', 'employe')),
    uploaded_by_id INTEGER NOT NULL,

    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_fichiers_demande ON demandes_fichiers(demande_id);
CREATE INDEX IF NOT EXISTS idx_demandes_fichiers_message ON demandes_fichiers(message_id);

-- ============================================================
-- Table: demandes_historique (timeline)
-- ============================================================

CREATE TABLE IF NOT EXISTS demandes_historique (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER NOT NULL REFERENCES demandes_clients(id) ON DELETE CASCADE,

    -- Action effectuée
    action VARCHAR(100) NOT NULL,
    -- 'creation', 'assignation', 'changement_statut', 'message', 'fichier_ajoute', 'estimation', 'cloture'

    -- Détails
    ancien_valeur TEXT,
    nouvelle_valeur TEXT,
    description TEXT,

    -- Auteur
    auteur_type VARCHAR(20) NOT NULL CHECK (auteur_type IN ('client', 'employe', 'systeme')),
    auteur_id INTEGER,

    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_historique_demande ON demandes_historique(demande_id);
CREATE INDEX IF NOT EXISTS idx_demandes_historique_date ON demandes_historique(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Activer RLS
ALTER TABLE demandes_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_historique ENABLE ROW LEVEL SECURITY;

-- Politiques pour demandes_clients
-- Employés authentifiés peuvent tout voir
DROP POLICY IF EXISTS "demandes_clients_employes_select" ON demandes_clients;
CREATE POLICY "demandes_clients_employes_select" ON demandes_clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "demandes_clients_employes_all" ON demandes_clients;
CREATE POLICY "demandes_clients_employes_all" ON demandes_clients
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    );

-- Clients portail ne voient que leurs demandes
DROP POLICY IF EXISTS "demandes_clients_portail_select" ON demandes_clients;
CREATE POLICY "demandes_clients_portail_select" ON demandes_clients
    FOR SELECT TO authenticated
    USING (
        client_id IN (SELECT id FROM clients WHERE portail_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "demandes_clients_portail_insert" ON demandes_clients;
CREATE POLICY "demandes_clients_portail_insert" ON demandes_clients
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id IN (SELECT id FROM clients WHERE portail_user_id = auth.uid())
    );

-- Politiques pour demandes_messages
DROP POLICY IF EXISTS "demandes_messages_select" ON demandes_messages;
CREATE POLICY "demandes_messages_select" ON demandes_messages
    FOR SELECT TO authenticated
    USING (
        -- Employés voient tout
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
        OR
        -- Clients ne voient pas les messages internes
        (
            NOT est_interne
            AND demande_id IN (
                SELECT dc.id FROM demandes_clients dc
                JOIN clients c ON c.id = dc.client_id
                WHERE c.portail_user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "demandes_messages_insert" ON demandes_messages;
CREATE POLICY "demandes_messages_insert" ON demandes_messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Politiques pour demandes_fichiers
DROP POLICY IF EXISTS "demandes_fichiers_select" ON demandes_fichiers;
CREATE POLICY "demandes_fichiers_select" ON demandes_fichiers
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "demandes_fichiers_insert" ON demandes_fichiers;
CREATE POLICY "demandes_fichiers_insert" ON demandes_fichiers
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Politiques pour demandes_historique
DROP POLICY IF EXISTS "demandes_historique_select" ON demandes_historique;
CREATE POLICY "demandes_historique_select" ON demandes_historique
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "demandes_historique_insert" ON demandes_historique;
CREATE POLICY "demandes_historique_insert" ON demandes_historique
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================================
-- Fonction pour créer l'historique automatiquement
-- ============================================================

CREATE OR REPLACE FUNCTION log_demande_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Changement de statut
    IF OLD.statut IS DISTINCT FROM NEW.statut THEN
        INSERT INTO demandes_historique (demande_id, action, ancien_valeur, nouvelle_valeur, auteur_type, auteur_id)
        VALUES (NEW.id, 'changement_statut', OLD.statut, NEW.statut, 'systeme', NULL);
    END IF;

    -- Changement d'assignation
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO demandes_historique (demande_id, action, ancien_valeur, nouvelle_valeur, auteur_type, auteur_id)
        VALUES (NEW.id, 'assignation', OLD.assignee_id::TEXT, NEW.assignee_id::TEXT, 'systeme', NULL);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_demande_change ON demandes_clients;
CREATE TRIGGER trigger_log_demande_change
    AFTER UPDATE ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION log_demande_change();

-- Trigger pour log création
CREATE OR REPLACE FUNCTION log_demande_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO demandes_historique (demande_id, action, description, auteur_type, auteur_id)
    VALUES (NEW.id, 'creation', 'Demande créée', 'systeme', NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_demande_creation ON demandes_clients;
CREATE TRIGGER trigger_log_demande_creation
    AFTER INSERT ON demandes_clients
    FOR EACH ROW
    EXECUTE FUNCTION log_demande_creation();

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON TABLE demandes_clients IS 'Demandes soumises par les clients via le portail';
COMMENT ON TABLE demandes_messages IS 'Messages et échanges sur les demandes clients';
COMMENT ON TABLE demandes_fichiers IS 'Pièces jointes des demandes clients';
COMMENT ON TABLE demandes_historique IS 'Historique des actions sur les demandes (timeline)';

-- ============================================================
-- Bucket Storage pour les fichiers
-- ============================================================

-- Note: Exécuter dans le dashboard Supabase:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('demandes-fichiers', 'demandes-fichiers', false);

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
