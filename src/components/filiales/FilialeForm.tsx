'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { filialeSchema, type FilialeFormData } from '@/lib/validations/filiale'

type Filiale = Tables<'filiales'>
type Pays = Tables<'pays'>

type FilialeFormProps = {
  filiale?: Filiale
  mode: 'create' | 'edit'
}

export function FilialeForm({ filiale, mode }: FilialeFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pays, setPays] = useState<Pays[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FilialeFormData>({
    resolver: zodResolver(filialeSchema),
    defaultValues: {
      code: filiale?.code || '',
      nom: filiale?.nom || '',
      adresse: filiale?.adresse || '',
      ville: filiale?.ville || '',
      code_postal: filiale?.code_postal || '',
      pays_id: filiale?.pays_id || undefined,
      telephone: filiale?.telephone || '',
      email: filiale?.email || '',
      site_web: filiale?.site_web || '',
      directeur_nom: filiale?.directeur_nom || '',
      directeur_email: filiale?.directeur_email || '',
      statut: filiale?.statut || 'en_creation',
    },
  })

  useEffect(() => {
    loadPays()
  }, [])

  const loadPays = async () => {
    const supabase = createUntypedClient()
    const { data } = await supabase.from('pays').select('*').order('nom')
    if (data) setPays(data)
  }

  const onSubmit = async (data: FilialeFormData) => {
    setError(null)

    try {
      const supabase = createUntypedClient()

      const filialeData = {
        code: data.code,
        nom: data.nom,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.code_postal || null,
        pays_id: data.pays_id || null,
        telephone: data.telephone || null,
        email: data.email || null,
        site_web: data.site_web || null,
        directeur_nom: data.directeur_nom || null,
        directeur_email: data.directeur_email || null,
        statut: data.statut,
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('filiales')
          .insert(filialeData)

        if (insertError) throw insertError
      } else if (filiale) {
        const { error: updateError } = await supabase
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                  {...register('code')}
                  placeholder="PHI-FR-001"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.code ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.code ? (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              ) : (
                <p className="text-xs text-gray-500">Identifiant unique de la filiale</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                Nom <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nom"
                  {...register('nom')}
                  placeholder="PHI Studios France"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.nom ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.nom && <p className="text-sm text-red-600">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut" className="text-sm font-medium text-gray-700">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
            >
              <option value="en_creation">En création</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
            {errors.statut && <p className="text-sm text-red-600">{errors.statut.message}</p>}
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
              {...register('adresse')}
              placeholder="123 Avenue de l'Innovation"
              rows={2}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none ${
                errors.adresse ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            {errors.adresse && <p className="text-sm text-red-600">{errors.adresse.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="ville" className="text-sm font-medium text-gray-700">Ville</Label>
              <Input
                id="ville"
                {...register('ville')}
                placeholder="Paris"
                className={`h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                  errors.ville ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.ville && <p className="text-sm text-red-600">{errors.ville.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code_postal" className="text-sm font-medium text-gray-700">Code postal</Label>
              <Input
                id="code_postal"
                {...register('code_postal')}
                placeholder="75001"
                className={`h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                  errors.code_postal ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.code_postal && <p className="text-sm text-red-600">{errors.code_postal.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pays_id" className="text-sm font-medium text-gray-700">Pays</Label>
              <select
                id="pays_id"
                {...register('pays_id', {
                  setValueAs: (v) => v === '' || v === null || v === undefined ? null : Number(v)
                })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="">Sélectionner un pays</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
              {errors.pays_id && <p className="text-sm text-red-600">{errors.pays_id.message}</p>}
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
                  type="tel"
                  {...register('telephone')}
                  placeholder="+33 1 23 45 67 89"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.telephone ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.telephone && <p className="text-sm text-red-600">{errors.telephone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contact@phistudios.fr"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_web" className="text-sm font-medium text-gray-700">Site web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="site_web"
                type="url"
                {...register('site_web')}
                placeholder="https://www.phistudios.fr"
                className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                  errors.site_web ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
            </div>
            {errors.site_web && <p className="text-sm text-red-600">{errors.site_web.message}</p>}
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
                  {...register('directeur_nom')}
                  placeholder="Jean Dupont"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.directeur_nom ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.directeur_nom && <p className="text-sm text-red-600">{errors.directeur_nom.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="directeur_email" className="text-sm font-medium text-gray-700">Email du directeur</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="directeur_email"
                  type="email"
                  {...register('directeur_email')}
                  placeholder="j.dupont@phistudios.fr"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.directeur_email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.directeur_email && <p className="text-sm text-red-600">{errors.directeur_email.message}</p>}
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
          disabled={isSubmitting}
          className="gap-2 bg-phi-primary hover:bg-phi-primary/90 px-8 h-12 rounded-xl shadow-lg shadow-phi-primary/20"
        >
          {isSubmitting ? (
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
