'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUntypedClient } from '@/lib/supabase/client'
import { useFiliales } from '@/lib/hooks/useEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  GitBranch,
  FileText,
  Calendar,
  User,
  Euro,
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Send,
  Building2,
  GraduationCap,
  ShoppingCart,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Filiale = Tables<'filiales'>
type Employe = Tables<'employes'>

type WorkflowFormProps = {
  mode: 'create' | 'edit'
  demande?: {
    id: number
    numero: string
    type: 'achat' | 'conge' | 'formation' | 'autre'
    titre: string
    description: string | null
    montant: number | null
    priorite: 'basse' | 'normale' | 'haute' | 'urgente'
    filiale_id: number
    donnees: Record<string, unknown>
  }
}

type FormData = {
  type: 'achat' | 'conge' | 'formation' | 'autre'
  titre: string
  description: string
  montant: string
  priorite: 'basse' | 'normale' | 'haute' | 'urgente'
  filiale_id: string
  demandeur_id: string
  // Champs spécifiques selon le type
  date_debut: string
  date_fin: string
  fournisseur: string
  justification: string
  formation_titre: string
  formation_organisme: string
}

const workflowTypes = [
  { value: 'achat', label: "Demande d'achat", icon: ShoppingCart, color: 'bg-blue-500' },
  { value: 'conge', label: 'Demande de congé', icon: Calendar, color: 'bg-green-500' },
  { value: 'formation', label: 'Demande de formation', icon: GraduationCap, color: 'bg-purple-500' },
  { value: 'autre', label: 'Autre demande', icon: GitBranch, color: 'bg-gray-500' },
]

export function WorkflowForm({ mode, demande }: WorkflowFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [submitAction, setSubmitAction] = useState<'brouillon' | 'soumettre'>('brouillon')

  // Utiliser le hook réutilisable pour filiales
  const { data: filiales } = useFiliales<Filiale>()

  const donnees = demande?.donnees || {}

  const [formData, setFormData] = useState<FormData>({
    type: demande?.type || 'achat',
    titre: demande?.titre || '',
    description: demande?.description || '',
    montant: demande?.montant?.toString() || '',
    priorite: demande?.priorite || 'normale',
    filiale_id: demande?.filiale_id?.toString() || '',
    demandeur_id: '',
    date_debut: (donnees.date_debut as string) || '',
    date_fin: (donnees.date_fin as string) || '',
    fournisseur: (donnees.fournisseur as string) || '',
    justification: (donnees.justification as string) || '',
    formation_titre: (donnees.formation_titre as string) || '',
    formation_organisme: (donnees.formation_organisme as string) || '',
  })

  useEffect(() => {
    const loadEmployes = async () => {
      const supabase = createUntypedClient()
      const { data: employesData } = await supabase
        .from('employes')
        .select('*')
        .eq('statut', 'actif')
        .order('nom')
      if (employesData) setEmployes(employesData)
    }
    loadEmployes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const generateNumero = () => {
    const prefix = {
      achat: 'ACH',
      conge: 'CON',
      formation: 'FOR',
      autre: 'AUT',
    }
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 9000) + 1000
    return `${prefix[formData.type]}-${year}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent, action: 'brouillon' | 'soumettre') => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSubmitAction(action)

    // Validation
    if (!formData.titre || !formData.filiale_id || !formData.demandeur_id) {
      setError('Le titre, la filiale et le demandeur sont obligatoires')
      setLoading(false)
      return
    }

    try {
      const supabase = createUntypedClient()

      // Construire les données spécifiques au type
      const donnees: Record<string, unknown> = {
        justification: formData.justification,
      }

      if (formData.type === 'achat') {
        donnees.fournisseur = formData.fournisseur
      } else if (formData.type === 'conge') {
        donnees.date_debut = formData.date_debut
        donnees.date_fin = formData.date_fin
      } else if (formData.type === 'formation') {
        donnees.formation_titre = formData.formation_titre
        donnees.formation_organisme = formData.formation_organisme
        donnees.date_debut = formData.date_debut
        donnees.date_fin = formData.date_fin
      }

      const demandeData = {
        numero: demande?.numero || generateNumero(),
        type: formData.type,
        titre: formData.titre,
        description: formData.description || null,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        priorite: formData.priorite,
        filiale_id: parseInt(formData.filiale_id),
        demandeur_id: parseInt(formData.demandeur_id),
        donnees,
        statut: action === 'soumettre' ? 'en_cours' : 'brouillon',
        date_demande: new Date().toISOString().split('T')[0],
        date_soumission: action === 'soumettre' ? new Date().toISOString() : null,
        etape_actuelle: action === 'soumettre' ? 1 : 0,
      }

      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('workflow_demandes')
          .insert(demandeData)

        if (insertError) throw insertError
      } else if (demande) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('workflow_demandes')
          .update(demandeData)
          .eq('id', demande.id)

        if (updateError) throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/workflows')
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      console.error('Workflow submission error:', err)
      let errorMessage = 'Une erreur est survenue'
      if (err && typeof err === 'object') {
        if ('message' in err) {
          errorMessage = String(err.message)
        }
        if ('details' in err) {
          errorMessage += ` - ${String(err.details)}`
        }
        if ('code' in err) {
          errorMessage += ` (Code: ${String(err.code)})`
        }
      }
      setError(errorMessage)
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
          {submitAction === 'soumettre' ? 'Demande soumise !' : 'Brouillon enregistré !'}
        </h2>
        <p className="text-gray-500">Redirection en cours...</p>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Section: Type de demande */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-primary to-phi-primary/90 text-white">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Type de demande</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowTypes.map((type) => {
              const Icon = type.icon
              const isSelected = formData.type === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as FormData['type'] }))}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-phi-primary bg-phi-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${type.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-phi-primary' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Section: Informations générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-phi-accent to-phi-accent/90 text-white">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <h3 className="font-heading font-semibold">Informations générales</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="titre" className="text-sm font-medium text-gray-700">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titre"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Titre de la demande"
                className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filiale_id" className="text-sm font-medium text-gray-700">
                Filiale <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="filiale_id"
                  name="filiale_id"
                  value={formData.filiale_id}
                  onChange={handleChange}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
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

          <div className="space-y-2">
            <Label htmlFor="demandeur_id" className="text-sm font-medium text-gray-700">
              Demandeur <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="demandeur_id"
                name="demandeur_id"
                value={formData.demandeur_id}
                onChange={handleChange}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
                required
              >
                <option value="">Sélectionner un demandeur</option>
                {employes.map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre demande en détail..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="priorite" className="text-sm font-medium text-gray-700">Priorité</Label>
              <select
                id="priorite"
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {(formData.type === 'achat' || formData.type === 'formation') && (
              <div className="space-y-2">
                <Label htmlFor="montant" className="text-sm font-medium text-gray-700">
                  Montant estimé
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="montant"
                    name="montant"
                    type="number"
                    step="0.01"
                    value={formData.montant}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Détails spécifiques selon le type */}
      {formData.type === 'achat' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              <h3 className="font-heading font-semibold">Détails de l'achat</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fournisseur" className="text-sm font-medium text-gray-700">Fournisseur</Label>
              <Input
                id="fournisseur"
                name="fournisseur"
                value={formData.fournisseur}
                onChange={handleChange}
                placeholder="Nom du fournisseur"
                className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-medium text-gray-700">Justification</Label>
              <textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Justifiez le besoin de cet achat..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {formData.type === 'conge' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <h3 className="font-heading font-semibold">Période de congé</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_debut" className="text-sm font-medium text-gray-700">Date de début</Label>
                <Input
                  id="date_debut"
                  name="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_fin" className="text-sm font-medium text-gray-700">Date de fin</Label>
                <Input
                  id="date_fin"
                  name="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-medium text-gray-700">Motif</Label>
              <textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Raison de la demande de congé..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {formData.type === 'formation' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5" />
              <h3 className="font-heading font-semibold">Détails de la formation</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="formation_titre" className="text-sm font-medium text-gray-700">
                  Intitulé de la formation
                </Label>
                <Input
                  id="formation_titre"
                  name="formation_titre"
                  value={formData.formation_titre}
                  onChange={handleChange}
                  placeholder="Nom de la formation"
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formation_organisme" className="text-sm font-medium text-gray-700">
                  Organisme
                </Label>
                <Input
                  id="formation_organisme"
                  name="formation_organisme"
                  value={formData.formation_organisme}
                  onChange={handleChange}
                  placeholder="Organisme de formation"
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_debut" className="text-sm font-medium text-gray-700">Date de début</Label>
                <Input
                  id="date_debut"
                  name="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_fin" className="text-sm font-medium text-gray-700">Date de fin</Label>
                <Input
                  id="date_fin"
                  name="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-gray-200 focus:border-phi-primary focus:ring-phi-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-medium text-gray-700">Justification</Label>
              <textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Pourquoi cette formation est-elle nécessaire..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {formData.type === 'autre' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5" />
              <h3 className="font-heading font-semibold">Informations complémentaires</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-medium text-gray-700">Justification</Label>
              <textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Détaillez votre demande..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Annuler
        </Button>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={(e) => handleSubmit(e, 'brouillon')}
            className="gap-2 h-12 px-6 rounded-xl"
          >
            {loading && submitAction === 'brouillon' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer brouillon
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e, 'soumettre')}
            className="gap-2 bg-phi-primary hover:bg-phi-primary/90 px-8 h-12 rounded-xl shadow-lg shadow-phi-primary/20"
          >
            {loading && submitAction === 'soumettre' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Soumettre la demande
          </Button>
        </div>
      </div>
    </form>
  )
}
