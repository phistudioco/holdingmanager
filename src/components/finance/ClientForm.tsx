'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formesJuridiques, modesReglement } from '@/lib/validations/client'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>
type Pays = Tables<'pays'>

type ClientFormProps = {
  client?: Client
  mode: 'create' | 'edit'
}

export function ClientForm({ client, mode }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [pays, setPays] = useState<Pays[]>([])

  const [formData, setFormData] = useState({
    filiale_id: client?.filiale_id || 0,
    type: client?.type || 'entreprise',
    code: client?.code || '',
    nom: client?.nom || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    adresse: client?.adresse || '',
    ville: client?.ville || '',
    code_postal: client?.code_postal || '',
    pays_id: client?.pays_id || null,
    siret: client?.siret || '',
    tva_intracommunautaire: client?.tva_intracommunautaire || '',
    forme_juridique: client?.forme_juridique || '',
    delai_paiement: client?.delai_paiement || 30,
    mode_reglement_prefere: client?.mode_reglement_prefere || '',
    limite_credit: client?.limite_credit || null,
    statut: client?.statut || 'prospect',
    notes: client?.notes || '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createUntypedClient()

      const [filialesRes, paysRes] = await Promise.all([
        supabase.from('filiales').select('*').eq('statut', 'actif').order('nom'),
        supabase.from('pays').select('*').order('nom'),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filialesData = (filialesRes as any).data as Filiale[] | null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paysData = (paysRes as any).data as Pays[] | null

      if (filialesData) setFiliales(filialesData)
      if (paysData) setPays(paysData)

      // Auto-sélectionner la première filiale si création
      if (mode === 'create' && filialesData && filialesData.length > 0) {
        setFormData(prev => ({ ...prev, filiale_id: filialesData[0].id }))
      }
    }

    fetchData()
  }, [mode])

  const generateCode = () => {
    const prefix = formData.type === 'entreprise' ? 'ENT' : 'PAR'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createUntypedClient()

      const clientData = {
        ...formData,
        code: mode === 'create' ? generateCode() : formData.code,
        email: formData.email || null,
        telephone: formData.telephone || null,
        adresse: formData.adresse || null,
        ville: formData.ville || null,
        code_postal: formData.code_postal || null,
        siret: formData.siret || null,
        tva_intracommunautaire: formData.tva_intracommunautaire || null,
        forme_juridique: formData.forme_juridique || null,
        mode_reglement_prefere: formData.mode_reglement_prefere || null,
        notes: formData.notes || null,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('clients')
          .insert(clientData)
        if (insertError) throw insertError
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('clients')
          .update(clientData)
          .eq('id', client?.id)
        if (updateError) throw updateError
      }

      router.push('/finance/clients')
      router.refresh()
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
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Type de client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-primary to-blue-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Type de client
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'entreprise' }))}
              className={`p-6 rounded-xl border-2 transition-all ${
                formData.type === 'entreprise'
                  ? 'border-phi-primary bg-phi-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building2
                className={`h-8 w-8 mx-auto mb-3 ${
                  formData.type === 'entreprise' ? 'text-phi-primary' : 'text-gray-400'
                }`}
              />
              <p className={`font-semibold ${formData.type === 'entreprise' ? 'text-phi-primary' : 'text-gray-600'}`}>
                Entreprise
              </p>
              <p className="text-sm text-gray-400 mt-1">Société, association...</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'particulier' }))}
              className={`p-6 rounded-xl border-2 transition-all ${
                formData.type === 'particulier'
                  ? 'border-phi-accent bg-phi-accent/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserCircle
                className={`h-8 w-8 mx-auto mb-3 ${
                  formData.type === 'particulier' ? 'text-phi-accent' : 'text-gray-400'
                }`}
              />
              <p className={`font-semibold ${formData.type === 'particulier' ? 'text-phi-accent' : 'text-gray-600'}`}>
                Particulier
              </p>
              <p className="text-sm text-gray-400 mt-1">Personne physique</p>
            </button>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-accent to-pink-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations générales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="nom">Nom / Raison sociale *</Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder={formData.type === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom complet'}
              required
              className="mt-1"
            />
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
              <option value="">Sélectionner une filiale</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom} ({filiale.code})
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
              <option value="prospect">Prospect</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          {mode === 'edit' && (
            <div>
              <Label htmlFor="code">Code client</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-500 to-emerald-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@entreprise.com"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+33 1 23 45 67 89"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-violet-600">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="123 rue de la Paix"
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
              placeholder="75000"
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
            <Label htmlFor="pays_id">Pays</Label>
            <select
              id="pays_id"
              name="pays_id"
              value={formData.pays_id || ''}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="">Sélectionner un pays</option>
              {pays.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Informations entreprise (si type entreprise) */}
      {formData.type === 'entreprise' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-primary to-indigo-600">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations entreprise
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                name="siret"
                value={formData.siret}
                onChange={handleChange}
                placeholder="12345678901234"
                maxLength={14}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tva_intracommunautaire">N° TVA Intracommunautaire</Label>
              <Input
                id="tva_intracommunautaire"
                name="tva_intracommunautaire"
                value={formData.tva_intracommunautaire}
                onChange={handleChange}
                placeholder="FR12345678901"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="forme_juridique">Forme juridique</Label>
              <select
                id="forme_juridique"
                name="forme_juridique"
                value={formData.forme_juridique}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="">Sélectionner</option>
                {formesJuridiques.map((forme) => (
                  <option key={forme} value={forme}>
                    {forme}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Conditions commerciales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-highlight to-amber-500">
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Conditions commerciales
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="delai_paiement">Délai de paiement (jours)</Label>
            <Input
              id="delai_paiement"
              name="delai_paiement"
              type="number"
              value={formData.delai_paiement}
              onChange={handleChange}
              min={0}
              max={365}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mode_reglement_prefere">Mode de règlement préféré</Label>
            <select
              id="mode_reglement_prefere"
              name="mode_reglement_prefere"
              value={formData.mode_reglement_prefere}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
            >
              <option value="">Sélectionner</option>
              {modesReglement.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="limite_credit">Limite de crédit (€)</Label>
            <Input
              id="limite_credit"
              name="limite_credit"
              type="number"
              value={formData.limite_credit || ''}
              onChange={handleChange}
              min={0}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes internes
          </h3>
        </div>
        <div className="p-6">
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Notes internes sur ce client..."
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
              {mode === 'create' ? 'Créer le client' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
