'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Monitor,
  Edit,
  Trash2,
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  Loader2,
  ArrowLeft,
  DollarSign,
  Globe,
  Code,
  Smartphone,
  Layers,
  ExternalLink,
} from 'lucide-react'

type ProjetDigital = {
  id: number
  nom: string
  description: string | null
  client_id: number | null
  filiale_id: number
  type: 'site_web' | 'application' | 'ecommerce' | 'mobile' | 'autre'
  statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
  url: string | null
  date_debut: string | null
  date_fin_prevue: string | null
  budget: number | null
  created_at: string
  updated_at: string
  client?: { id: number; nom: string; code: string } | null
  filiale?: { id: number; nom: string; code: string } | null
}

const themeColor = '#fcd017'
const themeDark = '#d4a90c'

export default function ProjetDigitalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projetId = Number(params.id)

  const [projet, setProjet] = useState<ProjetDigital | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchProjet = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('projets_digital')
        .select(`
          *,
          client:client_id(id, nom, code),
          filiale:filiale_id(id, nom, code)
        `)
        .eq('id', projetId)
        .single()

      if (error) {
        console.error('Erreur:', error)
        setLoading(false)
        return
      }

      setProjet(data as ProjetDigital)
      setLoading(false)
    }

    fetchProjet()
  }, [projetId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      planifie: {
        label: 'Planifié',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: <Clock className="h-4 w-4" />,
      },
      en_cours: {
        label: 'En cours',
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
      },
      en_pause: {
        label: 'En pause',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <Pause className="h-4 w-4" />,
      },
      termine: {
        label: 'Terminé',
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      annule: {
        label: 'Annulé',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <XCircle className="h-4 w-4" />,
      },
    }
    return configs[statut] || configs.planifie
  }

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode }> = {
      site_web: { label: 'Site Web', icon: <Globe className="h-5 w-5" /> },
      application: { label: 'Application', icon: <Code className="h-5 w-5" /> },
      ecommerce: { label: 'E-Commerce', icon: <Layers className="h-5 w-5" /> },
      mobile: { label: 'Mobile', icon: <Smartphone className="h-5 w-5" /> },
      autre: { label: 'Autre', icon: <Monitor className="h-5 w-5" /> },
    }
    return configs[type] || configs.autre
  }

  const handleDelete = async () => {
    if (!projet) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projet.nom}" ?`)) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projets_digital')
        .delete()
        .eq('id', projet.id)

      if (error) throw error

      router.push('/services/digital')
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeDark }} />
      </div>
    )
  }

  if (!projet) {
    return (
      <div className="text-center py-12">
        <Monitor className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Projet non trouvé</h2>
        <p className="text-gray-500 mb-6">Ce projet n&apos;existe pas ou a été supprimé.</p>
        <Link href="/services/digital">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    )
  }

  const statutConfig = getStatutConfig(projet.statut)
  const typeConfig = getTypeConfig(projet.type)

  return (
    <div className="space-y-6">
      <PageHeader
        title={projet.nom}
        description="Détails du projet digital"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Digital', href: '/services/digital' },
          { label: projet.nom },
        ]}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/services/digital">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <Link href={`/services/digital/${projet.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </Link>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Supprimer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-2" style={{ backgroundColor: themeColor }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${themeColor}30` }}
                  >
                    <span style={{ color: themeDark }}>{typeConfig.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{projet.nom}</h2>
                    <p className="text-sm text-gray-500">{typeConfig.label}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statutConfig.bg} ${statutConfig.color}`}>
                  {statutConfig.icon}
                  {statutConfig.label}
                </span>
              </div>

              {projet.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{projet.description}</p>
                </div>
              )}

              {projet.url && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    URL du projet
                  </h3>
                  <a
                    href={projet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    {projet.url}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de début
                  </h3>
                  <p className="text-gray-900 font-medium">{formatDate(projet.date_debut)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Fin prévue
                  </h3>
                  <p className="text-gray-900 font-medium">{formatDate(projet.date_fin_prevue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          {projet.budget && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget alloué
              </h3>
              <p className="text-3xl font-bold" style={{ color: themeDark }}>
                {formatCurrency(projet.budget)}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Filiale */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filiale
            </h3>
            {projet.filiale ? (
              <div>
                <p className="font-semibold text-gray-900">{projet.filiale.nom}</p>
                <p className="text-sm text-gray-500">{projet.filiale.code}</p>
              </div>
            ) : (
              <p className="text-gray-500">Non assigné</p>
            )}
          </div>

          {/* Client */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Client
            </h3>
            {projet.client ? (
              <div>
                <p className="font-semibold text-gray-900">{projet.client.nom}</p>
                <p className="text-sm text-gray-500">{projet.client.code}</p>
                <Link
                  href={`/finance/clients/${projet.client.id}`}
                  className="text-sm mt-2 inline-block hover:underline"
                  style={{ color: themeDark }}
                >
                  Voir le client →
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 italic">Aucun client associé</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span className="text-gray-900">{formatDate(projet.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifié le</span>
                <span className="text-gray-900">{formatDate(projet.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
