'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ExportButton } from '@/components/common/ExportButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientGridCard } from '@/components/finance/ClientGridCard'
import { ClientTableRow } from '@/components/finance/ClientTableRow'
import { exportClients } from '@/lib/export/excel'
import {
  Users,
  Building2,
  UserCircle,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'> & {
  filiale?: { nom: string; code: string } | null
}

const ITEMS_PER_PAGE = 12

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    entreprises: 0,
    particuliers: 0,
    actifs: 0,
  })

  // Fonction combinée pour charger clients et stats en parallèle
  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Construire la requête de clients
    let clientsQuery = supabase
      .from('clients')
      .select('*, filiale:filiale_id(nom, code)', { count: 'exact' })

    // Filtres
    if (search) {
      clientsQuery = clientsQuery.or(`nom.ilike.%${search}%,code.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (filterType !== 'all') {
      clientsQuery = clientsQuery.eq('type', filterType)
    }
    if (filterStatut !== 'all') {
      clientsQuery = clientsQuery.eq('statut', filterStatut)
    }

    // Pagination
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    clientsQuery = clientsQuery
      .order('created_at', { ascending: false })
      .range(from, to)

    try {
      // Exécuter les 5 requêtes en parallèle (clients + 4 stats)
      const [clientsResult, totalResult, entreprisesResult, particuliersResult, actifsResult] = await Promise.all([
        clientsQuery,
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'entreprise'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'particulier'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
      ])

      // Traiter les résultats des clients
      if (!clientsResult.error && clientsResult.data) {
        setClients(clientsResult.data as Client[])
        setTotalCount(clientsResult.count || 0)
      }

      // Traiter les résultats des stats
      setStats({
        total: totalResult.count || 0,
        entreprises: entreprisesResult.count || 0,
        particuliers: particuliersResult.count || 0,
        actifs: actifsResult.count || 0,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterStatut, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    const supabase = createClient()

    let query = supabase
      .from('clients')
      .select('*, filiale:filiale_id(nom, code)')

    if (search) {
      query = query.or(`nom.ilike.%${search}%,code.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }
    if (filterStatut !== 'all') {
      query = query.eq('statut', filterStatut)
    }

    const { data } = await query.order('created_at', { ascending: false })

    if (data && data.length > 0) {
      exportClients(data as Client[])
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Gérez vos clients et prospects"
        actionLabel="Nouveau client"
        actionHref="/finance/clients/nouveau"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Clients' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total clients"
          value={stats.total}
          icon={Users}
          trend={`${stats.actifs} actifs`}
          trendUp={true}
        />
        <StatsCard
          title="Entreprises"
          value={stats.entreprises}
          icon={Building2}
          trend={`${Math.round((stats.entreprises / (stats.total || 1)) * 100)}%`}
          trendUp={true}
        />
        <StatsCard
          title="Particuliers"
          value={stats.particuliers}
          icon={UserCircle}
          trend={`${Math.round((stats.particuliers / (stats.total || 1)) * 100)}%`}
          trendUp={true}
        />
        <StatsCard
          title="Taux conversion"
          value="68%"
          icon={TrendingUp}
          trend="Prospects → Actifs"
          trendUp={true}
        />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un client..."
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
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Tous types</option>
                <option value="entreprise">Entreprises</option>
                <option value="particulier">Particuliers</option>
              </select>
              <select
                value={filterStatut}
                onChange={(e) => {
                  setFilterStatut(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Tous statuts</option>
                <option value="prospect">Prospects</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
                <option value="suspendu">Suspendus</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('grid')}
              className="h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setView('list')}
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
            <ExportButton
              onExport={handleExport}
              disabled={totalCount === 0}
            />
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client trouvé"
          description={search || filterType !== 'all' || filterStatut !== 'all'
            ? "Aucun client ne correspond à vos critères de recherche"
            : "Commencez par ajouter votre premier client"
          }
          actionLabel="Nouveau client"
          actionHref="/finance/clients/nouveau"
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientGridCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden lg:table-cell">Filiale</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <ClientTableRow key={client.id} client={client} />
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
            {totalCount} client{totalCount > 1 ? 's' : ''} au total
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
