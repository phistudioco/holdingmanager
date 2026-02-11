-- ============================================================
-- MIGRATION: Table push_subscriptions
-- Module: Notifications Push Web
-- ============================================================

-- Table: push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Activer Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Les utilisateurs peuvent voir et gérer leur propre subscription
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_update_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_update_own" ON push_subscriptions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Politique pour le service role (envoi de notifications)
DROP POLICY IF EXISTS "push_subscriptions_service_select" ON push_subscriptions;
CREATE POLICY "push_subscriptions_service_select" ON push_subscriptions
    FOR SELECT TO service_role
    USING (true);

-- Commentaire sur la table
COMMENT ON TABLE push_subscriptions IS 'Abonnements aux notifications push Web';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
