'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Star,
} from 'lucide-react'

type Fournisseur = {
  id?: number
  nom: string
  type: 'materiel' | 'service' | 'logistique' | 'autre'
  contact_nom: string | null
  contact_email: string | null
  contact_telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  pays: string | null
  statut: 'actif' | 'inactif' | 'en_evaluation'
  note_qualite: number | null
  notes: string | null
}

type FournisseurFormProps = {
  fournisseur?: Fournisseur
  mode: 'create' | 'edit'
}

const typeOptions = [
  { value: 'materiel', label: 'Matériel' },
  { value: 'service', label: 'Service' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'autre', label: 'Autre' },
]

const statutOptions = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'en_evaluation', label: 'En évaluation' },
]

export function FournisseurForm({ fournisseur, mode }: FournisseurFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: fournisseur?.nom || '',
    type: fournisseur?.type || 'materiel',
    contact_nom: fournisseur?.contact_nom || '',
    contact_email: fournisseur?.contact_email || '',
    contact_telephone: fournisseur?.contact_telephone || '',
    adresse: fournisseur?.adresse || '',
    ville: fournisseur?.ville || '',
    code_postal: fournisseur?.code_postal || '',
    pays: fournisseur?.pays || 'France',
    statut: fournisseur?.statut || 'en_evaluation',
    note_qualite: fournisseur?.note_qualite || 0,
    notes: fournisseur?.notes || '',
  })

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
      setError('Le nom du fournisseur est requis')
      return
    }

    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const fournisseurData = {
        nom: formData.nom.trim(),
        type: formData.type,
        contact_nom: formData.contact_nom.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_telephone: formData.contact_telephone.trim() || null,
        adresse: formData.adresse.trim() || null,
        ville: formData.ville.trim() || null,
        code_postal: formData.code_postal.trim() || null,
        pays: formData.pays.trim() || null,
        statut: formData.statut,
        note_qualite: formData.note_qualite || null,
        notes: formData.notes.trim() || null,
      }

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('fournisseurs')
          .insert(fournisseurData)
          .select()
          .single()

        if (insertError) throw insertError

        router.push(`/services/outsourcing/fournisseurs/${(data as { id: number }).id}`)
      } else if (fournisseur?.id) {
        const { error: updateError } = await supabase
          .from('fournisseurs')
          .update(fournisseurData)
          .eq('id', fournisseur.id)

        if (updateError) throw updateError

        router.push(`/services/outsourcing/fournisseurs/${fournisseur.id}`)
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
          <Building className="h-5 w-5" style={{ color: themeColor }} />
          Informations du fournisseur
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="nom">Nom du fournisseur *</Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Acme Industries"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            <Label htmlFor="note_qualite">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Note qualité (1-5)
              </span>
            </Label>
            <Input
              id="note_qualite"
              name="note_qualite"
              type="number"
              min="0"
              max="5"
              step="1"
              value={formData.note_qualite || ''}
              onChange={handleChange}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-5 w-5" style={{ color: themeColor }} />
          Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="contact_nom">Nom du contact</Label>
            <Input
              id="contact_nom"
              name="contact_nom"
              value={formData.contact_nom}
              onChange={handleChange}
              placeholder="Jean Dupont"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="contact_email">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </span>
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="contact@fournisseur.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="contact_telephone">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </span>
            </Label>
            <Input
              id="contact_telephone"
              name="contact_telephone"
              type="tel"
              value={formData.contact_telephone}
              onChange={handleChange}
              placeholder="+33 1 23 45 67 89"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5" style={{ color: themeColor }} />
          Adresse
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="123 rue de l'Industrie"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="code_postal">Code postal</Label>
            <Input
              id="code_postal"
              name="code_postal"
              value={formData.code_postal}
              onChange={handleChange}
              placeholder="75001"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              placeholder="Paris"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="pays">Pays</Label>
            <Input
              id="pays"
              name="pays"
              value={formData.pays}
              onChange={handleChange}
              placeholder="France"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Label htmlFor="notes">Notes internes</Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder="Notes sur ce fournisseur..."
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
              {mode === 'create' ? 'Créer le fournisseur' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
