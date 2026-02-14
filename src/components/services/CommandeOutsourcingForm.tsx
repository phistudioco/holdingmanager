'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useFiliales, useFournisseurs, type Filiale, type Fournisseur } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShoppingCart,
  Building2,
  Calendar,
  Save,
  Loader2,

  DollarSign,
  Truck,
} from 'lucide-react'
import { parseSupabaseError, type FormError } from '@/lib/errors/parse-error'

type CommandeOutsourcing = {
  id?: number
  numero: string
  fournisseur_id: number
  filiale_id: number
  montant_total: number
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
  date_commande: string
  date_livraison_prevue: string | null
  notes: string | null
}

type CommandeOutsourcingFormProps = {
  commande?: CommandeOutsourcing
  mode: 'create' | 'edit'
}

const statutOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' },
]

const commandeSchema = z.object({
  numero: z.string().min(1, 'Le numéro de commande est requis'),
  fournisseur_id: z.number().min(1, 'Veuillez sélectionner un fournisseur'),
  filiale_id: z.number().min(1, 'Veuillez sélectionner une filiale'),
  montant_total: z.number().min(0, 'Le montant doit être positif'),
  statut: z.enum(['brouillon', 'envoyee', 'confirmee', 'livree', 'annulee']),
  date_commande: z.string().min(1, 'La date de commande est requise'),
  date_livraison_prevue: z.string().optional(),
  notes: z.string().optional(),
})

type CommandeFormData = z.infer<typeof commandeSchema>

export function CommandeOutsourcingForm({ commande, mode }: CommandeOutsourcingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<FormError | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales({ fields: 'id, nom, code' })
  const { data: fournisseurs } = useFournisseurs({ fields: 'id, nom' })

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `CMD-${year}-${random}`
  }

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CommandeFormData>({
    resolver: zodResolver(commandeSchema),
    defaultValues: {
      numero: commande?.numero || generateNumero(),
      fournisseur_id: commande?.fournisseur_id || 0,
      filiale_id: commande?.filiale_id || 0,
      montant_total: commande?.montant_total || 0,
      statut: (commande?.statut as CommandeFormData['statut']) || 'brouillon',
      date_commande: commande?.date_commande || new Date().toISOString().split('T')[0],
      date_livraison_prevue: commande?.date_livraison_prevue || '',
      notes: commande?.notes || '',
    },
  })

  const formData = watch()

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, setValue])

  const onSubmit = async (data: CommandeFormData) => {
    setFormError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const commandeData = {
        numero: data.numero.trim(),
        fournisseur_id: data.fournisseur_id,
        filiale_id: data.filiale_id,
        montant_total: data.montant_total,
        statut: data.statut,
        date_commande: data.date_commande,
        date_livraison_prevue: data.date_livraison_prevue || null,
        notes: data.notes?.trim() || null,
      }

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('commandes_outsourcing')
          .insert(commandeData)
          .select()
          .single()

        if (insertError) throw insertError

        router.push(`/services/outsourcing/commandes/${(data as { id: number }).id}`)
      } else if (commande?.id) {
        const { error: updateError } = await supabase
          .from('commandes_outsourcing')
          .update(commandeData)
          .eq('id', commande.id)

        if (updateError) throw updateError

        router.push(`/services/outsourcing/commandes/${commande.id}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      const parsedError = parseSupabaseError(err)
      setFormError(parsedError)
    } finally {
      setLoading(false)
    }
  }

  const themeColor = '#0f2080'

  return (
    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de commande outsourcing">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" style={{ color: themeColor }} aria-hidden="true" />
          Informations de la commande
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="numero">Numéro de commande</Label>
            <Input
              id="numero"
              {...register('numero')}
              placeholder="CMD-2026-0001"
              className="mt-1"
              readOnly={mode === 'edit'}
            />
            {errors.numero && (
              <p className="text-sm text-red-600 mt-1">{errors.numero.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            <Label htmlFor="fournisseur_id">
              Fournisseur <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="fournisseur_id"
              {...register('fournisseur_id', { valueAsNumber: true })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              aria-required="true"
              aria-invalid={!!errors.fournisseur_id}
              aria-describedby={errors.fournisseur_id ? 'fournisseur-error' : undefined}
            >
              <option value={0}>Sélectionner un fournisseur</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            {errors.fournisseur_id && (
              <p id="fournisseur-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.fournisseur_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="filiale_id">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Filiale <span className="text-red-500" aria-label="requis">*</span>
              </span>
            </Label>
            <select
              id="filiale_id"
              {...register('filiale_id', { valueAsNumber: true })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            <Label htmlFor="montant_total">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                Montant total (EUR)
              </span>
            </Label>
            <Input
              id="montant_total"
              type="number"
              step="0.01"
              {...register('montant_total', { valueAsNumber: true })}
              placeholder="0.00"
              className="mt-1"
            />
            {errors.montant_total && (
              <p className="text-sm text-red-600 mt-1">{errors.montant_total.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: themeColor }} aria-hidden="true" />
          Planification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_commande">
              Date de commande <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="date_commande"
              type="date"
              {...register('date_commande')}
              className="mt-1"
              aria-required="true"
              aria-invalid={!!errors.date_commande}
              aria-describedby={errors.date_commande ? 'date-commande-error' : undefined}
            />
            {errors.date_commande && (
              <p id="date-commande-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.date_commande.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date_livraison_prevue">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" aria-hidden="true" />
                Date de livraison prévue
              </span>
            </Label>
            <Input
              id="date_livraison_prevue"
              type="date"
              {...register('date_livraison_prevue')}
              className="mt-1"
            />
            {errors.date_livraison_prevue && (
              <p className="text-sm text-red-600 mt-1">{errors.date_livraison_prevue.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={4}
          className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder="Notes sur cette commande..."
        />
        {errors.notes && (
          <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
        )}
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
          style={{ backgroundColor: themeColor }}
          className="hover:opacity-90 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {mode === 'create' ? 'Créer la commande' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
