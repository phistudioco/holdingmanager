# Web Vitals Monitoring - Guide Complet

## Table des matières

1. [Introduction](#introduction)
2. [Métriques Core Web Vitals](#métriques-core-web-vitals)
3. [Seuils de performance](#seuils-de-performance)
4. [Configuration](#configuration)
5. [Interprétation des résultats](#interprétation-des-résultats)
6. [Amélioration des performances](#amélioration-des-performances)
7. [Intégration Analytics](#intégration-analytics)

## Introduction

Les **Core Web Vitals** sont un ensemble de métriques standardisées par Google pour mesurer l'expérience utilisateur réelle d'un site web. Ces métriques sont cruciales pour :

- **SEO** : Google les utilise comme facteur de classement
- **UX** : Elles reflètent directement la qualité de l'expérience utilisateur
- **Business** : De meilleures performances = meilleure conversion

Notre application Next.js 14 surveille automatiquement ces métriques grâce au composant `WebVitalsReporter`.

## Métriques Core Web Vitals

### 1. LCP - Largest Contentful Paint

**Qu'est-ce que c'est ?**
- Mesure le temps de chargement du plus grand élément de contenu visible dans le viewport
- Généralement une image, une vidéo ou un bloc de texte

**Pourquoi c'est important ?**
- Indique quand le contenu principal de la page est chargé
- Reflète la perception de vitesse de chargement par l'utilisateur

**Seuils :**
- ✅ Bon : ≤ 2.5s
- ⚠️ À améliorer : 2.5s - 4.0s
- ❌ Médiocre : > 4.0s

**Comment l'améliorer ?**
- Optimiser les images (WebP, compression, lazy loading)
- Utiliser un CDN pour les ressources statiques
- Réduire le temps de réponse serveur (TTFB)
- Précharger les ressources critiques (`<link rel="preload">`)
- Minimiser le CSS et JS bloquant le rendu
- Utiliser le SSR (Server-Side Rendering) de Next.js

### 2. FID - First Input Delay (Legacy)

**Qu'est-ce que c'est ?**
- Mesure le temps entre la première interaction de l'utilisateur et la réponse du navigateur
- Exemples : clic sur un bouton, sélection d'un menu

**Pourquoi c'est important ?**
- Reflète l'interactivité de la page
- Indique si l'interface est réactive ou bloquée

**Seuils :**
- ✅ Bon : ≤ 100ms
- ⚠️ À améliorer : 100ms - 300ms
- ❌ Médiocre : > 300ms

**Note :** FID est remplacé par INP (voir ci-dessous)

### 3. INP - Interaction to Next Paint

**Qu'est-ce que c'est ?**
- Mesure la latence de TOUTES les interactions (pas seulement la première)
- Remplace FID depuis mars 2024
- Plus représentatif de l'expérience utilisateur globale

**Pourquoi c'est important ?**
- Mesure la réactivité globale de l'application
- Détecte les blocages de l'interface pendant l'utilisation

**Seuils :**
- ✅ Bon : ≤ 200ms
- ⚠️ À améliorer : 200ms - 500ms
- ❌ Médiocre : > 500ms

**Comment l'améliorer ?**
- Optimiser les gestionnaires d'événements
- Réduire la complexité du rendu React
- Utiliser la mémoïsation (`useMemo`, `useCallback`)
- Éviter les re-renders inutiles
- Découper les tâches longues en micro-tâches
- Utiliser des Web Workers pour les calculs lourds

### 4. CLS - Cumulative Layout Shift

**Qu'est-ce que c'est ?**
- Mesure la stabilité visuelle de la page
- Quantifie les déplacements inattendus d'éléments pendant le chargement

**Pourquoi c'est important ?**
- Évite les frustrations (cliquer au mauvais endroit)
- Améliore l'accessibilité
- Reflète la qualité du design et de l'intégration

**Seuils :**
- ✅ Bon : ≤ 0.1
- ⚠️ À améliorer : 0.1 - 0.25
- ❌ Médiocre : > 0.25

**Comment l'améliorer ?**
- Définir des dimensions explicites pour images et vidéos
- Éviter d'insérer du contenu au-dessus du contenu existant
- Précharger les polices web (`font-display: swap`)
- Réserver l'espace pour les publicités et iframes
- Éviter les animations qui modifient la mise en page
- Utiliser `aspect-ratio` CSS

### 5. TTFB - Time to First Byte

**Qu'est-ce que c'est ?**
- Mesure le temps de réponse du serveur
- Temps entre la requête initiale et le premier octet reçu

**Pourquoi c'est important ?**
- Impacte directement toutes les autres métriques
- Reflète la performance du backend et du réseau

**Seuils :**
- ✅ Bon : ≤ 800ms
- ⚠️ À améliorer : 800ms - 1800ms
- ❌ Médiocre : > 1800ms

**Comment l'améliorer ?**
- Optimiser les requêtes base de données
- Utiliser le cache côté serveur (Redis, memcached)
- Activer la compression (gzip, brotli)
- Utiliser un CDN ou edge computing (Vercel Edge)
- Optimiser les requêtes API
- Utiliser le SSR intelligent de Next.js 14

### 6. FCP - First Contentful Paint

**Qu'est-ce que c'est ?**
- Mesure le temps avant le premier rendu de contenu
- Premier élément DOM visible (texte, image, SVG)

**Pourquoi c'est important ?**
- Indique quand l'utilisateur voit que la page charge
- Feedback visuel rapide = meilleure perception

**Seuils :**
- ✅ Bon : ≤ 1.8s
- ⚠️ À améliorer : 1.8s - 3.0s
- ❌ Médiocre : > 3.0s

**Comment l'améliorer ?**
- Optimiser le Critical Rendering Path
- Minimiser le CSS critique (inline critical CSS)
- Utiliser le Server-Side Rendering (SSR)
- Précharger les polices importantes
- Réduire le temps de chargement des ressources

## Seuils de performance

Tableau récapitulatif :

| Métrique | Bon (✅)  | À améliorer (⚠️) | Médiocre (❌) | Unité |
|----------|-----------|------------------|---------------|-------|
| LCP      | ≤ 2.5s    | 2.5s - 4.0s      | > 4.0s        | ms    |
| FID      | ≤ 100ms   | 100ms - 300ms    | > 300ms       | ms    |
| INP      | ≤ 200ms   | 200ms - 500ms    | > 500ms       | ms    |
| CLS      | ≤ 0.1     | 0.1 - 0.25       | > 0.25        | score |
| TTFB     | ≤ 800ms   | 800ms - 1800ms   | > 1800ms      | ms    |
| FCP      | ≤ 1.8s    | 1.8s - 3.0s      | > 3.0s        | ms    |

## Configuration

### 1. Installation

Le package `web-vitals` est déjà installé :

```bash
npm install web-vitals
```

### 2. Composant WebVitalsReporter

Le composant `WebVitalsReporter` est intégré dans le layout racine (`src/app/layout.tsx`) :

```tsx
import { WebVitalsReporter } from './_components/WebVitalsReporter'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  )
}
```

### 3. Modes de fonctionnement

**En développement :**
- Les métriques sont loggées dans la console
- Affichage détaillé avec émojis (✅ bon, ⚠️ à améliorer, ❌ médiocre)
- Suggestions d'amélioration pour les métriques "poor"

**En production :**
- Les métriques sont envoyées à Google Analytics (si configuré)
- Possibilité d'envoyer à un endpoint API personnalisé
- Pas de logs en console

### 4. Visualisation en développement

Ouvrez la console du navigateur (F12) et naviguez dans l'application. Vous verrez :

```
✅ Web Vital: LCP
  Value: 1234.56
  Rating: good
  Navigation Type: navigate
  Metric ID: v3-1234567890123-4567890123456

⚠️ Web Vital: CLS
  Value: 0.15
  Rating: needs-improvement
  Navigation Type: navigate
  Metric ID: v3-1234567890123-4567890123457

💡 Suggestions d'amélioration:
  • Définir des dimensions explicites pour images et vidéos
  • Éviter d'insérer du contenu au-dessus du contenu existant
  • Précharger les polices web (font-display: swap)
```

## Interprétation des résultats

### Navigation Types

Les métriques peuvent varier selon le type de navigation :

- **navigate** : Navigation classique (URL dans la barre d'adresse)
- **reload** : Rechargement de la page (F5)
- **back-forward** : Navigation via boutons navigateur
- **prerender** : Page prérendue

### Variation des métriques

Les Web Vitals peuvent varier selon :

- **Appareil** : Desktop vs mobile vs tablette
- **Connexion** : WiFi vs 4G vs 3G
- **Navigateur** : Chrome, Firefox, Safari, Edge
- **État du cache** : Premier chargement vs rechargement
- **Charge système** : CPU/RAM disponible

**Best practice :** Mesurez sur plusieurs appareils et conditions réseau.

### Percentile 75

Google recommande d'optimiser pour le **75e percentile** (P75) :
- 75% des utilisateurs doivent avoir une expérience "bonne"
- Ne vous focalisez pas uniquement sur la médiane

## Amélioration des performances

### Checklist globale

- [ ] Images optimisées (WebP, compression, lazy loading)
- [ ] Polices web optimisées (font-display, preload)
- [ ] CSS critique inline
- [ ] JavaScript différé (defer, async)
- [ ] Code splitting (dynamic imports)
- [ ] Cache navigateur configuré
- [ ] CDN pour les assets statiques
- [ ] Compression activée (gzip, brotli)
- [ ] Database queries optimisées
- [ ] API responses cachées
- [ ] SSR/ISR utilisés judicieusement

### Outils de diagnostic

1. **Chrome DevTools**
   - Lighthouse (audit complet)
   - Performance tab (waterfall, profiling)
   - Network tab (timing, cache)

2. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Analyse sur données réelles (CrUX)

3. **WebPageTest**
   - https://www.webpagetest.org/
   - Tests avancés multi-localisations

4. **Vercel Analytics**
   - Si hébergé sur Vercel
   - Real User Monitoring (RUM)

### Next.js 14 spécifiques

```tsx
// 1. Optimisation des images
import Image from 'next/image'

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  priority // Pour LCP
  alt="Hero"
/>

// 2. Optimisation des polices
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Réduit CLS
})

// 3. Dynamic imports pour code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
})

// 4. Metadata pour preload
export const metadata = {
  other: {
    preload: 'https://fonts.googleapis.com/...',
  },
}
```

## Intégration Analytics

### Option 1 : Google Analytics (GA4)

1. **Installer Google Analytics :**

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

2. **Les Web Vitals seront automatiquement envoyés** grâce au `WebVitalsReporter`.

3. **Visualiser dans GA4 :**
   - Rapports > Événements > web_vitals
   - Exploration > Créer un rapport personnalisé

### Option 2 : API Endpoint personnalisé

1. **Créer un endpoint API :**

```tsx
// src/app/api/analytics/web-vitals/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const metric = await request.json()

  // Stocker dans votre base de données
  // await db.webVitals.create({ data: metric })

  // Ou envoyer à un service externe
  // await fetch('https://analytics.example.com/metrics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  // })

  return NextResponse.json({ success: true })
}
```

2. **Activer dans WebVitalsReporter :**

Décommentez la section dans `src/app/_components/WebVitalsReporter.tsx`.

### Option 3 : Vercel Analytics

1. **Installer :**

```bash
npm install @vercel/analytics
```

2. **Intégrer :**

```tsx
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

3. **Les Web Vitals sont automatiquement collectés** et visibles dans le dashboard Vercel.

### Option 4 : Plausible Analytics

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          defer
          data-domain="yourdomain.com"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## API Reference

### WebVitalsReporter

Composant React qui surveille les Web Vitals.

**Utilisation :**
```tsx
import { WebVitalsReporter } from '@/app/_components/WebVitalsReporter'

<WebVitalsReporter />
```

### Fonctions utilitaires

**`logWebVital(metric: Metric)`**
- Log détaillé d'une métrique en console
- Affiche des suggestions d'amélioration

**`sendToAnalytics(metric: Metric)`**
- Envoie la métrique à Google Analytics
- Supporte GA4 et Universal Analytics

**`getMetricRating(name: string, value: number)`**
- Détermine le rating (good/needs-improvement/poor)

**`formatMetricValue(name: string, value: number)`**
- Formate la valeur pour l'affichage (ms ou score)

**`getImprovementSuggestions(metricName: string)`**
- Retourne des suggestions d'amélioration

**`WebVitalsCollector`**
- Classe pour agréger les métriques
- Génère des rapports de performance

## Ressources

- [Web Vitals - web.dev](https://web.dev/vitals/)
- [Core Web Vitals - Google](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [web-vitals package](https://github.com/GoogleChrome/web-vitals)
- [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux)

## Support

Pour toute question ou problème :
1. Consultez la console navigateur en développement
2. Utilisez les outils Chrome DevTools > Lighthouse
3. Vérifiez les logs dans votre service analytics
4. Consultez la documentation Next.js

---

**Dernière mise à jour :** Février 2026
**Version :** 1.0.0
