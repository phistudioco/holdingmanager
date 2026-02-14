'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationPreferences = {
  id?: number
  user_id?: string

  // Types de notifications
  notify_facture_impayee: boolean
  notify_facture_echeance: boolean
  notify_contrat_expiration: boolean
  notify_workflow_approbation: boolean
  notify_workflow_statut: boolean
  notify_budget_alerte: boolean
  notify_systeme: boolean

  // Sévérité minimum
  severite_minimum: 'basse' | 'moyenne' | 'haute' | 'critique'

  // Canaux
  canal_inapp: boolean
  canal_push: boolean
  canal_email: boolean

  // Heures de notification
  notification_heures_debut: string
  notification_heures_fin: string
  notification_weekend: boolean

  // Résumé quotidien
  resume_quotidien: boolean
  resume_heure: string
}

const defaultPreferences: NotificationPreferences = {
  notify_facture_impayee: true,
  notify_facture_echeance: true,
  notify_contrat_expiration: true,
  notify_workflow_approbation: true,
  notify_workflow_statut: true,
  notify_budget_alerte: true,
  notify_systeme: true,
  severite_minimum: 'moyenne',
  canal_inapp: true,
  canal_push: true,
  canal_email: false,
  notification_heures_debut: '08:00',
  notification_heures_fin: '20:00',
  notification_weekend: false,
  resume_quotidien: false,
  resume_heure: '09:00',
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les préférences
  const loadPreferences = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const db = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setPreferences(defaultPreferences)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await db
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Pas de préférences existantes, utiliser les valeurs par défaut
          setPreferences(defaultPreferences)
        } else {
          throw fetchError
        }
      } else if (data) {
        setPreferences({
          ...defaultPreferences,
          ...(data as NotificationPreferences),
        })
      }
    } catch (err) {
      console.error('Erreur chargement préférences:', err)
      setError('Erreur lors du chargement des préférences')
    } finally {
      setLoading(false)
    }
  }, [])

  // Sauvegarder les préférences
  const savePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const db = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Non authentifié')
      }

      const prefsToSave = {
        user_id: user.id,
        ...preferences,
        ...newPreferences,
        updated_at: new Date().toISOString(),
      }

      // Remove id for upsert
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...prefsWithoutId } = prefsToSave as NotificationPreferences & { id?: number }

      const { error: saveError } = await db
        .from('notification_preferences')
        .upsert(prefsWithoutId, {
          onConflict: 'user_id',
        })

      if (saveError) throw saveError

      setPreferences(prev => ({ ...prev, ...newPreferences }))
      return true
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err)
      setError('Erreur lors de la sauvegarde')
      return false
    } finally {
      setSaving(false)
    }
  }, [preferences])

  // Mettre à jour une préférence
  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [])

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = useCallback(async () => {
    return await savePreferences(defaultPreferences)
  }, [savePreferences])

  // Charger au montage
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    loading,
    saving,
    error,
    updatePreference,
    savePreferences,
    resetToDefaults,
    loadPreferences,
  }
}
