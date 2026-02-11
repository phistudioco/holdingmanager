'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Hash,
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Filiale = Tables<'filiales'>
type Pays = Tables<'pays'>

type FilialeFormProps = {
  filiale?: Filiale
  mode: 'create' | 'edit'
}

type FormData = {
  code: string
  nom: string
  adresse: string
  ville: string
  code_postal: string
  pays_id: string
  telephone: string
  email: string
  site_web: string
  directeur_nom: string
  directeur_email: string
  statut: 'actif' | 'inactif' | 'en_creation'
}

export function FilialeForm({ filiale, mode }: FilialeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pays, setPays] = useState<Pays[]>([])

  const [formData, setFormData] = useState<FormData>({
    code: filiale?.code || '',
    nom: filiale?.nom || '',
    adresse: filiale?.adresse || '',
    ville: filiale?.ville || '',
    code_postal: filiale?.code_postal || '',
    pays_id: filiale?.pays_id?.toString() || '',
    telephone: filiale?.telephone || '',
    email: filiale?.email || '',
    site_web: filiale?.site_web || '',
    directeur_nom: filiale?.directeur_nom || '',
    directeur_email: filiale?.directeur_email || '',
    statut: filiale?.statut || 'en_creation',
  })

  useEffect(() => {
    loadPays()
  }, [])

  const loadPays = async () => {
    const supabase = createUntypedClient()
    const { data } = await supabase.from('pays').select('*').order('nom')
    if (data) setPays(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.code || !formData.nom) {
      setError('Le code et le nom sont obligatoires')
      setLoading(false)
      return
    }

    try {
      const supabase = createUntypedClient()

      const filialeData = {
        code: formData.code,
        nom: formData.nom,
        adresse: formData.adresse || null,
        ville: formData.ville || null,
        code_postal: formData.code_postal || null,
        pays_id: formData.pays_id ? parseInt(formData.pays_id) : null,
        telephone: formData.telephone || null,
        email: formData.email || null,
        site_web: formData.site_web || null,
        directeur_nom: formData.directeur_nom || null,
        directeur_email: formData.directeur_email || null,
        statut: formData.statut,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('filiales')
          .insert(filialeData)

        if (insertError) throw insertError
      } else if (filiale) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('filiales')
          .update(filialeData)
          .eq('id', filiale.id)

        if (updateError) throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/filiales')
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
        setError('Ce code de filiale existe déjà')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          {mode === 'create' ? 'Filiale créée !' : 'Filiale mise à jour !'}
        </h2>
        <p className="text-gray-500">Redirection en cours...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Section: Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-primary to-phi-primary/90 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Informations générales</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                Code filiale <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="PHI-FR-001"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Identifiant unique de la filiale</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                Nom <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="PHI Studios France"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut" className="text-sm font-medium text-gray-700">Statut</Label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
            >
              <option value="en_creation">En création</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Adresse */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-accent to-phi-accent/90 text-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Adresse</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">Adresse</Label>
            <textarea
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="123 Avenue de l'Innovation"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="ville" className="text-sm font-medium text-gray-700">Ville</Label>
              <Input
                id="ville"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                placeholder="Paris"
                className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code_postal" className="text-sm font-medium text-gray-700">Code postal</Label>
              <Input
                id="code_postal"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleChange}
                placeholder="75001"
                className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pays_id" className="text-sm font-medium text-gray-700">Pays</Label>
              <select
                id="pays_id"
                name="pays_id"
                value={formData.pays_id}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="">Sélectionner un pays</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-highlight to-phi-highlight/90 text-gray-900">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Contact</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+33 1 23 45 67 89"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@phistudios.fr"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_web" className="text-sm font-medium text-gray-700">Site web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="site_web"
                name="site_web"
                type="url"
                value={formData.site_web}
                onChange={handleChange}
                placeholder="https://www.phistudios.fr"
                className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Direction */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-600 text-white">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Direction</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="directeur_nom" className="text-sm font-medium text-gray-700">Nom du directeur</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="directeur_nom"
                  name="directeur_nom"
                  value={formData.directeur_nom}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="directeur_email" className="text-sm font-medium text-gray-700">Email du directeur</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="directeur_email"
                  name="directeur_email"
                  type="email"
                  value={formData.directeur_email}
                  onChange={handleChange}
                  placeholder="j.dupont@phistudios.fr"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="gap-2 bg-phi-primary hover:bg-phi-primary/90 px-8 h-12 rounded-xl shadow-lg shadow-phi-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Création...' : 'Mise à jour...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Créer la filiale' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
