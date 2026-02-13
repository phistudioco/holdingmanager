'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUntypedClient } from '@/lib/supabase/client'
import { useFiliales, useClients } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import { RadioGroupAccessible } from '@/components/ui/radio-group-accessible'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Euro,
  Save,
  Loader2,
  Building2,
} from 'lucide-react'
import type { Tables } from '@/types/database'
import {
  transactionSchema,
  type TransactionFormData,
  categoriesRevenu,
  categoriesDepense,
} from '@/lib/validations/transaction'

type Transaction = Tables<'transactions'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type TransactionFormProps = {
  transaction?: Transaction
  mode: 'create' | 'edit'
}

export function TransactionForm({ transaction, mode }: TransactionFormProps) {
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales<Filiale>()
  const { data: clients } = useClients<Client>({ statuts: ['actif'] })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      filiale_id: transaction?.filiale_id || undefined,
      type: transaction?.type || 'revenu',
      categorie: transaction?.categorie || 'facturation',
      montant: transaction?.montant ? Number(transaction.montant) : 0,
      date_transaction: transaction?.date_transaction || new Date().toISOString().split('T')[0],
      description: transaction?.description || '',
      reference: transaction?.reference || '',
      client_id: transaction?.client_id || null,
      statut: transaction?.statut || 'en_attente',
    },
  })

  const type = watch('type')
  const montant = watch('montant')
  const filialeId = watch('filiale_id')

  // Définir la filiale par défaut en mode création
  useEffect(() => {
    if (mode === 'create' && filiales.length > 0 && !transaction?.filiale_id) {
      setValue('filiale_id', filiales[0].id)
    }
  }, [mode, filiales, transaction?.filiale_id, setValue])

  const onSubmit = async (data: TransactionFormData) => {
    setError(null)

    try {
      const supabase = createUntypedClient()

      const transactionData = {
        ...data,
        description: data.description || null,
        reference: data.reference || null,
        client_id: data.client_id || null,
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionData)

        if (insertError) throw insertError
      } else {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction?.id)

        if (updateError) throw updateError
      }

      router.push('/finance/transactions')
      router.refresh()
    } catch (err: unknown) {
      console.error('Erreur:', err)
      const errorMessage = err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) :
        'Erreur inconnue'
      setError(`Erreur: ${errorMessage}`)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const categories = type === 'revenu' ? categoriesRevenu : categoriesDepense

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de transaction">
      <FormAlert type="error" message={error || undefined} aria-label="Erreur de transaction" />

      {/* Type de transaction */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100">
          <h2 className="font-heading font-semibold text-gray-700">Type de transaction</h2>
        </div>
        <div className="p-6">
          <RadioGroupAccessible
            name="type"
            label="Type de transaction"
            value={type}
            onChange={(value) => {
              setValue('type', value)
              // Définir la catégorie par défaut selon le type
              if (value === 'revenu') {
                setValue('categorie', 'facturation')
              } else {
                setValue('categorie', 'salaires')
              }
            }}
            required
            options={[
              {
                value: 'revenu',
                label: 'Revenu',
                description: "Entrée d'argent",
                icon: <ArrowUpCircle className="h-8 w-8 text-green-500" aria-hidden="true" />,
              },
              {
                value: 'depense',
                label: 'Dépense',
                description: "Sortie d'argent",
                icon: <ArrowDownCircle className="h-8 w-8 text-red-500" aria-hidden="true" />,
              },
            ]}
          />
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r ${
          type === 'revenu' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
        }`}>
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            {type === 'revenu' ? (
              <ArrowUpCircle className="h-5 w-5" />
            ) : (
              <ArrowDownCircle className="h-5 w-5" />
            )}
            Informations
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <Label htmlFor="categorie">
              Catégorie <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <select
              id="categorie"
              {...register('categorie')}
              className={`mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.categorie ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.categorie}
              aria-describedby={errors.categorie ? 'categorie-error' : undefined}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.categorie && (
              <p id="categorie-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.categorie.message}
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
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
            {errors.statut && <p className="text-sm text-red-600 mt-1">{errors.statut.message}</p>}
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Description de la transaction..."
              className="mt-1"
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              {...register('reference')}
              placeholder="N° de référence, facture..."
              className="mt-1"
            />
            {errors.reference && <p className="text-sm text-red-600 mt-1">{errors.reference.message}</p>}
          </div>

          {type === 'revenu' && (
            <div>
              <Label htmlFor="client_id">Client (optionnel)</Label>
              <select
                id="client_id"
                {...register('client_id', {
                  setValueAs: (v) => v === '' || v === null || v === undefined ? null : Number(v)
                })}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="">Aucun client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom} ({client.code})
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Montant et Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Montant */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-violet-600">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Montant
            </h3>
          </div>
          <div className="p-6">
            <div>
              <Label htmlFor="montant">
                Montant (€) <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <Input
                id="montant"
                type="number"
                step={0.01}
                {...register('montant', { valueAsNumber: true })}
                className={`mt-1 text-lg ${errors.montant ? 'border-red-500' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.montant}
                aria-describedby={errors.montant ? 'montant-error' : undefined}
              />
              {errors.montant && (
                <p id="montant-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.montant.message}
                </p>
              )}
            </div>
            <div className={`mt-4 p-4 rounded-xl ${
              type === 'revenu' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Montant affiché</p>
              <p className={`text-2xl font-bold ${
                type === 'revenu' ? 'text-green-600' : 'text-red-600'
              }`}>
                {type === 'revenu' ? '+' : '-'}{formatCurrency(montant)}
              </p>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-cyan-600">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date
            </h3>
          </div>
          <div className="p-6">
            <div>
              <Label htmlFor="date_transaction">
                Date de la transaction <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <Input
                id="date_transaction"
                type="date"
                {...register('date_transaction')}
                className={`mt-1 ${errors.date_transaction ? 'border-red-500' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.date_transaction}
                aria-describedby={errors.date_transaction ? 'date-transaction-error' : undefined}
              />
              {errors.date_transaction && (
                <p id="date-transaction-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.date_transaction.message}
                </p>
              )}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Filiale sélectionnée</p>
                <p className="font-medium text-blue-700">
                  {filiales.find(f => f.id === filialeId)?.nom || 'Non sélectionnée'}
                </p>
              </div>
            </div>
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
          className={type === 'revenu' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Enregistrer' : 'Modifier'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
