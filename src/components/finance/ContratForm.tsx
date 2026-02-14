'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useFiliales, useClients } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import {
  ScrollText,
  Users,
  Calendar,
  Euro,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import type { Tables } from '@/types/database'
import {
  contratSchema,
  contratCreateSchema,
  type ContratFormData,
  typesContrat,
  periodicitesContrat,
} from '@/lib/validations/contrat'
import { parseSupabaseError, type FormError } from '@/lib/errors/parse-error'

type Contrat = Tables<'contrats'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type ContratFormProps = {
  contrat?: Contrat
  mode: 'create' | 'edit'
}

export function ContratForm({ contrat, mode }: ContratFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')

  const [formError, setFormError] = useState<FormError | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales<Filiale>()
  const { data: clients } = useClients<Client>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContratFormData>({
    resolver: zodResolver(mode === 'create' ? contratCreateSchema : contratSchema),
    defaultValues: {
      filiale_id: contrat?.filiale_id || undefined,
      client_id: contrat?.client_id || (clientIdFromUrl ? parseInt(clientIdFromUrl) : undefined),
      numero: contrat?.numero || '',
      titre: contrat?.titre || '',
      type: contrat?.type || 'service',
      date_debut: contrat?.date_debut || new Date().toISOString().split('T')[0],
      date_fin: contrat?.date_fin || '',
      montant: contrat?.montant ? Number(contrat.montant) : 0,
      periodicite: contrat?.periodicite || 'mensuel',
      reconduction_auto: contrat?.reconduction_auto ?? true,
      statut: contrat?.statut || 'brouillon',
      description: contrat?.description || '',
    },
  })

  const periodicite = watch('periodicite')
  const montant = watch('montant')

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0 && !contrat?.filiale_id) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, contrat?.filiale_id, setValue])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-4)
    return `CTR-${year}-${timestamp}`
  }

  const onSubmit = async (data: ContratFormData) => {
    setFormError(null)

    try {
      const supabase = createClient()

      const contratData = {
        ...data,
        numero: mode === 'create' ? generateNumero() : data.numero,
        date_fin: data.date_fin || null,
        description: data.description || null,
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('contrats')
          .insert(contratData)

        if (insertError) throw insertError
      } else {
        const { error: updateError } = await supabase
          .from('contrats')
          .update(contratData)
          .eq('id', contrat?.id)

        if (updateError) throw updateError
      }

      router.push('/finance/contrats')
      router.refresh()
    } catch (err: unknown) {
      console.error('Erreur:', err)
      const parsedError = parseSupabaseError(err)
      setFormError(parsedError)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de contrat">
      {/* Erreurs de validation Zod */}
      {Object.keys(errors).length > 0 && (
        <FormAlert
          type="error"
          message="Erreurs de validation :"
          messages={Object.entries(errors).map(([key, error]) => `${key}: ${error.message}`)}
          aria-label="Erreurs de validation du formulaire"
        />
      )}

      {/* Erreurs serveur (RLS, métier, techniques) */}
      {formError && (
        <FormAlert
          type={formError.type === 'rls' ? 'warning' : 'error'}
          message={formError.message}
          messages={formError.details ? [formError.details] : undefined}
        />
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-phi-primary to-blue-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <ScrollText className="h-5 w-5" aria-hidden="true" />
            Informations générales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="type">Type de contrat</Label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {typesContrat.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <Label htmlFor="filiale_id">
              Filiale <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="filiale_id"
              {...register('filiale_id', {
                setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
              })}
              className={`mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.filiale_id ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.filiale_id}
              aria-describedby={errors.filiale_id ? 'filiale-error' : undefined}
            >
              <option value="">Sélectionner</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom}
                </option>
              ))}
            </select>
            {errors.filiale_id && (
              <p id="filiale-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.filiale_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="brouillon">Brouillon</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="termine">Terminé</option>
              <option value="resilie">Résilié</option>
            </select>
            {errors.statut && <p className="text-sm text-red-600 mt-1">{errors.statut.message}</p>}
          </div>

          {mode === 'edit' && (
            <div>
              <Label htmlFor="numero">Numéro</Label>
              <Input
                id="numero"
                {...register('numero')}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="titre">
              Titre du contrat <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="titre"
              {...register('titre')}
              placeholder="Contrat de maintenance annuel, Licence logiciel..."
              className={`mt-1 ${errors.titre ? 'border-red-500' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.titre}
              aria-describedby={errors.titre ? 'titre-error' : undefined}
            />
            {errors.titre && (
              <p id="titre-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.titre.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-phi-accent to-pink-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden="true" />
            Client
          </h3>
        </div>
        <div className="p-6">
          <div>
            <Label htmlFor="client_id">
              Client <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="client_id"
              {...register('client_id', {
                setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
              })}
              className={`mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.client_id ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.client_id}
              aria-describedby={errors.client_id ? 'client-error' : undefined}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom} ({client.code})
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p id="client-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.client_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dates et Périodicité */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-green-500 to-emerald-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            Durée et Périodicité
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="date_debut">
              Date de début <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="date_debut"
              type="date"
              {...register('date_debut')}
              className={`mt-1 ${errors.date_debut ? 'border-red-500' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.date_debut}
              aria-describedby={errors.date_debut ? 'date-debut-error' : undefined}
            />
            {errors.date_debut && (
              <p id="date-debut-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.date_debut.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date_fin">Date de fin</Label>
            <Input
              id="date_fin"
              type="date"
              {...register('date_fin')}
              className="mt-1"
            />
            <p className="text-xs text-gray-600 mt-1">Laisser vide pour durée indéterminée</p>
            {errors.date_fin && <p className="text-sm text-red-600 mt-1">{errors.date_fin.message}</p>}
          </div>

          <div>
            <Label htmlFor="periodicite">Périodicité</Label>
            <select
              id="periodicite"
              {...register('periodicite')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {periodicitesContrat.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {errors.periodicite && <p className="text-sm text-red-600 mt-1">{errors.periodicite.message}</p>}
          </div>

          <div>
            <Label>Option</Label>
            <label className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 h-[42px]">
              <input
                type="checkbox"
                {...register('reconduction_auto')}
                className="h-4 w-4 text-phi-primary rounded focus:ring-phi-primary/20"
              />
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">Reconduction auto</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-purple-500 to-violet-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Euro className="h-5 w-5" aria-hidden="true" />
            Montant
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="montant">
                Montant (€) <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <Input
                id="montant"
                type="number"
                step={0.01}
                {...register('montant', { valueAsNumber: true })}
                className={`mt-1 ${errors.montant ? 'border-red-500' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.montant}
                aria-describedby={errors.montant ? 'montant-error' : undefined}
              />
              <p className="text-xs text-gray-600 mt-1">
                Montant par période ({periodicite})
              </p>
              {errors.montant && (
                <p id="montant-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.montant.message}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <div className="p-4 bg-phi-primary/5 rounded-xl w-full">
                <p className="text-sm text-gray-600 mb-1">Montant affiché</p>
                <p className="text-2xl font-bold text-phi-primary">
                  {formatCurrency(montant)}
                  <span className="text-sm font-normal text-gray-600 ml-2">/ {periodicite}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 flex items-center gap-2">
            <ScrollText className="h-5 w-5" aria-hidden="true" />
            Description
          </h3>
        </div>
        <div className="p-6">
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            placeholder="Description du contrat, clauses particulières..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 resize-none"
          />
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-phi-primary hover:bg-phi-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {mode === 'create' ? 'Créer le contrat' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
