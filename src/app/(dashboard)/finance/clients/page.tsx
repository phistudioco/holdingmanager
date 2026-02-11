'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { ExportButton } from '@/components/common/ExportButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Mail,
  Phone,
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

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('clients')
      .select('*, filiale:filiale_id(nom, code)', { count: 'exact' })

    // Filtres
    if (search) {
      query = query.or(`nom.ilike.%${search}%,code.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }
    if (filterStatut !== 'all') {
      query = query.eq('statut', filterStatut)
    }

    // Pagination
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setClients(data as Client[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [search, filterType, filterStatut, page])

  const fetchStats = useCallback(async () => {
    const supabase = createClient()

    const [
      { count: total },
      { count: entreprises },
      { count: particuliers },
      { count: actifs },
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'entreprise'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('type', 'particulier'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    ])

    setStats({
      total: total || 0,
      entreprises: entreprises || 0,
      particuliers: particuliers || 0,
      actifs: actifs || 0,
    })
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

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
            <Link
              key={client.id}
              href={`/finance/clients/${client.id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-phi-primary/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 ${
                    client.type === 'entreprise'
                      ? 'bg-gradient-to-br from-phi-primary to-blue-600'
                      : 'bg-gradient-to-br from-phi-accent to-pink-600'
                  }`}
                >
                  {client.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-phi-primary transition-colors">
                      {client.nom}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{client.code}</p>
                  <StatusBadge status={client.statut} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.telephone}</span>
                  </div>
                )}
                {client.filiale && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{client.filiale.nom}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    client.type === 'entreprise'
                      ? 'bg-phi-primary/10 text-phi-primary'
                      : 'bg-phi-accent/10 text-phi-accent'
                  }`}
                >
                  {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                </span>
                {client.ville && (
                  <span className="text-xs text-gray-400">{client.ville}</span>
                )}
              </div>
            </Link>
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
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/finance/clients/${client.id}`} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                          client.type === 'entreprise' ? 'bg-phi-primary' : 'bg-phi-accent'
                        }`}
                      >
                        {client.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 hover:text-phi-primary">{client.nom}</p>
                        <p className="text-sm text-gray-500">{client.code}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        client.type === 'entreprise'
                          ? 'bg-phi-primary/10 text-phi-primary'
                          : 'bg-phi-accent/10 text-phi-accent'
                      }`}
                    >
                      {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-sm">
                      {client.email && <p className="text-gray-600">{client.email}</p>}
                      {client.telephone && <p className="text-gray-400">{client.telephone}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                    {client.filiale?.nom || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={client.statut} />
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
