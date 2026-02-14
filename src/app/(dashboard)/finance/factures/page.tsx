'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ExportButton } from '@/components/common/ExportButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FactureTableRow } from '@/components/finance/FactureTableRow'
import { exportFactures } from '@/lib/export/excel'
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Euro,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { downloadFacturePDF } from '@/lib/pdf/facture-pdf'
import type { Tables } from '@/types/database'

type Facture = Tables<'factures'> & {
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
}

type FactureStats = {
  total_ttc: number | null
  montant_paye: number | null
  statut: string
}

const ITEMS_PER_PAGE = 10

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    envoyees: 0,
    payees: 0,
    totalMontant: 0,
    totalImpaye: 0,
  })
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  // Fonction combinée pour charger factures et stats en parallèle
  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Construire la requête de factures
    let facturesQuery = supabase
      .from('factures')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom)', { count: 'exact' })

    if (search) {
      facturesQuery = facturesQuery.or(`numero.ilike.%${search}%,objet.ilike.%${search}%`)
    }
    if (filterStatut !== 'all') {
      facturesQuery = facturesQuery.eq('statut', filterStatut)
    }
    if (filterType !== 'all') {
      facturesQuery = facturesQuery.eq('type', filterType)
    }

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    facturesQuery = facturesQuery
      .order('date_emission', { ascending: false })
      .range(from, to)

    // Construire la requête de stats (head: false car on a besoin des données)
    const statsQuery = supabase
      .from('factures')
      .select('statut, total_ttc, montant_paye', { count: 'exact' })

    try {
      // Exécuter les deux requêtes en parallèle
      const [facturesResult, statsResult] = await Promise.all([
        facturesQuery,
        statsQuery,
      ])

      // Traiter les résultats des factures
      if (!facturesResult.error && facturesResult.data) {
        setFactures(facturesResult.data as Facture[])
        setTotalCount(facturesResult.count || 0)
      }

      // Traiter les résultats des stats
      if (!statsResult.error && statsResult.data) {
        const facturesStats = statsResult.data as FactureStats[]
        const total = statsResult.count || 0

        // Calcul de tous les stats à partir d'une seule requête
        const brouillon = facturesStats.filter(f => f.statut === 'brouillon').length
        const envoyees = facturesStats.filter(f => f.statut === 'envoyee').length
        const payees = facturesStats.filter(f => f.statut === 'payee').length

        const totalMontant = facturesStats.reduce((sum, f) => sum + (f.total_ttc || 0), 0)
        const totalImpaye = facturesStats
          .filter(f => ['envoyee', 'partiellement_payee'].includes(f.statut))
          .reduce((sum, f) => sum + ((f.total_ttc || 0) - (f.montant_paye || 0)), 0)

        setStats({
          total,
          brouillon,
          envoyees,
          payees,
          totalMontant,
          totalImpaye,
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatut, filterType, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    const supabase = createClient()

    let query = supabase
      .from('factures')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom)')

    if (search) {
      query = query.or(`numero.ilike.%${search}%,objet.ilike.%${search}%`)
    }
    if (filterStatut !== 'all') {
      query = query.eq('statut', filterStatut)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }

    const { data } = await query.order('date_emission', { ascending: false })

    if (data && data.length > 0) {
      exportFactures(data as Facture[])
    }
  }

  const totalPages = useMemo(
    () => Math.ceil(totalCount / ITEMS_PER_PAGE),
    [totalCount]
  )

  const formatCurrency = useMemo(
    () => (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount)
    },
    []
  )

  const formatDate = useMemo(
    () => (date: string) => {
      return new Date(date).toLocaleDateString('fr-FR')
    },
    []
  )

  const getStatutColor = useMemo(
    () => (statut: string) => {
      const colors: Record<string, string> = {
        brouillon: 'bg-gray-100 text-gray-700',
        envoyee: 'bg-blue-100 text-blue-700',
        partiellement_payee: 'bg-yellow-100 text-yellow-700',
        payee: 'bg-green-100 text-green-700',
        annulee: 'bg-red-100 text-red-700',
      }
      return colors[statut] || 'bg-gray-100 text-gray-700'
    },
    []
  )

  const getStatutLabel = useMemo(
    () => (statut: string) => {
      const labels: Record<string, string> = {
        brouillon: 'Brouillon',
        envoyee: 'Envoyée',
        partiellement_payee: 'Partiel',
        payee: 'Payée',
        annulee: 'Annulée',
      }
      return labels[statut] || statut
    },
    []
  )

  const isOverdue = useMemo(
    () => (dateEcheance: string, statut: string) => {
      if (['payee', 'annulee'].includes(statut)) return false
      return new Date(dateEcheance) < new Date()
    },
    []
  )

  const handleDownloadPDF = async (factureId: number) => {
    setDownloadingId(factureId)
    try {
      const supabase = createClient()

      // Récupérer la facture complète avec client, filiale et lignes
      const { data: factureDataRaw, error: factureError } = await supabase
        .from('factures')
        .select(`
          *,
          client:client_id(id, nom, code, email, telephone, adresse, ville, code_postal, siret, tva_intracommunautaire),
          filiale:filiale_id(id, nom, code, adresse, ville, code_postal, telephone, email)
        `)
        .eq('id', factureId)
        .single()

      if (factureError || !factureDataRaw) {
        throw new Error('Erreur lors de la récupération de la facture')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const factureData = factureDataRaw as any

      // Récupérer les lignes de facture
      const { data: lignesDataRaw, error: lignesError } = await supabase
        .from('facture_lignes')
        .select('*')
        .eq('facture_id', factureId)
        .order('id')

      if (lignesError) {
        throw new Error('Erreur lors de la récupération des lignes')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lignesData = (lignesDataRaw || []) as any[]

      // Générer le PDF
      await downloadFacturePDF({
        facture: {
          numero: factureData.numero,
          type: factureData.type,
          date_emission: factureData.date_emission,
          date_echeance: factureData.date_echeance,
          objet: factureData.objet,
          total_ht: factureData.total_ht,
          taux_tva: factureData.taux_tva,
          total_tva: factureData.total_tva,
          total_ttc: factureData.total_ttc,
          montant_paye: factureData.montant_paye,
          statut: factureData.statut,
          notes: factureData.notes,
        },
        client: factureData.client || {
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
        filiale: factureData.filiale || {
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
        title="Factures"
        description="Gérez vos factures et suivez les paiements"
        actionLabel="Nouvelle facture"
        actionHref="/finance/factures/nouveau"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Factures' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total factures"
          value={stats.total}
          icon={FileText}
          trend={`${stats.brouillon} brouillons`}
          trendUp={true}
        />
        <StatsCard
          title="Envoyées"
          value={stats.envoyees}
          icon={Clock}
          trend="En attente"
          trendUp={false}
        />
        <StatsCard
          title="Payées"
          value={stats.payees}
          icon={CheckCircle}
          trend={`${Math.round((stats.payees / (stats.total || 1)) * 100)}%`}
          trendUp={true}
        />
        <div className="bg-gradient-to-br from-phi-accent to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Euro className="h-6 w-6" />
            </div>
            <AlertTriangle className={`h-5 w-5 ${stats.totalImpaye > 0 ? 'opacity-100' : 'opacity-40'}`} />
          </div>
          <p className="text-sm opacity-80 mb-1">Montant impayé</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalImpaye)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une facture..."
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
                <option value="envoyee">Envoyées</option>
                <option value="partiellement_payee">Partiellement payées</option>
                <option value="payee">Payées</option>
                <option value="annulee">Annulées</option>
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
                <option value="facture">Factures</option>
                <option value="avoir">Avoirs</option>
                <option value="acompte">Acomptes</option>
                <option value="proforma">Proformas</option>
              </select>
            </div>
          </div>
          <ExportButton
            onExport={handleExport}
            disabled={totalCount === 0}
          />
        </div>
      </div>

      {/* Liste des factures */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
        </div>
      ) : factures.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture trouvée"
          description={search || filterStatut !== 'all' || filterType !== 'all'
            ? "Aucune facture ne correspond à vos critères"
            : "Créez votre première facture"
          }
          actionLabel="Nouvelle facture"
          actionHref="/finance/factures/nouveau"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Facture</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">Dates</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {factures.map((facture) => (
                <FactureTableRow
                  key={facture.id}
                  facture={facture}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  isOverdue={isOverdue}
                  getStatutColor={getStatutColor}
                  getStatutLabel={getStatutLabel}
                  onDownloadPDF={handleDownloadPDF}
                  downloadingId={downloadingId}
                />
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
            {totalCount} facture{totalCount > 1 ? 's' : ''} au total
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
