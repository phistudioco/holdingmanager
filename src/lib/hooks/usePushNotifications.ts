'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type PushSubscriptionState = {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | null
  loading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
    loading: true,
    error: null,
  })

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    return isSupported
  }, [])

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(prev => ({ ...prev, isSupported: false, loading: false }))
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed: !!subscription,
        permission: Notification.permission,
        loading: false,
      }))
    } catch (error) {
      console.error('Erreur vérification subscription:', error)
      setState(prev => ({
        ...prev,
        isSupported: true,
        loading: false,
        error: 'Erreur lors de la vérification',
      }))
    }
  }, [checkSupport])

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!checkSupport()) return null

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      console.log('Service Worker enregistré:', registration.scope)
      return registration
    } catch (error) {
      console.error('Erreur enregistrement SW:', error)
      throw error
    }
  }, [checkSupport])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!checkSupport()) {
      return 'denied' as NotificationPermission
    }

    const permission = await Notification.requestPermission()
    setState(prev => ({ ...prev, permission }))
    return permission
  }, [checkSupport])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Request permission if not granted
      let permission = Notification.permission
      if (permission === 'default') {
        permission = await requestPermission()
      }

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Permission refusée pour les notifications',
        }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured')
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Save subscription to database
      const supabase = createClient()
      const db = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const subscriptionJSON = subscription.toJSON()

        // Upsert subscription
        // Table push_subscriptions pas complètement typée dans database.ts - type assertion temporaire
        const { error: dbError } = await (db as any)
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: subscriptionJSON.endpoint,
            p256dh: subscriptionJSON.keys?.p256dh,
            auth: subscriptionJSON.keys?.auth,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          })

        if (dbError) {
          // eslint-disable-next-line no-console
          console.error('Erreur sauvegarde subscription:', dbError)
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        loading: false,
      }))

      return true
    } catch (error) {
      console.error('Erreur subscription push:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'abonnement',
      }))
      return false
    }
  }, [requestPermission])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Remove from database
        const supabase = createClient()
        const db = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { error: dbError } = await db
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)

          if (dbError) {
            // eslint-disable-next-line no-console
            console.error('Erreur suppression subscription:', dbError)
          }
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
      }))

      return true
    } catch (error) {
      console.error('Erreur unsubscribe:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors du désabonnement',
      }))
      return false
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (checkSupport()) {
        await registerServiceWorker()
        await checkSubscription()
      } else {
        setState(prev => ({ ...prev, isSupported: false, loading: false }))
      }
    }

    init()
  }, [checkSupport, registerServiceWorker, checkSubscription])

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    checkSubscription,
  }
}
