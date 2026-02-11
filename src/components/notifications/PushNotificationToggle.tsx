'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2, AlertCircle, Check } from 'lucide-react'

type PushNotificationToggleProps = {
  variant?: 'button' | 'switch' | 'compact'
  showLabel?: boolean
}

export function PushNotificationToggle({
  variant = 'button',
  showLabel = true,
}: PushNotificationToggleProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  const [actionLoading, setActionLoading] = useState(false)

  const handleToggle = async () => {
    setActionLoading(true)
    try {
      if (isSubscribed) {
        await unsubscribe()
      } else {
        await subscribe()
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Not supported
  if (!isSupported) {
    if (variant === 'compact') return null
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span>Notifications non supportées</span>
      </div>
    )
  }

  // Permission denied
  if (permission === 'denied') {
    if (variant === 'compact') return null
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <BellOff className="h-4 w-4" />
        <span>Notifications bloquées par le navigateur</span>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {showLabel && <span>Chargement...</span>}
      </div>
    )
  }

  // Compact variant (just icon)
  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        disabled={actionLoading}
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed
            ? 'bg-green-100 text-green-600 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isSubscribed ? 'Désactiver les notifications push' : 'Activer les notifications push'}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
      </button>
    )
  }

  // Switch variant
  if (variant === 'switch') {
    return (
      <div className="flex items-center justify-between">
        {showLabel && (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Notifications push</span>
          </div>
        )}
        <button
          onClick={handleToggle}
          disabled={actionLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSubscribed ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          >
            {actionLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </span>
        </button>
      </div>
    )
  }

  // Button variant (default)
  return (
    <div className="space-y-2">
      <Button
        onClick={handleToggle}
        disabled={actionLoading}
        variant={isSubscribed ? 'outline' : 'default'}
        className={isSubscribed ? 'border-green-500 text-green-600' : ''}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isSubscribed ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Bell className="h-4 w-4 mr-2" />
        )}
        {isSubscribed ? 'Notifications activées' : 'Activer les notifications'}
      </Button>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
