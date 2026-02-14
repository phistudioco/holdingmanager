'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilialeCard } from '@/components/filiales/FilialeCard'
import {
  Building2,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  TrendingUp,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Filiale = Tables<'filiales'>

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'actif' | 'inactif' | 'en_creation'

export default function FilialesPage() {
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  useEffect(() => {
    loadFiliales()
  }, [])

  const loadFiliales = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('filiales')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFiliales(data)
    }
    setLoading(false)
  }

  // Filtrage
  const filteredFiliales = useMemo(() =>
    filiales.filter(filiale => {
      const matchesSearch =
        filiale.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        filiale.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        filiale.ville?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus === 'all' || filiale.statut === filterStatus

      return matchesSearch && matchesStatus
    }),
    [filiales, searchQuery, filterStatus]
  )

  // Pagination
  const totalPages = useMemo(
    () => Math.ceil(filteredFiliales.length / itemsPerPage),
    [filteredFiliales.length, itemsPerPage]
  )

  const paginatedFiliales = useMemo(
    () => filteredFiliales.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredFiliales, currentPage, itemsPerPage]
  )

  // Stats
  const stats = useMemo(() => ({
    total: filiales.length,
    actives: filiales.filter(f => f.statut === 'actif').length,
    villes: new Set(filiales.map(f => f.ville).filter(Boolean)).size,
  }), [filiales])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        title="Filiales"
        description="Gérez les filiales de votre holding PHI Studios"
        breadcrumbs={[{ label: 'Filiales' }]}
        action={{
          label: 'Nouvelle filiale',
          href: '/filiales/nouveau',
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
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Filiales</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Entités enregistrées</p>
            </div>
            <div className="p-3 bg-phi-primary/10 rounded-xl">
              <Building2 className="h-6 w-6 text-phi-primary" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Actives</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.actives}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.total > 0 ? Math.round((stats.actives / stats.total) * 100) : 0}% du total
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-phi-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-phi-accent" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Villes</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 font-heading">{stats.villes}</p>
              <p className="text-sm text-gray-500 mt-1">Présence géographique</p>
            </div>
            <div className="p-3 bg-phi-accent/10 rounded-xl">
              <MapPin className="h-6 w-6 text-phi-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Rechercher par nom, code ou ville..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-11 h-11 bg-gray-50 border-gray-200 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              <Filter className="h-4 w-4 text-gray-400 ml-2" />
              {(['all', 'actif', 'inactif', 'en_creation'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filterStatus === status
                      ? 'bg-white text-phi-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {status === 'all' ? 'Tous' : status === 'en_creation' ? 'En création' : status.charAt(0).toUpperCase() + status.slice(1)}
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
      {filteredFiliales.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery || filterStatus !== 'all' ? 'Aucun résultat' : 'Aucune filiale'}
          description={
            searchQuery || filterStatus !== 'all'
              ? 'Modifiez vos critères de recherche'
              : 'Commencez par créer votre première filiale'
          }
          action={
            !searchQuery && filterStatus === 'all'
              ? { label: 'Créer une filiale', href: '/filiales/nouveau' }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedFiliales.map((filiale, index) => (
            <div
              key={filiale.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FilialeCard filiale={filiale} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Filiale</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Code</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Ville</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Directeur</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedFiliales.map((filiale, index) => (
                  <tr
                    key={filiale.id}
                    className="hover:bg-gray-50/50 transition-colors animate-in fade-in duration-300"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-phi-primary/10 rounded-xl flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-phi-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{filiale.nom}</p>
                          <p className="text-sm text-gray-500">{filiale.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                        {filiale.code}
                      </code>
                    </td>
                    <td className="py-4 px-6 text-gray-600 hidden md:table-cell">
                      {filiale.ville || '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-600 hidden lg:table-cell">
                      {filiale.directeur_nom || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={filiale.statut} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/filiales/${filiale.id}`}>
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
            <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredFiliales.length)}</span> sur{' '}
            <span className="font-medium text-gray-900">{filteredFiliales.length}</span> résultats
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
              () => Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
              )),
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
