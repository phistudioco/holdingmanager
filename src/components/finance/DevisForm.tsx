'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import type { Tables } from '@/types/database'
import {
  devisSchema,
  devisCreateSchema,
  type DevisFormData,
  tauxTVA as tauxTVAOptions,
} from '@/lib/validations/devis'

type Devis = Tables<'devis'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type LigneDevis = {
  id?: number
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_tva: number
  montant_ttc: number
}

type DevisFormProps = {
  devis?: Devis
  lignes?: LigneDevis[]
  mode: 'create' | 'edit'
}

// Date de validité par défaut: 30 jours après émission
const getDefaultValidite = (dateEmission: string) => {
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

export function DevisForm({ devis, lignes: initialLignes, mode }: DevisFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')

  const [error, setError] = useState<string | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales<Filiale>()
  const { data: clients } = useClients<Client>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DevisFormData>({
    resolver: zodResolver(mode === 'create' ? devisCreateSchema : devisSchema),
    defaultValues: {
      filiale_id: devis?.filiale_id || undefined,
      client_id: devis?.client_id || (clientIdFromUrl ? parseInt(clientIdFromUrl) : undefined),
      numero: devis?.numero || '',
      date_emission: devis?.date_emission || new Date().toISOString().split('T')[0],
      date_validite: devis?.date_validite || getDefaultValidite(new Date().toISOString().split('T')[0]),
      objet: devis?.objet || '',
      taux_tva: devis?.taux_tva || 20,
      statut: devis?.statut || 'brouillon',
      notes: devis?.notes || '',
      conditions: devis?.conditions || '',
    },
  })

  const dateEmission = watch('date_emission')
  const tauxTvaDefault = watch('taux_tva')

  const [lignes, setLignes] = useState<LigneDevis[]>(
    initialLignes || [
      {
        description: '',
        quantite: 1,
        prix_unitaire: 0,
        taux_tva: 20,
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      },
    ]
  )

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0 && !devis?.filiale_id) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, devis?.filiale_id, setValue])

  // Mettre à jour la date de validité quand la date d'émission change
  useEffect(() => {
    if (mode === 'create' && dateEmission) {
      setValue('date_validite', getDefaultValidite(dateEmission))
    }
  }, [dateEmission, mode, setValue])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-4)
    return `DEV-${year}${month}-${timestamp}`
  }

  const calculateLigne = (ligne: LigneDevis): LigneDevis => {
    const montant_ht = ligne.quantite * ligne.prix_unitaire
    const montant_tva = montant_ht * (ligne.taux_tva / 100)
    const montant_ttc = montant_ht + montant_tva
    return { ...ligne, montant_ht, montant_tva, montant_ttc }
  }

  const handleLigneChange = (index: number, field: keyof LigneDevis, value: string | number) => {
    setLignes(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: typeof value === 'string' && ['quantite', 'prix_unitaire', 'taux_tva'].includes(field)
          ? field === 'quantite'
            ? parseInt(value) || 1
            : parseFloat(value) || 0
          : value,
      }
      updated[index] = calculateLigne(updated[index])
      return updated
    })
  }

  const addLigne = () => {
    setLignes(prev => [
      ...prev,
      {
        description: '',
        quantite: 1,
        prix_unitaire: 0,
        taux_tva: tauxTvaDefault,
        montant_ht: 0,
        montant_tva: 0,
        montant_ttc: 0,
      },
    ])
  }

  const removeLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const totaux = lignes.reduce(
    (acc, ligne) => ({
      ht: acc.ht + ligne.montant_ht,
      tva: acc.tva + ligne.montant_tva,
      ttc: acc.ttc + ligne.montant_ttc,
    }),
    { ht: 0, tva: 0, ttc: 0 }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const onSubmit = async (data: DevisFormData) => {
    setError(null)

    // Validation des lignes
    if (lignes.every(l => !l.description.trim())) {
      setError('Veuillez ajouter au moins une ligne avec une description')
      return
    }

    try {
      const db = createUntypedClient()

      const numero = mode === 'create' ? generateNumero() : data.numero

      const devisData = {
        filiale_id: data.filiale_id,
        client_id: data.client_id,
        numero,
        date_emission: data.date_emission,
        date_validite: data.date_validite,
        objet: data.objet || null,
        total_ht: totaux.ht,
        taux_tva: data.taux_tva,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
        statut: data.statut,
        notes: data.notes || null,
        conditions: data.conditions || null,
      }

      if (mode === 'create') {
        const { data: newDevis, error: devisError } = await db
          .from('devis')
          .insert(devisData)
          .select()
          .single()

        if (devisError) throw devisError

        // Insérer les lignes
        const lignesData = lignes
          .filter(l => l.description.trim())
          .map((ligne, index) => ({
            devis_id: (newDevis as { id: number }).id,
            description: ligne.description,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
            taux_tva: ligne.taux_tva,
            montant_ht: ligne.montant_ht,
            montant_tva: ligne.montant_tva,
            montant_ttc: ligne.montant_ttc,
            ordre: index,
          }))

        if (lignesData.length > 0) {
          const { error: lignesError } = await db
            .from('devis_lignes')
            .insert(lignesData)

          if (lignesError) throw lignesError
        }

        router.push(`/finance/devis/${(newDevis as { id: number }).id}`)
      } else if (devis) {
        const { error: updateError } = await db
          .from('devis')
          .update(devisData)
          .eq('id', devis.id)

        if (updateError) throw updateError

        // Supprimer les anciennes lignes et réinsérer
        await db.from('devis_lignes').delete().eq('devis_id', devis.id)

        const lignesData = lignes
          .filter(l => l.description.trim())
          .map((ligne, index) => ({
            devis_id: devis.id,
            description: ligne.description,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
            taux_tva: ligne.taux_tva,
            montant_ht: ligne.montant_ht,
            montant_tva: ligne.montant_tva,
            montant_ttc: ligne.montant_ttc,
            ordre: index,
          }))

        if (lignesData.length > 0) {
          const { error: lignesError } = await db
            .from('devis_lignes')
            .insert(lignesData)

          if (lignesError) throw lignesError
        }

        router.push(`/finance/devis/${devis.id}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de l\'enregistrement')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de devis">
      <FormAlert type="error" message={error || undefined} aria-label="Erreur de devis" />

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-phi-highlight" aria-hidden="true" />
          Informations du devis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="filiale_id">
              Filiale émettrice <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="filiale_id"
              {...register('filiale_id', {
                setValueAs: (v) => v === '' || v === null || v === undefined || v === 0 ? undefined : Number(v)
              })}
              className={`mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary ${
                errors.filiale_id ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.filiale_id}
              aria-describedby={errors.filiale_id ? 'filiale-error' : undefined}
            >
              <option value={0}>Sélectionner une filiale</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            {errors.filiale_id && (
              <p id="filiale-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.filiale_id.message}
              </p>
            )}
          </div>

          {mode === 'edit' && (
            <div>
              <Label htmlFor="numero">Numéro du devis</Label>
              <Input
                id="numero"
                {...register('numero')}
                disabled
                placeholder="Auto-généré"
                className="mt-1 bg-gray-50"
              />
            </div>
          )}

          <div>
            <Label htmlFor="taux_tva">Taux TVA par défaut</Label>
            <select
              id="taux_tva"
              {...register('taux_tva', { valueAsNumber: true })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
            >
              {tauxTVAOptions.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.taux_tva && <p className="text-sm text-red-600 mt-1">{errors.taux_tva.message}</p>}
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-phi-accent" aria-hidden="true" />
          Client
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="client_id">
              Client <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="client_id"
              {...register('client_id', {
                setValueAs: (v) => v === '' || v === null || v === undefined || v === 0 ? undefined : Number(v)
              })}
              className={`mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary ${
                errors.client_id ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.client_id}
              aria-describedby={errors.client_id ? 'client-error' : undefined}
            >
              <option value={0}>Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
              ))}
            </select>
            {errors.client_id && (
              <p id="client-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.client_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="objet">Objet du devis</Label>
            <Input
              id="objet"
              {...register('objet')}
              placeholder="Description courte du devis"
              className="mt-1"
            />
            {errors.objet && <p className="text-sm text-red-600 mt-1">{errors.objet.message}</p>}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-phi-primary" aria-hidden="true" />
          Dates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_emission">
              Date d&apos;émission <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="date_emission"
              type="date"
              {...register('date_emission')}
              className={`mt-1 ${errors.date_emission ? 'border-red-500' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.date_emission}
              aria-describedby={errors.date_emission ? 'date-emission-error' : undefined}
            />
            {errors.date_emission && (
              <p id="date-emission-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.date_emission.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date_validite">
              Date de validité <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="date_validite"
              type="date"
              {...register('date_validite')}
              className={`mt-1 ${errors.date_validite ? 'border-red-500' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.date_validite}
              aria-describedby={errors.date_validite ? 'date-validite-error date-validite-hint' : 'date-validite-hint'}
            />
            <p id="date-validite-hint" className="text-xs text-gray-600 mt-1">
              Par défaut: 30 jours après émission
            </p>
            {errors.date_validite && (
              <p id="date-validite-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.date_validite.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lignes du devis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-phi-highlight" aria-hidden="true" />
            Lignes du devis
          </h2>
          <Button type="button" onClick={addLigne} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Ajouter une ligne
          </Button>
        </div>

        <div className="space-y-4">
          {lignes.map((ligne, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-xl">
              <div className="col-span-12 md:col-span-4">
                <Label className="text-xs">Description</Label>
                <Input
                  value={ligne.description}
                  onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                  placeholder="Description du service/produit"
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Label className="text-xs">Qté</Label>
                <Input
                  type="number"
                  min="1"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Label className="text-xs">Prix unit. HT</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.prix_unitaire}
                  onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Label className="text-xs">TVA %</Label>
                <select
                  value={ligne.taux_tva}
                  onChange={(e) => handleLigneChange(index, 'taux_tva', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
                >
                  {tauxTVAOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.value}%</option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 md:col-span-2">
                <Label className="text-xs">Total TTC</Label>
                <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900">
                  {formatCurrency(ligne.montant_ttc)}
                </div>
              </div>
              <div className="col-span-6 md:col-span-2 flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLigne(index)}
                  disabled={lignes.length === 1}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="mt-6 flex justify-end">
          <div className="w-full md:w-80 space-y-2 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total HT</span>
              <span className="font-medium">{formatCurrency(totaux.ht)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total TVA</span>
              <span className="font-medium">{formatCurrency(totaux.tva)}</span>
            </div>
            <div className="border-t border-yellow-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Total TTC</span>
              <span className="font-bold text-lg text-phi-primary">{formatCurrency(totaux.ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes et conditions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Notes & Conditions
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes internes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              placeholder="Notes visibles sur le devis..."
            />
            {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>}
          </div>

          <div>
            <Label htmlFor="conditions">Conditions particulières</Label>
            <textarea
              id="conditions"
              {...register('conditions')}
              rows={4}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              placeholder="Conditions spécifiques (laisser vide pour les conditions par défaut)..."
            />
            {errors.conditions && <p className="text-sm text-red-600 mt-1">{errors.conditions.message}</p>}
          </div>
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
          className="bg-phi-primary text-white hover:bg-phi-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {mode === 'create' ? 'Créer le devis' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
