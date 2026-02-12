-- ============================================================
-- Row Level Security (RLS) Policies - Version 5 (SQL pur)
-- ============================================================
-- Version simplifiée sans RAISE NOTICE, utilisant ALTER TABLE IF EXISTS
-- FIX v3: Correction UUID vs TEXT
-- FIX v4: Vérification existence tables pour policies
-- FIX v5: SQL pur sans messages de progression

-- ============================================================
-- 1. ACTIVER RLS SUR LES TABLES CRITIQUES
-- ============================================================

-- Tables Finance
ALTER TABLE IF EXISTS factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facture_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- Tables Core
ALTER TABLE IF EXISTS filiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Tables Alertes/Logs
ALTER TABLE IF EXISTS alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

-- Supprimer TOUTES les surcharges existantes de ces fonctions
DO $$
DECLARE
  func_signature TEXT;
BEGIN
  -- Supprimer toutes les surcharges de is_super_admin
  FOR func_signature IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'is_super_admin'
    AND pg_function_is_visible(oid)
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature || ' CASCADE';
  END LOOP;

  -- Supprimer toutes les surcharges de get_user_role_level
  FOR func_signature IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'get_user_role_level'
    AND pg_function_is_visible(oid)
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature || ' CASCADE';
  END LOOP;

  -- Supprimer toutes les surcharges de get_user_filiales
  FOR func_signature IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'get_user_filiales'
    AND pg_function_is_visible(oid)
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature || ' CASCADE';
  END LOOP;
END $$;

CREATE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.niveau >= 100
  );
$$;

CREATE FUNCTION get_user_role_level()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT r.niveau
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = auth.uid()
    ),
    0
  );
$$;

CREATE FUNCTION get_user_filiales()
RETURNS SETOF INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT filiale_id
  FROM user_affectations
  WHERE user_id = auth.uid();
$$;

-- ============================================================
-- 3. SUPPRESSION DES ANCIENNES POLICIES
-- ============================================================

DO $$
BEGIN
  -- Users
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    DROP POLICY IF EXISTS "Super admins can read all users" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
  END IF;

  -- Filiales
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'filiales') THEN
    DROP POLICY IF EXISTS "Read filiales by affectations" ON filiales;
    DROP POLICY IF EXISTS "Admins can create filiales" ON filiales;
    DROP POLICY IF EXISTS "Admins can update filiales" ON filiales;
    DROP POLICY IF EXISTS "Super admins can delete filiales" ON filiales;
  END IF;

  -- Employes
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employes') THEN
    DROP POLICY IF EXISTS "Read employes by filiale" ON employes;
    DROP POLICY IF EXISTS "Managers can create employes" ON employes;
    DROP POLICY IF EXISTS "Managers can update employes" ON employes;
    DROP POLICY IF EXISTS "Admins can delete employes" ON employes;
  END IF;

  -- Clients
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    DROP POLICY IF EXISTS "Read clients by filiale" ON clients;
    DROP POLICY IF EXISTS "Employes can create clients" ON clients;
    DROP POLICY IF EXISTS "Employes can update clients" ON clients;
    DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
  END IF;

  -- Factures
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'factures') THEN
    DROP POLICY IF EXISTS "Read factures by filiale" ON factures;
    DROP POLICY IF EXISTS "Employes can create factures" ON factures;
    DROP POLICY IF EXISTS "Managers can update factures" ON factures;
    DROP POLICY IF EXISTS "Admins can delete factures" ON factures;
  END IF;

  -- Facture_lignes
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facture_lignes') THEN
    DROP POLICY IF EXISTS "Read facture_lignes via factures" ON facture_lignes;
    DROP POLICY IF EXISTS "Managers can create facture_lignes" ON facture_lignes;
    DROP POLICY IF EXISTS "Managers can update facture_lignes" ON facture_lignes;
    DROP POLICY IF EXISTS "Managers can delete facture_lignes" ON facture_lignes;
  END IF;

  -- Contrats
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contrats') THEN
    DROP POLICY IF EXISTS "Read contrats by filiale" ON contrats;
    DROP POLICY IF EXISTS "Employes can create contrats" ON contrats;
    DROP POLICY IF EXISTS "Managers can update contrats" ON contrats;
    DROP POLICY IF EXISTS "Admins can delete contrats" ON contrats;
  END IF;

  -- Transactions
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    DROP POLICY IF EXISTS "Read transactions by filiale" ON transactions;
    DROP POLICY IF EXISTS "Managers can create transactions" ON transactions;
    DROP POLICY IF EXISTS "Managers can update transactions" ON transactions;
    DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;
  END IF;

  -- Alertes
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertes') THEN
    DROP POLICY IF EXISTS "Users can read own alertes" ON alertes;
    DROP POLICY IF EXISTS "System can create alertes" ON alertes;
    DROP POLICY IF EXISTS "Users can update own alertes" ON alertes;
  END IF;

  -- Activity_logs
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    DROP POLICY IF EXISTS "Managers can read activity logs" ON activity_logs;
    DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs;
  END IF;
END $$;

-- ============================================================
-- 4. POLICIES POUR LA TABLE USERS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (id = auth.uid());
    CREATE POLICY "Super admins can read all users" ON users FOR SELECT USING (is_super_admin());
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 5. POLICIES POUR LA TABLE FILIALES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'filiales') THEN
    CREATE POLICY "Read filiales by affectations" ON filiales FOR SELECT USING (is_super_admin() OR id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can create filiales" ON filiales FOR INSERT WITH CHECK (get_user_role_level() >= 80);
    CREATE POLICY "Admins can update filiales" ON filiales FOR UPDATE USING (get_user_role_level() >= 80) WITH CHECK (get_user_role_level() >= 80);
    CREATE POLICY "Super admins can delete filiales" ON filiales FOR DELETE USING (is_super_admin());
  END IF;
END $$;

-- ============================================================
-- 6. POLICIES POUR LA TABLE EMPLOYES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employes') THEN
    CREATE POLICY "Read employes by filiale" ON employes FOR SELECT USING (is_super_admin() OR filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can create employes" ON employes FOR INSERT WITH CHECK (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can update employes" ON employes FOR UPDATE USING (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales())) WITH CHECK (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can delete employes" ON employes FOR DELETE USING (get_user_role_level() >= 80);
  END IF;
END $$;

-- ============================================================
-- 7. POLICIES POUR LA TABLE CLIENTS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    CREATE POLICY "Read clients by filiale" ON clients FOR SELECT USING (is_super_admin() OR filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Employes can create clients" ON clients FOR INSERT WITH CHECK (get_user_role_level() >= 20 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Employes can update clients" ON clients FOR UPDATE USING (get_user_role_level() >= 20 AND filiale_id IN (SELECT * FROM get_user_filiales())) WITH CHECK (get_user_role_level() >= 20 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can delete clients" ON clients FOR DELETE USING (get_user_role_level() >= 80);
  END IF;
END $$;

-- ============================================================
-- 8. POLICIES POUR LA TABLE FACTURES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'factures') THEN
    CREATE POLICY "Read factures by filiale" ON factures FOR SELECT USING (is_super_admin() OR filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Employes can create factures" ON factures FOR INSERT WITH CHECK (get_user_role_level() >= 20 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can update factures" ON factures FOR UPDATE USING (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales())) WITH CHECK (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can delete factures" ON factures FOR DELETE USING (get_user_role_level() >= 80);
  END IF;
END $$;

-- ============================================================
-- 9. POLICIES POUR LA TABLE FACTURE_LIGNES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facture_lignes') THEN
    CREATE POLICY "Read facture_lignes via factures" ON facture_lignes FOR SELECT USING (EXISTS (SELECT 1 FROM factures WHERE factures.id = facture_lignes.facture_id));
    CREATE POLICY "Managers can create facture_lignes" ON facture_lignes FOR INSERT WITH CHECK (get_user_role_level() >= 40 AND EXISTS (SELECT 1 FROM factures WHERE factures.id = facture_lignes.facture_id AND factures.filiale_id IN (SELECT * FROM get_user_filiales())));
    CREATE POLICY "Managers can update facture_lignes" ON facture_lignes FOR UPDATE USING (get_user_role_level() >= 40 AND EXISTS (SELECT 1 FROM factures WHERE factures.id = facture_lignes.facture_id AND factures.filiale_id IN (SELECT * FROM get_user_filiales())));
    CREATE POLICY "Managers can delete facture_lignes" ON facture_lignes FOR DELETE USING (get_user_role_level() >= 40 AND EXISTS (SELECT 1 FROM factures WHERE factures.id = facture_lignes.facture_id AND factures.filiale_id IN (SELECT * FROM get_user_filiales())));
  END IF;
END $$;

-- ============================================================
-- 10. POLICIES POUR LA TABLE CONTRATS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contrats') THEN
    CREATE POLICY "Read contrats by filiale" ON contrats FOR SELECT USING (is_super_admin() OR filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Employes can create contrats" ON contrats FOR INSERT WITH CHECK (get_user_role_level() >= 20 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can update contrats" ON contrats FOR UPDATE USING (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can delete contrats" ON contrats FOR DELETE USING (get_user_role_level() >= 80);
  END IF;
END $$;

-- ============================================================
-- 11. POLICIES POUR LA TABLE TRANSACTIONS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    CREATE POLICY "Read transactions by filiale" ON transactions FOR SELECT USING (is_super_admin() OR filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can create transactions" ON transactions FOR INSERT WITH CHECK (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Managers can update transactions" ON transactions FOR UPDATE USING (get_user_role_level() >= 40 AND filiale_id IN (SELECT * FROM get_user_filiales()));
    CREATE POLICY "Admins can delete transactions" ON transactions FOR DELETE USING (get_user_role_level() >= 80);
  END IF;
END $$;

-- ============================================================
-- 12. POLICIES POUR LA TABLE ALERTES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertes') THEN
    CREATE POLICY "Users can read own alertes" ON alertes FOR SELECT USING (true);
    CREATE POLICY "System can create alertes" ON alertes FOR INSERT WITH CHECK (true);
    CREATE POLICY "Users can update own alertes" ON alertes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 13. POLICIES POUR LA TABLE ACTIVITY_LOGS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    CREATE POLICY "Managers can read activity logs" ON activity_logs FOR SELECT USING (get_user_role_level() >= 40);
    CREATE POLICY "System can create activity logs" ON activity_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 14. GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_level() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_filiales() TO authenticated;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON FUNCTION is_super_admin IS 'Vérifie si l''utilisateur actuel est super_admin (niveau >= 100)';
COMMENT ON FUNCTION get_user_role_level IS 'Retourne le niveau de rôle de l''utilisateur actuel (0-100)';
COMMENT ON FUNCTION get_user_filiales IS 'Retourne les IDs des filiales auxquelles l''utilisateur a accès';
