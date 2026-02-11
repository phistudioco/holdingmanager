-- ============================================================
-- TRIGGER: Création automatique du profil utilisateur
-- À exécuter après le schéma principal
-- ============================================================

-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id INTEGER;
BEGIN
    -- Récupérer l'ID du rôle "employe" par défaut
    SELECT id INTO default_role_id FROM public.roles WHERE nom = 'employe' LIMIT 1;

    -- Si le rôle n'existe pas, utiliser NULL
    IF default_role_id IS NULL THEN
        default_role_id := 5; -- ID supposé du rôle employe
    END IF;

    -- Insérer le nouveau profil utilisateur
    INSERT INTO public.users (id, nom, prenom, email, role_id, statut)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Nouveau'),
        COALESCE(NEW.raw_user_meta_data->>'prenom', 'Utilisateur'),
        NEW.email,
        default_role_id,
        'actif'
    );

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Si l'utilisateur existe déjà, on ne fait rien
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log l'erreur mais ne bloque pas l'inscription
        RAISE WARNING 'Erreur lors de la création du profil: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: user_affectations (liaison utilisateur-filiale-service)
-- ============================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_affectations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    role_specifique_id INTEGER REFERENCES roles(id),
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    est_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, filiale_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_affectations_user ON user_affectations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affectations_filiale ON user_affectations(filiale_id);

-- RLS pour user_affectations
ALTER TABLE user_affectations ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "user_affectations_select_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_insert_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_update_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_delete_policy" ON user_affectations;

-- Créer les policies
CREATE POLICY "user_affectations_select_policy"
    ON user_affectations FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_affectations_insert_policy"
    ON user_affectations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_affectations_update_policy"
    ON user_affectations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "user_affectations_delete_policy"
    ON user_affectations FOR DELETE TO authenticated USING (true);

-- ============================================================
-- FONCTION: Obtenir les filiales d'un utilisateur
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_filiales(p_user_id UUID)
RETURNS TABLE (
    filiale_id INTEGER,
    filiale_nom VARCHAR,
    filiale_code VARCHAR,
    service_id INTEGER,
    service_nom VARCHAR,
    est_principal BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as filiale_id,
        f.nom as filiale_nom,
        f.code as filiale_code,
        ua.service_id,
        s.nom as service_nom,
        ua.est_principal
    FROM user_affectations ua
    JOIN filiales f ON f.id = ua.filiale_id
    LEFT JOIN services s ON s.id = ua.service_id
    WHERE ua.user_id = p_user_id
    AND (ua.date_fin IS NULL OR ua.date_fin >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION: Vérifier si un utilisateur a accès à une filiale
-- ============================================================

CREATE OR REPLACE FUNCTION user_has_filiale_access(p_user_id UUID, p_filiale_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    has_access BOOLEAN;
BEGIN
    -- Récupérer le rôle de l'utilisateur
    SELECT r.nom INTO user_role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = p_user_id;

    -- Super admin et admin ont accès à tout
    IF user_role IN ('super_admin', 'admin') THEN
        RETURN TRUE;
    END IF;

    -- Vérifier si l'utilisateur a une affectation à cette filiale
    SELECT EXISTS (
        SELECT 1 FROM user_affectations
        WHERE user_id = p_user_id
        AND filiale_id = p_filiale_id
        AND (date_fin IS NULL OR date_fin >= CURRENT_DATE)
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON FUNCTION handle_new_user() IS 'Crée automatiquement un profil utilisateur lors de l''inscription via Supabase Auth';
COMMENT ON TABLE user_affectations IS 'Affectations des utilisateurs aux filiales et services';
COMMENT ON FUNCTION get_user_filiales(UUID) IS 'Retourne les filiales auxquelles un utilisateur a accès';
COMMENT ON FUNCTION user_has_filiale_access(UUID, INTEGER) IS 'Vérifie si un utilisateur a accès à une filiale spécifique';
