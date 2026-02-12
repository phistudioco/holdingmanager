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
import {
  clientSchema,
  clientCreateSchema,
  formesJuridiques,
  modesReglement,
  type ClientFormData,
} from '@/lib/validations/client'
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
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [pays, setPays] = useState<Pays[]>([])

  // Configuration react-hook-form avec zodResolver
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(mode === 'create' ? clientCreateSchema : clientSchema),
    defaultValues: {
      filiale_id: client?.filiale_id || 0,
      type: client?.type || 'entreprise',
      code: client?.code || '',
      nom: client?.nom || '',
      email: client?.email || '',
      telephone: client?.telephone || '',
      adresse: client?.adresse || '',
      ville: client?.ville || '',
      code_postal: client?.code_postal || '',
      pays_id: client?.pays_id || undefined,
      siret: client?.siret || '',
      tva_intracommunautaire: client?.tva_intracommunautaire || '',
      forme_juridique: client?.forme_juridique || '',
      delai_paiement: client?.delai_paiement || 30,
      mode_reglement_prefere: client?.mode_reglement_prefere || '',
      limite_credit: client?.limite_credit || undefined,
      statut: client?.statut || 'prospect',
      notes: client?.notes || '',
    },
  })

  // Observer le type de client pour afficher/masquer les champs entreprise
  const clientType = watch('type')

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
        setValue('filiale_id', filialesData[0].id)
      }
    }

    fetchData()
  }, [mode, setValue])

  const generateCode = (type: 'entreprise' | 'particulier') => {
    const prefix = type === 'entreprise' ? 'ENT' : 'PAR'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  const onSubmit = async (data: ClientFormData) => {
    try {
      const supabase = createUntypedClient()

      const clientData = {
        ...data,
        code: mode === 'create' ? generateCode(data.type) : data.code,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.code_postal || null,
        siret: data.siret || null,
        tva_intracommunautaire: data.tva_intracommunautaire || null,
        forme_juridique: data.forme_juridique || null,
        mode_reglement_prefere: data.mode_reglement_prefere || null,
        notes: data.notes || null,
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
      // L'erreur sera affichée par react-hook-form
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Affichage des erreurs générales */}
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Erreurs de validation :</p>
            <ul className="list-disc list-inside text-sm mt-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error.message}</li>
              ))}
            </ul>
          </div>
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
              onClick={() => setValue('type', 'entreprise')}
              className={`p-6 rounded-xl border-2 transition-all ${
                clientType === 'entreprise'
                  ? 'border-phi-primary bg-phi-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building2
                className={`h-8 w-8 mx-auto mb-3 ${
                  clientType === 'entreprise' ? 'text-phi-primary' : 'text-gray-400'
                }`}
              />
              <p className={`font-semibold ${clientType === 'entreprise' ? 'text-phi-primary' : 'text-gray-600'}`}>
                Entreprise
              </p>
              <p className="text-sm text-gray-400 mt-1">Société, association...</p>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'particulier')}
              className={`p-6 rounded-xl border-2 transition-all ${
                clientType === 'particulier'
                  ? 'border-phi-accent bg-phi-accent/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserCircle
                className={`h-8 w-8 mx-auto mb-3 ${
                  clientType === 'particulier' ? 'text-phi-accent' : 'text-gray-400'
                }`}
              />
              <p className={`font-semibold ${clientType === 'particulier' ? 'text-phi-accent' : 'text-gray-600'}`}>
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
              {...register('nom')}
              placeholder={clientType === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom complet'}
              className={`mt-1 ${errors.nom ? 'border-red-500' : ''}`}
            />
            {errors.nom && <p className="text-sm text-red-600 mt-1">{errors.nom.message}</p>}
          </div>

          <div>
            <Label htmlFor="filiale_id">Filiale *</Label>
            <select
              id="filiale_id"
              {...register('filiale_id', { valueAsNumber: true })}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-phi-primary/20 ${
                errors.filiale_id ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Sélectionner une filiale</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom} ({filiale.code})
                </option>
              ))}
            </select>
            {errors.filiale_id && <p className="text-sm text-red-600 mt-1">{errors.filiale_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <select
              id="statut"
              {...register('statut')}
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
                {...register('code')}
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
                type="email"
                {...register('email')}
                placeholder="contact@entreprise.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="telephone"
                {...register('telephone')}
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
              {...register('adresse')}
              placeholder="123 rue de la Paix"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="code_postal">Code postal</Label>
            <Input
              id="code_postal"
              {...register('code_postal')}
              placeholder="75000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              {...register('ville')}
              placeholder="Paris"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="pays_id">Pays</Label>
            <select
              id="pays_id"
              {...register('pays_id', {
                setValueAs: (v) => v === '' ? undefined : Number(v)
              })}
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
      {clientType === 'entreprise' && (
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
                {...register('siret')}
                placeholder="12345678901234"
                maxLength={14}
                className={`mt-1 ${errors.siret ? 'border-red-500' : ''}`}
              />
              {errors.siret && <p className="text-sm text-red-600 mt-1">{errors.siret.message}</p>}
            </div>

            <div>
              <Label htmlFor="tva_intracommunautaire">N° TVA Intracommunautaire</Label>
              <Input
                id="tva_intracommunautaire"
                {...register('tva_intracommunautaire')}
                placeholder="FR12345678901"
                className={`mt-1 ${errors.tva_intracommunautaire ? 'border-red-500' : ''}`}
              />
              {errors.tva_intracommunautaire && (
                <p className="text-sm text-red-600 mt-1">{errors.tva_intracommunautaire.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="forme_juridique">Forme juridique</Label>
              <select
                id="forme_juridique"
                {...register('forme_juridique')}
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
              type="number"
              {...register('delai_paiement', { valueAsNumber: true })}
              min={0}
              max={365}
              className={`mt-1 ${errors.delai_paiement ? 'border-red-500' : ''}`}
            />
            {errors.delai_paiement && (
              <p className="text-sm text-red-600 mt-1">{errors.delai_paiement.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mode_reglement_prefere">Mode de règlement préféré</Label>
            <select
              id="mode_reglement_prefere"
              {...register('mode_reglement_prefere')}
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
              type="number"
              {...register('limite_credit', {
                setValueAs: (v) => v === '' ? undefined : Number(v)
              })}
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
            {...register('notes')}
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
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-phi-primary hover:bg-phi-primary/90"
        >
          {isSubmitting ? (
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
