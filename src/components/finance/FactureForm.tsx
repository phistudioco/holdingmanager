'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
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
import { tauxTVA, typesFacture } from '@/lib/validations/facture'
import type { Tables } from '@/types/database'
import {
  calculateLigneFacture as calculateLigneMontants,
  sumMontants,
  formatCurrency as formatMontant,
} from '@/lib/utils/currency'

type Facture = Tables<'factures'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>

type LigneFacture = {
  id?: number
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_tva: number
  montant_ttc: number
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
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
  })

  const [lignes, setLignes] = useState<LigneFacture[]>(
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
      const supabase = createUntypedClient()

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

  // Calculer l'échéance automatiquement selon le client
  useEffect(() => {
    if (formData.client_id && formData.date_emission) {
      const client = clients.find(c => c.id === formData.client_id)
      if (client) {
        const dateEmission = new Date(formData.date_emission)
        dateEmission.setDate(dateEmission.getDate() + client.delai_paiement)
        setFormData(prev => ({
          ...prev,
          date_echeance: dateEmission.toISOString().split('T')[0],
        }))
      }
    }
  }, [formData.client_id, formData.date_emission, clients])

  const generateNumero = () => {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-4)
    const prefix = formData.type === 'avoir' ? 'AV' : formData.type === 'acompte' ? 'AC' : 'FAC'
    return `${prefix}-${year}-${timestamp}`
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

  const calculateLigne = (ligne: LigneFacture): LigneFacture => {
    // Utilise les calculs décimaux précis pour éviter les erreurs d'arrondi
    const { montant_ht, montant_tva, montant_ttc } = calculateLigneMontants(
      ligne.quantite,
      ligne.prix_unitaire,
      ligne.taux_tva
    )
    return { ...ligne, montant_ht, montant_tva, montant_ttc }
  }

  const handleLigneChange = (index: number, field: keyof LigneFacture, value: string | number) => {
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

  // Calcul des totaux avec précision décimale
  const totaux = {
    ht: sumMontants(...lignes.map(l => l.montant_ht)),
    tva: sumMontants(...lignes.map(l => l.montant_tva)),
    ttc: sumMontants(...lignes.map(l => l.montant_ttc)),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (lignes.some(l => !l.description || l.prix_unitaire <= 0)) {
      setError('Veuillez remplir toutes les lignes de la facture')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const factureData = {
        ...formData,
        numero: mode === 'create' ? generateNumero() : formData.numero,
        objet: formData.objet || null,
        notes: formData.notes || null,
        total_ht: totaux.ht,
        total_tva: totaux.tva,
        total_ttc: totaux.ttc,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newFacture, error: insertError } = await (supabase as any)
          .from('factures')
          .insert(factureData)
          .select()
          .single()

        if (insertError) throw insertError

        // Insérer les lignes
        const lignesData = lignes.map((ligne, index) => ({
          facture_id: newFacture.id,
          description: ligne.description,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          taux_tva: ligne.taux_tva,
          montant_ht: ligne.montant_ht,
          montant_tva: ligne.montant_tva,
          montant_ttc: ligne.montant_ttc,
          ordre: index,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: lignesError } = await (supabase as any)
          .from('facture_lignes')
          .insert(lignesData)

        if (lignesError) throw lignesError
      } else {
        // Mise à jour via API route sécurisée (transaction atomique)
        const lignesData = lignes.map((ligne, index) => ({
          description: ligne.description,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          taux_tva: ligne.taux_tva,
          montant_ht: ligne.montant_ht,
          montant_tva: ligne.montant_tva,
          montant_ttc: ligne.montant_ttc,
          ordre: index,
        }))

        const response = await fetch(`/api/factures/${facture?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            facture: factureData,
            lignes: lignesData,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Erreur lors de la mise à jour')
        }
      }

      router.push('/finance/factures')
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
            <FileText className="h-5 w-5" />
            Informations générales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="type">Type de document</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
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
                name="numero"
                value={formData.numero}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="objet">Objet</Label>
            <Input
              id="objet"
              name="objet"
              value={formData.objet}
              onChange={handleChange}
              placeholder="Prestation de services, Maintenance..."
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

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-500 to-emerald-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dates
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="date_emission">Date d&apos;émission *</Label>
            <Input
              id="date_emission"
              name="date_emission"
              type="date"
              value={formData.date_emission}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="date_echeance">Date d&apos;échéance *</Label>
            <Input
              id="date_echeance"
              name="date_echeance"
              type="date"
              value={formData.date_echeance}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Lignes de facture */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Lignes de facture
          </h3>
          <Button
            type="button"
            onClick={addLigne}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une ligne
          </Button>
        </div>
        <div className="p-6 space-y-4">
          {lignes.map((ligne, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-xl"
            >
              <div className="col-span-12 lg:col-span-4">
                <Label>Description *</Label>
                <Input
                  value={ligne.description}
                  onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                  placeholder="Description de la prestation"
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 lg:col-span-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                  min={1}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 lg:col-span-2">
                <Label>Prix unitaire HT</Label>
                <Input
                  type="number"
                  value={ligne.prix_unitaire}
                  onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                  min={0}
                  step={0.01}
                  className="mt-1"
                />
              </div>
              <div className="col-span-4 lg:col-span-1">
                <Label>TVA %</Label>
                <select
                  value={ligne.taux_tva}
                  onChange={(e) => handleLigneChange(index, 'taux_tva', e.target.value)}
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
                  {formatMontant(ligne.montant_ttc)}
                </p>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLigne(index)}
                  disabled={lignes.length === 1}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h3>
        </div>
        <div className="p-6">
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
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
              {mode === 'create' ? 'Créer la facture' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
