'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Save,
  Loader2,
  AlertCircle,
  Building2,
  Users,
  Clock,
  LayoutTemplate,
  Check,
  BarChart3,
  Image,
  Globe,
  Lock,
} from 'lucide-react'

type ReportType = 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
type PeriodeType = 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'

type Filiale = {
  id: number
  nom: string
  code: string
}

const reportTypes = [
  { value: 'finance', label: 'Finance', description: 'Revenus, dépenses, factures', icon: FileText },
  { value: 'clients', label: 'Clients', description: 'Analyse des clients', icon: Users },
  { value: 'services', label: 'Services', description: 'Performance par service', icon: Building2 },
  { value: 'workflows', label: 'Workflows', description: 'Demandes et approbations', icon: Clock },
]

const sectionsOptions: Record<ReportType, { id: string; label: string; description: string }[]> = {
  finance: [
    { id: 'synthese_financiere', label: 'Synthèse financière', description: 'Revenus, dépenses et solde' },
    { id: 'evolution_mensuelle', label: 'Évolution mensuelle', description: 'Graphique de tendance' },
    { id: 'factures_statut', label: 'Factures par statut', description: 'Répartition des factures' },
    { id: 'transactions_categorie', label: 'Transactions par catégorie', description: 'Détail par type' },
    { id: 'top_clients', label: 'Top 10 clients', description: 'Meilleurs clients par CA' },
    { id: 'comparaison_periode', label: 'Comparaison période', description: 'Vs période précédente' },
    { id: 'contrats_actifs', label: 'Contrats actifs', description: 'Liste des contrats en cours' },
  ],
  clients: [
    { id: 'liste_clients', label: 'Liste des clients', description: 'Tous les clients actifs' },
    { id: 'top_clients', label: 'Top clients', description: 'Par chiffre d\'affaires' },
    { id: 'clients_nouveaux', label: 'Nouveaux clients', description: 'Acquis sur la période' },
    { id: 'factures_par_client', label: 'Factures par client', description: 'Détail par client' },
    { id: 'repartition_type', label: 'Répartition par type', description: 'Entreprises vs Particuliers' },
  ],
  services: [
    { id: 'synthese_services', label: 'Synthèse par service', description: 'Vue d\'ensemble' },
    { id: 'projets_robotique', label: 'Projets Robotique', description: 'Liste et statuts' },
    { id: 'projets_digital', label: 'Projets Digital', description: 'Liste et statuts' },
    { id: 'commandes_outsourcing', label: 'Commandes Outsourcing', description: 'Liste et statuts' },
    { id: 'performance_service', label: 'Performance', description: 'Métriques par service' },
  ],
  workflows: [
    { id: 'demandes_statut', label: 'Demandes par statut', description: 'Répartition des demandes' },
    { id: 'temps_traitement', label: 'Temps de traitement', description: 'Délais moyens' },
    { id: 'demandes_type', label: 'Par type de demande', description: 'Achats, congés, formations' },
    { id: 'approbateurs', label: 'Activité approbateurs', description: 'Statistiques par approbateur' },
  ],
  employes: [],
  custom: [],
}

export default function NewReportTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filiales, setFiliales] = useState<Filiale[]>([])

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    type: 'finance' as ReportType,
    sections: ['synthese_financiere', 'factures_statut', 'top_clients'] as string[],
    filiales_ids: [] as number[],
    periode_type: 'mensuel' as PeriodeType,
    orientation: 'portrait' as 'portrait' | 'paysage',
    inclure_graphiques: true,
    inclure_logo: true,
    is_public: false,
  })

  useEffect(() => {
    const fetchFiliales = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('filiales')
        .select('id, nom, code')
        .eq('statut', 'actif')
        .order('nom')

      if (data) setFiliales(data as Filiale[])
    }
    fetchFiliales()
  }, [])

  const handleTypeChange = (type: ReportType) => {
    // Reset sections when type changes
    const defaultSections = sectionsOptions[type].slice(0, 3).map(s => s.id)
    setFormData(prev => ({
      ...prev,
      type,
      sections: defaultSections,
    }))
  }

  const toggleSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId],
    }))
  }

  const toggleFiliale = (filialeId: number) => {
    setFormData(prev => ({
      ...prev,
      filiales_ids: prev.filiales_ids.includes(filialeId)
        ? prev.filiales_ids.filter(f => f !== filialeId)
        : [...prev.filiales_ids, filialeId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.nom.trim()) {
      setError('Le nom du template est requis')
      return
    }
    if (formData.sections.length === 0) {
      setError('Sélectionnez au moins une section')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Non authentifié')

      // Use untyped client for report_templates (new table not in generated types)
      const db = createClient()
      const { data, error: insertError } = await db
        .from('report_templates')
        .insert({
          user_id: user.id,
          nom: formData.nom.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          sections: formData.sections,
          filiales_ids: formData.filiales_ids.length > 0 ? formData.filiales_ids : [],
          periode_type: formData.periode_type,
          orientation: formData.orientation,
          inclure_graphiques: formData.inclure_graphiques,
          inclure_logo: formData.inclure_logo,
          is_public: formData.is_public,
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push('/finance/rapports/personnalises')
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const currentSections = sectionsOptions[formData.type] || []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau template de rapport"
        description="Créez un template réutilisable pour vos rapports"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Rapports', href: '/finance/rapports' },
          { label: 'Personnalisés', href: '/finance/rapports/personnalises' },
          { label: 'Nouveau' },
        ]}
      />

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
            <LayoutTemplate className="h-5 w-5 text-phi-primary" />
            Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="nom">Nom du template *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Rapport mensuel commercial"
                className="mt-1"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
                placeholder="Description du contenu et de l'usage de ce rapport..."
              />
            </div>
          </div>
        </div>

        {/* Type de rapport */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-phi-primary" />
            Type de rapport
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value as ReportType)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.type === type.value
                    ? 'border-phi-primary bg-phi-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <type.icon className={`h-6 w-6 mb-2 ${
                  formData.type === type.value ? 'text-phi-primary' : 'text-gray-400'
                }`} />
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sections à inclure */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Check className="h-5 w-5 text-phi-primary" />
            Sections à inclure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`p-4 rounded-xl border transition-all text-left flex items-start gap-3 ${
                  formData.sections.includes(section.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  formData.sections.includes(section.id)
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {formData.sections.includes(section.id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{section.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filiales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-phi-primary" />
            Filiales
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Laissez vide pour inclure toutes les filiales, ou sélectionnez des filiales spécifiques
          </p>

          <div className="flex flex-wrap gap-2">
            {filiales.map((filiale) => (
              <button
                key={filiale.id}
                type="button"
                onClick={() => toggleFiliale(filiale.id)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  formData.filiales_ids.includes(filiale.id)
                    ? 'border-phi-primary bg-phi-primary text-white'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {filiale.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Période par défaut</Label>
              <select
                value={formData.periode_type}
                onChange={(e) => setFormData(prev => ({ ...prev, periode_type: e.target.value as PeriodeType }))}
                className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="annuel">Annuel</option>
                <option value="personnalise">Personnalisé</option>
              </select>
            </div>

            <div>
              <Label>Orientation</Label>
              <select
                value={formData.orientation}
                onChange={(e) => setFormData(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'paysage' }))}
                className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/30 focus:border-phi-primary"
              >
                <option value="portrait">Portrait</option>
                <option value="paysage">Paysage</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">Inclure les graphiques</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, inclure_graphiques: !prev.inclure_graphiques }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.inclure_graphiques ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.inclure_graphiques ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">Inclure le logo</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, inclure_logo: !prev.inclure_logo }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.inclure_logo ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.inclure_logo ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                {formData.is_public ? (
                  <Globe className="h-5 w-5 text-blue-500" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <span className="text-sm text-gray-700">Template public</span>
                  <p className="text-xs text-gray-500">
                    {formData.is_public
                      ? 'Visible par tous les utilisateurs'
                      : 'Visible uniquement par vous'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_public ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_public ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer le template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
