'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from '@/components/ui/form-alert'
import { Label } from '@/components/ui/label'
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,

  Star,
} from 'lucide-react'
import { parseSupabaseError, type FormError } from '@/lib/errors/parse-error'

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

const fournisseurSchema = z.object({
  nom: z.string().min(1, 'Le nom du fournisseur est requis'),
  type: z.enum(['materiel', 'service', 'logistique', 'autre']),
  contact_nom: z.string().optional(),
  contact_email: z.string().email('Email invalide').optional().or(z.literal('')),
  contact_telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
  pays: z.string().optional(),
  statut: z.enum(['actif', 'inactif', 'en_evaluation']),
  note_qualite: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
})

type FournisseurFormData = z.infer<typeof fournisseurSchema>

export function FournisseurForm({ fournisseur, mode }: FournisseurFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<FormError | null>(null)

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<FournisseurFormData>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: fournisseur?.nom || '',
      type: (fournisseur?.type as FournisseurFormData['type']) || 'materiel',
      contact_nom: fournisseur?.contact_nom || '',
      contact_email: fournisseur?.contact_email || '',
      contact_telephone: fournisseur?.contact_telephone || '',
      adresse: fournisseur?.adresse || '',
      ville: fournisseur?.ville || '',
      code_postal: fournisseur?.code_postal || '',
      pays: fournisseur?.pays || 'France',
      statut: (fournisseur?.statut as FournisseurFormData['statut']) || 'en_evaluation',
      note_qualite: fournisseur?.note_qualite || 0,
      notes: fournisseur?.notes || '',
    },
  })

  const onSubmit = async (data: FournisseurFormData) => {
    setFormError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const fournisseurData = {
        nom: data.nom.trim(),
        type: data.type,
        contact_nom: data.contact_nom?.trim() || null,
        contact_email: data.contact_email?.trim() || null,
        contact_telephone: data.contact_telephone?.trim() || null,
        adresse: data.adresse?.trim() || null,
        ville: data.ville?.trim() || null,
        code_postal: data.code_postal?.trim() || null,
        pays: data.pays?.trim() || null,
        statut: data.statut,
        note_qualite: data.note_qualite || null,
        notes: data.notes?.trim() || null,
      }

      if (mode === 'create') {
        // Table fournisseurs pas complètement typée dans database.ts - type assertion temporaire
        const { data, error: insertError } = await (supabase as any)
          .from('fournisseurs')
          .insert(fournisseurData)
          .select()
          .single()

        if (insertError) throw insertError

        router.push(`/services/outsourcing/fournisseurs/${(data as { id: number }).id}`)
      } else if (fournisseur?.id) {
        // Table fournisseurs pas complètement typée dans database.ts - type assertion temporaire
        const { error: updateError } = await (supabase as any)
          .from('fournisseurs')
          .update(fournisseurData)
          .eq('id', fournisseur.id)

        if (updateError) throw updateError

        router.push(`/services/outsourcing/fournisseurs/${fournisseur.id}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      const parsedError = parseSupabaseError(err)
      setFormError(parsedError)
    } finally {
      setLoading(false)
    }
  }

  const themeColor = '#0f2080'

  return (
    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-8" aria-label="Formulaire de fournisseur">
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

      {/* Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building className="h-5 w-5" style={{ color: themeColor }} aria-hidden="true" />
          Informations du fournisseur
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="nom">
              Nom du fournisseur <span className="text-red-500" aria-label="requis">*</span>
            </Label>
            <Input
              id="nom"
              {...register('nom')}
              placeholder="Ex: Acme Industries"
              className="mt-1"
              aria-required="true"
              aria-invalid={!!errors.nom}
              aria-describedby={errors.nom ? 'nom-error' : undefined}
            />
            {errors.nom && (
              <p id="nom-error" className="text-sm text-red-600 mt-1" role="alert">
                {errors.nom.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {statutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.statut && (
              <p className="text-sm text-red-600 mt-1">{errors.statut.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="note_qualite">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4" aria-hidden="true" />
                Note qualité (1-5)
              </span>
            </Label>
            <Input
              id="note_qualite"
              type="number"
              min="0"
              max="5"
              step="1"
              {...register('note_qualite', { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
            />
            {errors.note_qualite && (
              <p className="text-sm text-red-600 mt-1">{errors.note_qualite.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-5 w-5" style={{ color: themeColor }} aria-hidden="true" />
          Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="contact_nom">Nom du contact</Label>
            <Input
              id="contact_nom"
              {...register('contact_nom')}
              placeholder="Jean Dupont"
              className="mt-1"
            />
            {errors.contact_nom && (
              <p className="text-sm text-red-600 mt-1">{errors.contact_nom.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_email">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </span>
            </Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="contact@fournisseur.com"
              className="mt-1"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-600 mt-1">{errors.contact_email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_telephone">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Téléphone
              </span>
            </Label>
            <Input
              id="contact_telephone"
              type="tel"
              {...register('contact_telephone')}
              placeholder="+33 1 23 45 67 89"
              className="mt-1"
            />
            {errors.contact_telephone && (
              <p className="text-sm text-red-600 mt-1">{errors.contact_telephone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5" style={{ color: themeColor }} aria-hidden="true" />
          Adresse
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              {...register('adresse')}
              placeholder="123 rue de l'Industrie"
              className="mt-1"
            />
            {errors.adresse && (
              <p className="text-sm text-red-600 mt-1">{errors.adresse.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="code_postal">Code postal</Label>
            <Input
              id="code_postal"
              {...register('code_postal')}
              placeholder="75001"
              className="mt-1"
            />
            {errors.code_postal && (
              <p className="text-sm text-red-600 mt-1">{errors.code_postal.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              {...register('ville')}
              placeholder="Paris"
              className="mt-1"
            />
            {errors.ville && (
              <p className="text-sm text-red-600 mt-1">{errors.ville.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="pays">Pays</Label>
            <Input
              id="pays"
              {...register('pays')}
              placeholder="France"
              className="mt-1"
            />
            {errors.pays && (
              <p className="text-sm text-red-600 mt-1">{errors.pays.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
        <Label htmlFor="notes">Notes internes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={4}
          className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder="Notes sur ce fournisseur..."
        />
        {errors.notes && (
          <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
        )}
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {mode === 'create' ? 'Créer le fournisseur' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
