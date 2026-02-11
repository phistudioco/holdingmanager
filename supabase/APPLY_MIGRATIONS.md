# Application des Migrations Supabase

Ce fichier explique comment appliquer les migrations SQL sur votre projet Supabase.

## Méthode 1 : Via le Dashboard Supabase (Recommandé pour débutants)

1. **Accédez au Dashboard Supabase**
   - URL: https://app.supabase.com
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Dans le menu latéral, cliquez sur "SQL Editor"

3. **Créez une nouvelle requête**
   - Cliquez sur "+ New query"

4. **Copiez-collez le contenu de la migration**
   - Ouvrez le fichier: `supabase/migrations/20260211_update_facture_atomic.sql`
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL

5. **Exécutez la migration**
   - Cliquez sur "Run" (ou Ctrl+Enter)
   - Vérifiez qu'il n'y a pas d'erreurs

6. **Vérifiez que la fonction a été créée**
   ```sql
   SELECT proname, prosrc
   FROM pg_proc
   WHERE proname = 'update_facture_with_lignes';
   ```

---

## Méthode 2 : Via Supabase CLI (Recommandé pour production)

### Prérequis
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login
```

### Initialiser le projet local
```bash
# Dans le dossier racine du projet
supabase init

# Lier au projet distant
supabase link --project-ref your-project-ref
```

### Appliquer les migrations
```bash
# Appliquer toutes les migrations non appliquées
supabase db push

# Ou appliquer une migration spécifique
supabase db push --include-all
```

### Vérifier le statut
```bash
# Voir les migrations appliquées
supabase migration list

# Voir les différences avec le schéma distant
supabase db diff
```

---

## Méthode 3 : Manuellement via psql (Avancé)

```bash
# Se connecter à votre base Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Exécuter le fichier de migration
\i supabase/migrations/20260211_update_facture_atomic.sql

# Vérifier
\df update_facture_with_lignes
```

---

## Migrations Disponibles

### `20260211_update_facture_atomic.sql`
**Objectif:** Créer une fonction PostgreSQL pour mettre à jour les factures et leurs lignes de manière atomique.

**Ce qui est créé:**
- Fonction `update_facture_with_lignes(facture_id, facture_data, lignes_data)`
- Transaction atomique garantissant la cohérence des données
- Rollback automatique en cas d'erreur

**Impact:**
- 🔴 Critical: Empêche la perte de données lors des mises à jour de factures
- ✅ Les mises à jour de factures deviennent transactionnelles

**Test après application:**
```sql
-- Tester la fonction (remplacez les valeurs par des données réelles)
SELECT update_facture_with_lignes(
  1,  -- ID de la facture
  '{"statut": "brouillon", "notes": "Test transaction"}'::jsonb,  -- Données facture
  ARRAY[
    '{"description": "Ligne 1", "quantite": 1, "prix_unitaire": 100, "taux_tva": 20, "montant_ht": 100, "montant_tva": 20, "montant_ttc": 120}'::jsonb,
    '{"description": "Ligne 2", "quantite": 2, "prix_unitaire": 50, "taux_tva": 20, "montant_ht": 100, "montant_tva": 20, "montant_ttc": 120}'::jsonb
  ]  -- Lignes de la facture
);
```

---

## Rollback

Si vous devez annuler une migration :

```sql
-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_facture_with_lignes(INTEGER, JSONB, JSONB[]);
```

---

## Bonnes Pratiques

1. **Toujours tester en local d'abord**
   - Créez une branche Git
   - Appliquez la migration localement
   - Testez l'application

2. **Backup avant migration en production**
   ```bash
   # Via Supabase Dashboard
   # Settings > Database > Create backup
   ```

3. **Appliquer en heures creuses**
   - Minimise l'impact sur les utilisateurs
   - Facilite le rollback si nécessaire

4. **Versionner les migrations**
   - Format: `YYYYMMDD_description.sql`
   - Jamais modifier une migration appliquée
   - Créer une nouvelle migration pour les corrections

---

## Aide

- **Documentation Supabase:** https://supabase.com/docs/guides/database/migrations
- **Support:** https://supabase.com/support
- **Problèmes:** Ouvrir une issue dans le dépôt GitHub du projet
