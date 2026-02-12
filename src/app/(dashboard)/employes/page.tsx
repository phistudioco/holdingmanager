'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Mail,
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

  // Charger les données avec pagination côté serveur
  useEffect(() => {
    loadEmployes()
  }, [currentPage, searchQuery, filterStatus, filterFiliale])

  // Charger les filiales et stats une seule fois
  useEffect(() => {
    loadFilialesAndStats()
  }, [])

  const loadFilialesAndStats = async () => {
    const supabase = createClient()

    const [filialesRes, statsRes] = await Promise.all([
      supabase.from('filiales').select('*').order('nom'),
      // Charger les stats séparément (count rapide sans données)
      supabase.from('employes').select('statut', { count: 'exact', head: false }),
    ])

    if (filialesRes.data) setFiliales(filialesRes.data)

    if (statsRes.data) {
      const total = statsRes.count || 0
      const actifs = statsRes.data.filter((e: { statut: string }) => e.statut === 'actif').length
      const enConge = statsRes.data.filter((e: { statut: string }) => e.statut === 'en_conge').length
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

    // Appliquer les filtres côté serveur
    if (searchQuery) {
      query = query.or(
        `nom.ilike.%${searchQuery}%,prenom.ilike.%${searchQuery}%,matricule.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,poste.ilike.%${searchQuery}%`
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
  const totalPages = Math.ceil(totalCount / itemsPerPage)

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
            <Link
              key={employe.id}
              href={`/employes/${employe.id}`}
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-phi-primary/20">
                {/* Service color bar */}
                <div
                  className="h-1.5"
                  style={{ backgroundColor: employe.service?.couleur || '#6b7280' }}
                />

                <div className="p-5">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-phi-primary to-phi-accent rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-phi-primary/20 group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
                      {employe.photo ? (
                        <Image
                          src={employe.photo}
                          alt={`${employe.prenom} ${employe.nom}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <>{employe.prenom[0]}{employe.nom[0]}</>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors truncate">
                        {employe.prenom} {employe.nom}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{employe.poste || 'Poste non défini'}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{employe.filiale?.nom || '—'}</span>
                    </div>
                    {employe.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="truncate">{employe.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {employe.matricule}
                    </code>
                    <StatusBadge status={employe.statut} />
                  </div>
                </div>
              </div>
            </Link>
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
                <tr
                  key={employe.id}
                  className="hover:bg-gray-50/50 transition-colors animate-in fade-in duration-300"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden relative"
                        style={{ backgroundColor: employe.service?.couleur || '#6b7280' }}
                      >
                        {employe.photo ? (
                          <Image
                            src={employe.photo}
                            alt={`${employe.prenom} ${employe.nom}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <>{employe.prenom[0]}{employe.nom[0]}</>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{employe.prenom} {employe.nom}</p>
                        <p className="text-sm text-gray-500">{employe.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden sm:table-cell">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                      {employe.matricule}
                    </code>
                  </td>
                  <td className="py-4 px-6 text-gray-600 hidden md:table-cell">
                    {employe.filiale?.nom || '—'}
                  </td>
                  <td className="py-4 px-6 text-gray-600 hidden lg:table-cell">
                    {employe.poste || '—'}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={employe.statut} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/employes/${employe.id}`}>
                      <Button variant="ghost" size="sm" className="text-phi-primary hover:text-phi-primary/80 hover:bg-phi-primary/5">
                        Voir détails
                      </Button>
                    </Link>
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
            })}
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
