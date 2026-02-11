'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertCircle,
  CheckCircle,
  DollarSign,
  Camera,
} from 'lucide-react'
import { PhotoUpload } from '@/components/common/PhotoUpload'
import type { Tables } from '@/types/database'

type Employe = Tables<'employes'>
type Filiale = Tables<'filiales'>
type Service = Tables<'services'>

type EmployeFormProps = {
  employe?: Employe
  mode: 'create' | 'edit'
}

type FormData = {
  filiale_id: string
  service_id: string
  matricule: string
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance: string
  adresse: string
  poste: string
  date_embauche: string
  salaire: string
  statut: 'actif' | 'en_conge' | 'suspendu' | 'sorti'
  photo: string | null
}

export function EmployeForm({ employe, mode }: EmployeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [formData, setFormData] = useState<FormData>({
    filiale_id: employe?.filiale_id?.toString() || '',
    service_id: employe?.service_id?.toString() || '',
    matricule: employe?.matricule || '',
    nom: employe?.nom || '',
    prenom: employe?.prenom || '',
    email: employe?.email || '',
    telephone: employe?.telephone || '',
    date_naissance: employe?.date_naissance || '',
    adresse: employe?.adresse || '',
    poste: employe?.poste || '',
    date_embauche: employe?.date_embauche || new Date().toISOString().split('T')[0],
    salaire: employe?.salaire?.toString() || '',
    statut: employe?.statut || 'actif',
    photo: employe?.photo || null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createUntypedClient()
    const [filialesRes, servicesRes] = await Promise.all([
      supabase.from('filiales').select('*').eq('statut', 'actif').order('nom'),
      supabase.from('services').select('*').order('nom'),
    ])
    if (filialesRes.data) setFiliales(filialesRes.data)
    if (servicesRes.data) setServices(servicesRes.data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const generateMatricule = () => {
    const prefix = 'EMP'
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const year = new Date().getFullYear().toString().slice(-2)
    setFormData(prev => ({ ...prev, matricule: `${prefix}-${year}-${random}` }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.filiale_id || !formData.matricule || !formData.nom || !formData.prenom || !formData.date_embauche) {
      setError('Veuillez remplir tous les champs obligatoires')
      setLoading(false)
      return
    }

    try {
      const supabase = createUntypedClient()

      const employeData = {
        filiale_id: parseInt(formData.filiale_id),
        service_id: formData.service_id ? parseInt(formData.service_id) : null,
        matricule: formData.matricule,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email || null,
        telephone: formData.telephone || null,
        date_naissance: formData.date_naissance || null,
        adresse: formData.adresse || null,
        poste: formData.poste || null,
        date_embauche: formData.date_embauche,
        salaire: formData.salaire ? parseFloat(formData.salaire) : null,
        statut: formData.statut,
        photo: formData.photo,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('employes')
          .insert(employeData)

        if (insertError) throw insertError
      } else if (employe) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
        setError('Ce matricule existe déjà')
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
          {mode === 'create' ? 'Employé ajouté !' : 'Employé mis à jour !'}
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

      {/* Section: Photo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-highlight to-yellow-500 text-gray-900">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Photo de profil</h3>
          </div>
        </div>
        <div className="p-6">
          <PhotoUpload
            currentPhotoUrl={formData.photo}
            onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo: url }))}
            bucketName="photos"
            folderPath="employes"
          />
        </div>
      </div>

      {/* Section: Informations personnelles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-primary to-phi-primary/90 text-white">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Informations personnelles</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="jean.dupont@phistudios.com"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>

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
                  placeholder="+33 6 12 34 56 78"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date_naissance" className="text-sm font-medium text-gray-700">Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date_naissance"
                  name="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="123 Rue de la Paix, Paris"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Informations professionnelles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-accent to-phi-accent/90 text-white">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Informations professionnelles</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="matricule" className="text-sm font-medium text-gray-700">
                Matricule <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="matricule"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    placeholder="EMP-24-0001"
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                    required
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="filiale_id" className="text-sm font-medium text-gray-700">
                Filiale <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <select
                  id="filiale_id"
                  name="filiale_id"
                  value={formData.filiale_id}
                  onChange={handleChange}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors appearance-none"
                  required
                >
                  <option value="">Sélectionner une filiale</option>
                  {filiales.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="service_id" className="text-sm font-medium text-gray-700">Service</Label>
              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="">Sélectionner un service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poste" className="text-sm font-medium text-gray-700">Poste</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="poste"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  placeholder="Développeur Full-Stack"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date_embauche" className="text-sm font-medium text-gray-700">
                Date d'embauche <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date_embauche"
                  name="date_embauche"
                  type="date"
                  value={formData.date_embauche}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaire" className="text-sm font-medium text-gray-700">Salaire mensuel (€)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="salaire"
                  name="salaire"
                  type="number"
                  step="0.01"
                  value={formData.salaire}
                  onChange={handleChange}
                  placeholder="3500.00"
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
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
                <option value="actif">Actif</option>
                <option value="en_conge">En congé</option>
                <option value="suspendu">Suspendu</option>
                <option value="sorti">Sorti</option>
              </select>
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
              {mode === 'create' ? 'Ajouter l\'employé' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
