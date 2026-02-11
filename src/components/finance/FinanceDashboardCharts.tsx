'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { BarComparisonChart } from '@/components/charts/BarComparisonChart'
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  Building2,
} from 'lucide-react'

type MonthlyData = {
  mois: string
  revenus: number
  depenses: number
}

type CategoryData = {
  name: string
  value: number
  color: string
}

type FilialeData = {
  filiale: string
  revenus: number
  depenses: number
}

const CATEGORY_COLORS: Record<string, string> = {
  // Revenus
  facturation: '#10b981',
  prestation: '#059669',
  vente: '#34d399',
  subvention: '#6ee7b7',
  autre_revenu: '#a7f3d0',
  // Dépenses
  salaires: '#ef4444',
  loyer: '#dc2626',
  fournitures: '#f87171',
  equipements: '#fca5a5',
  services: '#fecaca',
  marketing: '#fb923c',
  deplacements: '#fdba74',
  autre_depense: '#fed7aa',
}

const CATEGORY_LABELS: Record<string, string> = {
  facturation: 'Facturation',
  prestation: 'Prestations',
  vente: 'Ventes',
  subvention: 'Subventions',
  autre_revenu: 'Autres revenus',
  salaires: 'Salaires',
  loyer: 'Loyer',
  fournitures: 'Fournitures',
  equipements: 'Équipements',
  services: 'Services',
  marketing: 'Marketing',
  deplacements: 'Déplacements',
  autre_depense: 'Autres dépenses',
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

type TransactionRow = {
  id: number
  type: 'revenu' | 'depense'
  categorie: string
  montant: number
  date_transaction: string
  filiale: { nom: string } | null
}

type FilialeRow = {
  id: number
  nom: string
}

export function FinanceDashboardCharts() {
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [revenueCategories, setRevenueCategories] = useState<CategoryData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([])
  const [filialeData, setFilialeData] = useState<FilialeData[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchChartData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch all transactions for the selected year
      const startDate = `${selectedYear}-01-01`
      const endDate = `${selectedYear}-12-31`

      const [transactionsRes, filialesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, filiale:filiale_id(nom)')
          .gte('date_transaction', startDate)
          .lte('date_transaction', endDate)
          .eq('statut', 'validee'),
        supabase.from('filiales').select('id, nom').eq('statut', 'actif'),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactions = (transactionsRes as any).data as TransactionRow[] | null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filiales = (filialesRes as any).data as FilialeRow[] | null

      if (!transactions) {
        setLoading(false)
        return
      }

      // Process monthly data
      const monthlyMap = new Map<number, { revenus: number; depenses: number }>()
      for (let i = 0; i < 12; i++) {
        monthlyMap.set(i, { revenus: 0, depenses: 0 })
      }

      // Process category data
      const revenueCategoryMap = new Map<string, number>()
      const expenseCategoryMap = new Map<string, number>()

      // Process filiale data
      const filialeMap = new Map<string, { revenus: number; depenses: number }>()
      filiales?.forEach((f) => {
        filialeMap.set(f.nom, { revenus: 0, depenses: 0 })
      })

      transactions.forEach((t) => {
        const month = new Date(t.date_transaction).getMonth()
        const monthData = monthlyMap.get(month)!
        const filialeName = (t.filiale as { nom: string } | null)?.nom || 'Autre'

        if (t.type === 'revenu') {
          monthData.revenus += t.montant
          revenueCategoryMap.set(t.categorie, (revenueCategoryMap.get(t.categorie) || 0) + t.montant)

          const filialeEntry = filialeMap.get(filialeName)
          if (filialeEntry) {
            filialeEntry.revenus += t.montant
          }
        } else {
          monthData.depenses += t.montant
          expenseCategoryMap.set(t.categorie, (expenseCategoryMap.get(t.categorie) || 0) + t.montant)

          const filialeEntry = filialeMap.get(filialeName)
          if (filialeEntry) {
            filialeEntry.depenses += t.montant
          }
        }
      })

      // Convert to arrays
      const monthlyArr: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        mois: MONTHS[month],
        revenus: data.revenus,
        depenses: data.depenses,
      }))

      const revenueCatArr: CategoryData[] = Array.from(revenueCategoryMap.entries())
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: CATEGORY_LABELS[name] || name,
          value,
          color: CATEGORY_COLORS[name] || '#6b7280',
        }))
        .sort((a, b) => b.value - a.value)

      const expenseCatArr: CategoryData[] = Array.from(expenseCategoryMap.entries())
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: CATEGORY_LABELS[name] || name,
          value,
          color: CATEGORY_COLORS[name] || '#6b7280',
        }))
        .sort((a, b) => b.value - a.value)

      const filialeArr: FilialeData[] = Array.from(filialeMap.entries())
        .filter(([_, data]) => data.revenus > 0 || data.depenses > 0)
        .map(([filiale, data]) => ({
          filiale,
          revenus: data.revenus,
          depenses: data.depenses,
        }))
        .sort((a, b) => (b.revenus - b.depenses) - (a.revenus - a.depenses))

      setMonthlyData(monthlyArr)
      setRevenueCategories(revenueCatArr)
      setExpenseCategories(expenseCatArr)
      setFilialeData(filialeArr)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchChartData()
  }, [fetchChartData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalRevenus = monthlyData.reduce((sum, m) => sum + m.revenus, 0)
  const totalDepenses = monthlyData.reduce((sum, m) => sum + m.depenses, 0)
  const soldeNet = totalRevenus - totalDepenses

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasData = monthlyData.some(m => m.revenus > 0 || m.depenses > 0)

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur d'année */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={fetchChartData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Revenus: {formatCurrency(totalRevenus)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Dépenses: {formatCurrency(totalDepenses)}</span>
          </div>
          <div className={`font-semibold ${soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Solde: {soldeNet >= 0 ? '+' : ''}{formatCurrency(soldeNet)}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Aucune transaction validée n&apos;a été trouvée pour {selectedYear}.
            Commencez par ajouter des transactions pour voir les graphiques.
          </p>
        </div>
      ) : (
        <>
          {/* Graphique évolution mensuelle */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-phi-primary" />
              <h3 className="font-heading font-semibold text-gray-900">
                Évolution mensuelle {selectedYear}
              </h3>
            </div>
            <div className="p-6">
              <RevenueChart data={monthlyData} />
            </div>
          </div>

          {/* Graphiques par catégorie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-green-500" />
                <h3 className="font-heading font-semibold text-gray-900">
                  Répartition des revenus
                </h3>
              </div>
              <div className="p-6">
                {revenueCategories.length > 0 ? (
                  <CategoryPieChart data={revenueCategories} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Aucun revenu enregistré
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-red-500" />
                <h3 className="font-heading font-semibold text-gray-900">
                  Répartition des dépenses
                </h3>
              </div>
              <div className="p-6">
                {expenseCategories.length > 0 ? (
                  <CategoryPieChart data={expenseCategories} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Aucune dépense enregistrée
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graphique par filiale */}
          {filialeData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-phi-accent" />
                <h3 className="font-heading font-semibold text-gray-900">
                  Performance par filiale
                </h3>
              </div>
              <div className="p-6">
                <BarComparisonChart data={filialeData} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
