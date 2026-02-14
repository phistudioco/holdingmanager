/**
 * Monitoring Library Index
 *
 * Point d'entrée centralisé pour tous les utilitaires de monitoring
 */

export {
  logWebVital,
  sendToAnalytics,
  sendToVercelAnalytics,
  getMetricRating,
  formatMetricValue,
  getImprovementSuggestions,
  WebVitalsCollector,
  WEB_VITALS_THRESHOLDS,
} from './web-vitals'

export type { Metric } from 'web-vitals'
