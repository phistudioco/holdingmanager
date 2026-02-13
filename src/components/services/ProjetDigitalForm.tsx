'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUntypedClient } from '@/lib/supabase/client'
import { useFiliales, useClients, type Filiale, type Client } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Monitor,
  Building2,
  Users,
  Calendar,
  Save,
  Loader2,
  
  DollarSign,
  Globe,
} from 'lucide-react'

type ProjetDigital = {
  id?: number
  nom: string
  description: string | null
  client_id: number | null
  filiale_id: number
  type: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
  statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
  url: string | null
  date_debut: string | null
  date_fin_prevue: string | null
  budget: number | null
}

type ProjetDigitalFormProps = {
  projet?: ProjetDigital
  mode: 'create' | 'edit'
}

const typeOptions = [
  { value: 'site_web', label: 'Site Web' },
  { value: 'application', label: 'Application' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'autre', label: 'Autre' },
]

const statutOptions = [
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'termine', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' },
]

const projetDigitalSchema = z.object({
  nom: z.string().min(1, 'Le nom du projet est requis'),
  description: z.string().optional(),
  client_id: z.number().optional(),
  filiale_id: z.number().min(1, 'Veuillez sélectionner une filiale'),
  type: z.enum(['site_web', 'application', 'ecommerce', 'mobile', 'autre']),
  statut: z.enum(['planifie', 'en_cours', 'en_pause', 'termine', 'annule']),
  url: z.string().optional(),
  date_debut: z.string().optional(),
  date_fin_prevue: z.string().optional(),
  budget: z.number().min(0, 'Le budget doit être positif').optional(),
})

type ProjetDigitalFormData = z.infer<typeof projetDigitalSchema>

export function ProjetDigitalForm({ projet, mode }: ProjetDigitalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales({ fields: 'id, nom, code' })
  const { data: clients } = useClients({ fields: 'id, nom, code' })

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProjetDigitalFormData>({
    resolver: zodResolver(projetDigitalSchema),
    defaultValues: {
      nom: projet?.nom || '',
      description: projet?.description || '',
      client_id: projet?.client_id || 0,
      filiale_id: projet?.filiale_id || 0,
      type: (projet?.type as ProjetDigitalFormData['type']) || 'site_web',
      statut: (projet?.statut as ProjetDigitalFormData['statut']) || 'planifie',
      url: projet?.url || '',
      date_debut: projet?.date_debut || '',
      date_fin_prevue: projet?.date_fin_prevue || '',
      budget: projet?.budget || 0,
    },
  })

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, setValue])

  const onSubmit = async (data: ProjetDigitalFormData) => {
    setError(null)
    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const projetData = {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        client_id: data.client_id || null,
        filiale_id: data.filiale_id,
        type: data.type,
        statut: data.statut,
        url: data.url?.trim() || null,
        date_debut: data.date_debut || null,
        date_fin_prevue: data.date_fin_prevue || null,
        budget: data.budget || null,
      }

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('projets_digital')
          .insert(projetData)
          .select()
          .single()

        if (insertError) throw insertError

        router.push(`/services/digital/${(data as { id: number }).id}`)
      } else if (projet?.id) {
        const { error: updateError } = await supabase
          .from('projets_digital')
          .update(projetData)
          .eq('id', projet.id)

        if (updateError) throw updateError

        router.push(`/services/digital/${projet.id}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const themeColor = '#fcd017'
  const themeDark = '#d4a90c'

  return (
    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de projet digital">
      <FormAlert type="error" message={error || undefined} aria-label="Erreur de projet digital" />

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Monitor className="h-5 w-5" style={{ color: themeDark }} />
          Informations du projet
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="nom">
              Nom du projet <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="nom"
              {...register('nom')}
              placeholder="Ex: Site vitrine Entreprise XYZ"
              className="mt-1"
              aria-required="true"
              aria-invalid={!!errors.nom}
              aria-describedby={errors.nom ? 'nom-error' : undefined}
            />
            {errors.nom && (
              <p id="nom-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.nom.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
              placeholder="Décrivez le projet en détail..."
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type de projet</Label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              {statutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.statut && (
              <p className="text-sm text-red-600 mt-1">{errors.statut.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="url">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL du projet
              </span>
            </Label>
            <Input
              id="url"
              type="text"
              {...register('url')}
              placeholder="www.example.com"
              className="mt-1"
            />
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="budget">Budget (EUR)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="budget"
                type="number"
                min="0"
                step="100"
                {...register('budget', { valueAsNumber: true })}
                placeholder="0"
                className="pl-10"
              />
            </div>
            {errors.budget && (
              <p className="text-sm text-red-600 mt-1">{errors.budget.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Affectation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5" style={{ color: themeDark }} />
          Affectation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="filiale_id">
              Filiale <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="filiale_id"
              {...register('filiale_id', { valueAsNumber: true })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
              aria-required="true"
              aria-invalid={!!errors.filiale_id}
              aria-describedby={errors.filiale_id ? 'filiale-error' : undefined}
            >
              <option value={0}>Sélectionner une filiale</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
              ))}
            </select>
            {errors.filiale_id && (
              <p id="filiale-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.filiale_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="client_id">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client (optionnel)
              </span>
            </Label>
            <select
              id="client_id"
              {...register('client_id', { valueAsNumber: true })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              <option value={0}>Aucun client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: themeDark }} />
          Planification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_debut">Date de début</Label>
            <Input
              id="date_debut"
              type="date"
              {...register('date_debut')}
              className="mt-1"
            />
            {errors.date_debut && (
              <p className="text-sm text-red-600 mt-1">{errors.date_debut.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date_fin_prevue">Date de fin prévue</Label>
            <Input
              id="date_fin_prevue"
              type="date"
              {...register('date_fin_prevue')}
              className="mt-1"
            />
            {errors.date_fin_prevue && (
              <p className="text-sm text-red-600 mt-1">{errors.date_fin_prevue.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="text-gray-900 hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Créer le projet' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
