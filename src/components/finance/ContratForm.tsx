'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ScrollText,
  Users,
  Calendar,
  Euro,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Contrat = Tables<'contrats'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type ContratFormProps = {
  contrat?: Contrat
  mode: 'create' | 'edit'
}

const typesContrat = [
  { label: 'Service', value: 'service' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Licence', value: 'licence' },
  { label: 'Location', value: 'location' },
  { label: 'Autre', value: 'autre' },
]

const periodicitesContrat = [
  { label: 'Mensuel', value: 'mensuel' },
  { label: 'Trimestriel', value: 'trimestriel' },
  { label: 'Semestriel', value: 'semestriel' },
  { label: 'Annuel', value: 'annuel' },
  { label: 'Ponctuel', value: 'ponctuel' },
]

export function ContratForm({ contrat, mode }: ContratFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    filiale_id: contrat?.filiale_id || 0,
    client_id: contrat?.client_id || (clientIdFromUrl ? parseInt(clientIdFromUrl) : 0),
    numero: contrat?.numero || '',
    titre: contrat?.titre || '',
    type: contrat?.type || 'service',
    date_debut: contrat?.date_debut || new Date().toISOString().split('T')[0],
    date_fin: contrat?.date_fin || '',
    montant: contrat?.montant || 0,
    periodicite: contrat?.periodicite || 'mensuel',
    reconduction_auto: contrat?.reconduction_auto ?? true,
    statut: contrat?.statut || 'brouillon',
    description: contrat?.description || '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createUntypedClient()

      const [filialesRes, clientsRes] = await Promise.all([
        supabase.from('filiales').select('*').eq('statut', 'actif').order('nom'),
        supabase.from('clients').select('*').in('statut', ['actif', 'prospect']).order('nom'),
      ])

      const filialesData = filialesRes.data as Filiale[] | null
      const clientsData = clientsRes.data as Client[] | null

      if (filialesData) setFiliales(filialesData)
      if (clientsData) setClients(clientsData)

      if (mode === 'create' && filialesData && filialesData.length > 0) {
        setFormData(prev => ({ ...prev, filiale_id: filialesData[0].id }))
      }
    }

    fetchData()
  }, [mode])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-4)
    return `CTR-${year}-${timestamp}`
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.filiale_id || !formData.client_id || !formData.titre) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const contratData = {
        ...formData,
        numero: mode === 'create' ? generateNumero() : formData.numero,
        date_fin: formData.date_fin || null,
        description: formData.description || null,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('contrats')
          .insert(contratData)

        if (insertError) throw insertError
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('contrats')
          .update(contratData)
          .eq('id', contrat?.id)

        if (updateError) throw updateError
      }

      router.push('/finance/contrats')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-primary to-blue-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Informations générales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="type">Type de contrat</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {typesContrat.map((type) => (
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
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="brouillon">Brouillon</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="termine">Terminé</option>
              <option value="resilie">Résilié</option>
            </select>
          </div>

          {mode === 'edit' && (
            <div>
              <Label htmlFor="numero">Numéro</Label>
              <Input
                id="numero"
                name="numero"
                value={formData.numero}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="titre">Titre du contrat *</Label>
            <Input
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              placeholder="Contrat de maintenance annuel, Licence logiciel..."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-accent to-pink-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client
          </h3>
        </div>
        <div className="p-6">
          <div>
            <Label htmlFor="client_id">Client *</Label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom} ({client.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dates et Périodicité */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-500 to-emerald-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Durée et Périodicité
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="date_debut">Date de début *</Label>
            <Input
              id="date_debut"
              name="date_debut"
              type="date"
              value={formData.date_debut}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date_fin">Date de fin</Label>
            <Input
              id="date_fin"
              name="date_fin"
              type="date"
              value={formData.date_fin}
              onChange={handleChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Laisser vide pour durée indéterminée</p>
          </div>

          <div>
            <Label htmlFor="periodicite">Périodicité</Label>
            <select
              id="periodicite"
              name="periodicite"
              value={formData.periodicite}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              {periodicitesContrat.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Option</Label>
            <label className="mt-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 h-[42px]">
              <input
                type="checkbox"
                name="reconduction_auto"
                checked={formData.reconduction_auto}
                onChange={handleChange}
                className="h-4 w-4 text-phi-primary rounded focus:ring-phi-primary/20"
              />
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Reconduction auto</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-violet-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Montant
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant par période ({formData.periodicite})
              </p>
            </div>
            <div className="flex items-center">
              <div className="p-4 bg-phi-primary/5 rounded-xl w-full">
                <p className="text-sm text-gray-600 mb-1">Montant affiché</p>
                <p className="text-2xl font-bold text-phi-primary">
                  {formatCurrency(formData.montant)}
                  <span className="text-sm font-normal text-gray-500 ml-2">/ {formData.periodicite}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Description
          </h3>
        </div>
        <div className="p-6">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Description du contrat, clauses particulières..."
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
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-phi-primary hover:bg-phi-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Créer le contrat' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
