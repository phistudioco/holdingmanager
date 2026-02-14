'use client'

import { useReportWebVitals } from 'next/web-vitals'

/**
 * WebVitalsReporter Component
 *
 * Surveille et rapporte les métriques Core Web Vitals de l'application.
 * Ce composant client utilise le hook useReportWebVitals de Next.js 14.
 *
 * Métriques surveillées :
 * - LCP (Largest Contentful Paint) : Temps de chargement du plus grand élément visible
 * - FID (First Input Delay) : Temps de réponse à la première interaction
 * - CLS (Cumulative Layout Shift) : Stabilité visuelle
 * - TTFB (Time to First Byte) : Temps de réponse serveur
 * - INP (Interaction to Next Paint) : Réactivité globale
 * - FCP (First Contentful Paint) : Premier élément rendu
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log en console en développement
    if (process.env.NODE_ENV === 'development') {
      const { name, value, rating, navigationType } = metric

      // Emoji en fonction du rating
      const ratingEmoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'

      console.group(`${ratingEmoji} Web Vital: ${name}`)
      console.log('Value:', value.toFixed(2))
      console.log('Rating:', rating)
      console.log('Navigation Type:', navigationType)
      console.log('Metric ID:', metric.id)
      console.groupEnd()

      // Alerte si performance médiocre
      if (rating === 'poor') {
        console.warn(`⚠️ Poor performance detected for ${name}: ${value.toFixed(2)}`)
      }
    }

    // En production, envoyer à un service analytics
    if (process.env.NODE_ENV === 'production') {
      // Option 1: Google Analytics (gtag.js)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          metric_rating: metric.rating,
          metric_delta: metric.delta,
          non_interaction: true,
        })
      }

      // Option 2: API endpoint personnalisé
      // Décommenter et adapter selon vos besoins
      /*
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      })

      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true, // Important pour les requêtes envoyées lors de la fermeture de la page
      })
      */
    }
  })

  // Ce composant ne rend rien
  return null
}
