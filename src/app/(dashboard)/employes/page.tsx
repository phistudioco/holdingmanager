'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmployeeGridCard } from '@/components/employes/EmployeeGridCard'
import { EmployeeTableRow } from '@/components/employes/EmployeeTableRow'
import { useDebounce } from '@/lib/hooks/useDebounce'
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Employe = Tables<'employes'> & {
  filiale?: { nom: string; code: string } | null
  service?: { nom: string; couleur: string } | null
}

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'actif' | 'en_conge' | 'suspendu' | 'sorti'

export default function EmployesPage() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [filiales, setFiliales] = useState<Tables<'filiales'>[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterFiliale, setFilterFiliale] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({ total: 0, actifs: 0, enConge: 0 })
  const itemsPerPage = 12

  // Debounce de la recherche pour éviter les requêtes trop fréquentes
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Charger les données avec pagination côté serveur
  useEffect(() => {
    loadEmployes()
  }, [currentPage, debouncedSearchQuery, filterStatus, filterFiliale])

  // Charger les filiales et stats une seule fois
  useEffect(() => {
    loadFilialesAndStats()
  }, [])

  const loadFilialesAndStats = async () => {
    const supabase = createClient()

    // Exécuter 3 requêtes en parallèle pour maximiser la performance
    const [filialesRes, totalCountRes, statsDataRes] = await Promise.all([
      supabase.from('filiales').select('*').order('nom'),
      // Requête 1 : count total uniquement (head: true pour ne pas charger de données)
      supabase.from('employes').select('*', { count: 'exact', head: true }),
      // Requête 2 : données minimales pour les stats par statut
      supabase.from('employes').select('statut'),
    ])

    if (filialesRes.data) setFiliales(filialesRes.data)

    if (statsDataRes.data) {
      const total = totalCountRes.count || 0
      const actifs = statsDataRes.data.filter((e: { statut: string }) => e.statut === 'actif').length
      const enConge = statsDataRes.data.filter((e: { statut: string }) => e.statut === 'en_conge').length
      setStats({ total, actifs, enConge })
    }
  }

  const loadEmployes = async () => {
    setLoading(true)
    const supabase = createClient()

    // Construire la query avec filtres côté serveur
    let query = supabase
      .from('employes')
      .select(
        `
          *,
          filiale:filiale_id (nom, code),
          service:service_id (nom, couleur)
        `,
        { count: 'exact' }
      )

    // Appliquer les filtres côté serveur avec la valeur debouncée
    if (debouncedSearchQuery) {
      query = query.or(
        `nom.ilike.%${debouncedSearchQuery}%,prenom.ilike.%${debouncedSearchQuery}%,matricule.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%,poste.ilike.%${debouncedSearchQuery}%`
      )
    }

    if (filterStatus !== 'all') {
      query = query.eq('statut', filterStatus)
    }

    if (filterFiliale !== 'all') {
      query = query.eq('filiale_id', parseInt(filterFiliale))
    }

    // Pagination côté serveur avec range()
    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, count, error } = await query
      .order('nom', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Erreur chargement employés:', error)
    } else {
      setEmployes((data as Employe[]) || [])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }

  // Calculer totalPages à partir du count serveur
  const totalPages = useMemo(
    () => Math.ceil(totalCount / itemsPerPage),
    [totalCount, itemsPerPage]
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Employés"
        description="Gérez les employés de votre holding"
        breadcrumbs={[{ label: 'Employés' }]}
        action={{
          label: 'Nouvel employé',
          href: '/employes/nouveau',
          icon: Plus,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-phi-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-phi-primary" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Employés</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Dans toutes les filiales</p>
            </div>
            <div className="p-3 bg-phi-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-phi-primary" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Actifs</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.actifs}</p>
              <p className="text-sm text-green-600 mt-1">
                {stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0}% de l'effectif
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">En congé</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.enConge}</p>
              <p className="text-sm text-gray-500 mt-1">Absences temporaires</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Rechercher par nom, matricule, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-11 h-11 bg-gray-50 border-gray-200 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filiale Filter */}
            <select
              value={filterFiliale}
              onChange={(e) => {
                setFilterFiliale(e.target.value)
                setCurrentPage(1)
              }}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors"
            >
              <option value="all">Toutes les filiales</option>
              {filiales.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
              <Filter className="h-4 w-4 text-gray-400 ml-2" />
              {(['all', 'actif', 'en_conge', 'suspendu'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-phi-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {status === 'all' ? 'Tous' : status === 'en_conge' ? 'En congé' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-phi-primary shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-phi-primary shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {employes.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title={searchQuery || filterStatus !== 'all' || filterFiliale !== 'all' ? 'Aucun résultat' : 'Aucun employé'}
          description={
            searchQuery || filterStatus !== 'all' || filterFiliale !== 'all'
              ? 'Modifiez vos critères de recherche'
              : 'Commencez par ajouter votre premier employé'
          }
          action={
            !searchQuery && filterStatus === 'all' && filterFiliale === 'all'
              ? { label: 'Ajouter un employé', href: '/employes/nouveau' }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employes.map((employe, index) => (
            <EmployeeGridCard key={employe.id} employe={employe} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Employé</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Matricule</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Filiale</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Poste</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {employes.map((employe, index) => (
                <EmployeeTableRow key={employe.id} employe={employe} index={index} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Affichage de <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
            <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> sur{' '}
            <span className="font-medium text-gray-900">{totalCount}</span> résultats
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {useMemo(
              () => Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-phi-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              }),
              [totalPages, currentPage]
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
