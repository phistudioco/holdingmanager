'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Monitor,
  Building2,
  Users,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
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

type Client = {
  id: number
  nom: string
  code: string
}

type Filiale = {
  id: number
  nom: string
  code: string
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

export function ProjetDigitalForm({ projet, mode }: ProjetDigitalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    nom: projet?.nom || '',
    description: projet?.description || '',
    client_id: projet?.client_id || 0,
    filiale_id: projet?.filiale_id || 0,
    type: projet?.type || 'site_web',
    statut: projet?.statut || 'planifie',
    url: projet?.url || '',
    date_debut: projet?.date_debut || '',
    date_fin_prevue: projet?.date_fin_prevue || '',
    budget: projet?.budget || 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createUntypedClient()

      const [filialesRes, clientsRes] = await Promise.all([
        supabase.from('filiales').select('id, nom, code').eq('statut', 'actif').order('nom'),
        supabase.from('clients').select('id, nom, code').in('statut', ['actif', 'prospect']).order('nom'),
      ])

      if (filialesRes.data) setFiliales(filialesRes.data as Filiale[])
      if (clientsRes.data) setClients(clientsRes.data as Client[])

      if (mode === 'create' && filialesRes.data && filialesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, filiale_id: filialesRes.data[0].id }))
      }
    }

    fetchData()
  }, [mode])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.nom.trim()) {
      setError('Le nom du projet est requis')
      return
    }
    if (!formData.filiale_id) {
      setError('Veuillez sélectionner une filiale')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const projetData = {
        nom: formData.nom.trim(),
        description: formData.description.trim() || null,
        client_id: formData.client_id || null,
        filiale_id: formData.filiale_id,
        type: formData.type,
        statut: formData.statut,
        url: formData.url.trim() || null,
        date_debut: formData.date_debut || null,
        date_fin_prevue: formData.date_fin_prevue || null,
        budget: formData.budget || null,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Monitor className="h-5 w-5" style={{ color: themeDark }} />
          Informations du projet
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="nom">Nom du projet *</Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Site vitrine Entreprise XYZ"
              className="mt-1"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
              placeholder="Décrivez le projet en détail..."
            />
          </div>

          <div>
            <Label htmlFor="type">Type de projet</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              {statutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              name="url"
              type="text"
              value={formData.url}
              onChange={handleChange}
              placeholder="www.example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget (EUR)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="100"
                value={formData.budget || ''}
                onChange={handleChange}
                placeholder="0"
                className="pl-10"
              />
            </div>
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
            <Label htmlFor="filiale_id">Filiale *</Label>
            <select
              id="filiale_id"
              name="filiale_id"
              value={formData.filiale_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
              required
            >
              <option value={0}>Sélectionner une filiale</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
              ))}
            </select>
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
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-500"
            >
              <option value={0}>Aucun client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
              ))}
            </select>
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
              name="date_debut"
              type="date"
              value={formData.date_debut}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date_fin_prevue">Date de fin prévue</Label>
            <Input
              id="date_fin_prevue"
              name="date_fin_prevue"
              type="date"
              value={formData.date_fin_prevue}
              onChange={handleChange}
              className="mt-1"
            />
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
