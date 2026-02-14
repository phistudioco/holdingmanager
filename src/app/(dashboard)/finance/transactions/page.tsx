'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ExportButton } from '@/components/common/ExportButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { exportTransactions } from '@/lib/export/excel'
import { useDebounce } from '@/lib/hooks/useDebounce'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Transaction = Tables<'transactions'> & {
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
  facture?: { numero: string } | null
}

type TransactionStats = {
  type: string
  montant: number
  statut: string
}

const ITEMS_PER_PAGE = 15

const categories = {
  revenu: [
    { label: 'Facturation', value: 'facturation' },
    { label: 'Prestation', value: 'prestation' },
    { label: 'Vente', value: 'vente' },
    { label: 'Subvention', value: 'subvention' },
    { label: 'Autre revenu', value: 'autre_revenu' },
  ],
  depense: [
    { label: 'Salaires', value: 'salaires' },
    { label: 'Loyer', value: 'loyer' },
    { label: 'Fournitures', value: 'fournitures' },
    { label: 'Équipements', value: 'equipements' },
    { label: 'Services', value: 'services' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Déplacements', value: 'deplacements' },
    { label: 'Autre dépense', value: 'autre_depense' },
  ],
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategorie, setFilterCategorie] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    totalRevenus: 0,
    totalDepenses: 0,
    solde: 0,
    transactionsCount: 0,
  })

  // Debounce de la recherche pour éviter les requêtes trop fréquentes
  const debouncedSearch = useDebounce(search, 300)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('transactions')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom), facture:facture_id(numero)', { count: 'exact' })

    if (debouncedSearch) {
      query = query.or(`description.ilike.%${debouncedSearch}%,reference.ilike.%${debouncedSearch}%`)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }
    if (filterCategorie !== 'all') {
      query = query.eq('categorie', filterCategorie)
    }

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, count, error } = await query
      .order('date_transaction', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setTransactions(data as Transaction[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [debouncedSearch, filterType, filterCategorie, page])

  const fetchStats = useCallback(async () => {
    const supabase = createClient()

    // Performance: Limiter à 10000 transactions pour les statistiques
    // Au-delà de ce volume, les stats sont calculées sur un échantillon représentatif
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('type, montant, statut')
      .eq('statut', 'validee')
      .order('date_transaction', { ascending: false })
      .limit(10000)

    const allTransactions = (transactionsData || []) as TransactionStats[]

    if (allTransactions.length > 0) {
      const totalRevenus = allTransactions
        .filter(t => t.type === 'revenu')
        .reduce((sum, t) => sum + (t.montant || 0), 0)

      const totalDepenses = allTransactions
        .filter(t => t.type === 'depense')
        .reduce((sum, t) => sum + (t.montant || 0), 0)

      setStats({
        totalRevenus,
        totalDepenses,
        solde: totalRevenus - totalDepenses,
        transactionsCount: allTransactions.length,
      })
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleExport = async () => {
    const supabase = createClient()

    let query = supabase
      .from('transactions')
      .select('*, client:client_id(nom, code), filiale:filiale_id(nom), facture:facture_id(numero)')

    if (debouncedSearch) {
      query = query.or(`description.ilike.%${debouncedSearch}%,reference.ilike.%${debouncedSearch}%`)
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType)
    }
    if (filterCategorie !== 'all') {
      query = query.eq('categorie', filterCategorie)
    }

    // Performance: Limiter l'export à 5000 transactions maximum
    // Pour des exports plus larges, utiliser une solution d'export par lots
    const { data } = await query
      .order('date_transaction', { ascending: false })
      .limit(5000)

    if (data && data.length > 0) {
      exportTransactions(data as Transaction[])
    }
  }

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

  const getCategorieLabel = (type: string, categorie: string) => {
    const cats = type === 'revenu' ? categories.revenu : categories.depense
    const found = cats.find(c => c.value === categorie)
    return found?.label || categorie
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      en_attente: 'bg-yellow-100 text-yellow-700',
      validee: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      validee: 'Validée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Suivez vos revenus et dépenses"
        actionLabel="Nouvelle transaction"
        actionHref="/finance/transactions/nouveau"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Transactions' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total revenus"
          value={formatCurrency(stats.totalRevenus)}
          icon={TrendingUp}
          trend="Validés"
          trendUp={true}
        />
        <StatsCard
          title="Total dépenses"
          value={formatCurrency(stats.totalDepenses)}
          icon={TrendingDown}
          trend="Validées"
          trendUp={false}
        />
        <div className={`rounded-2xl p-6 text-white shadow-lg ${stats.solde >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
            {stats.solde >= 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>
          <p className="text-sm opacity-80 mb-1">Solde net</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.solde)}</p>
        </div>
        <StatsCard
          title="Transactions"
          value={stats.transactionsCount}
          icon={Receipt}
          trend="Total validées"
          trendUp={true}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une transaction..."
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
                  setFilterCategorie('all')
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Tous types</option>
                <option value="revenu">Revenus</option>
                <option value="depense">Dépenses</option>
              </select>
              <select
                value={filterCategorie}
                onChange={(e) => {
                  setFilterCategorie(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
              >
                <option value="all">Toutes catégories</option>
                {filterType === 'all' || filterType === 'revenu' ? (
                  <optgroup label="Revenus">
                    {categories.revenu.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                ) : null}
                {filterType === 'all' || filterType === 'depense' ? (
                  <optgroup label="Dépenses">
                    {categories.depense.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </div>
          </div>
          <ExportButton
            onExport={handleExport}
            disabled={totalCount === 0}
          />
        </div>
      </div>

      {/* Liste des transactions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune transaction trouvée"
          description={search || filterType !== 'all' || filterCategorie !== 'all'
            ? "Aucune transaction ne correspond à vos critères"
            : "Enregistrez votre première transaction"
          }
          actionLabel="Nouvelle transaction"
          actionHref="/finance/transactions/nouveau"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">Catégorie</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      transaction.type === 'revenu'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type === 'revenu' ? (
                        <ArrowUpCircle className="h-4 w-4" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4" />
                      )}
                      {transaction.type === 'revenu' ? 'Revenu' : 'Dépense'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{transaction.description || 'Sans description'}</p>
                    {transaction.reference && (
                      <p className="text-sm text-gray-500">Réf: {transaction.reference}</p>
                    )}
                    {transaction.facture && (
                      <Link href={`/finance/factures/${transaction.facture_id}`} className="text-sm text-phi-primary hover:underline">
                        Facture: {transaction.facture.numero}
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-700">
                      {getCategorieLabel(transaction.type, transaction.categorie)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{formatDate(transaction.date_transaction)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${
                      transaction.type === 'revenu' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'revenu' ? '+' : '-'}{formatCurrency(transaction.montant)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(transaction.statut)}`}>
                      {getStatutLabel(transaction.statut)}
                    </span>
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
            {totalCount} transaction{totalCount > 1 ? 's' : ''} au total
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
