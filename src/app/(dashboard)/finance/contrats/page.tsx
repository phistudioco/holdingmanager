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
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Euro,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Contrat = Tables<'contrats'> & {
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
}

const ITEMS_PER_PAGE = 10

export default function ContratsPage() {
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    expirantBientot: 0,
    montantTotal: 0,
  })

  const fetchContrats = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('contrats')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom)', { count: 'exact' })

    if (search) {
      query = query.or(`numero.ilike.%${search}%,titre.ilike.%${search}%`)
    }
    if (filterStatut !== 'all') {
      query = query.eq('statut', filterStatut)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setContrats(data as Contrat[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [search, filterStatut, filterType, page])

  const fetchStats = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      { count: total },
      { count: actifs },
      { count: expirantBientot },
      { data: allContrats },
    ] = await Promise.all([
      supabase.from('contrats').select('*', { count: 'exact', head: true }),
      supabase.from('contrats').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
      supabase
        .from('contrats')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'actif')
        .gte('date_fin', today)
        .lte('date_fin', in30Days),
      supabase.from('contrats').select('montant, statut').eq('statut', 'actif'),
    ])

    const montantTotal = (allContrats as { montant: number }[] | null)?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0

    setStats({
      total: total || 0,
      actifs: actifs || 0,
      expirantBientot: expirantBientot || 0,
      montantTotal,
    })
  }, [])

  useEffect(() => {
    fetchContrats()
  }, [fetchContrats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      actif: 'bg-green-100 text-green-700',
      suspendu: 'bg-yellow-100 text-yellow-700',
      termine: 'bg-blue-100 text-blue-700',
      resilie: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      actif: 'Actif',
      suspendu: 'Suspendu',
      termine: 'Terminé',
      resilie: 'Résilié',
    }
    return labels[statut] || statut
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service: 'Service',
      maintenance: 'Maintenance',
      licence: 'Licence',
      location: 'Location',
      autre: 'Autre',
    }
    return labels[type] || type
  }

  const isExpiringSoon = (dateFin: string | null, statut: string) => {
    if (statut !== 'actif' || !dateFin) return false
    const diff = new Date(dateFin).getTime() - Date.now()
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrats"
        description="Gérez vos contrats clients et suivez leur renouvellement"
        actionLabel="Nouveau contrat"
        actionHref="/finance/contrats/nouveau"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Contrats' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total contrats"
          value={stats.total}
          icon={ScrollText}
          trend={`${stats.actifs} actifs`}
          trendUp={true}
        />
        <StatsCard
          title="Contrats actifs"
          value={stats.actifs}
          icon={CheckCircle}
          trend={`${Math.round((stats.actifs / (stats.total || 1)) * 100)}%`}
          trendUp={true}
        />
        <StatsCard
          title="Expirent bientôt"
          value={stats.expirantBientot}
          icon={AlertTriangle}
          trend="Dans 30 jours"
          trendUp={false}
        />
        <div className="bg-gradient-to-br from-phi-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Euro className="h-6 w-6" />
            </div>
            <RefreshCw className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Valeur totale (actifs)</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.montantTotal)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un contrat..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatut}
                onChange={(e) => {
                  setFilterStatut(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Tous statuts</option>
                <option value="brouillon">Brouillons</option>
                <option value="actif">Actifs</option>
                <option value="suspendu">Suspendus</option>
                <option value="termine">Terminés</option>
                <option value="resilie">Résiliés</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Tous types</option>
                <option value="service">Service</option>
                <option value="maintenance">Maintenance</option>
                <option value="licence">Licence</option>
                <option value="location">Location</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des contrats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
        </div>
      ) : contrats.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Aucun contrat trouvé"
          description={search || filterStatut !== 'all' || filterType !== 'all'
            ? "Aucun contrat ne correspond à vos critères"
            : "Créez votre premier contrat"
          }
          action={{
            label: "Nouveau contrat",
            href: "/finance/contrats/nouveau"
          }}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Contrat</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden lg:table-cell">Période</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {contrats.map((contrat) => (
                <tr key={contrat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/finance/contrats/${contrat.id}`} className="block">
                      <p className="font-semibold text-gray-900 hover:text-phi-primary">{contrat.numero}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{contrat.titre}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {contrat.client ? (
                      <Link href={`/finance/clients/${contrat.client_id}`} className="hover:text-phi-primary">
                        <p className="font-medium text-gray-900">{contrat.client.nom}</p>
                        <p className="text-sm text-gray-500">{contrat.client.code}</p>
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-phi-primary/10 text-phi-primary">
                      {getTypeLabel(contrat.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{formatDate(contrat.date_debut)}</p>
                        <p className={`text-xs ${isExpiringSoon(contrat.date_fin, contrat.statut) ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                          → {formatDate(contrat.date_fin)}
                          {isExpiringSoon(contrat.date_fin, contrat.statut) && ' ⚠️'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(contrat.montant)}</p>
                    <p className="text-xs text-gray-500">{contrat.periodicite}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(contrat.statut)}`}>
                        {getStatutLabel(contrat.statut)}
                      </span>
                      {contrat.reconduction_auto && (
                        <span title="Reconduction automatique">
                          <RefreshCw className="h-4 w-4 text-green-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/finance/contrats/${contrat.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/finance/contrats/${contrat.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {totalCount} contrat{totalCount > 1 ? 's' : ''} au total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
