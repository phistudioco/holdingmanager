-- ============================================================
-- MIGRATION: Renforcement des politiques RLS (Row Level Security)
-- Date: 2026-02-10
-- Description: Remplace les politiques permissives par des conditions
--              basées sur les rôles et les affectations utilisateur/filiale
-- ============================================================

-- ============================================================
-- FONCTION HELPER: Vérifier si l'utilisateur est admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.nom IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- FONCTION HELPER: Obtenir les IDs des filiales de l'utilisateur
-- ============================================================
CREATE OR REPLACE FUNCTION user_filiale_ids()
RETURNS SETOF INTEGER AS $$
BEGIN
  RETURN QUERY
  SELECT filiale_id FROM user_affectations
  WHERE user_id = auth.uid()
  AND (date_fin IS NULL OR date_fin >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- TABLES DE RÉFÉRENCE (lecture seule pour tous)
-- roles, pays, services, workflow_types
-- ============================================================

-- ROLES: Tout le monde peut lire, seuls les admins modifient
DROP POLICY IF EXISTS "roles_select_policy" ON roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
DROP POLICY IF EXISTS "roles_update_policy" ON roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON roles;

CREATE POLICY "roles_select_all" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert_admin" ON roles FOR INSERT TO authenticated WITH CHECK (is_admin_user());
CREATE POLICY "roles_update_admin" ON roles FOR UPDATE TO authenticated USING (is_admin_user());
CREATE POLICY "roles_delete_admin" ON roles FOR DELETE TO authenticated USING (is_admin_user());

-- PAYS: Tout le monde peut lire, seuls les admins modifient
DROP POLICY IF EXISTS "pays_select_policy" ON pays;
DROP POLICY IF EXISTS "pays_insert_policy" ON pays;
DROP POLICY IF EXISTS "pays_update_policy" ON pays;
DROP POLICY IF EXISTS "pays_delete_policy" ON pays;

CREATE POLICY "pays_select_all" ON pays FOR SELECT TO authenticated USING (true);
CREATE POLICY "pays_insert_admin" ON pays FOR INSERT TO authenticated WITH CHECK (is_admin_user());
CREATE POLICY "pays_update_admin" ON pays FOR UPDATE TO authenticated USING (is_admin_user());
CREATE POLICY "pays_delete_admin" ON pays FOR DELETE TO authenticated USING (is_admin_user());

-- SERVICES: Tout le monde peut lire, seuls les admins modifient
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

CREATE POLICY "services_select_all" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert_admin" ON services FOR INSERT TO authenticated WITH CHECK (is_admin_user());
CREATE POLICY "services_update_admin" ON services FOR UPDATE TO authenticated USING (is_admin_user());
CREATE POLICY "services_delete_admin" ON services FOR DELETE TO authenticated USING (is_admin_user());

-- WORKFLOW_TYPES: Tout le monde peut lire, seuls les admins modifient
DROP POLICY IF EXISTS "workflow_types_select_policy" ON workflow_types;
DROP POLICY IF EXISTS "workflow_types_insert_policy" ON workflow_types;
DROP POLICY IF EXISTS "workflow_types_update_policy" ON workflow_types;
DROP POLICY IF EXISTS "workflow_types_delete_policy" ON workflow_types;

CREATE POLICY "workflow_types_select_all" ON workflow_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_types_insert_admin" ON workflow_types FOR INSERT TO authenticated WITH CHECK (is_admin_user());
CREATE POLICY "workflow_types_update_admin" ON workflow_types FOR UPDATE TO authenticated USING (is_admin_user());
CREATE POLICY "workflow_types_delete_admin" ON workflow_types FOR DELETE TO authenticated USING (is_admin_user());

-- ============================================================
-- USERS: Chacun voit son profil, admins voient tout
-- ============================================================
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_select" ON users FOR SELECT TO authenticated
USING (id = auth.uid() OR is_admin_user());

CREATE POLICY "users_insert_admin" ON users FOR INSERT TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated
USING (id = auth.uid() OR is_admin_user());

CREATE POLICY "users_delete_admin" ON users FOR DELETE TO authenticated
USING (is_admin_user());

-- ============================================================
-- FILIALES: Accès selon affectations ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "filiales_select_policy" ON filiales;
DROP POLICY IF EXISTS "filiales_insert_policy" ON filiales;
DROP POLICY IF EXISTS "filiales_update_policy" ON filiales;
DROP POLICY IF EXISTS "filiales_delete_policy" ON filiales;

CREATE POLICY "filiales_select" ON filiales FOR SELECT TO authenticated
USING (id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "filiales_insert_admin" ON filiales FOR INSERT TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "filiales_update" ON filiales FOR UPDATE TO authenticated
USING (id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "filiales_delete_admin" ON filiales FOR DELETE TO authenticated
USING (is_admin_user());

-- ============================================================
-- EMPLOYES: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "employes_select_policy" ON employes;
DROP POLICY IF EXISTS "employes_insert_policy" ON employes;
DROP POLICY IF EXISTS "employes_update_policy" ON employes;
DROP POLICY IF EXISTS "employes_delete_policy" ON employes;

CREATE POLICY "employes_select" ON employes FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "employes_insert" ON employes FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "employes_update" ON employes FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "employes_delete" ON employes FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- CLIENTS: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- CONTRATS: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "contrats_select_policy" ON contrats;
DROP POLICY IF EXISTS "contrats_insert_policy" ON contrats;
DROP POLICY IF EXISTS "contrats_update_policy" ON contrats;
DROP POLICY IF EXISTS "contrats_delete_policy" ON contrats;

CREATE POLICY "contrats_select" ON contrats FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "contrats_insert" ON contrats FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "contrats_update" ON contrats FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "contrats_delete" ON contrats FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- FACTURES: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "factures_select_policy" ON factures;
DROP POLICY IF EXISTS "factures_insert_policy" ON factures;
DROP POLICY IF EXISTS "factures_update_policy" ON factures;
DROP POLICY IF EXISTS "factures_delete_policy" ON factures;

CREATE POLICY "factures_select" ON factures FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "factures_insert" ON factures FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "factures_update" ON factures FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "factures_delete" ON factures FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- FACTURE_LIGNES: Hérite de la visibilité de la facture parent
-- ============================================================
DROP POLICY IF EXISTS "facture_lignes_select_policy" ON facture_lignes;
DROP POLICY IF EXISTS "facture_lignes_insert_policy" ON facture_lignes;
DROP POLICY IF EXISTS "facture_lignes_update_policy" ON facture_lignes;
DROP POLICY IF EXISTS "facture_lignes_delete_policy" ON facture_lignes;

CREATE POLICY "facture_lignes_select" ON facture_lignes FOR SELECT TO authenticated
USING (
  facture_id IN (
    SELECT id FROM factures
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "facture_lignes_insert" ON facture_lignes FOR INSERT TO authenticated
WITH CHECK (
  facture_id IN (
    SELECT id FROM factures
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "facture_lignes_update" ON facture_lignes FOR UPDATE TO authenticated
USING (
  facture_id IN (
    SELECT id FROM factures
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "facture_lignes_delete" ON facture_lignes FOR DELETE TO authenticated
USING (
  facture_id IN (
    SELECT id FROM factures
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

-- ============================================================
-- TRANSACTIONS: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;

CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "transactions_delete" ON transactions FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- WORKFLOW_DEMANDES: Accès par filiale ou rôle admin
-- ============================================================
DROP POLICY IF EXISTS "workflow_demandes_select_policy" ON workflow_demandes;
DROP POLICY IF EXISTS "workflow_demandes_insert_policy" ON workflow_demandes;
DROP POLICY IF EXISTS "workflow_demandes_update_policy" ON workflow_demandes;
DROP POLICY IF EXISTS "workflow_demandes_delete_policy" ON workflow_demandes;

CREATE POLICY "workflow_demandes_select" ON workflow_demandes FOR SELECT TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "workflow_demandes_insert" ON workflow_demandes FOR INSERT TO authenticated
WITH CHECK (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "workflow_demandes_update" ON workflow_demandes FOR UPDATE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

CREATE POLICY "workflow_demandes_delete" ON workflow_demandes FOR DELETE TO authenticated
USING (filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user());

-- ============================================================
-- WORKFLOW_APPROBATIONS: Lié aux demandes accessibles
-- ============================================================
DROP POLICY IF EXISTS "workflow_approbations_select_policy" ON workflow_approbations;
DROP POLICY IF EXISTS "workflow_approbations_insert_policy" ON workflow_approbations;
DROP POLICY IF EXISTS "workflow_approbations_update_policy" ON workflow_approbations;
DROP POLICY IF EXISTS "workflow_approbations_delete_policy" ON workflow_approbations;

CREATE POLICY "workflow_approbations_select" ON workflow_approbations FOR SELECT TO authenticated
USING (
  demande_id IN (
    SELECT id FROM workflow_demandes
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "workflow_approbations_insert" ON workflow_approbations FOR INSERT TO authenticated
WITH CHECK (
  demande_id IN (
    SELECT id FROM workflow_demandes
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "workflow_approbations_update" ON workflow_approbations FOR UPDATE TO authenticated
USING (
  demande_id IN (
    SELECT id FROM workflow_demandes
    WHERE filiale_id IN (SELECT user_filiale_ids()) OR is_admin_user()
  )
);

CREATE POLICY "workflow_approbations_delete_admin" ON workflow_approbations FOR DELETE TO authenticated
USING (is_admin_user());

-- ============================================================
-- ALERTES: Tout le monde peut lire, seuls les admins suppriment
-- ============================================================
DROP POLICY IF EXISTS "alertes_select_policy" ON alertes;
DROP POLICY IF EXISTS "alertes_insert_policy" ON alertes;
DROP POLICY IF EXISTS "alertes_update_policy" ON alertes;
DROP POLICY IF EXISTS "alertes_delete_policy" ON alertes;

CREATE POLICY "alertes_select_all" ON alertes FOR SELECT TO authenticated USING (true);
CREATE POLICY "alertes_insert_all" ON alertes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alertes_update_all" ON alertes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "alertes_delete_admin" ON alertes FOR DELETE TO authenticated USING (is_admin_user());

-- ============================================================
-- NOTIFICATIONS: Chaque utilisateur voit ses propres notifications
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_admin_user());

-- ============================================================
-- USER_AFFECTATIONS: Chacun voit ses affectations, admins voient tout
-- ============================================================
DROP POLICY IF EXISTS "user_affectations_select_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_insert_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_update_policy" ON user_affectations;
DROP POLICY IF EXISTS "user_affectations_delete_policy" ON user_affectations;

CREATE POLICY "user_affectations_select" ON user_affectations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "user_affectations_insert_admin" ON user_affectations FOR INSERT TO authenticated
WITH CHECK (is_admin_user());

CREATE POLICY "user_affectations_update_admin" ON user_affectations FOR UPDATE TO authenticated
USING (is_admin_user());

CREATE POLICY "user_affectations_delete_admin" ON user_affectations FOR DELETE TO authenticated
USING (is_admin_user());

-- ============================================================
-- COMMENTAIRES
-- ============================================================
COMMENT ON FUNCTION is_admin_user() IS 'Vérifie si l''utilisateur courant a le rôle super_admin ou admin';
COMMENT ON FUNCTION user_filiale_ids() IS 'Retourne les IDs des filiales auxquelles l''utilisateur a accès';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
