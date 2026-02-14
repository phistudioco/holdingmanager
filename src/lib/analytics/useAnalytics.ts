/**
 * Hook personnalisé pour utiliser les analytics facilement dans les composants
 */

import { useCallback } from 'react'
import {
  trackEvent,
  trackPageView,
  trackFormSubmit,
  trackError,
  trackUserAction,
  trackDownload,
  trackSearch,
  trackButtonClick,
  trackNavigation,
} from './events'

export function useAnalytics() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

  const track = useCallback((eventName: string, params?: Record<string, any>) => {
    if (!isEnabled) return
    trackEvent(eventName, params)
  }, [isEnabled])

  const pageView = useCallback((url: string) => {
    if (!isEnabled) return
    trackPageView(url)
  }, [isEnabled])

  const formSubmit = useCallback((formName: string, success: boolean = true) => {
    if (!isEnabled) return
    trackFormSubmit(formName, success)
  }, [isEnabled])

  const error = useCallback((message: string, context?: Record<string, any>) => {
    if (!isEnabled) return
    trackError(message, context)
  }, [isEnabled])

  const userAction = useCallback((action: string, details?: Record<string, any>) => {
    if (!isEnabled) return
    trackUserAction(action, details)
  }, [isEnabled])

  const download = useCallback((fileName: string, fileType: string) => {
    if (!isEnabled) return
    trackDownload(fileName, fileType)
  }, [isEnabled])

  const search = useCallback((query: string, resultsCount: number) => {
    if (!isEnabled) return
    trackSearch(query, resultsCount)
  }, [isEnabled])

  const buttonClick = useCallback((buttonName: string, location?: string) => {
    if (!isEnabled) return
    trackButtonClick(buttonName, location)
  }, [isEnabled])

  const navigation = useCallback((from: string, to: string) => {
    if (!isEnabled) return
    trackNavigation(from, to)
  }, [isEnabled])

  return {
    track,
    pageView,
    formSubmit,
    error,
    userAction,
    download,
    search,
    buttonClick,
    navigation,
    isEnabled,
  }
}
