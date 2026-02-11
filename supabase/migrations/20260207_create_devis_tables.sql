-- Migration: Création des tables pour les devis
-- Date: 2026-02-07
-- Description: Ajoute les tables devis et devis_lignes pour la gestion des propositions commerciales

-- ============================================================
-- TABLE DEVIS
-- ============================================================
CREATE TABLE IF NOT EXISTS devis (
  id SERIAL PRIMARY KEY,
  filiale_id INTEGER NOT NULL REFERENCES filiales(id) ON DELETE RESTRICT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  numero VARCHAR(50) NOT NULL UNIQUE,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE NOT NULL,
  objet TEXT,
  total_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  total_tva DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti')),
  facture_id INTEGER REFERENCES factures(id) ON DELETE SET NULL,
  notes TEXT,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devis_filiale ON devis(filiale_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_date_validite ON devis(date_validite);

-- ============================================================
-- TABLE DEVIS_LIGNES
-- ============================================================
CREATE TABLE IF NOT EXISTS devis_lignes (
  id SERIAL PRIMARY KEY,
  devis_id INTEGER NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(12, 2) NOT NULL DEFAULT 0,
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  montant_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_tva DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devis_lignes_devis ON devis_lignes(devis_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Fonction pour calculer les montants d'une ligne de devis
CREATE OR REPLACE FUNCTION calculate_devis_ligne_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_ht := NEW.quantite * NEW.prix_unitaire;
  NEW.montant_tva := NEW.montant_ht * (NEW.taux_tva / 100);
  NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer les montants avant insertion/update d'une ligne
DROP TRIGGER IF EXISTS trigger_calculate_devis_ligne_amounts ON devis_lignes;
CREATE TRIGGER trigger_calculate_devis_ligne_amounts
  BEFORE INSERT OR UPDATE ON devis_lignes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_devis_ligne_amounts();

-- Fonction pour mettre à jour les totaux du devis
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
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les totaux du devis
DROP TRIGGER IF EXISTS trigger_update_devis_totals ON devis_lignes;
CREATE TRIGGER trigger_update_devis_totals
  AFTER INSERT OR UPDATE OR DELETE ON devis_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_totals();

-- Fonction pour mettre à jour updated_at sur le devis
CREATE OR REPLACE FUNCTION update_devis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_devis_updated_at ON devis;
CREATE TRIGGER trigger_update_devis_updated_at
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_lignes ENABLE ROW LEVEL SECURITY;

-- Politique pour devis: les utilisateurs peuvent voir les devis de leurs filiales
DROP POLICY IF EXISTS "Users can view devis of their filiales" ON devis;
CREATE POLICY "Users can view devis of their filiales"
  ON devis FOR SELECT
  USING (
    filiale_id IN (
      SELECT filiale_id FROM user_affectations
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.nom IN ('super_admin', 'admin')
    )
  );

-- Politique pour insérer des devis
DROP POLICY IF EXISTS "Users can insert devis" ON devis;
CREATE POLICY "Users can insert devis"
  ON devis FOR INSERT
  WITH CHECK (
    filiale_id IN (
      SELECT filiale_id FROM user_affectations
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.nom IN ('super_admin', 'admin')
    )
  );

-- Politique pour modifier des devis
DROP POLICY IF EXISTS "Users can update devis" ON devis;
CREATE POLICY "Users can update devis"
  ON devis FOR UPDATE
  USING (
    filiale_id IN (
      SELECT filiale_id FROM user_affectations
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.nom IN ('super_admin', 'admin')
    )
  );

-- Politique pour supprimer des devis (brouillons uniquement)
DROP POLICY IF EXISTS "Users can delete draft devis" ON devis;
CREATE POLICY "Users can delete draft devis"
  ON devis FOR DELETE
  USING (
    statut = 'brouillon'
    AND (
      filiale_id IN (
        SELECT filiale_id FROM user_affectations
        WHERE user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.nom IN ('super_admin', 'admin')
      )
    )
  );

-- Politiques pour devis_lignes (hérite de la visibilité du devis parent)
DROP POLICY IF EXISTS "Users can view devis_lignes" ON devis_lignes;
CREATE POLICY "Users can view devis_lignes"
  ON devis_lignes FOR SELECT
  USING (
    devis_id IN (SELECT id FROM devis)
  );

DROP POLICY IF EXISTS "Users can insert devis_lignes" ON devis_lignes;
CREATE POLICY "Users can insert devis_lignes"
  ON devis_lignes FOR INSERT
  WITH CHECK (
    devis_id IN (SELECT id FROM devis WHERE statut = 'brouillon')
  );

DROP POLICY IF EXISTS "Users can update devis_lignes" ON devis_lignes;
CREATE POLICY "Users can update devis_lignes"
  ON devis_lignes FOR UPDATE
  USING (
    devis_id IN (SELECT id FROM devis WHERE statut = 'brouillon')
  );

DROP POLICY IF EXISTS "Users can delete devis_lignes" ON devis_lignes;
CREATE POLICY "Users can delete devis_lignes"
  ON devis_lignes FOR DELETE
  USING (
    devis_id IN (SELECT id FROM devis WHERE statut = 'brouillon')
  );

-- ============================================================
-- FONCTION POUR GÉNÉRER UN NUMÉRO DE DEVIS
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
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON TABLE devis IS 'Table des devis/propositions commerciales';
COMMENT ON TABLE devis_lignes IS 'Lignes de détail des devis';
COMMENT ON COLUMN devis.statut IS 'brouillon: en cours de rédaction, envoye: envoyé au client, accepte: validé par le client, refuse: refusé, expire: date de validité dépassée, converti: transformé en facture';
COMMENT ON COLUMN devis.facture_id IS 'Référence vers la facture créée si le devis est converti';
