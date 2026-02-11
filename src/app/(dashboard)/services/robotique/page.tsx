'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Search,
  Plus,
  Cpu,
  Cog,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Zap,
} from 'lucide-react'

type ProjetRobotique = {
  id: number
  nom: string
  description: string | null
  client_id: number | null
  filiale_id: number
  statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
  date_debut: string | null
  date_fin_prevue: string | null
  budget: number | null
  created_at: string
  client?: { nom: string } | null
  filiale?: { nom: string } | null
}

export default function RobotiquePage() {
  const [projets, setProjets] = useState<ProjetRobotique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    termines: 0,
    budgetTotal: 0,
  })

  const fetchProjets = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('projets_robotique')
      .select('*, client:client_id(nom), filiale:filiale_id(nom)')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('nom', `%${search}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      const projetsData = data as ProjetRobotique[]
      setProjets(projetsData)

      // Calculate stats
      const enCours = projetsData.filter(p => p.statut === 'en_cours').length
      const termines = projetsData.filter(p => p.statut === 'termine').length
      const budgetTotal = projetsData.reduce((sum, p) => sum + (p.budget || 0), 0)

      setStats({
        total: projetsData.length,
        enCours,
        termines,
        budgetTotal,
      })
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchProjets()
  }, [fetchProjets])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      planifie: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-amber-100 text-amber-700',
      en_pause: 'bg-gray-100 text-gray-700',
      termine: 'bg-green-100 text-green-700',
      annule: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      planifie: 'Planifié',
      en_cours: 'En cours',
      en_pause: 'En pause',
      termine: 'Terminé',
      annule: 'Annulé',
    }
    return labels[statut] || statut
  }

  // Theme color for Robotique service
  const themeColor = '#e72572'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Robotique"
        description="Gestion des projets et équipements robotiques"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Robotique' },
        ]}
      />

      {/* Stats Cards with Robotique theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #c41e5e 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Bot className="h-6 w-6" />
            </div>
            <Cpu className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Total projets</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <StatsCard
          title="En cours"
          value={stats.enCours}
          icon={Activity}
          trend="Projets actifs"
          trendUp={true}
        />

        <StatsCard
          title="Terminés"
          value={stats.termines}
          icon={CheckCircle}
          trend={`${stats.total > 0 ? Math.round((stats.termines / stats.total) * 100) : 0}% réalisé`}
          trendUp={true}
        />

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Zap className="h-6 w-6" />
            </div>
            <Cog className="h-5 w-5 opacity-60 animate-spin-slow" />
          </div>
          <p className="text-sm opacity-80 mb-1">Budget total</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.budgetTotal)}</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/services/robotique/nouveau">
            <Button
              style={{ backgroundColor: themeColor }}
              className="hover:opacity-90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: themeColor }}
          />
        </div>
      ) : projets.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Aucun projet robotique"
          description={search ? "Aucun projet ne correspond à votre recherche" : "Créez votre premier projet robotique"}
          action={{
            label: "Nouveau projet",
            href: "/services/robotique/nouveau"
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projets.map((projet) => (
            <div
              key={projet.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Card Header with theme accent */}
              <div
                className="h-2"
                style={{ backgroundColor: themeColor }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <Bot className="h-5 w-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#e72572] transition-colors">
                        {projet.nom}
                      </h3>
                      {projet.client && (
                        <p className="text-sm text-gray-500">{projet.client.nom}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(projet.statut)}`}>
                    {getStatutLabel(projet.statut)}
                  </span>
                </div>

                {projet.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {projet.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Début: {formatDate(projet.date_debut)}</span>
                  </div>
                  {projet.date_fin_prevue && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Fin prévue: {formatDate(projet.date_fin_prevue)}</span>
                    </div>
                  )}
                  {projet.budget && (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Wrench className="h-4 w-4" />
                      <span>{formatCurrency(projet.budget)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    href={`/services/robotique/${projet.id}`}
                    className="flex items-center justify-between text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: themeColor }}
                  >
                    <span>Voir le projet</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
