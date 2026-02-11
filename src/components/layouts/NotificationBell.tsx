'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  ScrollText,
  GitBranch,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsDone,
  } = useNotifications()

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSeverityColor = (severite: string) => {
    const colors: Record<string, string> = {
      basse: 'text-blue-500 bg-blue-100',
      moyenne: 'text-yellow-500 bg-yellow-100',
      haute: 'text-orange-500 bg-orange-100',
      critique: 'text-red-500 bg-red-100',
    }
    return colors[severite] || 'text-gray-500 bg-gray-100'
  }

  const getSeverityIcon = (severite: string) => {
    switch (severite) {
      case 'critique':
        return <AlertTriangle className="h-4 w-4" />
      case 'haute':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facture_impayee':
      case 'facture_echeance':
        return <FileText className="h-4 w-4" />
      case 'contrat_expiration':
        return <ScrollText className="h-4 w-4" />
      case 'workflow':
        return <GitBranch className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getEntityLink = (notification: { entite_type: string | null; entite_id: number | null }) => {
    if (!notification.entite_type || !notification.entite_id) return null

    const links: Record<string, string> = {
      facture: `/finance/factures/${notification.entite_id}`,
      contrat: `/finance/contrats/${notification.entite_id}`,
      workflow_demande: `/workflows/${notification.entite_id}`,
    }

    return links[notification.entite_type] || null
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return notifDate.toLocaleDateString('fr-FR')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-phi-accent rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-phi-primary to-blue-600">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-white/80 hover:text-white hover:bg-white/20 text-xs gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tout lire
                </Button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-phi-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const link = getEntityLink(notification)

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.lue ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.lue) {
                          markAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icône */}
                        <div className={`shrink-0 p-2 rounded-lg ${getSeverityColor(notification.severite)}`}>
                          {getSeverityIcon(notification.severite)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium text-gray-900 ${!notification.lue ? 'font-semibold' : ''}`}>
                              {notification.titre}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsDone(notification.id)
                              }}
                              className="shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {getTypeIcon(notification.type)}
                              <span>{formatTime(notification.created_at)}</span>
                            </div>

                            {link && (
                              <Link
                                href={link}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsOpen(false)
                                }}
                                className="flex items-center gap-1 text-xs text-phi-primary hover:text-phi-primary/80 font-medium"
                              >
                                Voir
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50">
            {/* Push Notifications Toggle */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Notifications push</span>
                </div>
                <PushNotificationToggle variant="switch" showLabel={false} />
              </div>
            </div>

            {/* Voir toutes les alertes */}
            <div className="px-4 py-3">
              <Link
                href="/alertes"
                onClick={() => setIsOpen(false)}
                className="text-sm text-phi-primary hover:text-phi-primary/80 font-medium flex items-center justify-center gap-1"
              >
                Voir toutes les alertes
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
