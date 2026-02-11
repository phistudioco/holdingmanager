-- ============================================================
-- MIGRATION: Table notification_preferences
-- Module: Préférences Notifications Utilisateur
-- ============================================================

-- Table: notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Types de notifications à recevoir
    notify_facture_impayee BOOLEAN DEFAULT true,
    notify_facture_echeance BOOLEAN DEFAULT true,
    notify_contrat_expiration BOOLEAN DEFAULT true,
    notify_workflow_approbation BOOLEAN DEFAULT true,
    notify_workflow_statut BOOLEAN DEFAULT true,
    notify_budget_alerte BOOLEAN DEFAULT true,
    notify_systeme BOOLEAN DEFAULT true,

    -- Niveaux de sévérité minimum (basse, moyenne, haute, critique)
    severite_minimum VARCHAR(20) DEFAULT 'moyenne' CHECK (severite_minimum IN ('basse', 'moyenne', 'haute', 'critique')),

    -- Canaux de notification
    canal_inapp BOOLEAN DEFAULT true,
    canal_push BOOLEAN DEFAULT true,
    canal_email BOOLEAN DEFAULT false,

    -- Heures de notification (éviter les notifications la nuit)
    notification_heures_debut TIME DEFAULT '08:00',
    notification_heures_fin TIME DEFAULT '20:00',
    notification_weekend BOOLEAN DEFAULT false,

    -- Résumé quotidien par email
    resume_quotidien BOOLEAN DEFAULT false,
    resume_heure TIME DEFAULT '09:00',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS - Les utilisateurs peuvent voir et gérer leurs propres préférences
DROP POLICY IF EXISTS "notification_preferences_select_own" ON notification_preferences;
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_insert_own" ON notification_preferences;
CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_update_own" ON notification_preferences;
CREATE POLICY "notification_preferences_update_own" ON notification_preferences
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_delete_own" ON notification_preferences;
CREATE POLICY "notification_preferences_delete_own" ON notification_preferences
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Politique pour le service role
DROP POLICY IF EXISTS "notification_preferences_service_select" ON notification_preferences;
CREATE POLICY "notification_preferences_service_select" ON notification_preferences
    FOR SELECT TO service_role
    USING (true);

-- Commentaire sur la table
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications par utilisateur';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
