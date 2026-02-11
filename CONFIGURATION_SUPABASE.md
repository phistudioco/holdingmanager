# Configuration Supabase pour la Réinitialisation de Mot de Passe

## Problème Résolu

Le message "Auth session missing!" se produisait parce que la page de réinitialisation vérifiait la session trop tôt, avant que Supabase n'ait eu le temps d'échanger le token de récupération.

## Solution Implémentée

1. **Ajout d'un listener `onAuthStateChange`** pour détecter l'événement `PASSWORD_RECOVERY`
2. **État de chargement** pendant la vérification du lien
3. **Gestion des erreurs** pour les liens invalides ou expirés

## Configuration Requise dans Supabase Dashboard

Pour que le flux de réinitialisation fonctionne correctement, vous devez configurer les URLs de redirection dans votre projet Supabase.

### Étapes de Configuration

1. **Accédez au Supabase Dashboard** : https://app.supabase.com

2. **Sélectionnez votre projet** : `dmiqksxpneuvwgsxxbgq`

3. **Allez dans Authentication → URL Configuration**

4. **Ajoutez les URLs de redirection suivantes** dans "Redirect URLs" :

   ```
   https://holdingmanager.vercel.app/reset-password
   http://localhost:3001/reset-password
   http://localhost:3000/reset-password
   ```

5. **Configurez l'Email Template** (optionnel mais recommandé) :
   - Allez dans **Authentication → Email Templates**
   - Sélectionnez **Reset Password**
   - Vérifiez que le template contient : `{{ .ConfirmationURL }}`

### Template Email Recommandé

```html
<h2>Réinitialisation de votre mot de passe</h2>

<p>Bonjour,</p>

<p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte HoldingManager PHI Studios.</p>

<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>

<p>
  <a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a>
</p>

<p>Ce lien est valable pendant 1 heure.</p>

<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>

<p>Cordialement,<br>L'équipe PHI Studios</p>
```

## Flux Complet

1. **Utilisateur clique sur "Mot de passe oublié"** → `/forgot-password`
2. **Entre son email** → Supabase envoie un email avec lien de récupération
3. **Clique sur le lien dans l'email** → Redirige vers `/reset-password?token=...`
4. **Supabase établit une session** → Événement `PASSWORD_RECOVERY` détecté
5. **Formulaire affiché** → Utilisateur entre nouveau mot de passe
6. **Mot de passe mis à jour** → Redirection vers `/login`

## Test du Flux

1. Déployez les modifications sur Vercel
2. Allez sur https://holdingmanager.vercel.app/forgot-password
3. Entrez votre email : `matondomoise328@gmail.com`
4. Vérifiez votre boîte mail
5. Cliquez sur le lien de réinitialisation
6. Définissez votre nouveau mot de passe

## Dépannage

### "Lien invalide ou expiré"

- Vérifiez que les URLs de redirection sont bien configurées dans Supabase
- Le lien est valable 1 heure, demandez un nouveau lien si nécessaire

### "Email non reçu"

- Vérifiez vos spams
- Vérifiez que l'email est bien enregistré dans Supabase
- Vérifiez les logs d'emails dans Supabase Dashboard

### Session non établie

- Videz le cache de votre navigateur
- Essayez en navigation privée
- Vérifiez les cookies dans les DevTools
