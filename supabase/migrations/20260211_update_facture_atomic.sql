-- ============================================================
-- Fonction pour mise à jour atomique des factures avec leurs lignes
-- ============================================================
-- Cette fonction garantit que la mise à jour d'une facture et de ses lignes
-- se fait de manière atomique (tout ou rien) dans une transaction.
--
-- Usage: SELECT update_facture_with_lignes(facture_id, facture_data, lignes_data)

CREATE OR REPLACE FUNCTION update_facture_with_lignes(
  p_facture_id INTEGER,
  p_facture_data JSONB,
  p_lignes JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_ligne JSONB;
  v_index INTEGER := 0;
BEGIN
  -- Vérifier que la facture existe
  IF NOT EXISTS (SELECT 1 FROM factures WHERE id = p_facture_id) THEN
    RAISE EXCEPTION 'Facture % non trouvée', p_facture_id;
  END IF;

  -- 1. Mettre à jour la facture
  UPDATE factures
  SET
    numero = COALESCE((p_facture_data->>'numero')::TEXT, numero),
    date_emission = COALESCE((p_facture_data->>'date_emission')::DATE, date_emission),
    date_echeance = COALESCE((p_facture_data->>'date_echeance')::DATE, date_echeance),
    client_id = COALESCE((p_facture_data->>'client_id')::INTEGER, client_id),
    filiale_id = COALESCE((p_facture_data->>'filiale_id')::INTEGER, filiale_id),
    statut = COALESCE((p_facture_data->>'statut')::TEXT, statut),
    type = COALESCE((p_facture_data->>'type')::TEXT, type),
    contrat_id = (p_facture_data->>'contrat_id')::INTEGER,
    montant_ht = COALESCE((p_facture_data->>'montant_ht')::NUMERIC, montant_ht),
    montant_tva = COALESCE((p_facture_data->>'montant_tva')::NUMERIC, montant_tva),
    montant_ttc = COALESCE((p_facture_data->>'montant_ttc')::NUMERIC, montant_ttc),
    notes = (p_facture_data->>'notes')::TEXT,
    updated_at = NOW()
  WHERE id = p_facture_id;

  -- 2. Supprimer toutes les anciennes lignes
  DELETE FROM facture_lignes WHERE facture_id = p_facture_id;

  -- 3. Insérer les nouvelles lignes
  FOREACH v_ligne IN ARRAY p_lignes
  LOOP
    INSERT INTO facture_lignes (
      facture_id,
      description,
      quantite,
      prix_unitaire,
      taux_tva,
      montant_ht,
      montant_tva,
      montant_ttc,
      ordre
    ) VALUES (
      p_facture_id,
      (v_ligne->>'description')::TEXT,
      (v_ligne->>'quantite')::INTEGER,
      (v_ligne->>'prix_unitaire')::NUMERIC,
      (v_ligne->>'taux_tva')::NUMERIC,
      (v_ligne->>'montant_ht')::NUMERIC,
      (v_ligne->>'montant_tva')::NUMERIC,
      (v_ligne->>'montant_ttc')::NUMERIC,
      v_index
    );
    v_index := v_index + 1;
  END LOOP;

  -- 4. Retourner le résultat avec le nombre de lignes insérées
  v_result := jsonb_build_object(
    'success', true,
    'facture_id', p_facture_id,
    'lignes_count', v_index,
    'message', format('Facture %s mise à jour avec %s lignes', p_facture_id, v_index)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, PostgreSQL annule automatiquement toute la transaction
    RAISE EXCEPTION 'Erreur mise à jour facture: %', SQLERRM;
END;
$$;

-- ============================================================
-- Permissions
-- ============================================================
-- Permettre l'exécution à tous les utilisateurs authentifiés
-- (les permissions seront vérifiées au niveau applicatif)
GRANT EXECUTE ON FUNCTION update_facture_with_lignes TO authenticated;

-- ============================================================
-- Commentaires
-- ============================================================
COMMENT ON FUNCTION update_facture_with_lignes IS
'Met à jour une facture et ses lignes de manière atomique dans une transaction.
Si une erreur survient, toutes les modifications sont annulées (rollback automatique).';
