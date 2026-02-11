'use client'

import { useState } from 'react'
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
  Monitor,
  Save,
  Loader2,
  RotateCcw,
  AlertCircle,
  FileText,
  ScrollText,
  GitBranch,
  DollarSign,
  Settings,
  Clock,
  Calendar,
  Check,
} from 'lucide-react'

const severiteOptions = [
  { value: 'basse', label: 'Toutes (basse et plus)' },
  { value: 'moyenne', label: 'Moyenne et plus' },
  { value: 'haute', label: 'Haute et critique' },
  { value: 'critique', label: 'Critique uniquement' },
]

const notificationTypes = [
  {
    key: 'notify_facture_impayee' as const,
    label: 'Factures impayées',
    description: 'Alertes quand une facture dépasse son échéance',
    icon: FileText,
    color: 'text-red-500',
  },
  {
    key: 'notify_facture_echeance' as const,
    label: 'Échéances factures',
    description: 'Rappels avant échéance des factures',
    icon: Clock,
    color: 'text-orange-500',
  },
  {
    key: 'notify_contrat_expiration' as const,
    label: 'Expiration contrats',
    description: 'Alertes avant expiration des contrats',
    icon: ScrollText,
    color: 'text-yellow-500',
  },
  {
    key: 'notify_workflow_approbation' as const,
    label: 'Demandes d\'approbation',
    description: 'Nouvelles demandes à valider',
    icon: GitBranch,
    color: 'text-blue-500',
  },
  {
    key: 'notify_workflow_statut' as const,
    label: 'Statut de mes demandes',
    description: 'Mises à jour sur vos demandes',
    icon: Check,
    color: 'text-green-500',
  },
  {
    key: 'notify_budget_alerte' as const,
    label: 'Alertes budget',
    description: 'Dépassements ou seuils atteints',
    icon: DollarSign,
    color: 'text-purple-500',
  },
  {
    key: 'notify_systeme' as const,
    label: 'Notifications système',
    description: 'Mises à jour et annonces',
    icon: Settings,
    color: 'text-gray-500',
  },
]

export default function NotificationPreferencesPage() {
  const {
    preferences,
    loading,
    saving,
    error,
    updatePreference,
    savePreferences,
    resetToDefaults,
  } = useNotificationPreferences()

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications()

  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    updatePreference(key, value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    const success = await savePreferences(preferences)
    if (success) {
      setHasChanges(false)
    }
  }

  const handleReset = async () => {
    const success = await resetToDefaults()
    if (success) {
      setHasChanges(false)
    }
  }

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      await unsubscribePush()
    } else {
      await subscribePush()
    }
    handleChange('canal_push', !pushSubscribed)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Préférences de notifications"
        description="Configurez comment et quand vous souhaitez être notifié"
        breadcrumbs={[
          { label: 'Paramètres', href: '/parametres' },
          { label: 'Notifications' },
        ]}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Canaux de notification */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5 text-phi-primary" />
          Canaux de notification
        </h2>

        <div className="space-y-4">
          {/* In-App */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications in-app</p>
                <p className="text-sm text-gray-500">Affichées dans l'application</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('canal_inapp', !preferences.canal_inapp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.canal_inapp ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.canal_inapp ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pushSupported ? 'bg-purple-100' : 'bg-gray-200'}`}>
                <Smartphone className={`h-5 w-5 ${pushSupported ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications push</p>
                <p className="text-sm text-gray-500">
                  {!pushSupported
                    ? 'Non supporté par votre navigateur'
                    : pushPermission === 'denied'
                    ? 'Bloqué par le navigateur'
                    : 'Reçues même quand l\'application est fermée'}
                </p>
              </div>
            </div>
            {pushSupported && pushPermission !== 'denied' && (
              <button
                onClick={handlePushToggle}
                disabled={pushLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushSubscribed ? 'bg-green-500' : 'bg-gray-300'
                } ${pushLoading ? 'opacity-50' : ''}`}
              >
                {pushLoading ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                  </span>
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            )}
            {pushPermission === 'denied' && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <BellOff className="h-4 w-4" />
                Bloqué
              </span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications par email</p>
                <p className="text-sm text-gray-500">Envoyées à votre adresse email</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('canal_email', !preferences.canal_email)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.canal_email ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.canal_email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Types de notifications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-phi-primary" />
          Types de notifications
        </h2>

        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <type.icon className={`h-5 w-5 ${type.color}`} />
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleChange(type.key, !preferences[type.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[type.key] ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sévérité minimum */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-phi-primary" />
          Niveau de priorité minimum
        </h2>

        <div>
          <Label htmlFor="severite">Ne recevoir que les alertes de niveau</Label>
          <select
            id="severite"
            value={preferences.severite_minimum}
            onChange={(e) => handleChange('severite_minimum', e.target.value as typeof preferences.severite_minimum)}
            className="mt-2 w-full md:w-64 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
          >
            {severiteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Les notifications de niveau inférieur ne seront pas affichées
          </p>
        </div>
      </div>

      {/* Horaires de notification */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-phi-primary" />
          Horaires de notification
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="heures_debut">Heure de début</Label>
              <input
                type="time"
                id="heures_debut"
                value={preferences.notification_heures_debut}
                onChange={(e) => handleChange('notification_heures_debut', e.target.value)}
                className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
              />
            </div>
            <div>
              <Label htmlFor="heures_fin">Heure de fin</Label>
              <input
                type="time"
                id="heures_fin"
                value={preferences.notification_heures_fin}
                onChange={(e) => handleChange('notification_heures_fin', e.target.value)}
                className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Notifications le weekend</p>
                <p className="text-sm text-gray-500">Recevoir des notifications samedi et dimanche</p>
              </div>
            </div>
            <button
              onClick={() => handleChange('notification_weekend', !preferences.notification_weekend)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notification_weekend ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notification_weekend ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Résumé quotidien */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Mail className="h-5 w-5 text-phi-primary" />
          Résumé quotidien par email
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Recevoir un résumé quotidien</p>
              <p className="text-sm text-gray-500">Un email récapitulatif des notifications de la veille</p>
            </div>
            <button
              onClick={() => handleChange('resume_quotidien', !preferences.resume_quotidien)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.resume_quotidien ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.resume_quotidien ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.resume_quotidien && (
            <div>
              <Label htmlFor="resume_heure">Heure d'envoi du résumé</Label>
              <input
                type="time"
                id="resume_heure"
                value={preferences.resume_heure}
                onChange={(e) => handleChange('resume_heure', e.target.value)}
                className="mt-2 w-full md:w-48 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-phi-primary hover:bg-phi-primary/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les préférences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
