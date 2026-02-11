'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { downloadDevisPDF } from '@/lib/pdf/devis-pdf'
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader2,
  Send,
  FileCheck,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Devis = Tables<'devis'> & {
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
}

const ITEMS_PER_PAGE = 15

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    envoyes: 0,
    acceptes: 0,
    totalMontant: 0,
  })

  const fetchDevis = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('devis')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom)', { count: 'exact' })

    if (search) {
      query = query.or(`numero.ilike.%${search}%,objet.ilike.%${search}%`)
    }
    if (filterStatut !== 'all') {
      query = query.eq('statut', filterStatut)
    }

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setDevis(data as Devis[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [search, filterStatut, page])

  const fetchStats = useCallback(async () => {
    const supabase = createClient()

    const { data: allDevis } = await supabase
      .from('devis')
      .select('statut, total_ttc')

    if (allDevis) {
      const typedDevis = allDevis as { statut: string; total_ttc: number }[]
      setStats({
        total: typedDevis.length,
        brouillon: typedDevis.filter(d => d.statut === 'brouillon').length,
        envoyes: typedDevis.filter(d => d.statut === 'envoye').length,
        acceptes: typedDevis.filter(d => d.statut === 'accepte').length,
        totalMontant: typedDevis
          .filter(d => d.statut === 'accepte')
          .reduce((sum, d) => sum + (d.total_ttc || 0), 0),
      })
    }
  }, [])

  useEffect(() => {
    fetchDevis()
  }, [fetchDevis])

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      envoye: 'bg-blue-100 text-blue-700',
      accepte: 'bg-green-100 text-green-700',
      refuse: 'bg-red-100 text-red-700',
      expire: 'bg-orange-100 text-orange-700',
      converti: 'bg-purple-100 text-purple-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoye: 'Envoyé',
      accepte: 'Accepté',
      refuse: 'Refusé',
      expire: 'Expiré',
      converti: 'Converti',
    }
    return labels[statut] || statut
  }

  const isExpired = (dateValidite: string, statut: string) => {
    if (['accepte', 'refuse', 'expire', 'converti'].includes(statut)) return false
    return new Date(dateValidite) < new Date()
  }

  const handleDownloadPDF = async (devisId: number) => {
    setDownloadingId(devisId)
    try {
      const supabase = createClient()

      const { data: devisDataRaw, error: devisError } = await supabase
        .from('devis')
        .select(`
          *,
          client:client_id(id, nom, code, email, telephone, adresse, ville, code_postal, siret, tva_intracommunautaire),
          filiale:filiale_id(id, nom, code, adresse, ville, code_postal, telephone, email)
        `)
        .eq('id', devisId)
        .single()

      if (devisError || !devisDataRaw) {
        throw new Error('Erreur lors de la récupération du devis')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const devisData = devisDataRaw as any

      const { data: lignesDataRaw, error: lignesError } = await supabase
        .from('devis_lignes')
        .select('*')
        .eq('devis_id', devisId)
        .order('ordre')

      if (lignesError) {
        throw new Error('Erreur lors de la récupération des lignes')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lignesData = (lignesDataRaw || []) as any[]

      await downloadDevisPDF({
        devis: {
          numero: devisData.numero,
          date_emission: devisData.date_emission,
          date_validite: devisData.date_validite,
          objet: devisData.objet,
          total_ht: devisData.total_ht,
          taux_tva: devisData.taux_tva,
          total_tva: devisData.total_tva,
          total_ttc: devisData.total_ttc,
          statut: devisData.statut,
          notes: devisData.notes,
          conditions: devisData.conditions,
        },
        client: devisData.client || {
          nom: 'Client inconnu',
          code: '',
          email: null,
          telephone: null,
          adresse: null,
          ville: null,
          code_postal: null,
          siret: null,
          tva_intracommunautaire: null,
        },
        filiale: devisData.filiale || {
          nom: 'PHI Studios',
          code: '',
          adresse: null,
          ville: null,
          code_postal: null,
          telephone: null,
          email: null,
        },
        lignes: lignesData.map(ligne => ({
          description: ligne.description,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          taux_tva: ligne.taux_tva,
          montant_ht: ligne.montant_ht,
          montant_ttc: ligne.montant_ttc,
        })),
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        description="Gérez vos devis et propositions commerciales"
        actionLabel="Nouveau devis"
        actionHref="/finance/devis/nouveau"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Devis' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total devis"
          value={stats.total}
          icon={FileText}
          trend="Tous statuts"
          trendUp={true}
        />
        <StatsCard
          title="En attente"
          value={stats.envoyes}
          icon={Send}
          trend="Envoyés"
          trendUp={true}
        />
        <StatsCard
          title="Acceptés"
          value={stats.acceptes}
          icon={CheckCircle}
          trend="Validés par le client"
          trendUp={true}
        />
        <div className="bg-gradient-to-br from-phi-highlight to-yellow-500 rounded-2xl p-6 text-gray-900 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/30 rounded-xl">
              <FileCheck className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-80 mb-1">Montant accepté</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalMontant)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un devis..."
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
                <option value="all">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
                <option value="expire">Expiré</option>
                <option value="converti">Converti</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
        </div>
      ) : devis.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis trouvé"
          description={search || filterStatut !== 'all'
            ? "Aucun devis ne correspond à vos critères"
            : "Créez votre premier devis"
          }
          actionLabel="Nouveau devis"
          actionHref="/finance/devis/nouveau"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Numéro</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">Objet</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Validité</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Montant TTC</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devis.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/finance/devis/${d.id}`} className="font-medium text-phi-primary hover:underline">
                        {d.numero}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{d.client?.nom || 'Client inconnu'}</p>
                        <p className="text-sm text-gray-500">{d.client?.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700 truncate max-w-xs">
                        {d.objet || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${isExpired(d.date_validite, d.statut) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(d.date_validite)}
                        </span>
                        {isExpired(d.date_validite, d.statut) && (
                          <Clock className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(d.total_ttc)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(d.statut)}`}>
                        {getStatutLabel(d.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/finance/devis/${d.id}`}>
                          <Button variant="ghost" size="sm">
                            Voir
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-phi-highlight"
                          onClick={() => handleDownloadPDF(d.id)}
                          disabled={downloadingId === d.id}
                        >
                          {downloadingId === d.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
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
            {totalCount} devis au total
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
