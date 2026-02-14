# Migration createClient typé - Travaux restants

**Date** : 13 février 2026
**Statut** : 90% complété
**Problème** : Certaines tables retournent `never` dans les types générés

---

## ✅ Travaux complétés

### Migration createUntypedClient() → createClient()
- ✅ **36 fichiers** migrés de `createUntypedClient()` vers `createClient()`
- ✅ **Suppression** de la fonction `createUntypedClient()` dans `src/lib/supabase/client.ts`
- ✅ **Correction** de tous les imports dupliqués
- ✅ **API Routes** : Utilisation correcte de `createClient` depuis `@/lib/supabase/server`
- ✅ **105 insertions, 124 suppressions** (code plus propre)

### Fichiers migrés
- 12 formulaires (ClientForm, EmployeForm, etc.)
- 15+ pages (dashboard, portail)
- 4 hooks (useEntities, useNotifications, etc.)
- 2 moteurs (workflows, alertes)
- 2 API routes
- 1 helper (supabase/helpers.ts)

---

## ❌ Problèmes restants

### Erreurs TypeScript - Tables incompl`ètes

Certaines tables dans `src/types/database.ts` retournent `never` pour les opérations UPDATE/INSERT.

#### Fichiers affectés

1. **src/app/(dashboard)/admin/users/page.tsx** - Ligne 123
   ```typescript
   // Erreur: Argument of type '{ role_id: number; }' is not assignable to parameter of type 'never'
   await supabase.from('users').update({ role_id: roleId })
   ```
   **Fix temporaire** : Ajouté `(supabase as any)`

2. **src/app/(dashboard)/alertes/page.tsx** - Ligne 92
   ```typescript
   // Erreur: Argument of type '{ lue: boolean; }' is not assignable to parameter of type 'never'
   await supabase.from('alertes').update({ lue: true })
   ```

3. **Autres fichiers potentiellement affectés** :
   - src/lib/hooks/useNotificationPreferences.ts (table `notification_preferences`)
   - src/lib/hooks/usePushNotifications.ts (table `push_subscriptions`)
   - Possiblement d'autres pages/composants

---

## 🔧 Solutions proposées

### Option A : Régénérer les types avec Supabase CLI (Recommandé)

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Se connecter au projet
supabase login

# 3. Lier le projet
supabase link --project-ref <votre-project-ref>

# 4. Régénérer les types
supabase gen types typescript --project-id <votre-project-id> > src/types/database.generated.ts

# 5. Remplacer src/types/database.ts par database.generated.ts
```

**Avantages** :
- Types 100% à jour avec le schéma réel
- Autocomplete complet
- Détection d'erreurs à la compilation
- Pas de types `never`

**Durée estimée** : 30 minutes

---

### Option B : Compléter manuellement database.ts (Temporaire)

Ajouter les tables manquantes dans `src/types/database.ts` :

#### Tables à ajouter/corriger

1. **users** (Update manquant)
   ```typescript
   users: {
     Row: { ... }
     Insert: { ... }
     Update: {  // ← MANQUANT ou incomplet
       role_id?: number
       derniere_connexion?: string
       // etc.
     }
   }
   ```

2. **alertes** (Update manquant)
   ```typescript
   alertes: {
     Row: { ... }
     Insert: { ... }
     Update: {  // ← MANQUANT ou incomplet
       lue?: boolean
       // etc.
     }
   }
   ```

3. **notification_preferences** (Complètement manquante ?)
4. **push_subscriptions** (Complètement manquante ?)

**Avantages** :
- Fix rapide
- Pas besoin d'accès CLI Supabase

**Inconvénients** :
- Types peuvent devenir obsolètes
- Maintenance manuelle
- Risque d'erreurs

**Durée estimée** : 1-2 heures

---

### Option C : Type assertions temporaires (Actuelle)

Utiliser `as any` pour contourner les erreurs TypeScript temporairement.

```typescript
// Exemple dans admin/users/page.tsx
const { error } = await (supabase as any)
  .from('users')
  .update({ role_id: roleId })
```

**Avantages** :
- Fix immédiat
- Le code fonctionne

**Inconvénients** :
- ❌ Perte de type-safety
- ❌ Pas d'autocomplete
- ❌ Erreurs possibles au runtime
- ❌ Dette technique

**Statut** : Appliqué sur 1 fichier (admin/users/page.tsx)

---

## 📊 Impact sur le build

### Build actuel
```
Failed to compile.

./src/app/(dashboard)/alertes/page.tsx:92:43
Type error: Argument of type '{ lue: boolean; }' is not assignable to parameter of type 'never'.
```

### Après Option A (régénération types)
```
✓ Compiled successfully
✓ Generating static pages (49/49)
```

### Après Option B (compléter manuellement)
```
✓ Compiled successfully (avec avertissements possibles)
```

### Après Option C (type assertions)
```
✓ Compiled successfully (avec perte de type-safety)
```

---

## 🎯 Recommandation

**Utiliser l'Option A** (Régénération avec Supabase CLI) dès que possible pour :
- Avoir des types 100% corrects
- Éviter la dette technique
- Bénéficier pleinement de TypeScript
- Améliorer la maintenabilité

**En attendant** :
- Option C (type assertions) permet de continuer le développement
- Créer une tâche dans le backlog pour régénération des types

---

## 📝 Checklist post-migration

- [x] Remplacer tous les `createUntypedClient()` par `createClient()`
- [x] Supprimer fonction `createUntypedClient()` de client.ts
- [x] Corriger imports dupliqués
- [x] Vérifier API routes utilisent client serveur
- [ ] Régénérer types Supabase (Option A)
- [ ] Supprimer tous les `as any` temporaires
- [ ] Vérifier build passe à 100%
- [ ] Tests E2E validés

---

## 🔗 Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Generating TypeScript Types](https://supabase.com/docs/guides/api/generating-types)
- [TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

---

**Prochaine étape** : Appliquer Option A pour finaliser la migration à 100%.
