# Guide de Déploiement - HoldingManager PHI Studios

---

## ÉTAPE 1 : Pousser le code sur GitHub

### 1.1 Ajouter et commiter les fichiers

```bash
cd "e:\Fi Studio\Holding Manager\holdingmanager-v2"
git add .
git commit -m "Prêt pour déploiement production"
```

### 1.2 Pousser sur GitHub

```bash
git push origin master
```

> **Note** : Si votre branche s'appelle `main`, utilisez `git push origin main`

**Résultat** : Le code est à jour sur GitHub.

---

## ÉTAPE 2 : Importer le projet dans Vercel

### 2.1 Aller sur Vercel

1. Connectez-vous sur https://vercel.com
2. Cliquez **Add New** → **Project**

### 2.2 Sélectionner le repository

1. Trouvez `holdingmanager-v2` dans la liste
2. Cliquez **Import**

### 2.3 Configurer le build

| Champ | Valeur |
|-------|--------|
| Framework Preset | `Next.js` |
| Root Directory | `./` |
| Build Command | `npm run build` |

---

## ÉTAPE 3 : Ajouter les variables d'environnement

Dans l'écran de configuration, dépliez **Environment Variables** et ajoutez :

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dmiqksxpneuvwgsxxbgq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon (depuis Supabase → Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service_role (depuis Supabase → Settings → API) |
| `NEXT_PUBLIC_APP_URL` | L'URL que Vercel vous donnera |
| `NEXT_PUBLIC_APP_NAME` | `HoldingManager` |
| `NEXT_PUBLIC_COMPANY_NAME` | `PHI Studios` |

---

## ÉTAPE 4 : Déployer

1. Cliquez **Deploy**
2. Attendez 2-5 minutes
3. Vercel vous donne l'URL de l'application

---

## ÉTAPE 5 : Appliquer les migrations SQL

### 5.1 Aller dans Supabase

1. https://supabase.com/dashboard
2. Ouvrir votre projet
3. **SQL Editor** → **New query**

### 5.2 Exécuter les migrations

Copiez-collez et exécutez ces 2 fichiers (un à la fois) :

1. `supabase/migrations/20260210_fix_functions_search_path.sql`
2. `supabase/migrations/20260210_fix_rls_policies.sql`

---

## ÉTAPE 6 : Mises à jour futures

Pour chaque modification :

```bash
git add .
git commit -m "Description"
git push
```

Vercel redéploie automatiquement.

---

## En cas de problème

- **Build échoue** : Vercel → Deployments → voir les logs
- **Données ne chargent pas** : Vérifier les variables d'environnement
- **Rollback** : Vercel → Deployments → ... → Promote to Production

---

*Guide créé le 10 février 2026*
