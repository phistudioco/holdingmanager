'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUntypedClient } from '@/lib/supabase/client'
import { useFiliales, useClients } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import {
  FileText,
  Users,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calculator,
} from 'lucide-react'
import {
  factureSchema,
  factureCreateSchema,
  tauxTVA,
  typesFacture,
  type FactureFormData,
  type FactureLigneFormData,
} from '@/lib/validations/facture'
import type { Tables } from '@/types/database'
import {
  calculateLigneFacture as calculateLigneMontants,
  sumMontants,
  formatCurrency as formatMontant,
} from '@/lib/utils/currency'
import { parseSupabaseError, parseApiError, type FormError } from '@/lib/errors/parse-error'

type Facture = Tables<'factures'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type LigneFacture = {
  id?: number
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht?: number
  montant_tva?: number
  montant_ttc?: number
  ordre?: number
}

type FactureFormProps = {
  facture?: Facture
  lignes?: LigneFacture[]
  mode: 'create' | 'edit'
}

export function FactureForm({ facture, lignes: initialLignes, mode }: FactureFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')

  const [formError, setFormError] = useState<FormError | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales<Filiale>()
  const { data: clients } = useClients<Client>()

  // Configuration react-hook-form avec zodResolver et lignes dynamiques
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FactureFormData>({
    resolver: zodResolver(mode === 'create' ? factureCreateSchema : factureSchema),
    defaultValues: {
      filiale_id: facture?.filiale_id || 0,
      client_id: facture?.client_id || (clientIdFromUrl ? parseInt(clientIdFromUrl) : 0),
      numero: facture?.numero || '',
      type: facture?.type || 'facture',
      date_emission: facture?.date_emission || new Date().toISOString().split('T')[0],
      date_echeance: facture?.date_echeance || '',
      objet: facture?.objet || '',
      taux_tva: facture?.taux_tva || 20,
      statut: facture?.statut || 'brouillon',
      notes: facture?.notes || '',
      lignes: initialLignes && initialLignes.length > 0
        ? initialLignes.map(l => ({
            description: l.description,
            quantite: l.quantite,
            prix_unitaire: l.prix_unitaire,
            taux_tva: l.taux_tva,
            ordre: l.ordre || 0,
          }))
        : [
            {
              description: '',
              quantite: 1,
              prix_unitaire: 0,
              taux_tva: 20,
              ordre: 0,
            },
          ],
    },
  })

  // Gestion du tableau dynamique de lignes
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lignes',
  })

  // Observer les changements pour recalculer
  const watchedLignes = useWatch({ control, name: 'lignes' })
  const watchedClientId = useWatch({ control, name: 'client_id' })
  const watchedDateEmission = useWatch({ control, name: 'date_emission' })
  const watchedTauxTVA = useWatch({ control, name: 'taux_tva' })

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, setValue])

  // Calculer l'échéance automatiquement selon le client
  useEffect(() => {
    if (watchedClientId && watchedDateEmission) {
      const client = clients.find(c => c.id === watchedClientId)
      if (client) {
        const dateEmission = new Date(watchedDateEmission)
        dateEmission.setDate(dateEmission.getDate() + client.delai_paiement)
        setValue('date_echeance', dateEmission.toISOString().split('T')[0])
      }
    }
  }, [watchedClientId, watchedDateEmission, clients, setValue])

  // Calculer les montants pour chaque ligne avec memoization
  const lignesWithCalculations = useMemo(() => {
    if (!watchedLignes) return []
    return watchedLignes.map((ligne: FactureLigneFormData) => {
      const { montant_ht, montant_tva, montant_ttc } = calculateLigneMontants(
        ligne.quantite,
        ligne.prix_unitaire,
        ligne.taux_tva
      )
      return { ...ligne, montant_ht, montant_tva, montant_ttc }
    })
  }, [watchedLignes])

  // Calculer les totaux avec précision décimale
  const totaux = useMemo(() => ({
    ht: sumMontants(...lignesWithCalculations.map(l => l.montant_ht || 0)),
    tva: sumMontants(...lignesWithCalculations.map(l => l.montant_tva || 0)),
    ttc: sumMontants(...lignesWithCalculations.map(l => l.montant_ttc || 0)),
  }), [lignesWithCalculations])

  const generateNumero = (type: string) => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-4)
    const prefix = type === 'avoir' ? 'AV' : type === 'acompte' ? 'AC' : 'FAC'
    return `${prefix}-${year}-${timestamp}`
  }

  const addLigne = () => {
    append({
      description: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: watchedTauxTVA || 20,
      ordre: fields.length,
    })
  }

  const onSubmit = async (data: FactureFormData) => {
    setFormError(null)

    try {
      const supabase = createUntypedClient()

      // Préparer les lignes avec calculs
      const lignesWithMontants = lignesWithCalculations.map((ligne, index) => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        taux_tva: ligne.taux_tva,
        montant_ht: ligne.montant_ht || 0,
        montant_tva: ligne.montant_tva || 0,
        montant_ttc: ligne.montant_ttc || 0,
        ordre: index,
      }))

      const factureData = {
        filiale_id: data.filiale_id,
        client_id: data.client_id,
        numero: mode === 'create' ? generateNumero(data.type) : data.numero,
        type: data.type,
        date_emission: data.date_emission,
        date_echeance: data.date_echeance,
        objet: data.objet || null,
        taux_tva: data.taux_tva,
        statut: data.statut,
        notes: data.notes || null,
        total_ht: totaux.ht,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
        montant_paye: 0,
      }

      if (mode === 'create') {
        const { data: newFacture, error: insertError } = await supabase
          .from('factures')
          .insert(factureData)
          .select()
          .single()

        if (insertError) throw insertError

        // Insérer les lignes
        const lignesData = lignesWithMontants.map((ligne) => ({
          facture_id: newFacture.id,
          ...ligne,
        }))

        const { error: lignesError } = await supabase
          .from('facture_lignes')
          .insert(lignesData)

        if (lignesError) throw lignesError
      } else {
        // Mise à jour via API route sécurisée (transaction atomique)
        const response = await fetch(`/api/factures/${facture?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            facture: factureData,
            lignes: lignesWithMontants,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          const parsedError = await parseApiError(response)
          setFormError(parsedError)
          return
        }
      }

      router.push('/finance/factures')
      router.refresh()
    } catch (err: unknown) {
      console.error('Erreur:', err)
      const parsedError = parseSupabaseError(err)
      setFormError(parsedError)
    }
  }

  // Préparer les messages d'erreur pour FormAlert
  const errorMessages = Object.entries(errors).map(([key, error]) => {
    if (key === 'lignes' && Array.isArray(error)) {
      return error
        .map((ligneError, idx) =>
          ligneError ? `Ligne ${idx + 1}: ${Object.values(ligneError).join(', ')}` : null
        )
        .filter(Boolean)
        .join('; ')
    }
    return error.message || ''
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de facture">
      {/* Erreurs de validation Zod */}
      {Object.keys(errors).length > 0 && (
        <FormAlert
          type="error"
          message="Erreurs de validation :"
          messages={errorMessages}
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
            <FileText className="h-5 w-5" aria-hidden="true" />
            Informations générales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="type">Type de document</Label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {typesFacture.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="filiale_id">Filiale *</Label>
            <select
              id="filiale_id"
              {...register('filiale_id', { valueAsNumber: true })}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.filiale_id ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Sélectionner</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom}
                </option>
              ))}
            </select>
            {errors.filiale_id && <p className="text-sm text-red-600 mt-1">{errors.filiale_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
              <option value="payee">Payée</option>
              <option value="annulee">Annulée</option>
            </select>
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
            <Label htmlFor="objet">Objet</Label>
            <Input
              id="objet"
              {...register('objet')}
              placeholder="Prestation de services, Maintenance..."
              className="mt-1"
            />
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
            <Label htmlFor="client_id">Client *</Label>
            <select
              id="client_id"
              {...register('client_id', { valueAsNumber: true })}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.client_id ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom} ({client.code})
                </option>
              ))}
            </select>
            {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-green-500 to-emerald-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            Dates
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="date_emission">Date d&apos;émission *</Label>
            <Input
              id="date_emission"
              type="date"
              {...register('date_emission')}
              className={`mt-1 ${errors.date_emission ? 'border-red-500' : ''}`}
            />
            {errors.date_emission && <p className="text-sm text-red-600 mt-1">{errors.date_emission.message}</p>}
          </div>

          <div>
            <Label htmlFor="date_echeance">Date d&apos;échéance *</Label>
            <Input
              id="date_echeance"
              type="date"
              {...register('date_echeance')}
              className={`mt-1 ${errors.date_echeance ? 'border-red-500' : ''}`}
            />
            {errors.date_echeance && <p className="text-sm text-red-600 mt-1">{errors.date_echeance.message}</p>}
          </div>
        </div>
      </div>

      {/* Lignes de facture */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            Lignes de facture
          </h3>
          <Button
            type="button"
            onClick={addLigne}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Ajouter une ligne
          </Button>
        </div>
        <div className="p-6 space-y-4">
          {fields.map((field, index) => {
            const ligneWithCalc = lignesWithCalculations[index]
            return (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-xl"
              >
                <div className="col-span-12 lg:col-span-4">
                  <Label>Description *</Label>
                  <Input
                    {...register(`lignes.${index}.description`)}
                    placeholder="Description de la prestation"
                    className={`mt-1 ${errors.lignes?.[index]?.description ? 'border-red-500' : ''}`}
                  />
                  {errors.lignes?.[index]?.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.lignes[index]?.description?.message}</p>
                  )}
                </div>
                <div className="col-span-4 lg:col-span-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                    min={1}
                    step={1}
                    className={`mt-1 ${errors.lignes?.[index]?.quantite ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="col-span-4 lg:col-span-2">
                  <Label>Prix unitaire HT</Label>
                  <Input
                    type="number"
                    {...register(`lignes.${index}.prix_unitaire`, { valueAsNumber: true })}
                    min={0}
                    step={0.01}
                    className={`mt-1 ${errors.lignes?.[index]?.prix_unitaire ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="col-span-4 lg:col-span-1">
                  <Label>TVA %</Label>
                  <select
                    {...register(`lignes.${index}.taux_tva`, { valueAsNumber: true })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
                  >
                    {tauxTVA.map((taux) => (
                      <option key={taux.value} value={taux.value}>
                        {taux.value}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-10 lg:col-span-2 text-right">
                  <Label>Total TTC</Label>
                  <p className="mt-1 py-2 font-semibold text-gray-900">
                    {ligneWithCalc ? formatMontant(ligneWithCalc.montant_ttc || 0) : '0,00 €'}
                  </p>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totaux */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total HT</span>
              <span className="font-medium">{formatMontant(totaux.ht)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total TVA</span>
              <span className="font-medium">{formatMontant(totaux.tva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total TTC</span>
              <span className="text-phi-primary">{formatMontant(totaux.ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Notes
          </h3>
        </div>
        <div className="p-6">
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder="Notes internes ou conditions particulières..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 resize-none"
          />
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
              {mode === 'create' ? 'Créer la facture' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
