import type { Metric } from 'web-vitals'

/**
 * Web Vitals Monitoring Utilities
 *
 * Utilitaires pour le monitoring et l'analyse des Core Web Vitals.
 * Ces fonctions permettent de logger, analyser et envoyer les métriques
 * de performance à des services d'analytics.
 */

/**
 * Seuils de performance pour chaque métrique (en ms, sauf CLS)
 * Basés sur les recommandations officielles de Google
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (ms)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (ms)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Cumulative Layout Shift (score)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // Time to First Byte (ms)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (ms)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // First Contentful Paint (ms)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
} as const

/**
 * Détermine le rating d'une métrique en fonction de sa valeur
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS]

  if (!thresholds) return 'good'

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Formate la valeur d'une métrique pour l'affichage
 */
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

/**
 * Log détaillé d'une métrique Web Vital en développement
 */
export function logWebVital(metric: Metric): void {
  const { name, value, rating, navigationType, delta } = metric

  // Emoji en fonction du rating
  const ratingEmoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'

  console.group(`${ratingEmoji} ${name}`)
  console.log('Value:', formatMetricValue(name, value))
  console.log('Rating:', rating)
  console.log('Delta:', formatMetricValue(name, delta))
  console.log('Navigation:', navigationType)
  console.log('Metric ID:', metric.id)
  console.groupEnd()

  // Alertes si mauvaise performance
  if (rating === 'poor') {
    console.warn(`⚠️ Poor ${name}: ${formatMetricValue(name, value)}`)

    // Suggestions d'amélioration
    const suggestions = getImprovementSuggestions(name)
    if (suggestions.length > 0) {
      console.group('💡 Suggestions d\'amélioration:')
      suggestions.forEach((suggestion) => console.log(`• ${suggestion}`))
      console.groupEnd()
    }
  }
}

/**
 * Retourne des suggestions d'amélioration pour une métrique donnée
 */
export function getImprovementSuggestions(metricName: string): string[] {
  const suggestions: Record<string, string[]> = {
    LCP: [
      'Optimiser les images (WebP, compression, lazy loading)',
      'Utiliser un CDN pour les ressources statiques',
      'Réduire le temps de réponse serveur (TTFB)',
      'Précharger les ressources critiques (preload, prefetch)',
      'Minimiser le CSS et JS bloquant le rendu',
    ],
    FID: [
      'Réduire le temps d\'exécution JavaScript',
      'Découper le code en chunks plus petits (code splitting)',
      'Utiliser un Web Worker pour les tâches lourdes',
      'Différer le chargement des scripts non critiques',
      'Optimiser les event listeners',
    ],
    CLS: [
      'Définir des dimensions explicites pour images et vidéos',
      'Éviter d\'insérer du contenu au-dessus du contenu existant',
      'Précharger les polices web (font-display: swap)',
      'Réserver l\'espace pour les publicités et iframes',
      'Éviter les animations qui modifient la mise en page',
    ],
    TTFB: [
      'Optimiser les requêtes base de données',
      'Utiliser le cache côté serveur (Redis, memcached)',
      'Activer la compression (gzip, brotli)',
      'Utiliser un CDN ou edge computing',
      'Optimiser les requêtes API',
    ],
    INP: [
      'Optimiser les gestionnaires d\'événements',
      'Réduire la complexité du rendu React',
      'Utiliser la mémoïsation (useMemo, useCallback)',
      'Éviter les re-renders inutiles',
      'Découper les tâches longues en micro-tâches',
    ],
    FCP: [
      'Optimiser le Critical Rendering Path',
      'Minimiser le CSS critique',
      'Utiliser le Server-Side Rendering (SSR)',
      'Précharger les polices importantes',
      'Réduire le temps de chargement des ressources',
    ],
  }

  return suggestions[metricName] || []
}

/**
 * Envoie les métriques à un service d'analytics
 */
export function sendToAnalytics(metric: Metric): void {
  // Option 1: Google Analytics (gtag.js)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_navigation_type: metric.navigationType,
      non_interaction: true,
    })
  }

  // Option 2: Google Analytics 4 (gtag.js v4)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }

  // Option 3: API endpoint personnalisé
  // Utile pour stocker les métriques dans votre propre base de données
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  })

  // Décommenter pour activer l'envoi à votre API
  /*
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true, // Important pour les requêtes envoyées lors de la fermeture de la page
  }).catch((error) => {
    console.error('Erreur lors de l\'envoi des Web Vitals:', error)
  })
  */
}

/**
 * Envoie les métriques à Vercel Analytics
 * (Si vous utilisez Vercel pour l'hébergement)
 */
export function sendToVercelAnalytics(metric: Metric): void {
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', {
      name: metric.name,
      data: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      },
    })
  }
}

/**
 * Agrège et retourne un résumé des métriques collectées
 * Utile pour générer des rapports de performance
 */
export class WebVitalsCollector {
  private metrics: Map<string, Metric[]> = new Map()

  collect(metric: Metric): void {
    const existing = this.metrics.get(metric.name) || []
    this.metrics.set(metric.name, [...existing, metric])
  }

  getSummary() {
    const summary: Record<string, any> = {}

    this.metrics.forEach((metrics, name) => {
      const values = metrics.map((m) => m.value)
      const ratings = metrics.map((m) => m.rating)

      summary[name] = {
        count: metrics.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        ratings: {
          good: ratings.filter((r) => r === 'good').length,
          needsImprovement: ratings.filter((r) => r === 'needs-improvement').length,
          poor: ratings.filter((r) => r === 'poor').length,
        },
      }
    })

    return summary
  }

  clear(): void {
    this.metrics.clear()
  }
}
