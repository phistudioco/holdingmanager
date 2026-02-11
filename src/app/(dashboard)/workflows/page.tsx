'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import {
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Calendar,
  FileText,
} from 'lucide-react'

type WorkflowDemande = {
  id: number
  numero: string
  type: 'achat' | 'conge' | 'formation' | 'autre'
  titre: string
  description: string | null
  statut: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
  demandeur_id: number
  date_demande: string
  montant: number | null
  created_at: string
  demandeur?: { nom: string; prenom: string } | null
}

export default function WorkflowsPage() {
  const [demandes, setDemandes] = useState<WorkflowDemande[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'toutes' | 'mes_demandes' | 'a_approuver'>('toutes')
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    approuvees: 0,
    rejetees: 0,
  })

  useEffect(() => {
    const fetchDemandes = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('workflow_demandes')
        .select('*, demandeur:demandeur_id(nom, prenom)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const demandesData = data as unknown as WorkflowDemande[]
        setDemandes(demandesData)

        const enCours = demandesData.filter(d => d.statut === 'en_cours').length
        const approuvees = demandesData.filter(d => d.statut === 'approuve').length
        const rejetees = demandesData.filter(d => d.statut === 'rejete').length

        setStats({
          total: demandesData.length,
          enCours,
          approuvees,
          rejetees,
        })
      }
      setLoading(false)
    }

    fetchDemandes()
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      en_cours: 'bg-amber-100 text-amber-700',
      approuve: 'bg-green-100 text-green-700',
      rejete: 'bg-red-100 text-red-700',
      annule: 'bg-gray-100 text-gray-500',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      en_cours: 'En cours',
      approuve: 'Approuvé',
      rejete: 'Rejeté',
      annule: 'Annulé',
    }
    return labels[statut] || statut
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      achat: "Demande d'achat",
      conge: 'Demande de congé',
      formation: 'Demande de formation',
      autre: 'Autre demande',
    }
    return labels[type] || type
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      achat: <FileText className="h-4 w-4" />,
      conge: <Calendar className="h-4 w-4" />,
      formation: <User className="h-4 w-4" />,
      autre: <GitBranch className="h-4 w-4" />,
    }
    return icons[type] || <GitBranch className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Gestion des demandes et approbations"
        actionLabel="Nouvelle demande"
        actionHref="/workflows/nouveau"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total demandes"
          value={stats.total}
          icon={GitBranch}
          trend="Toutes les demandes"
          trendUp={true}
        />
        <StatsCard
          title="En cours"
          value={stats.enCours}
          icon={Clock}
          trend="En attente d'approbation"
          trendUp={stats.enCours > 0}
        />
        <StatsCard
          title="Approuvées"
          value={stats.approuvees}
          icon={CheckCircle}
          trend={`${stats.total > 0 ? Math.round((stats.approuvees / stats.total) * 100) : 0}%`}
          trendUp={true}
        />
        <StatsCard
          title="Rejetées"
          value={stats.rejetees}
          icon={XCircle}
          trend={`${stats.total > 0 ? Math.round((stats.rejetees / stats.total) * 100) : 0}%`}
          trendUp={false}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'toutes', label: 'Toutes les demandes' },
            { key: 'mes_demandes', label: 'Mes demandes' },
            { key: 'a_approuver', label: 'À approuver' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-phi-primary border-b-2 border-phi-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary" />
            </div>
          ) : demandes.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="Aucune demande"
              description="Créez votre première demande de workflow"
              action={{
                label: "Nouvelle demande",
                href: "/workflows/nouveau"
              }}
            />
          ) : (
            <div className="space-y-4">
              {demandes.map((demande) => (
                <div
                  key={demande.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-phi-primary/10 rounded-lg text-phi-primary">
                      {getTypeIcon(demande.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{demande.numero}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatutColor(demande.statut)}`}>
                          {getStatutLabel(demande.statut)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{demande.titre}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTypeLabel(demande.type)} • {formatDate(demande.date_demande)}
                        {demande.demandeur && ` • ${demande.demandeur.prenom} ${demande.demandeur.nom}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {demande.montant && (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(demande.montant)}
                      </span>
                    )}
                    <Link href={`/workflows/${demande.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
