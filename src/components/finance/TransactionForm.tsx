'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Euro,
  Save,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Transaction = Tables<'transactions'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type TransactionFormProps = {
  transaction?: Transaction
  mode: 'create' | 'edit'
}

const categoriesRevenu = [
  { label: 'Facturation', value: 'facturation' },
  { label: 'Prestation', value: 'prestation' },
  { label: 'Vente', value: 'vente' },
  { label: 'Subvention', value: 'subvention' },
  { label: 'Autre revenu', value: 'autre_revenu' },
]

const categoriesDepense = [
  { label: 'Salaires', value: 'salaires' },
  { label: 'Loyer', value: 'loyer' },
  { label: 'Fournitures', value: 'fournitures' },
  { label: 'Équipements', value: 'equipements' },
  { label: 'Services', value: 'services' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Déplacements', value: 'deplacements' },
  { label: 'Autre dépense', value: 'autre_depense' },
]

export function TransactionForm({ transaction, mode }: TransactionFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    filiale_id: transaction?.filiale_id || 0,
    type: transaction?.type || 'revenu',
    categorie: transaction?.categorie || 'facturation',
    montant: transaction?.montant || 0,
    date_transaction: transaction?.date_transaction || new Date().toISOString().split('T')[0],
    description: transaction?.description || '',
    reference: transaction?.reference || '',
    client_id: transaction?.client_id || null,
    statut: transaction?.statut || 'en_attente',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createUntypedClient()

      const [filialesRes, clientsRes] = await Promise.all([
        supabase.from('filiales').select('*').eq('statut', 'actif').order('nom'),
        supabase.from('clients').select('*').in('statut', ['actif']).order('nom'),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filialesData = (filialesRes as any).data as Filiale[] | null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientsData = (clientsRes as any).data as Client[] | null

      if (filialesData) setFiliales(filialesData)
      if (clientsData) setClients(clientsData)

      if (mode === 'create' && filialesData && filialesData.length > 0) {
        setFormData(prev => ({ ...prev, filiale_id: filialesData[0].id }))
      }
    }

    fetchData()
  }, [mode])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }

      // Reset categorie when type changes
      if (name === 'type') {
        newData.categorie = value === 'revenu' ? 'facturation' : 'salaires'
      }

      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.filiale_id || !formData.montant || formData.montant <= 0) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const transactionData = {
        ...formData,
        description: formData.description || null,
        reference: formData.reference || null,
        client_id: formData.client_id || null,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('transactions')
          .insert(transactionData)

        if (insertError) throw insertError
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
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
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const categories = formData.type === 'revenu' ? categoriesRevenu : categoriesDepense

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Type de transaction */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700">Type de transaction</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'revenu', categorie: 'facturation' }))}
              className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${
                formData.type === 'revenu'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-200 hover:bg-green-50/50'
              }`}
            >
              <ArrowUpCircle className={`h-8 w-8 ${formData.type === 'revenu' ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className="font-semibold text-lg">Revenu</p>
                <p className="text-sm opacity-70">Entrée d&apos;argent</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'depense', categorie: 'salaires' }))}
              className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${
                formData.type === 'depense'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-200 hover:bg-red-50/50'
              }`}
            >
              <ArrowDownCircle className={`h-8 w-8 ${formData.type === 'depense' ? 'text-red-500' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className="font-semibold text-lg">Dépense</p>
                <p className="text-sm opacity-70">Sortie d&apos;argent</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r ${
          formData.type === 'revenu' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
        }`}>
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            {formData.type === 'revenu' ? (
              <ArrowUpCircle className="h-5 w-5" />
            ) : (
              <ArrowDownCircle className="h-5 w-5" />
            )}
            Informations
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="filiale_id">Filiale *</Label>
            <select
              id="filiale_id"
              name="filiale_id"
              value={formData.filiale_id}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="">Sélectionner</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="categorie">Catégorie *</Label>
            <select
              id="categorie"
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description de la transaction..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="N° de référence, facture..."
              className="mt-1"
            />
          </div>

          {formData.type === 'revenu' && (
            <div>
              <Label htmlFor="client_id">Client (optionnel)</Label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id || ''}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="">Aucun client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom} ({client.code})
                  </option>
                ))}
              </select>
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
              <Label htmlFor="montant">Montant (€) *</Label>
              <Input
                id="montant"
                name="montant"
                type="number"
                value={formData.montant}
                onChange={handleChange}
                min={0}
                step={0.01}
                required
                className="mt-1 text-lg"
              />
            </div>
            <div className={`mt-4 p-4 rounded-xl ${
              formData.type === 'revenu' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Montant affiché</p>
              <p className={`text-2xl font-bold ${
                formData.type === 'revenu' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.type === 'revenu' ? '+' : '-'}{formatCurrency(formData.montant)}
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
              <Label htmlFor="date_transaction">Date de la transaction *</Label>
              <Input
                id="date_transaction"
                name="date_transaction"
                type="date"
                value={formData.date_transaction}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Filiale sélectionnée</p>
                <p className="font-medium text-blue-700">
                  {filiales.find(f => f.id === formData.filiale_id)?.nom || 'Non sélectionnée'}
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
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={formData.type === 'revenu' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          {loading ? (
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
