# Guide de Tests RLS - Row Level Security

**Objectif** : Valider que les politiques RLS fonctionnent correctement pour tous les rôles utilisateurs.

---

## 1. HIÉRARCHIE DES RÔLES

```
super_admin (niveau 100)
    ↓
admin (niveau 80)
    ↓
directeur (niveau 60)
    ↓
manager/responsable (niveau 40)
    ↓
employe (niveau 20)
```

### Permissions par niveau

| Niveau | Rôle | Accès Filiales | Peut créer | Peut supprimer |
|--------|------|----------------|------------|----------------|
| 100 | super_admin | TOUTES | Tout | Tout |
| 80 | admin | TOUTES | Presque tout | Factures, Contrats |
| 60 | directeur | Affectées uniquement | Clients, Employés, Factures | Non |
| 40 | manager/responsable | Affectées uniquement | Clients, Factures, Workflows | Non |
| 20 | employe | Affectées uniquement | Workflows | Non |

---

## 2. MATRICE DES TESTS

### TEST SUITE 1: Accès par Filiale

#### T-RLS-001: Employé voit seulement sa filiale
```
Rôle: employe
Filiale assignée: Filiale A
Action: SELECT factures
Résultat attendu: ✅ Voir uniquement factures de Filiale A
Test manuel:
1. Se connecter comme employe@filiale-a.com
2. Aller sur /finance/factures
3. Vérifier que seules les factures de Filiale A apparaissent
```

#### T-RLS-002: Employé ne voit pas autres filiales
```
Rôle: employe
Filiale assignée: Filiale A
Action: SELECT factures WHERE filiale_id = Filiale B
Résultat attendu: ✅ Aucune facture retournée (RLS bloque)
Test manuel:
1. Se connecter comme employe@filiale-a.com
2. Essayer d'accéder /finance/factures?filiale=B
3. Vérifier qu'aucune facture n'apparaît
```

#### T-RLS-003: Manager multi-filiales
```
Rôle: manager
Filiales assignées: Filiale A, Filiale B
Action: SELECT clients
Résultat attendu: ✅ Voir clients de A et B uniquement
Test manuel:
1. Se connecter comme manager@multi-filiales.com
2. Aller sur /finance/clients
3. Vérifier que seuls les clients de A et B apparaissent
```

#### T-RLS-004: Directeur crée employé dans sa filiale
```
Rôle: directeur
Filiale assignée: Filiale A
Action: INSERT employes SET filiale_id = A
Résultat attendu: ✅ Création réussie
Test manuel:
1. Se connecter comme directeur@filiale-a.com
2. Aller sur /employes/nouveau
3. Créer un employé avec filiale = A
4. Vérifier succès
```

#### T-RLS-005: Directeur ne peut PAS créer dans autre filiale
```
Rôle: directeur
Filiale assignée: Filiale A
Action: INSERT employes SET filiale_id = B
Résultat attendu: ❌ Erreur RLS (403 ou erreur serveur)
Test manuel:
1. Se connecter comme directeur@filiale-a.com
2. Aller sur /employes/nouveau
3. Essayer de sélectionner filiale = B
4. Soumettre le formulaire
5. Vérifier erreur : "Accès refusé par les politiques de sécurité"
```

#### T-RLS-006: Super admin voit tout
```
Rôle: super_admin
Filiales: TOUTES
Action: SELECT factures
Résultat attendu: ✅ Voir toutes les factures de toutes filiales
Test manuel:
1. Se connecter comme super-admin@holding.com
2. Aller sur /finance/factures
3. Vérifier que toutes les factures apparaissent (A, B, C, etc.)
```

---

### TEST SUITE 2: Permissions API Routes

#### T-API-001: Employé ne peut PAS supprimer facture
```
Rôle: employe (niveau 20)
Endpoint: DELETE /api/factures/1
Résultat attendu: ❌ 403 Permission denied
Test manuel:
1. Se connecter comme employe@filiale-a.com
2. Aller sur /finance/factures/1
3. Cliquer sur bouton "Supprimer" (si visible)
4. Vérifier erreur : "Permission denied" (roleNiveau < 80)
```

#### T-API-002: Manager peut modifier facture de sa filiale
```
Rôle: manager (niveau 40)
Filiale: A
Endpoint: PUT /api/factures/1 (facture de filiale A)
Résultat attendu: ✅ 200 OK
Test manuel:
1. Se connecter comme manager@filiale-a.com
2. Modifier facture de filiale A
3. Sauvegarder
4. Vérifier succès
```

#### T-API-003: Manager ne peut PAS modifier facture d'autre filiale
```
Rôle: manager (niveau 40)
Filiale: A
Endpoint: PUT /api/factures/2 (facture de filiale B)
Résultat attendu: ❌ 404 ou 403 (RLS bloque)
Test manuel:
1. Se connecter comme manager@filiale-a.com
2. Essayer d'accéder /finance/factures/2/edit (facture de filiale B)
3. Vérifier erreur : "Ressource introuvable ou accès refusé"
```

#### T-API-004: Admin peut supprimer facture
```
Rôle: admin (niveau 80)
Endpoint: DELETE /api/factures/1
Résultat attendu: ✅ 200 OK (si conditions métier respectées)
Test manuel:
1. Se connecter comme admin@holding.com
2. Aller sur /finance/factures/1 (facture brouillon)
3. Supprimer la facture
4. Vérifier succès
```

#### T-API-005: Utilisateur non authentifié
```
Rôle: Aucun (non connecté)
Endpoint: GET /api/factures/1
Résultat attendu: ❌ 401 Unauthorized
Test manuel:
1. Se déconnecter
2. Essayer d'accéder /finance/factures
3. Vérifier redirection vers /login
```

---

### TEST SUITE 3: Restrictions d'État

#### T-STATE-001: Impossible de supprimer facture payée
```
Statut: payee
Rôle: admin (autorisé à supprimer)
Action: DELETE facture
Résultat attendu: ❌ 400 "Impossible de supprimer une facture payée"
Test manuel:
1. Se connecter comme admin
2. Créer facture et la marquer comme "payee"
3. Essayer de la supprimer
4. Vérifier erreur métier
```

#### T-STATE-002: Impossible de supprimer facture partiellement payée
```
Statut: partiellement_payee
Rôle: admin
Action: DELETE facture
Résultat attendu: ❌ 400 "Impossible de supprimer une facture partiellement payée"
Test manuel:
1. Se connecter comme admin
2. Créer facture et ajouter un paiement partiel
3. Essayer de la supprimer
4. Vérifier erreur métier
```

#### T-STATE-003: Possible de supprimer facture brouillon
```
Statut: brouillon
Rôle: admin
Action: DELETE facture
Résultat attendu: ✅ 200 OK
Test manuel:
1. Se connecter comme admin
2. Créer facture en brouillon
3. La supprimer
4. Vérifier succès
```

#### T-STATE-004: Impossible de supprimer contrat actif
```
Statut: actif
Rôle: admin
Action: DELETE contrat
Résultat attendu: ❌ 400 "Impossible de supprimer un contrat actif"
Test manuel:
1. Se connecter comme admin
2. Créer contrat et le marquer comme "actif"
3. Essayer de le supprimer
4. Vérifier erreur métier
```

#### T-STATE-005: Impossible de supprimer contrat avec factures liées
```
Conditions: contrat a des factures associées
Rôle: admin
Action: DELETE contrat
Résultat attendu: ❌ 400 "Impossible de supprimer : des factures sont liées à ce contrat"
Test manuel:
1. Se connecter comme admin
2. Créer contrat + factures liées
3. Essayer de supprimer le contrat
4. Vérifier erreur métier
```

---

### TEST SUITE 4: Affectations Temporelles

#### T-TIME-001: Affectation active (date_fin = NULL)
```
Affectation: user → Filiale A (date_debut: 01/01/2025, date_fin: NULL)
Date actuelle: 14/02/2026
Résultat attendu: ✅ Accès à Filiale A
Test manuel:
1. Créer affectation sans date_fin
2. Se connecter comme cet utilisateur
3. Vérifier accès à la filiale
```

#### T-TIME-002: Affectation expirée
```
Affectation: user → Filiale A (date_debut: 01/01/2025, date_fin: 01/02/2026)
Date actuelle: 14/02/2026
Résultat attendu: ❌ Pas d'accès à Filiale A
Test manuel:
1. Créer affectation avec date_fin passée
2. Se connecter comme cet utilisateur
3. Vérifier que filiale n'apparaît pas dans les sélecteurs
```

#### T-TIME-003: Affectation expire aujourd'hui
```
Affectation: date_fin = 14/02/2026
Date actuelle: 14/02/2026
Résultat attendu: ✅ Encore actif (>= aujourd'hui)
Test manuel:
1. Créer affectation expirant aujourd'hui
2. Se connecter
3. Vérifier accès encore actif
```

---

### TEST SUITE 5: Cas Limites

#### T-EDGE-001: Utilisateur sans affectation
```
Setup: Utilisateur créé mais aucune ligne dans user_affectations
Résultat attendu: Voir aucune filiale (sauf super_admin)
Test manuel:
1. Créer utilisateur sans affectation
2. Se connecter
3. Vérifier que sélecteurs de filiales sont vides
```

#### T-EDGE-002: Utilisateur multi-filiales
```
Setup: user affecté à Filiale A et Filiale B
Résultat attendu: Voir données des 2 filiales uniquement
Test manuel:
1. Créer 2 affectations (A et B)
2. Se connecter
3. Vérifier liste de sélection montre A et B
4. Vérifier données affichées incluent A et B
```

#### T-EDGE-003: Facture_lignes hérite permissions facture
```
Setup: user a accès Filiale A
Action: SELECT facture_lignes WHERE facture.filiale_id = A
Résultat attendu: ✅ Voir les lignes
Test manuel:
1. Se connecter avec accès filiale A
2. Ouvrir facture de filiale A
3. Vérifier que les lignes s'affichent
```

#### T-EDGE-004: Update facture d'autre filiale
```
Setup: user filiale A essaie de modifier facture filiale B
Résultat attendu: ❌ 404 "Ressource introuvable ou accès refusé"
Test manuel:
1. Se connecter avec accès filiale A uniquement
2. Essayer d'éditer facture de filiale B via URL directe
3. Vérifier erreur RLS
```

---

## 3. CHECKLIST DE TESTS MANUELS

### Préparation
- [ ] Créer 3 filiales de test (Filiale A, B, C)
- [ ] Créer 5 utilisateurs de test (1 par rôle)
- [ ] Créer affectations temporelles (une active, une expirée)
- [ ] Créer données de test (clients, factures, contrats, employés)

### Exécution des tests

#### Tests Employé
- [ ] T-RLS-001: Voir seulement sa filiale
- [ ] T-RLS-002: Ne pas voir autres filiales
- [ ] T-API-001: Pas de permission DELETE
- [ ] T-EDGE-001: Sans affectation → aucune filiale

#### Tests Manager
- [ ] T-RLS-003: Multi-filiales visible
- [ ] T-API-002: Peut modifier sa filiale
- [ ] T-API-003: Ne peut pas modifier autre filiale

#### Tests Directeur
- [ ] T-RLS-004: Créer employé dans sa filiale
- [ ] T-RLS-005: Ne peut PAS créer dans autre filiale

#### Tests Admin
- [ ] T-RLS-006: Voit toutes les filiales (partout)
- [ ] T-API-004: Peut supprimer factures
- [ ] T-STATE-001: Bloqué par facture payée
- [ ] T-STATE-004: Bloqué par contrat actif

#### Tests Super Admin
- [ ] Accès illimité à toutes ressources
- [ ] Peut créer/modifier toutes filiales
- [ ] Peut supprimer (sauf restrictions métier)

#### Tests Temporels
- [ ] T-TIME-001: Affectation active (NULL)
- [ ] T-TIME-002: Affectation expirée
- [ ] T-TIME-003: Expire aujourd'hui

#### Tests Sécurité
- [ ] T-API-005: Redirection login si non authentifié
- [ ] Messages d'erreur RLS user-friendly
- [ ] Pas de leak d'informations sensibles

---

## 4. RÉSULTATS ATTENDUS

### Messages d'erreur RLS corrects
- **403** : "Accès refusé par les politiques de sécurité"
- **404** : "Ressource introuvable ou accès refusé"
- **400** : Messages métier (facture payée, contrat actif, etc.)
- **401** : "Non authentifié" (redirection login)

### Conformité
✅ Tous les tests doivent passer
✅ Aucune donnée d'autre filiale ne doit être visible
✅ Aucune action non autorisée ne doit réussir
✅ Messages d'erreur clairs et en français

---

## 5. FICHIERS CRITIQUES

- `supabase/migrations/20260211_enable_rls_policies_v5.sql` : Politiques RLS
- `src/lib/auth/permissions.ts` : Logique permissions
- `src/app/api/factures/[id]/route.ts` : Vérifications API
- `src/app/api/contrats/[id]/route.ts` : Vérifications API
- `src/lib/errors/parse-error.ts` : Parsing erreurs RLS

---

## 6. TESTS AUTOMATISÉS (Optionnel)

Pour automatiser ces tests, créer un fichier `tests/rls.test.ts` :

```typescript
describe('RLS Permissions', () => {
  it('T-RLS-001: Employé voit seulement sa filiale', async () => {
    const { data } = await supabase
      .from('factures')
      .select('*')

    expect(data.every(f => f.filiale_id === 'A')).toBe(true)
  })

  it('T-API-001: Employé ne peut pas DELETE', async () => {
    const response = await fetch('/api/factures/1', { method: 'DELETE' })
    expect(response.status).toBe(403)
  })
})
```

---

**Date de création** : 13 février 2026
**Dernière mise à jour** : 13 février 2026
**Responsable** : Équipe développement
