'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShoppingCart,
  Building2,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  DollarSign,
  Truck,
} from 'lucide-react'

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

type Fournisseur = {
  id: number
  nom: string
}

type Filiale = {
  id: number
  nom: string
  code: string
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

export function CommandeOutsourcingForm({ commande, mode }: CommandeOutsourcingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `CMD-${year}-${random}`
  }

  const [formData, setFormData] = useState({
    numero: commande?.numero || generateNumero(),
    fournisseur_id: commande?.fournisseur_id || 0,
    filiale_id: commande?.filiale_id || 0,
    montant_total: commande?.montant_total || 0,
    statut: commande?.statut || 'brouillon',
    date_commande: commande?.date_commande || new Date().toISOString().split('T')[0],
    date_livraison_prevue: commande?.date_livraison_prevue || '',
    notes: commande?.notes || '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createUntypedClient()

      const [filialesRes, fournisseursRes] = await Promise.all([
        supabase.from('filiales').select('id, nom, code').eq('statut', 'actif').order('nom'),
        supabase.from('fournisseurs').select('id, nom').in('statut', ['actif', 'en_evaluation']).order('nom'),
      ])

      if (filialesRes.data) setFiliales(filialesRes.data as Filiale[])
      if (fournisseursRes.data) setFournisseurs(fournisseursRes.data as Fournisseur[])

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

    if (!formData.fournisseur_id) {
      setError('Veuillez sélectionner un fournisseur')
      return
    }
    if (!formData.filiale_id) {
      setError('Veuillez sélectionner une filiale')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const commandeData = {
        numero: formData.numero.trim(),
        fournisseur_id: formData.fournisseur_id,
        filiale_id: formData.filiale_id,
        montant_total: formData.montant_total,
        statut: formData.statut,
        date_commande: formData.date_commande,
        date_livraison_prevue: formData.date_livraison_prevue || null,
        notes: formData.notes.trim() || null,
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
      setError('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const themeColor = '#0f2080'

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
          <ShoppingCart className="h-5 w-5" style={{ color: themeColor }} />
          Informations de la commande
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="numero">Numéro de commande</Label>
            <Input
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              placeholder="CMD-2026-0001"
              className="mt-1"
              readOnly={mode === 'edit'}
            />
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {statutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="fournisseur_id">Fournisseur *</Label>
            <select
              id="fournisseur_id"
              name="fournisseur_id"
              value={formData.fournisseur_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              <option value={0}>Sélectionner un fournisseur</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="filiale_id">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Filiale *
              </span>
            </Label>
            <select
              id="filiale_id"
              name="filiale_id"
              value={formData.filiale_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              <option value={0}>Sélectionner une filiale</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="montant_total">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Montant total (EUR)
              </span>
            </Label>
            <Input
              id="montant_total"
              name="montant_total"
              type="number"
              min="0"
              step="0.01"
              value={formData.montant_total || ''}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: themeColor }} />
          Planification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_commande">Date de commande *</Label>
            <Input
              id="date_commande"
              name="date_commande"
              type="date"
              value={formData.date_commande}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="date_livraison_prevue">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Date de livraison prévue
              </span>
            </Label>
            <Input
              id="date_livraison_prevue"
              name="date_livraison_prevue"
              type="date"
              value={formData.date_livraison_prevue}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder="Notes sur cette commande..."
        />
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Créer la commande' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
