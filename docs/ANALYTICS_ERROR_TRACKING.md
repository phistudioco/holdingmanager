# Analytics & Error Tracking - Guide d'implémentation

**Date** : 14 février 2026
**Application** : PHI Studios Holding Manager
**Framework** : Next.js 14

---

## 📊 Analytics

### Options Recommandées

#### 1. Vercel Analytics (Recommandé pour Next.js)

**Installation** :
```bash
npm install @vercel/analytics
```

**Configuration** :
```typescript
// src/app/layout.tsx
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

**Avantages** :
- Intégration native avec Vercel
- Privacy-friendly (GDPR compliant)
- Pas de cookies
- Métriques Web Vitals automatiques
- Dashboard Vercel intégré

---

#### 2. Plausible Analytics (Privacy-First)

**Installation** :
```bash
npm install next-plausible
```

**Configuration** :
```typescript
// src/app/layout.tsx
import PlausibleProvider from 'next-plausible'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <PlausibleProvider domain="holding.phistudios.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Avantages** :
- Open-source
- Privacy-first (GDPR compliant)
- Léger (<1KB)
- Pas de cookies
- Self-hosted possible

---

#### 3. Google Analytics 4 (Plus complet)

**Installation via Script** :
```typescript
// src/app/layout.tsx
import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Variables d'environnement** :
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

### Custom Events Tracking

**Créer helper** : `src/lib/analytics/events.ts`

```typescript
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window === 'undefined') return

  // Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams)
  }

  // Vercel Analytics
  if ((window as any).va) {
    (window as any).va('track', eventName, eventParams)
  }

  // Plausible
  if ((window as any).plausible) {
    (window as any).plausible(eventName, { props: eventParams })
  }
}

// Exemples d'utilisation
export const trackPageView = (url: string) => {
  trackEvent('page_view', { page_path: url })
}

export const trackFormSubmit = (formName: string) => {
  trackEvent('form_submit', { form_name: formName })
}

export const trackError = (errorMessage: string) => {
  trackEvent('error', { error_message: errorMessage })
}
```

---

## 🐛 Error Tracking

### Options Recommandées

#### 1. Sentry (Recommandé)

**Installation** :
```bash
npm install @sentry/nextjs
```

**Configuration automatique** :
```bash
npx @sentry/wizard@latest -i nextjs
```

Cela crée :
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` modifié

**Configuration manuelle** :

`sentry.client.config.ts` :
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

`sentry.server.config.ts` :
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

**Variables d'environnement** :
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@oyyy.ingest.sentry.io/zzzzz
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**Avantages** :
- Error tracking complet
- Session replay
- Performance monitoring
- Source maps pour debugging
- Intégration Slack/Jira
- Alertes email automatiques

---

#### 2. LogRocket (Alternative)

**Installation** :
```bash
npm install logrocket
```

**Configuration** :
```typescript
// src/lib/monitoring/logrocket.ts
import LogRocket from 'logrocket'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID!)
}

export default LogRocket
```

---

### Custom Error Boundary

**Créer** : `src/app/error.tsx` (Next.js 14)

```typescript
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur à Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Une erreur est survenue</h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-phi-primary text-white rounded-lg hover:bg-phi-primary/90"
      >
        Réessayer
      </button>
    </div>
  )
}
```

---

### Logging Personnalisé

**Créer** : `src/lib/monitoring/logger.ts`

```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      data,
    }

    // Console en dev
    if (this.isDevelopment) {
      console[level](message, data)
    }

    // Envoyer à un service en production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Sentry
      if (level === 'error') {
        if ((window as any).Sentry) {
          (window as any).Sentry.captureMessage(message, {
            level: 'error',
            extra: data,
          })
        }
      }

      // API endpoint custom
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      }).catch(console.error)
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()

// Utilisation
// logger.info('User logged in', { userId: 123 })
// logger.error('Failed to fetch data', { error })
```

---

## 📝 Checklist d'Implémentation

### Analytics
- [ ] Choisir solution analytics (Vercel/Plausible/GA)
- [ ] Installer package npm
- [ ] Configurer dans layout.tsx
- [ ] Ajouter variables d'environnement
- [ ] Créer helper custom events
- [ ] Tester tracking en dev
- [ ] Vérifier dashboard analytics

### Error Tracking
- [ ] Installer Sentry ou alternative
- [ ] Configurer client/server
- [ ] Créer error.tsx boundary
- [ ] Ajouter variables d'environnement
- [ ] Créer logger personnalisé
- [ ] Tester capture erreurs
- [ ] Configurer alertes email

### Privacy & GDPR
- [ ] Ajouter banner cookies si nécessaire
- [ ] Documenter collecte données
- [ ] Anonymiser données sensibles
- [ ] Configurer durée rétention
- [ ] Ajouter opt-out utilisateur

---

## 🔒 Considérations Privacy

**Application Privée** : L'application Holding Manager est une application interne privée.

**Recommandations** :
- Anonymiser les données utilisateurs
- Ne pas tracker les données personnelles sensibles
- Utiliser analytics privacy-first (Plausible/Vercel)
- Configurer rétention courte (30-90 jours)
- Pas besoin de banner cookies pour app interne

---

## 🚀 Déploiement

**Variables d'environnement production** :
```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=holding.phistudios.com

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@oyyy.ingest.sentry.io/zzz
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORG=phi-studios
SENTRY_PROJECT=holding-manager

# Logs
LOG_LEVEL=info
```

---

## 📚 Ressources

- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Plausible](https://plausible.io/docs)
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [LogRocket](https://docs.logrocket.com/)

---

**Prochaine étape** : Choisir et implémenter la solution analytics et error tracking selon les besoins du projet.
