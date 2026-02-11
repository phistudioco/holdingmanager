'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Users,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Calculator,
} from 'lucide-react'
import type { Tables } from '@/types/database'

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

const tauxTVA = [
  { value: 20, label: '20% (Normal)' },
  { value: 10, label: '10% (Intermédiaire)' },
  { value: 5.5, label: '5.5% (Réduit)' },
  { value: 2.1, label: '2.1% (Super réduit)' },
  { value: 0, label: '0% (Exonéré)' },
]

export function DevisForm({ devis, lignes: initialLignes, mode }: DevisFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Date de validité par défaut: 30 jours après émission
  const getDefaultValidite = (dateEmission: string) => {
    const date = new Date(dateEmission)
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    filiale_id: devis?.filiale_id || 0,
    client_id: devis?.client_id || (clientIdFromUrl ? parseInt(clientIdFromUrl) : 0),
    numero: devis?.numero || '',
    date_emission: devis?.date_emission || new Date().toISOString().split('T')[0],
    date_validite: devis?.date_validite || getDefaultValidite(new Date().toISOString().split('T')[0]),
    objet: devis?.objet || '',
    taux_tva: devis?.taux_tva || 20,
    statut: devis?.statut || 'brouillon',
    notes: devis?.notes || '',
    conditions: devis?.conditions || '',
  })

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

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [filialesRes, clientsRes] = await Promise.all([
        supabase.from('filiales').select('*').eq('statut', 'actif').order('nom'),
        supabase.from('clients').select('*').in('statut', ['actif', 'prospect']).order('nom'),
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

  // Mettre à jour la date de validité quand la date d'émission change
  useEffect(() => {
    if (mode === 'create' && formData.date_emission) {
      setFormData(prev => ({
        ...prev,
        date_validite: getDefaultValidite(formData.date_emission),
      }))
    }
  }, [formData.date_emission, mode])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-4)
    return `DEV-${year}${month}-${timestamp}`
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
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
        taux_tva: formData.taux_tva,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.filiale_id) {
      setError('Veuillez sélectionner une filiale')
      return
    }
    if (!formData.client_id) {
      setError('Veuillez sélectionner un client')
      return
    }
    if (lignes.every(l => !l.description.trim())) {
      setError('Veuillez ajouter au moins une ligne avec une description')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const db = createUntypedClient()

      const numero = formData.numero || generateNumero()

      const devisData = {
        filiale_id: formData.filiale_id,
        client_id: formData.client_id,
        numero,
        date_emission: formData.date_emission,
        date_validite: formData.date_validite,
        objet: formData.objet || null,
        total_ht: totaux.ht,
        taux_tva: formData.taux_tva,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
        statut: formData.statut,
        notes: formData.notes || null,
        conditions: formData.conditions || null,
      }

      if (mode === 'create') {
        const { data: newDevis, error: devisError } = await db
          .from('devis')
          .insert(devisData)
          .select()
          .single()

        if (devisError) throw devisError

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedDevis = newDevis as any

        // Insérer les lignes
        const lignesData = lignes
          .filter(l => l.description.trim())
          .map((ligne, index) => ({
            devis_id: typedDevis.id,
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

        router.push(`/finance/devis/${typedDevis.id}`)
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
    } finally {
      setLoading(false)
    }
  }

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
          <FileText className="h-5 w-5 text-phi-highlight" />
          Informations du devis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="filiale_id">Filiale émettrice *</Label>
            <select
              id="filiale_id"
              name="filiale_id"
              value={formData.filiale_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              required
            >
              <option value={0}>Sélectionner une filiale</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="numero">Numéro du devis</Label>
            <Input
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              placeholder="Auto-généré si vide"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="taux_tva">Taux TVA par défaut</Label>
            <select
              id="taux_tva"
              name="taux_tva"
              value={formData.taux_tva}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
            >
              {tauxTVA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-phi-accent" />
          Client
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="client_id">Client *</Label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              required
            >
              <option value={0}>Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="objet">Objet du devis</Label>
            <Input
              id="objet"
              name="objet"
              value={formData.objet}
              onChange={handleChange}
              placeholder="Description courte du devis"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-phi-primary" />
          Dates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_emission">Date d&apos;émission *</Label>
            <Input
              id="date_emission"
              name="date_emission"
              type="date"
              value={formData.date_emission}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="date_validite">Date de validité *</Label>
            <Input
              id="date_validite"
              name="date_validite"
              type="date"
              value={formData.date_validite}
              onChange={handleChange}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Par défaut: 30 jours après émission
            </p>
          </div>
        </div>
      </div>

      {/* Lignes du devis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-phi-highlight" />
            Lignes du devis
          </h2>
          <Button type="button" onClick={addLigne} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
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
                  {tauxTVA.map(t => (
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
                  <Trash2 className="h-4 w-4" />
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Notes & Conditions
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes internes</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              placeholder="Notes visibles sur le devis..."
            />
          </div>

          <div>
            <Label htmlFor="conditions">Conditions particulières</Label>
            <textarea
              id="conditions"
              name="conditions"
              value={formData.conditions}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
              placeholder="Conditions spécifiques (laisser vide pour les conditions par défaut)..."
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
          className="bg-phi-highlight text-gray-900 hover:bg-phi-highlight/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Créer le devis' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
