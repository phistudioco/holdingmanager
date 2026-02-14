'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/hooks/useDebounce'
import {
  Monitor,
  Search,
  Plus,
  Globe,
  Smartphone,
  Code,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Layers,
  Palette,
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
  client?: { nom: string } | null
  filiale?: { nom: string } | null
}

export default function DigitalPage() {
  const [projets, setProjets] = useState<ProjetDigital[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    termines: 0,
    sitesWeb: 0,
  })

  // Debounce de la recherche pour éviter les requêtes trop fréquentes
  const debouncedSearch = useDebounce(search, 300)

  const fetchProjets = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('projets_digital')
      .select('*, client:client_id(nom), filiale:filiale_id(nom)')
      .order('created_at', { ascending: false })

    if (debouncedSearch) {
      query = query.ilike('nom', `%${debouncedSearch}%`)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }

    const { data, error } = await query

    if (!error && data) {
      const projetsData = data as ProjetDigital[]
      setProjets(projetsData)

      // Calculate stats
      const enCours = projetsData.filter(p => p.statut === 'en_cours').length
      const termines = projetsData.filter(p => p.statut === 'termine').length
      const sitesWeb = projetsData.filter(p => p.type === 'site_web').length

      setStats({
        total: projetsData.length,
        enCours,
        termines,
        sitesWeb,
      })
    }
    setLoading(false)
  }, [debouncedSearch, filterType])

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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      site_web: <Globe className="h-5 w-5" />,
      application: <Code className="h-5 w-5" />,
      ecommerce: <Layers className="h-5 w-5" />,
      mobile: <Smartphone className="h-5 w-5" />,
      autre: <Monitor className="h-5 w-5" />,
    }
    return icons[type] || <Monitor className="h-5 w-5" />
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      site_web: 'Site Web',
      application: 'Application',
      ecommerce: 'E-Commerce',
      mobile: 'Mobile',
      autre: 'Autre',
    }
    return labels[type] || type
  }

  // Theme color for Digital service (Yellow/Gold)
  const themeColor = '#fcd017'
  const themeDark = '#d4a90c'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Digital"
        description="Gestion des projets digitaux et plateformes"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Digital' },
        ]}
      />

      {/* Stats Cards with Digital theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-6 text-gray-900 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeDark} 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black/10 rounded-xl">
              <Monitor className="h-6 w-6" />
            </div>
            <Code className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Total projets</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <StatsCard
          title="En cours"
          value={stats.enCours}
          icon={TrendingUp}
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

        <StatsCard
          title="Sites Web"
          value={stats.sitesWeb}
          icon={Globe}
          trend="En production"
          trendUp={true}
        />
      </div>

      {/* Search, Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            >
              <option value="all">Tous les types</option>
              <option value="site_web">Sites Web</option>
              <option value="application">Applications</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="mobile">Mobile</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <Link href="/services/digital/nouveau">
            <Button
              className="text-gray-900 hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: themeDark }}
          />
        </div>
      ) : projets.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Aucun projet digital"
          description={search || filterType !== 'all'
            ? "Aucun projet ne correspond à vos critères"
            : "Créez votre premier projet digital"
          }
          action={{
            label: "Nouveau projet",
            href: "/services/digital/nouveau"
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
                      style={{ backgroundColor: `${themeColor}30` }}
                    >
                      <span style={{ color: themeDark }}>{getTypeIcon(projet.type)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {projet.nom}
                      </h3>
                      <p className="text-xs text-gray-500">{getTypeLabel(projet.type)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(projet.statut)}`}>
                    {getStatutLabel(projet.statut)}
                  </span>
                </div>

                {projet.client && (
                  <p className="text-sm text-gray-600 mb-2">
                    Client: <span className="font-medium">{projet.client.nom}</span>
                  </p>
                )}

                {projet.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {projet.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(projet.date_debut)} → {formatDate(projet.date_fin_prevue)}</span>
                  </div>
                  {projet.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={projet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {projet.url}
                      </a>
                    </div>
                  )}
                  {projet.budget && (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Palette className="h-4 w-4" />
                      <span>{formatCurrency(projet.budget)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link
                    href={`/services/digital/${projet.id}`}
                    className="flex items-center justify-between text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
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
