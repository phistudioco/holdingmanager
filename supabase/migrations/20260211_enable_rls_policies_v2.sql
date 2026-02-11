-- ============================================================
-- Row Level Security (RLS) Policies - Version 2 (Corrigée)
-- ============================================================
-- Sécurise l'accès aux données sensibles au niveau de la base de données.
-- Les politiques garantissent que les utilisateurs ne peuvent accéder
-- qu'aux données de leurs filiales assignées et selon leurs permissions.
--
-- IMPORTANT: Ces politiques complètent mais ne remplacent PAS
-- les vérifications d'autorisation au niveau applicatif.
--
-- VERSION 2: Vérifie l'existence des tables avant d'activer RLS

-- ============================================================
-- 1. ACTIVER RLS SUR LES TABLES EXISTANTES
-- ============================================================

DO $$
BEGIN
  -- Tables Finance
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'factures') THEN
    ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur factures';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facture_lignes') THEN
    ALTER TABLE facture_lignes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur facture_lignes';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contrats') THEN
    ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur contrats';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur clients';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur transactions';
  END IF;

  -- Tables Core
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'filiales') THEN
    ALTER TABLE filiales ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur filiales';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employes') THEN
    ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur employes';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur users';
  END IF;

  -- Tables Alertes/Logs
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertes') THEN
    ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur alertes';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS activé sur activity_logs';
  END IF;
END $$;

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

-- Fonction pour vérifier si l'utilisateur est super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()::text
    AND r.niveau >= 100
  );
$$;

-- Fonction pour obtenir le niveau de rôle de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT r.niveau
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = auth.uid()::text
    ),
    0
  );
$$;

-- Fonction pour obtenir les filiales auxquelles l'utilisateur a accès
CREATE OR REPLACE FUNCTION get_user_filiales()
RETURNS SETOF INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT filiale_id
  FROM user_affectations
  WHERE user_id = auth.uid()::text;
$$;

-- ============================================================
-- 3. POLICIES POUR LA TABLE USERS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Les utilisateurs peuvent lire leur propre profil
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    CREATE POLICY "Users can read own profile"
    ON users
    FOR SELECT
    USING (id = auth.uid()::text);

    -- Super admins peuvent tout lire
    DROP POLICY IF EXISTS "Super admins can read all users" ON users;
    CREATE POLICY "Super admins can read all users"
    ON users
    FOR SELECT
    USING (is_super_admin());

    -- Les utilisateurs peuvent mettre à jour leur propre profil
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (id = auth.uid()::text)
    WITH CHECK (id = auth.uid()::text);

    RAISE NOTICE 'Politiques RLS créées pour users';
  END IF;
END $$;

-- ============================================================
-- 4. POLICIES POUR LA TABLE FILIALES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'filiales') THEN
    DROP POLICY IF EXISTS "Read filiales by affectations" ON filiales;
    CREATE POLICY "Read filiales by affectations"
    ON filiales
    FOR SELECT
    USING (
      is_super_admin()
      OR id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can create filiales" ON filiales;
    CREATE POLICY "Admins can create filiales"
    ON filiales
    FOR INSERT
    WITH CHECK (get_user_role_level() >= 80);

    DROP POLICY IF EXISTS "Admins can update filiales" ON filiales;
    CREATE POLICY "Admins can update filiales"
    ON filiales
    FOR UPDATE
    USING (get_user_role_level() >= 80)
    WITH CHECK (get_user_role_level() >= 80);

    DROP POLICY IF EXISTS "Super admins can delete filiales" ON filiales;
    CREATE POLICY "Super admins can delete filiales"
    ON filiales
    FOR DELETE
    USING (is_super_admin());

    RAISE NOTICE 'Politiques RLS créées pour filiales';
  END IF;
END $$;

-- ============================================================
-- 5. POLICIES POUR LA TABLE EMPLOYES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employes') THEN
    DROP POLICY IF EXISTS "Read employes by filiale" ON employes;
    CREATE POLICY "Read employes by filiale"
    ON employes
    FOR SELECT
    USING (
      is_super_admin()
      OR filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can create employes" ON employes;
    CREATE POLICY "Managers can create employes"
    ON employes
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can update employes" ON employes;
    CREATE POLICY "Managers can update employes"
    ON employes
    FOR UPDATE
    USING (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    )
    WITH CHECK (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can delete employes" ON employes;
    CREATE POLICY "Admins can delete employes"
    ON employes
    FOR DELETE
    USING (get_user_role_level() >= 80);

    RAISE NOTICE 'Politiques RLS créées pour employes';
  END IF;
END $$;

-- ============================================================
-- 6. POLICIES POUR LA TABLE CLIENTS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    DROP POLICY IF EXISTS "Read clients by filiale" ON clients;
    CREATE POLICY "Read clients by filiale"
    ON clients
    FOR SELECT
    USING (
      is_super_admin()
      OR filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Employes can create clients" ON clients;
    CREATE POLICY "Employes can create clients"
    ON clients
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 20
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Employes can update clients" ON clients;
    CREATE POLICY "Employes can update clients"
    ON clients
    FOR UPDATE
    USING (
      get_user_role_level() >= 20
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    )
    WITH CHECK (
      get_user_role_level() >= 20
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
    CREATE POLICY "Admins can delete clients"
    ON clients
    FOR DELETE
    USING (get_user_role_level() >= 80);

    RAISE NOTICE 'Politiques RLS créées pour clients';
  END IF;
END $$;

-- ============================================================
-- 7. POLICIES POUR LA TABLE FACTURES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'factures') THEN
    DROP POLICY IF EXISTS "Read factures by filiale" ON factures;
    CREATE POLICY "Read factures by filiale"
    ON factures
    FOR SELECT
    USING (
      is_super_admin()
      OR filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Employes can create factures" ON factures;
    CREATE POLICY "Employes can create factures"
    ON factures
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 20
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can update factures" ON factures;
    CREATE POLICY "Managers can update factures"
    ON factures
    FOR UPDATE
    USING (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    )
    WITH CHECK (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can delete factures" ON factures;
    CREATE POLICY "Admins can delete factures"
    ON factures
    FOR DELETE
    USING (get_user_role_level() >= 80);

    RAISE NOTICE 'Politiques RLS créées pour factures';
  END IF;
END $$;

-- ============================================================
-- 8. POLICIES POUR LA TABLE FACTURE_LIGNES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facture_lignes') THEN
    DROP POLICY IF EXISTS "Read facture_lignes via factures" ON facture_lignes;
    CREATE POLICY "Read facture_lignes via factures"
    ON facture_lignes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM factures
        WHERE factures.id = facture_lignes.facture_id
      )
    );

    DROP POLICY IF EXISTS "Managers can create facture_lignes" ON facture_lignes;
    CREATE POLICY "Managers can create facture_lignes"
    ON facture_lignes
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 40
      AND EXISTS (
        SELECT 1 FROM factures
        WHERE factures.id = facture_lignes.facture_id
        AND factures.filiale_id IN (SELECT * FROM get_user_filiales())
      )
    );

    DROP POLICY IF EXISTS "Managers can update facture_lignes" ON facture_lignes;
    CREATE POLICY "Managers can update facture_lignes"
    ON facture_lignes
    FOR UPDATE
    USING (
      get_user_role_level() >= 40
      AND EXISTS (
        SELECT 1 FROM factures
        WHERE factures.id = facture_lignes.facture_id
        AND factures.filiale_id IN (SELECT * FROM get_user_filiales())
      )
    );

    DROP POLICY IF EXISTS "Managers can delete facture_lignes" ON facture_lignes;
    CREATE POLICY "Managers can delete facture_lignes"
    ON facture_lignes
    FOR DELETE
    USING (
      get_user_role_level() >= 40
      AND EXISTS (
        SELECT 1 FROM factures
        WHERE factures.id = facture_lignes.facture_id
        AND factures.filiale_id IN (SELECT * FROM get_user_filiales())
      )
    );

    RAISE NOTICE 'Politiques RLS créées pour facture_lignes';
  END IF;
END $$;

-- ============================================================
-- 9. POLICIES POUR LA TABLE CONTRATS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contrats') THEN
    DROP POLICY IF EXISTS "Read contrats by filiale" ON contrats;
    CREATE POLICY "Read contrats by filiale"
    ON contrats
    FOR SELECT
    USING (
      is_super_admin()
      OR filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Employes can create contrats" ON contrats;
    CREATE POLICY "Employes can create contrats"
    ON contrats
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 20
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can update contrats" ON contrats;
    CREATE POLICY "Managers can update contrats"
    ON contrats
    FOR UPDATE
    USING (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can delete contrats" ON contrats;
    CREATE POLICY "Admins can delete contrats"
    ON contrats
    FOR DELETE
    USING (get_user_role_level() >= 80);

    RAISE NOTICE 'Politiques RLS créées pour contrats';
  END IF;
END $$;

-- ============================================================
-- 10. POLICIES POUR LA TABLE TRANSACTIONS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    DROP POLICY IF EXISTS "Read transactions by filiale" ON transactions;
    CREATE POLICY "Read transactions by filiale"
    ON transactions
    FOR SELECT
    USING (
      is_super_admin()
      OR filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can create transactions" ON transactions;
    CREATE POLICY "Managers can create transactions"
    ON transactions
    FOR INSERT
    WITH CHECK (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Managers can update transactions" ON transactions;
    CREATE POLICY "Managers can update transactions"
    ON transactions
    FOR UPDATE
    USING (
      get_user_role_level() >= 40
      AND filiale_id IN (SELECT * FROM get_user_filiales())
    );

    DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;
    CREATE POLICY "Admins can delete transactions"
    ON transactions
    FOR DELETE
    USING (get_user_role_level() >= 80);

    RAISE NOTICE 'Politiques RLS créées pour transactions';
  END IF;
END $$;

-- ============================================================
-- 11. POLICIES POUR LA TABLE ALERTES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertes') THEN
    DROP POLICY IF EXISTS "Users can read own alertes" ON alertes;
    CREATE POLICY "Users can read own alertes"
    ON alertes
    FOR SELECT
    USING (true);

    DROP POLICY IF EXISTS "System can create alertes" ON alertes;
    CREATE POLICY "System can create alertes"
    ON alertes
    FOR INSERT
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can update own alertes" ON alertes;
    CREATE POLICY "Users can update own alertes"
    ON alertes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

    RAISE NOTICE 'Politiques RLS créées pour alertes';
  END IF;
END $$;

-- ============================================================
-- 12. POLICIES POUR LA TABLE ACTIVITY_LOGS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    DROP POLICY IF EXISTS "Managers can read activity logs" ON activity_logs;
    CREATE POLICY "Managers can read activity logs"
    ON activity_logs
    FOR SELECT
    USING (get_user_role_level() >= 40);

    DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs;
    CREATE POLICY "System can create activity logs"
    ON activity_logs
    FOR INSERT
    WITH CHECK (true);

    RAISE NOTICE 'Politiques RLS créées pour activity_logs';
  END IF;
END $$;

-- ============================================================
-- 13. GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_level() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_filiales() TO authenticated;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON FUNCTION is_super_admin IS
'Vérifie si l''utilisateur actuel est super_admin (niveau >= 100)';

COMMENT ON FUNCTION get_user_role_level IS
'Retourne le niveau de rôle de l''utilisateur actuel (0-100)';

COMMENT ON FUNCTION get_user_filiales IS
'Retourne les IDs des filiales auxquelles l''utilisateur a accès';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

-- Afficher un résumé
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;

  RAISE NOTICE '✅ Migration RLS terminée avec succès';
  RAISE NOTICE '📊 % tables ont RLS activé', table_count;
  RAISE NOTICE '🔒 Vérifiez avec: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND rowsecurity = true;';
END $$;
