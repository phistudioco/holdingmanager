-- ============================================================
-- MIGRATION: Correction search_path des fonctions PostgreSQL
-- Date: 2026-02-10
-- Description: Ajoute SET search_path = public pour sécuriser les fonctions
-- ============================================================
-- Cette migration corrige une vulnérabilité de sécurité potentielle
-- où les fonctions sans search_path défini peuvent être exploitées
-- via des attaques par injection de schéma.
-- ============================================================

-- ============================================================
-- 1. update_updated_at_column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 2. calculate_facture_ligne_totals
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_facture_ligne_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.montant_ht := NEW.quantite * NEW.prix_unitaire;
    NEW.montant_tva := NEW.montant_ht * (NEW.taux_tva / 100);
    NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 3. update_facture_totals
-- ============================================================
CREATE OR REPLACE FUNCTION update_facture_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_total_ht DECIMAL(15, 2);
    new_total_tva DECIMAL(15, 2);
    new_total_ttc DECIMAL(15, 2);
    facture_record factures%ROWTYPE;
BEGIN
    -- Déterminer l'ID de la facture à mettre à jour
    IF TG_OP = 'DELETE' THEN
        SELECT COALESCE(SUM(montant_ht), 0), COALESCE(SUM(montant_tva), 0), COALESCE(SUM(montant_ttc), 0)
        INTO new_total_ht, new_total_tva, new_total_ttc
        FROM facture_lignes
        WHERE facture_id = OLD.facture_id;

        UPDATE factures
        SET total_ht = new_total_ht,
            total_tva = new_total_tva,
            total_ttc = new_total_ttc
        WHERE id = OLD.facture_id;
    ELSE
        SELECT COALESCE(SUM(montant_ht), 0), COALESCE(SUM(montant_tva), 0), COALESCE(SUM(montant_ttc), 0)
        INTO new_total_ht, new_total_tva, new_total_ttc
        FROM facture_lignes
        WHERE facture_id = NEW.facture_id;

        UPDATE factures
        SET total_ht = new_total_ht,
            total_tva = new_total_tva,
            total_ttc = new_total_ttc
        WHERE id = NEW.facture_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 4. handle_new_user (SECURITY DEFINER)
-- ============================================================
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- 5. get_user_filiales (SECURITY DEFINER)
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- 6. user_has_filiale_access (SECURITY DEFINER)
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- 7. calculate_devis_ligne_amounts
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_devis_ligne_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_ht := NEW.quantite * NEW.prix_unitaire;
  NEW.montant_tva := NEW.montant_ht * (NEW.taux_tva / 100);
  NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 8. update_devis_totals
-- ============================================================
CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht DECIMAL(12, 2);
  v_total_tva DECIMAL(12, 2);
  v_total_ttc DECIMAL(12, 2);
  v_devis_id INTEGER;
BEGIN
  -- Déterminer l'ID du devis concerné
  IF TG_OP = 'DELETE' THEN
    v_devis_id := OLD.devis_id;
  ELSE
    v_devis_id := NEW.devis_id;
  END IF;

  -- Calculer les totaux
  SELECT
    COALESCE(SUM(montant_ht), 0),
    COALESCE(SUM(montant_tva), 0),
    COALESCE(SUM(montant_ttc), 0)
  INTO v_total_ht, v_total_tva, v_total_ttc
  FROM devis_lignes
  WHERE devis_id = v_devis_id;

  -- Mettre à jour le devis
  UPDATE devis
  SET
    total_ht = v_total_ht,
    total_tva = v_total_tva,
    total_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = v_devis_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 9. update_devis_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_devis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 10. generate_devis_numero
-- ============================================================
CREATE OR REPLACE FUNCTION generate_devis_numero(p_filiale_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_filiale_code VARCHAR(20);
  v_count INTEGER;
  v_numero VARCHAR(50);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');

  -- Récupérer le code de la filiale
  SELECT code INTO v_filiale_code FROM filiales WHERE id = p_filiale_id;

  -- Compter les devis du mois
  SELECT COUNT(*) + 1 INTO v_count
  FROM devis
  WHERE filiale_id = p_filiale_id
    AND date_emission >= DATE_TRUNC('month', CURRENT_DATE)
    AND date_emission < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

  -- Générer le numéro: DEV-CODE-YYYYMM-XXXX
  v_numero := 'DEV-' || COALESCE(v_filiale_code, 'PHI') || '-' || v_year || v_month || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- 11. generate_facture_numero (fonction utilitaire supplémentaire)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_facture_numero(p_filiale_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_filiale_code VARCHAR(20);
  v_count INTEGER;
  v_numero VARCHAR(50);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');

  -- Récupérer le code de la filiale
  SELECT code INTO v_filiale_code FROM filiales WHERE id = p_filiale_id;

  -- Compter les factures du mois
  SELECT COUNT(*) + 1 INTO v_count
  FROM factures
  WHERE filiale_id = p_filiale_id
    AND date_emission >= DATE_TRUNC('month', CURRENT_DATE)
    AND date_emission < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

  -- Générer le numéro: FAC-CODE-YYYYMM-XXXX
  v_numero := 'FAC-' || COALESCE(v_filiale_code, 'PHI') || '-' || v_year || v_month || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- COMMENTAIRES DE SÉCURITÉ
-- ============================================================
COMMENT ON FUNCTION update_updated_at_column() IS 'Met à jour automatiquement la colonne updated_at. search_path sécurisé.';
COMMENT ON FUNCTION calculate_facture_ligne_totals() IS 'Calcule les montants HT/TVA/TTC d''une ligne de facture. search_path sécurisé.';
COMMENT ON FUNCTION update_facture_totals() IS 'Met à jour les totaux d''une facture après modification des lignes. search_path sécurisé.';
COMMENT ON FUNCTION handle_new_user() IS 'Crée automatiquement un profil utilisateur. SECURITY DEFINER avec search_path sécurisé.';
COMMENT ON FUNCTION get_user_filiales(UUID) IS 'Retourne les filiales d''un utilisateur. SECURITY DEFINER avec search_path sécurisé.';
COMMENT ON FUNCTION user_has_filiale_access(UUID, INTEGER) IS 'Vérifie l''accès filiale. SECURITY DEFINER avec search_path sécurisé.';
COMMENT ON FUNCTION calculate_devis_ligne_amounts() IS 'Calcule les montants HT/TVA/TTC d''une ligne de devis. search_path sécurisé.';
COMMENT ON FUNCTION update_devis_totals() IS 'Met à jour les totaux d''un devis. search_path sécurisé.';
COMMENT ON FUNCTION update_devis_updated_at() IS 'Met à jour updated_at sur un devis. search_path sécurisé.';
COMMENT ON FUNCTION generate_devis_numero(INTEGER) IS 'Génère un numéro de devis unique. search_path sécurisé.';
COMMENT ON FUNCTION generate_facture_numero(INTEGER) IS 'Génère un numéro de facture unique. search_path sécurisé.';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
