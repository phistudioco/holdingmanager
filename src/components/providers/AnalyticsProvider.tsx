'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics/events'

/**
 * Provider pour Google Analytics
 * Active seulement si NEXT_PUBLIC_GA_ID est configuré
 */
export function GoogleAnalyticsProvider() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url)
  }, [pathname, searchParams, GA_MEASUREMENT_ID])

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
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
    </>
  )
}

/**
 * Provider pour Plausible Analytics
 * Active seulement si NEXT_PUBLIC_PLAUSIBLE_DOMAIN est configuré
 */
export function PlausibleProvider() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

  if (!domain) {
    return null
  }

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  )
}

/**
 * Provider combiné pour tous les services analytics
 * À ajouter dans le layout principal
 */
export function AnalyticsProvider() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

  if (!isEnabled) {
    return null
  }

  return (
    <>
      <GoogleAnalyticsProvider />
      <PlausibleProvider />
    </>
  )
}
