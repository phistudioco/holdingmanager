'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Plus,
  Download,
  Edit2,
  Trash2,
  Copy,
  Share2,
  Clock,
  Calendar,
  Building2,
  Users,
  Loader2,
  ChevronRight,
  LayoutTemplate,
  Globe,
  Lock,
  Star,
} from 'lucide-react'

type ReportTemplate = {
  id: number
  user_id: string
  nom: string
  description: string | null
  type: 'finance' | 'clients' | 'employes' | 'services' | 'workflows' | 'custom'
  sections: string[]
  filiales_ids: number[]
  periode_type: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
  orientation: 'portrait' | 'paysage'
  inclure_graphiques: boolean
  inclure_logo: boolean
  is_public: boolean
  derniere_generation: string | null
  fois_genere: number
  created_at: string
}

const typeLabels: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  finance: { label: 'Finance', color: 'bg-green-100 text-green-700', icon: FileText },
  clients: { label: 'Clients', color: 'bg-blue-100 text-blue-700', icon: Users },
  employes: { label: 'Employés', color: 'bg-purple-100 text-purple-700', icon: Users },
  services: { label: 'Services', color: 'bg-amber-100 text-amber-700', icon: Building2 },
  workflows: { label: 'Workflows', color: 'bg-pink-100 text-pink-700', icon: Clock },
  custom: { label: 'Personnalisé', color: 'bg-gray-100 text-gray-700', icon: LayoutTemplate },
}

const periodeLabels: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
  personnalise: 'Personnalisé',
}

export default function CustomReportsPage() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [publicTemplates, setPublicTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Use untyped client for report_templates (new table not in generated types)
    const db = createClient()

    // Mes templates
    const { data: myTemplates } = await db
      .from('report_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    // Templates publics (créés par d'autres)
    const { data: sharedTemplates } = await db
      .from('report_templates')
      .select('*')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('fois_genere', { ascending: false })
      .limit(10)

    if (myTemplates) setTemplates(myTemplates as ReportTemplate[])
    if (sharedTemplates) setPublicTemplates(sharedTemplates as ReportTemplate[])

    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    const db = createClient()
    const { error } = await db
      .from('report_templates')
      .delete()
      .eq('id', id)

    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== id))
      setShowDeleteConfirm(null)
    }
  }

  const handleDuplicate = async (template: ReportTemplate) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const db = createClient()
    // Table report_templates pas complètement typée dans database.ts - type assertion temporaire
    const { data } = await (db as any)
      .from('report_templates')
      .insert({
        user_id: user.id,
        nom: `${template.nom} (copie)`,
        description: template.description,
        type: template.type,
        sections: template.sections,
        filiales_ids: template.filiales_ids,
        periode_type: template.periode_type,
        orientation: template.orientation,
        inclure_graphiques: template.inclure_graphiques,
        inclure_logo: template.inclure_logo,
        is_public: false,
      })
      .select()
      .single()

    if (data) {
      setTemplates(prev => [data as ReportTemplate, ...prev])
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rapports Personnalisés"
        description="Créez et gérez vos templates de rapports"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Rapports', href: '/finance/rapports' },
          { label: 'Personnalisés' },
        ]}
        actions={
          <Link href="/finance/rapports/personnalises/nouveau">
            <Button className="bg-phi-primary hover:bg-phi-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </Link>
        }
      />

      {/* Mes templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-phi-primary" />
          Mes templates
        </h2>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template</h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier template de rapport pour gagner du temps
            </p>
            <Link href="/finance/rapports/personnalises/nouveau">
              <Button className="bg-phi-primary hover:bg-phi-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const typeInfo = typeLabels[template.type]
              const TypeIcon = typeInfo.icon

              return (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {template.is_public ? (
                        <span title="Public"><Globe className="h-4 w-4 text-gray-400" /></span>
                      ) : (
                        <span title="Privé"><Lock className="h-4 w-4 text-gray-400" /></span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {periodeLabels[template.periode_type]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{template.nom}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {template.fois_genere} fois
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(template.derniere_generation)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link href={`/finance/rapports/personnalises/${template.id}/generer`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-3 w-3 mr-1" />
                        Générer
                      </Button>
                    </Link>
                    <Link href={`/finance/rapports/personnalises/${template.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {showDeleteConfirm === template.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Oui
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Non
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Templates publics populaires */}
      {publicTemplates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-phi-primary" />
            Templates publics populaires
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicTemplates.map((template) => {
              const typeInfo = typeLabels[template.type]
              const TypeIcon = typeInfo.icon

              return (
                <div
                  key={template.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-xs font-medium">{template.fois_genere}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{template.nom}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Utiliser ce template
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lien vers rapports standard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-phi-primary/10 rounded-xl">
              <FileText className="h-6 w-6 text-phi-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rapport financier rapide</h3>
              <p className="text-sm text-gray-500">
                Générez un rapport financier sans créer de template
              </p>
            </div>
          </div>
          <Link href="/finance/rapports">
            <Button variant="outline">
              Accéder
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
