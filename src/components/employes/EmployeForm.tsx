'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useFiliales, useServices } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Loader2,
  Save,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Camera,
} from 'lucide-react'
import { PhotoUpload } from '@/components/common/PhotoUpload'
import type { Tables } from '@/types/database'
import { employeSchema, type EmployeFormData } from '@/lib/validations/employe'
import { parseSupabaseError, type FormError } from '@/lib/errors/parse-error'

type Employe = Tables<'employes'>
type Filiale = Tables<'filiales'>
type Service = Tables<'services'>

type EmployeFormProps = {
  employe?: Employe
  mode: 'create' | 'edit'
}

export function EmployeForm({ employe, mode }: EmployeFormProps) {
  const router = useRouter()
  const [formError, setFormError] = useState<FormError | null>(null)
  const [success, setSuccess] = useState(false)

  // Utiliser les hooks réutilisables
  const { data: filiales } = useFiliales<Filiale>()
  const { data: services } = useServices<Service>()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeFormData>({
    resolver: zodResolver(employeSchema),
    defaultValues: {
      filiale_id: employe?.filiale_id || undefined,
      service_id: employe?.service_id || undefined,
      matricule: employe?.matricule || '',
      nom: employe?.nom || '',
      prenom: employe?.prenom || '',
      email: employe?.email || '',
      telephone: employe?.telephone || '',
      date_naissance: employe?.date_naissance || '',
      adresse: employe?.adresse || '',
      poste: employe?.poste || '',
      date_embauche: employe?.date_embauche || new Date().toISOString().split('T')[0],
      salaire: employe?.salaire || undefined,
      statut: employe?.statut || 'actif',
      photo: employe?.photo || null,
    },
  })


  const generateMatricule = () => {
    const prefix = 'EMP'
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const year = new Date().getFullYear().toString().slice(-2)
    setValue('matricule', `${prefix}-${year}-${random}`)
  }

  const onSubmit = async (data: EmployeFormData) => {
    setFormError(null)

    try {
      const supabase = createClient()

      const employeData = {
        filiale_id: data.filiale_id,
        service_id: data.service_id || null,
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        date_naissance: data.date_naissance || null,
        adresse: data.adresse || null,
        poste: data.poste || null,
        date_embauche: data.date_embauche,
        salaire: data.salaire || null,
        statut: data.statut,
        photo: data.photo || null,
      }

      if (mode === 'create') {
        // Table employes pas complètement typée dans database.ts - type assertion temporaire
        const { error: insertError } = await (supabase as any)
          .from('employes')
          .insert(employeData)

        if (insertError) throw insertError
      } else if (employe) {
        // Table employes pas complètement typée dans database.ts - type assertion temporaire
        const { error: updateError } = await (supabase as any)
          .from('employes')
          .update(employeData)
          .eq('id', employe.id)

        if (updateError) throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/employes')
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      console.error('Erreur:', err)
      const parsedError = parseSupabaseError(err)
      setFormError(parsedError)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          {mode === 'create' ? 'Employé ajouté !' : 'Employé mis à jour !'}
        </h2>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire d'employé">
      {/* Erreurs de validation Zod */}
      {Object.keys(errors).length > 0 && (
        <FormAlert
          type="error"
          message="Erreurs de validation :"
          messages={Object.entries(errors).map(([key, error]) => `${key}: ${error.message}`)}
          aria-label="Erreurs de validation du formulaire"
        />
      )}

      {/* Erreurs serveur (RLS, métier, techniques) */}
      {formError && (
        <FormAlert
          type={formError.type === 'rls' ? 'warning' : 'error'}
          message={formError.message}
          messages={formError.details ? [formError.details] : undefined}
        />
      )}

      {/* Section: Photo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-highlight to-yellow-500 text-gray-900">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-heading font-semibold">Photo de profil</h3>
          </div>
        </div>
        <div className="p-6">
          <PhotoUpload
            currentPhotoUrl={employe?.photo || null}
            onPhotoChange={(url) => setValue('photo', url)}
            bucketName="photos"
            folderPath="employes"
          />
          {errors.photo && <p className="text-sm text-red-600 mt-2">{errors.photo.message}</p>}
        </div>
      </div>

      {/* Section: Informations personnelles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-primary to-phi-primary/90 text-white">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-heading font-semibold">Informations personnelles</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                Prénom <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="prenom"
                  {...register('prenom')}
                  placeholder="Jean"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.prenom ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  aria-required="true"
                  aria-invalid={!!errors.prenom}
                  aria-describedby={errors.prenom ? 'prenom-error' : undefined}
                />
              </div>
              {errors.prenom && (
                <p id="prenom-error" className="text-sm text-red-600" role="alert">
                  {errors.prenom.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                Nom <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <Input
                id="nom"
                {...register('nom')}
                placeholder="Dupont"
                className={`h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                  errors.nom ? 'border-red-500 focus:border-red-500' : ''
                }`}
                aria-required="true"
                aria-invalid={!!errors.nom}
                aria-describedby={errors.nom ? 'nom-error' : undefined}
              />
              {errors.nom && <p className="text-sm text-red-600">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="jean.dupont@phistudios.com"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="telephone"
                  type="tel"
                  {...register('telephone')}
                  placeholder="+33 6 12 34 56 78"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.telephone ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.telephone && <p className="text-sm text-red-600">{errors.telephone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date_naissance" className="text-sm font-medium text-gray-700">Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="date_naissance"
                  type="date"
                  {...register('date_naissance')}
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.date_naissance ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.date_naissance && <p className="text-sm text-red-600">{errors.date_naissance.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="adresse"
                  {...register('adresse')}
                  placeholder="123 Rue de la Paix, Paris"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.adresse ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.adresse && <p className="text-sm text-red-600">{errors.adresse.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Informations professionnelles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-accent to-phi-accent/90 text-white">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-heading font-semibold">Informations professionnelles</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="matricule" className="text-sm font-medium text-gray-700">
                Matricule <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                  <Input
                    id="matricule"
                    {...register('matricule')}
                    placeholder="EMP-24-0001"
                    className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                      errors.matricule ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    aria-required="true"
                    aria-invalid={!!errors.matricule}
                    aria-describedby={errors.matricule ? 'matricule-error' : undefined}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMatricule}
                  className="h-12 rounded-xl"
                >
                  Générer
                </Button>
              </div>
              {errors.matricule && (
                <p id="matricule-error" className="text-sm text-red-600" role="alert">
                  {errors.matricule.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filiale_id" className="text-sm font-medium text-gray-700">
                Filiale <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" aria-hidden="true" />
                <select
                  id="filiale_id"
                  {...register('filiale_id', {
                    setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                  })}
                  className={`w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors appearance-none ${
                    errors.filiale_id ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  aria-required="true"
                  aria-invalid={!!errors.filiale_id}
                  aria-describedby={errors.filiale_id ? 'filiale-error' : undefined}
                >
                  <option value="">Sélectionner une filiale</option>
                  {filiales.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              {errors.filiale_id && (
                <p id="filiale-error" className="text-sm text-red-600" role="alert">
                  {errors.filiale_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="service_id" className="text-sm font-medium text-gray-700">Service</Label>
              <select
                id="service_id"
                {...register('service_id', {
                  setValueAs: (v) => v === '' || v === null || v === undefined ? null : Number(v)
                })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="">Sélectionner un service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
              {errors.service_id && <p className="text-sm text-red-600">{errors.service_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="poste" className="text-sm font-medium text-gray-700">Poste</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="poste"
                  {...register('poste')}
                  placeholder="Développeur Full-Stack"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.poste ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.poste && <p className="text-sm text-red-600">{errors.poste.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date_embauche" className="text-sm font-medium text-gray-700">
                Date d'embauche <span className="text-red-500" aria-label="requis">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="date_embauche"
                  type="date"
                  {...register('date_embauche')}
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.date_embauche ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  aria-required="true"
                  aria-invalid={!!errors.date_embauche}
                  aria-describedby={errors.date_embauche ? 'date-embauche-error' : undefined}
                />
              </div>
              {errors.date_embauche && (
                <p id="date-embauche-error" className="text-sm text-red-600" role="alert">
                  {errors.date_embauche.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaire" className="text-sm font-medium text-gray-700">Salaire mensuel (€)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" aria-hidden="true" />
                <Input
                  id="salaire"
                  type="number"
                  step="0.01"
                  {...register('salaire', { valueAsNumber: true })}
                  placeholder="3500.00"
                  className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20 ${
                    errors.salaire ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.salaire && <p className="text-sm text-red-600">{errors.salaire.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut" className="text-sm font-medium text-gray-700">Statut</Label>
              <select
                id="statut"
                {...register('statut')}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="actif">Actif</option>
                <option value="en_conge">En congé</option>
                <option value="suspendu">Suspendu</option>
                <option value="sorti">Sorti</option>
              </select>
              {errors.statut && <p className="text-sm text-red-600">{errors.statut.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 bg-phi-primary hover:bg-phi-primary/90 px-8 h-12 rounded-xl shadow-lg shadow-phi-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {mode === 'create' ? 'Création...' : 'Mise à jour...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              {mode === 'create' ? 'Ajouter l\'employé' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
