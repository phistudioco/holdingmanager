/**
 * Helper pour le tracking d'événements analytics
 * Supporte Vercel Analytics, Plausible, et Google Analytics
 */

type EventParams = Record<string, any>

/**
 * Track un événement personnalisé
 * Envoie automatiquement à tous les services analytics configurés
 */
export const trackEvent = (
  eventName: string,
  eventParams?: EventParams
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

  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Event]', eventName, eventParams)
  }
}

/**
 * Track une vue de page
 */
export const trackPageView = (url: string) => {
  trackEvent('page_view', { page_path: url })
}

/**
 * Track une soumission de formulaire
 */
export const trackFormSubmit = (formName: string, success: boolean = true) => {
  trackEvent('form_submit', {
    form_name: formName,
    success,
  })
}

/**
 * Track une erreur
 */
export const trackError = (errorMessage: string, errorContext?: Record<string, any>) => {
  trackEvent('error', {
    error_message: errorMessage,
    ...errorContext,
  })
}

/**
 * Track une action utilisateur
 */
export const trackUserAction = (action: string, details?: EventParams) => {
  trackEvent('user_action', {
    action,
    ...details,
  })
}

/**
 * Track un téléchargement de fichier
 */
export const trackDownload = (fileName: string, fileType: string) => {
  trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
  })
}

/**
 * Track une recherche
 */
export const trackSearch = (query: string, resultsCount: number) => {
  trackEvent('search', {
    search_query: query,
    results_count: resultsCount,
  })
}

/**
 * Track un clic sur un bouton
 */
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
  })
}

/**
 * Track une navigation
 */
export const trackNavigation = (from: string, to: string) => {
  trackEvent('navigation', {
    from,
    to,
  })
}
