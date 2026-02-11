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

### `20260211_enable_rls_policies.sql`
**Objectif:** Activer Row Level Security (RLS) et créer des politiques de sécurité pour toutes les tables critiques.

**Ce qui est créé:**
- Activation de RLS sur 11 tables (factures, contrats, clients, filiales, employes, users, etc.)
- 3 fonctions helper: `is_super_admin()`, `get_user_role_level()`, `get_user_filiales()`
- 50+ politiques RLS garantissant l'accès selon les affectations et permissions

**Politiques principales:**
- **Lecture:** Accès uniquement aux données des filiales assignées (sauf super_admin)
- **Création:** Selon niveau de rôle (employé+ pour clients, manager+ pour transactions)
- **Modification:** Manager+ pour ses filiales
- **Suppression:** Admin+ uniquement

**Niveaux de rôle:**
- `super_admin` (100): Accès complet à toutes les données
- `admin` (80): Peut créer/modifier/supprimer dans toutes les filiales
- `directeur` (60): Lecture toutes filiales, modification ses filiales
- `manager` (40): Gestion complète de ses filiales assignées
- `responsable` (30): Lecture/création dans ses filiales
- `employe` (20): Lecture/création limitée

**Impact:**
- 🔴 Critical: Empêche l'accès non autorisé aux données sensibles AU NIVEAU DE LA BASE
- 🔴 Critical: Protection même si l'application a des failles de sécurité
- ✅ Les permissions sont appliquées automatiquement sur toutes les requêtes
- ✅ Impossible de contourner via des requêtes SQL directes

**Test après application:**
```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('factures', 'clients', 'contrats', 'filiales');

-- Lister toutes les politiques créées
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Tester en tant qu'utilisateur (remplacer user_id)
SET request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM factures; -- Ne doit retourner que les factures des filiales assignées
```

**⚠️ IMPORTANT:**
- Appliquer cette migration en **DERNIER** (après avoir vérifié que l'app fonctionne)
- Une fois RLS activé, toutes les requêtes sont filtrées
- Si l'application ne fonctionne plus, c'est probablement un problème de politiques RLS

---

## Rollback

Si vous devez annuler une migration :

### Rollback `20260211_update_facture_atomic.sql`
```sql
-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_facture_with_lignes(INTEGER, JSONB, JSONB[]);
```

### Rollback `20260211_enable_rls_policies.sql`
```sql
-- Désactiver RLS sur toutes les tables
ALTER TABLE factures DISABLE ROW LEVEL SECURITY;
ALTER TABLE facture_lignes DISABLE ROW LEVEL SECURITY;
ALTER TABLE contrats DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;
ALTER TABLE filiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE employes DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertes DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques (automatique avec DROP POLICY CASCADE)
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS get_user_role_level();
DROP FUNCTION IF EXISTS get_user_filiales();
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
