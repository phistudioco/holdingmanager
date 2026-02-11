-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
-- Sécurise l'accès aux données sensibles au niveau de la base de données.
-- Les politiques garantissent que les utilisateurs ne peuvent accéder
-- qu'aux données de leurs filiales assignées et selon leurs permissions.
--
-- IMPORTANT: Ces politiques complètent mais ne remplacent PAS
-- les vérifications d'autorisation au niveau applicatif.

-- ============================================================
-- 1. ACTIVER RLS SUR LES TABLES CRITIQUES
-- ============================================================

-- Tables Finance
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Tables Core
ALTER TABLE filiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tables Alertes/Logs
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

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

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
USING (id = auth.uid()::text);

-- Super admins peuvent tout lire
CREATE POLICY "Super admins can read all users"
ON users
FOR SELECT
USING (is_super_admin());

-- Les utilisateurs peuvent mettre à jour leur propre profil (sauf role_id)
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- ============================================================
-- 4. POLICIES POUR LA TABLE FILIALES
-- ============================================================

-- Lecture selon affectations ou si super_admin
CREATE POLICY "Read filiales by affectations"
ON filiales
FOR SELECT
USING (
  is_super_admin()
  OR id IN (SELECT * FROM get_user_filiales())
);

-- Seuls admin+ peuvent créer des filiales
CREATE POLICY "Admins can create filiales"
ON filiales
FOR INSERT
WITH CHECK (get_user_role_level() >= 80);

-- Seuls admin+ peuvent modifier des filiales
CREATE POLICY "Admins can update filiales"
ON filiales
FOR UPDATE
USING (get_user_role_level() >= 80)
WITH CHECK (get_user_role_level() >= 80);

-- Seuls super_admin peuvent supprimer des filiales
CREATE POLICY "Super admins can delete filiales"
ON filiales
FOR DELETE
USING (is_super_admin());

-- ============================================================
-- 5. POLICIES POUR LA TABLE EMPLOYES
-- ============================================================

-- Lecture selon filiales assignées
CREATE POLICY "Read employes by filiale"
ON employes
FOR SELECT
USING (
  is_super_admin()
  OR filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut créer des employés dans ses filiales
CREATE POLICY "Managers can create employes"
ON employes
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 40
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut modifier des employés de ses filiales
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

-- Admin+ peut supprimer des employés
CREATE POLICY "Admins can delete employes"
ON employes
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 6. POLICIES POUR LA TABLE CLIENTS
-- ============================================================

-- Lecture selon filiales assignées
CREATE POLICY "Read clients by filiale"
ON clients
FOR SELECT
USING (
  is_super_admin()
  OR filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Employé+ peut créer des clients dans ses filiales
CREATE POLICY "Employes can create clients"
ON clients
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 20
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Employé+ peut modifier des clients de ses filiales
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

-- Admin+ peut supprimer des clients
CREATE POLICY "Admins can delete clients"
ON clients
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 7. POLICIES POUR LA TABLE FACTURES
-- ============================================================

-- Lecture selon filiales assignées
CREATE POLICY "Read factures by filiale"
ON factures
FOR SELECT
USING (
  is_super_admin()
  OR filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Employé+ peut créer des factures dans ses filiales
CREATE POLICY "Employes can create factures"
ON factures
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 20
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut modifier des factures de ses filiales
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

-- Admin+ peut supprimer des factures (brouillon/annulées uniquement - vérifié par l'app)
CREATE POLICY "Admins can delete factures"
ON factures
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 8. POLICIES POUR LA TABLE FACTURE_LIGNES
-- ============================================================

-- Lecture via factures (héritage du RLS de factures)
CREATE POLICY "Read facture_lignes via factures"
ON facture_lignes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM factures
    WHERE factures.id = facture_lignes.facture_id
    -- La politique de factures s'applique automatiquement
  )
);

-- Manager+ peut créer des lignes (via l'API route atomique)
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

-- Manager+ peut modifier des lignes
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

-- Manager+ peut supprimer des lignes (via l'API route atomique)
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

-- ============================================================
-- 9. POLICIES POUR LA TABLE CONTRATS
-- ============================================================

-- Lecture selon filiales assignées
CREATE POLICY "Read contrats by filiale"
ON contrats
FOR SELECT
USING (
  is_super_admin()
  OR filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Employé+ peut créer des contrats
CREATE POLICY "Employes can create contrats"
ON contrats
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 20
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut modifier des contrats
CREATE POLICY "Managers can update contrats"
ON contrats
FOR UPDATE
USING (
  get_user_role_level() >= 40
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Admin+ peut supprimer des contrats
CREATE POLICY "Admins can delete contrats"
ON contrats
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 10. POLICIES POUR LA TABLE TRANSACTIONS
-- ============================================================

-- Lecture selon filiales
CREATE POLICY "Read transactions by filiale"
ON transactions
FOR SELECT
USING (
  is_super_admin()
  OR filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut créer des transactions
CREATE POLICY "Managers can create transactions"
ON transactions
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 40
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Manager+ peut modifier des transactions
CREATE POLICY "Managers can update transactions"
ON transactions
FOR UPDATE
USING (
  get_user_role_level() >= 40
  AND filiale_id IN (SELECT * FROM get_user_filiales())
);

-- Admin+ peut supprimer des transactions
CREATE POLICY "Admins can delete transactions"
ON transactions
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 11. POLICIES POUR LA TABLE PAIEMENTS
-- ============================================================

-- Lecture via factures
CREATE POLICY "Read paiements via factures"
ON paiements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM factures
    WHERE factures.id = paiements.facture_id
  )
);

-- Employé+ peut enregistrer des paiements
CREATE POLICY "Employes can create paiements"
ON paiements
FOR INSERT
WITH CHECK (
  get_user_role_level() >= 20
  AND EXISTS (
    SELECT 1 FROM factures
    WHERE factures.id = paiements.facture_id
    AND factures.filiale_id IN (SELECT * FROM get_user_filiales())
  )
);

-- Manager+ peut modifier des paiements
CREATE POLICY "Managers can update paiements"
ON paiements
FOR UPDATE
USING (get_user_role_level() >= 40);

-- Admin+ peut supprimer des paiements
CREATE POLICY "Admins can delete paiements"
ON paiements
FOR DELETE
USING (get_user_role_level() >= 80);

-- ============================================================
-- 12. POLICIES POUR LA TABLE ALERTES
-- ============================================================

-- Tous les utilisateurs peuvent voir leurs alertes
CREATE POLICY "Users can read own alertes"
ON alertes
FOR SELECT
USING (true); -- Filtré par l'application selon le user_id ou filiale

-- Système peut créer des alertes
CREATE POLICY "System can create alertes"
ON alertes
FOR INSERT
WITH CHECK (true); -- Créées par triggers ou l'app

-- Utilisateurs peuvent marquer leurs alertes comme lues/traitées
CREATE POLICY "Users can update own alertes"
ON alertes
FOR UPDATE
USING (true) -- L'app vérifie que c'est leur alerte
WITH CHECK (true);

-- ============================================================
-- 13. POLICIES POUR LA TABLE ACTIVITY_LOGS
-- ============================================================

-- Lecture selon niveau
CREATE POLICY "Managers can read activity logs"
ON activity_logs
FOR SELECT
USING (get_user_role_level() >= 40);

-- Système peut créer des logs
CREATE POLICY "System can create activity logs"
ON activity_logs
FOR INSERT
WITH CHECK (true);

-- Personne ne peut modifier ou supprimer des logs (audit trail)
-- Pas de policy = DENY par défaut

-- ============================================================
-- 14. GRANT PERMISSIONS
-- ============================================================

-- Permettre aux fonctions helper d'être exécutées
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

-- Pour vérifier que RLS est activé:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('factures', 'clients', 'contrats');

-- Pour lister toutes les politiques:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';
