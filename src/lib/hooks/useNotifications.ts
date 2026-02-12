'use client'

import { useEffect, useState, useCallback } from 'react'
import { createUntypedClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type Notification = {
  id: number
  type: string
  severite: string
  titre: string
  message: string
  entite_type: string | null
  entite_id: number | null
  lue: boolean
  traitee: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    const supabase = createUntypedClient()

    const { data, error } = await supabase
      .from('alertes')
      .select('*')
      .eq('traitee', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter((n: Notification) => !n.lue).length)
    }
    setLoading(false)
  }, [])

  // Marquer comme lue
  const markAsRead = useCallback(async (id: number) => {
    const supabase = createUntypedClient()

    const { error } = await supabase
      .from('alertes')
      .update({ lue: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lue: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    const supabase = createUntypedClient()

    // Utiliser la forme fonctionnelle pour éviter la dépendance à notifications
    setNotifications(prev => {
      const unreadIds = prev.filter(n => !n.lue).map(n => n.id)

      if (unreadIds.length === 0) return prev

      // Lancer la requête de manière asynchrone
      supabase
        .from('alertes')
        .update({ lue: true })
        .in('id', unreadIds)
        .then((result: { error: Error | null }) => {
          if (result.error) {
            console.error('Error marking all as read:', result.error)
          }
        })

      // Mettre à jour immédiatement l'UI
      return prev.map(n => ({ ...n, lue: true }))
    })
    setUnreadCount(0)
  }, [])

  // Marquer comme traitée (supprimer de la liste)
  const markAsDone = useCallback(async (id: number) => {
    const supabase = createUntypedClient()

    const { error } = await supabase
      .from('alertes')
      .update({ traitee: true })
      .eq('id', id)

    if (!error) {
      // Utiliser la forme fonctionnelle pour éviter la dépendance à notifications
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id)
        if (notification && !notification.lue) {
          setUnreadCount(count => Math.max(0, count - 1))
        }
        return prev.filter(n => n.id !== id)
      })
    }
  }, [])

  // Configuration du Realtime
  useEffect(() => {
    fetchNotifications()

    const supabase = createUntypedClient()
    let channel: RealtimeChannel | null = null

    // S'abonner aux changements sur la table alertes
    channel = supabase
      .channel('alertes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertes',
        },
        (payload: { new: Notification }) => {
          const newNotification = payload.new
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)])
          if (!newNotification.lue) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alertes',
        },
        (payload: { new: Notification }) => {
          const updated = payload.new
          if (updated.traitee) {
            setNotifications(prev => prev.filter(n => n.id !== updated.id))
          } else {
            setNotifications(prev =>
              prev.map(n => (n.id === updated.id ? updated : n))
            )
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsDone,
    refresh: fetchNotifications,
  }
}
