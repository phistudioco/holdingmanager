# Guide d'activation Analytics & Error Tracking

**Date** : 14 février 2026
**Statut** : Structure prête, activation en attente

---

## 📋 Prérequis

La structure de base est déjà en place :

- ✅ **Helper analytics** : `src/lib/analytics/events.ts`
- ✅ **Hook useAnalytics** : `src/lib/analytics/useAnalytics.ts`
- ✅ **Logger personnalisé** : `src/lib/monitoring/logger.ts`
- ✅ **Provider Analytics** : `src/components/providers/AnalyticsProvider.tsx`
- ✅ **Web Vitals Reporter** : `src/app/_components/WebVitalsReporter.tsx`
- ✅ **Variables d'env** : `.env.example`

---

## 🚀 Activation rapide

### Option 1 : Vercel Analytics (Recommandé)

**Si déployé sur Vercel** :

1. Installer le package :
   ```bash
   npm install @vercel/analytics
   ```

2. Ajouter dans `src/app/layout.tsx` :
   ```typescript
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

3. C'est tout ! Les analytics Vercel sont automatiquement actifs en production.

---

### Option 2 : Google Analytics

1. Créer un compte GA4 et obtenir un ID (format: `G-XXXXXXXXXX`)

2. Ajouter dans `.env.local` :
   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

3. Ajouter le provider dans `src/app/layout.tsx` :
   ```typescript
   import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <AnalyticsProvider />
           {children}
         </body>
       </html>
     )
   }
   ```

4. Les Web Vitals sont automatiquement envoyés à GA grâce à `WebVitalsReporter` déjà en place.

---

### Option 3 : Plausible Analytics

1. Créer un compte Plausible et configurer le domaine

2. Installer le package :
   ```bash
   npm install next-plausible
   ```

3. Ajouter dans `.env.local` :
   ```bash
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=holding.phistudios.com
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

4. Le `AnalyticsProvider` détectera automatiquement Plausible.

---

## 🐛 Error Tracking avec Sentry

### Installation

1. Créer un compte Sentry et un projet

2. Installer Sentry :
   ```bash
   npm install @sentry/nextjs
   ```

3. Configurer automatiquement :
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. Ajouter les variables d'environnement dans `.env.local` :
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@oyyy.ingest.sentry.io/zzzzz
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=phi-studios
   SENTRY_PROJECT=holding-manager
   NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
   ```

5. Le wizard créera automatiquement :
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`

### Configuration manuelle (si le wizard échoue)

Créer `sentry.client.config.ts` :
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

Créer `sentry.server.config.ts` :
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 💻 Utilisation dans le code

### Tracking d'événements

```typescript
import { useAnalytics } from '@/lib/analytics/useAnalytics'

function MonComposant() {
  const analytics = useAnalytics()

  const handleSubmit = async (data) => {
    try {
      await saveData(data)
      analytics.formSubmit('employee-form', true)
    } catch (error) {
      analytics.error('Form submission failed', { form: 'employee-form' })
    }
  }

  return (
    <button onClick={() => analytics.buttonClick('save-button', 'employee-page')}>
      Enregistrer
    </button>
  )
}
```

### Logging personnalisé

```typescript
import { logger } from '@/lib/monitoring/logger'

// Info
logger.info('User logged in', { userId: 123 })

// Warning
logger.warn('Slow API response', { endpoint: '/api/clients', duration: 5000 })

// Error
logger.error('Failed to fetch data', { error: error.message })

// Exception avec contexte
try {
  // code
} catch (error) {
  logger.exception(error, { context: 'user-registration' })
}
```

---

## ✅ Checklist d'activation

### Analytics
- [ ] Choisir une solution (Vercel/Plausible/GA)
- [ ] Installer le package npm si nécessaire
- [ ] Configurer les variables d'environnement
- [ ] Ajouter le provider dans layout.tsx (si applicable)
- [ ] Tester le tracking en dev avec console
- [ ] Vérifier le dashboard analytics en production

### Error Tracking
- [ ] Créer un compte Sentry
- [ ] Installer @sentry/nextjs
- [ ] Exécuter le wizard de configuration
- [ ] Ajouter les variables d'environnement
- [ ] Tester la capture d'erreurs en dev
- [ ] Configurer les alertes email dans Sentry

### Optionnel
- [ ] Configurer l'endpoint custom logs (`/api/logs`)
- [ ] Ajouter banner cookies si nécessaire (pas requis pour app privée)
- [ ] Configurer la rétention des données
- [ ] Setup alertes Slack/Discord depuis Sentry

---

## 🔒 Privacy & GDPR

**Application Privée** : Holding Manager est une application interne.

**Recommandations appliquées** :
- ✅ Robots bloqués (`robots.txt`)
- ✅ Metadata avec `noindex, nofollow`
- ✅ Logger anonymise automatiquement les données sensibles
- ✅ Pas de cookies tiers (Vercel/Plausible sont cookieless)

**Si Google Analytics est utilisé** :
- Activer l'anonymisation IP
- Configurer rétention courte (26 mois max)
- Documenter la collecte de données

---

## 📊 Vérification

### En développement
```bash
# Les logs apparaissent dans la console
[Analytics Event] form_submit { form_name: 'employee-form', success: true }
[Web Vitals] { name: 'LCP', value: 1234, rating: 'good' }
```

### En production
- Vercel Analytics : Dashboard Vercel → Analytics
- Google Analytics : analytics.google.com
- Plausible : plausible.io/holding.phistudios.com
- Sentry : sentry.io/phi-studios/holding-manager

---

## 🚨 Troubleshooting

**Analytics ne track pas** :
- Vérifier `NEXT_PUBLIC_ENABLE_ANALYTICS=true` dans `.env.local`
- Vérifier que les IDs sont corrects
- Ouvrir la console navigateur pour voir les événements

**Sentry ne capture pas les erreurs** :
- Vérifier `NEXT_PUBLIC_SENTRY_DSN` dans `.env.local`
- Vérifier que Sentry est initialisé (voir Network tab)
- Tester manuellement : `throw new Error('Test Sentry')`

**Web Vitals manquants** :
- Vérifier que `WebVitalsReporter` est dans `layout.tsx`
- Web Vitals nécessitent interactions utilisateur pour FID/INP

---

## 📚 Ressources

- [Analytics Implementation Guide](./ANALYTICS_ERROR_TRACKING.md)
- [Web Vitals Documentation](./WEB_VITALS.md)
- [SEO Configuration](./SEO_CONFIGURATION.md)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Plausible Docs](https://plausible.io/docs)

---

**Statut actuel** : Structure complète, prête à activer selon les besoins.
