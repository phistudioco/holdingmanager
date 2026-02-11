'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { Button } from '@/components/ui/button'
import { downloadRapportPDF } from '@/lib/pdf/rapport-pdf'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Loader2,
  Building2,
} from 'lucide-react'

type PeriodeType = 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'

type Filiale = {
  id: number
  code: string
  nom: string
  adresse: string | null
  ville: string | null
  code_postal: string | null
  telephone: string | null
  email: string | null
}

export default function RapportsPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [periodeType, setPeriodeType] = useState<PeriodeType>('mensuel')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [selectedFiliale, setSelectedFiliale] = useState<number | 'all'>('all')
  const [filiales, setFiliales] = useState<Filiale[]>([])
  const [stats, setStats] = useState({
    totalRevenus: 0,
    totalDepenses: 0,
    solde: 0,
    facturesCount: 0,
  })

  // Initialiser les dates par défaut selon le type de période
  useEffect(() => {
    const now = new Date()
    let debut: Date
    let fin: Date

    switch (periodeType) {
      case 'mensuel':
        debut = new Date(now.getFullYear(), now.getMonth(), 1)
        fin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'trimestriel':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        debut = new Date(now.getFullYear(), currentQuarter * 3, 1)
        fin = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0)
        break
      case 'annuel':
        debut = new Date(now.getFullYear(), 0, 1)
        fin = new Date(now.getFullYear(), 11, 31)
        break
      default:
        debut = new Date(now.getFullYear(), now.getMonth(), 1)
        fin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    setDateDebut(debut.toISOString().split('T')[0])
    setDateFin(fin.toISOString().split('T')[0])
  }, [periodeType])

  // Charger les filiales
  useEffect(() => {
    const fetchFiliales = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('filiales')
        .select('id, code, nom, adresse, ville, code_postal, telephone, email')
        .eq('statut', 'actif')
        .order('nom')

      if (data) {
        const typedData = data as Filiale[]
        setFiliales(typedData)
        if (typedData.length === 1) {
          setSelectedFiliale(typedData[0].id)
        }
      }
    }
    fetchFiliales()
  }, [])

  // Charger les stats de prévisualisation
  const fetchPreviewStats = useCallback(async () => {
    if (!dateDebut || !dateFin) return

    setLoading(true)
    const supabase = createClient()

    // Transactions dans la période
    let transQuery = supabase
      .from('transactions')
      .select('type, montant')
      .gte('date_transaction', dateDebut)
      .lte('date_transaction', dateFin)
      .eq('statut', 'validee')

    if (selectedFiliale !== 'all') {
      transQuery = transQuery.eq('filiale_id', selectedFiliale)
    }

    const { data: transData } = await transQuery

    // Factures dans la période
    let factQuery = supabase
      .from('factures')
      .select('id', { count: 'exact', head: true })
      .gte('date_emission', dateDebut)
      .lte('date_emission', dateFin)

    if (selectedFiliale !== 'all') {
      factQuery = factQuery.eq('filiale_id', selectedFiliale)
    }

    const { count: factCount } = await factQuery

    // Calculer les totaux
    const transactions = (transData || []) as { type: string; montant: number }[]
    const totalRevenus = transactions
      .filter(t => t.type === 'revenu')
      .reduce((sum, t) => sum + (t.montant || 0), 0)
    const totalDepenses = transactions
      .filter(t => t.type === 'depense')
      .reduce((sum, t) => sum + (t.montant || 0), 0)

    setStats({
      totalRevenus,
      totalDepenses,
      solde: totalRevenus - totalDepenses,
      facturesCount: factCount || 0,
    })

    setLoading(false)
  }, [dateDebut, dateFin, selectedFiliale])

  useEffect(() => {
    fetchPreviewStats()
  }, [fetchPreviewStats])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleGeneratePDF = async () => {
    if (!dateDebut || !dateFin) return

    setGenerating(true)
    const supabase = createClient()

    try {
      // Récupérer la filiale
      let filialeData: Filiale
      if (selectedFiliale === 'all') {
        // Utiliser une filiale par défaut (la première) ou créer une entrée "Toutes filiales"
        filialeData = filiales[0] || {
          id: 0,
          code: 'ALL',
          nom: 'Toutes les filiales',
          adresse: null,
          ville: null,
          code_postal: null,
          telephone: null,
          email: null,
        }
      } else {
        filialeData = filiales.find(f => f.id === selectedFiliale) || filiales[0]
      }

      // Transactions par catégorie
      let transQuery = supabase
        .from('transactions')
        .select('type, categorie, montant')
        .gte('date_transaction', dateDebut)
        .lte('date_transaction', dateFin)
        .eq('statut', 'validee')

      if (selectedFiliale !== 'all') {
        transQuery = transQuery.eq('filiale_id', selectedFiliale)
      }

      const { data: transData } = await transQuery

      // Grouper par catégorie
      const transactions = (transData || []) as { type: string; categorie: string; montant: number }[]
      const categoriesMap = new Map<string, { type: 'revenu' | 'depense'; total: number; count: number }>()

      transactions.forEach(t => {
        const key = `${t.type}-${t.categorie}`
        const existing = categoriesMap.get(key)
        if (existing) {
          existing.total += t.montant || 0
          existing.count++
        } else {
          categoriesMap.set(key, {
            type: t.type as 'revenu' | 'depense',
            total: t.montant || 0,
            count: 1,
          })
        }
      })

      const transactionsParCategorie = Array.from(categoriesMap.entries()).map(([key, value]) => ({
        categorie: key.split('-')[1],
        type: value.type,
        total: value.total,
        count: value.count,
      }))

      // Factures par statut
      let factQuery = supabase
        .from('factures')
        .select('statut, total_ttc')
        .gte('date_emission', dateDebut)
        .lte('date_emission', dateFin)

      if (selectedFiliale !== 'all') {
        factQuery = factQuery.eq('filiale_id', selectedFiliale)
      }

      const { data: factData } = await factQuery
      const factures = (factData || []) as { statut: string; total_ttc: number }[]

      const statutsMap = new Map<string, { count: number; total: number }>()
      factures.forEach(f => {
        const existing = statutsMap.get(f.statut)
        if (existing) {
          existing.count++
          existing.total += f.total_ttc || 0
        } else {
          statutsMap.set(f.statut, { count: 1, total: f.total_ttc || 0 })
        }
      })

      const facturesParStatut = Array.from(statutsMap.entries()).map(([statut, value]) => ({
        statut,
        count: value.count,
        total: value.total,
      }))

      // Top clients
      let clientsQuery = supabase
        .from('factures')
        .select('client_id, total_ttc, client:client_id(nom, code)')
        .gte('date_emission', dateDebut)
        .lte('date_emission', dateFin)

      if (selectedFiliale !== 'all') {
        clientsQuery = clientsQuery.eq('filiale_id', selectedFiliale)
      }

      const { data: clientsData } = await clientsQuery
      const clientsFactures = (clientsData || []) as { client_id: number; total_ttc: number; client: { nom: string; code: string } | null }[]

      const clientsMap = new Map<number, { nom: string; code: string; totalFactures: number; totalMontant: number }>()
      clientsFactures.forEach(f => {
        if (f.client) {
          const existing = clientsMap.get(f.client_id)
          if (existing) {
            existing.totalFactures++
            existing.totalMontant += f.total_ttc || 0
          } else {
            clientsMap.set(f.client_id, {
              nom: f.client.nom,
              code: f.client.code,
              totalFactures: 1,
              totalMontant: f.total_ttc || 0,
            })
          }
        }
      })

      const topClients = Array.from(clientsMap.values())
        .sort((a, b) => b.totalMontant - a.totalMontant)
        .slice(0, 10)

      // Calculer les totaux
      const totalRevenus = transactions
        .filter(t => t.type === 'revenu')
        .reduce((sum, t) => sum + (t.montant || 0), 0)
      const totalDepenses = transactions
        .filter(t => t.type === 'depense')
        .reduce((sum, t) => sum + (t.montant || 0), 0)

      const facturesPayees = factures.filter(f => f.statut === 'payee').length
      const facturesEnAttente = factures.filter(f => ['envoyee', 'partiellement_payee'].includes(f.statut)).length
      const montantImpaye = factures
        .filter(f => ['envoyee', 'partiellement_payee'].includes(f.statut))
        .reduce((sum, f) => sum + (f.total_ttc || 0), 0)

      // Générer le PDF
      await downloadRapportPDF({
        rapport: {
          periode: {
            debut: dateDebut,
            fin: dateFin,
            type: periodeType,
          },
          totaux: {
            revenus: totalRevenus,
            depenses: totalDepenses,
            solde: totalRevenus - totalDepenses,
            facturesEmises: factures.length,
            facturesPayees,
            facturesEnAttente,
            montantImpaye,
          },
          transactionsParCategorie,
          facturesParStatut,
          topClients,
        },
        filiale: filialeData,
      })
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports Financiers"
        description="Générez des rapports PDF de vos données financières"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Rapports' },
        ]}
      />

      {/* Configuration du rapport */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-phi-primary" />
          Configuration du rapport
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Type de période */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de période
            </label>
            <select
              value={periodeType}
              onChange={(e) => setPeriodeType(e.target.value as PeriodeType)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
            >
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
              <option value="personnalise">Personnalisé</option>
            </select>
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              disabled={periodeType !== 'personnalise'}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              disabled={periodeType !== 'personnalise'}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Filiale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filiale
            </label>
            <select
              value={selectedFiliale}
              onChange={(e) => setSelectedFiliale(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
            >
              <option value="all">Toutes les filiales</option>
              {filiales.map((filiale) => (
                <option key={filiale.id} value={filiale.id}>
                  {filiale.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prévisualisation des stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenus"
          value={loading ? '...' : formatCurrency(stats.totalRevenus)}
          icon={TrendingUp}
          trend="Période sélectionnée"
          trendUp={true}
        />
        <StatsCard
          title="Dépenses"
          value={loading ? '...' : formatCurrency(stats.totalDepenses)}
          icon={TrendingDown}
          trend="Période sélectionnée"
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
          <p className="text-2xl font-bold">
            {loading ? '...' : formatCurrency(stats.solde)}
          </p>
        </div>
        <StatsCard
          title="Factures"
          value={loading ? '...' : stats.facturesCount.toString()}
          icon={FileText}
          trend="Émises sur la période"
          trendUp={true}
        />
      </div>

      {/* Bouton de génération */}
      <div className="bg-gradient-to-br from-phi-primary to-phi-primary/80 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Générer le rapport PDF</h3>
              <p className="text-white/80 text-sm mt-1">
                Le rapport inclura toutes les données financières de la période sélectionnée
              </p>
            </div>
          </div>
          <Button
            onClick={handleGeneratePDF}
            disabled={generating || !dateDebut || !dateFin}
            className="bg-white text-phi-primary hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Télécharger le rapport
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Informations sur le contenu du rapport */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contenu du rapport
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <div className="p-2 bg-phi-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-phi-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Synthèse financière</p>
              <p className="text-sm text-gray-500 mt-1">
                Revenus, dépenses et solde net
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <div className="p-2 bg-phi-accent/10 rounded-lg">
              <FileText className="h-5 w-5 text-phi-accent" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Détail des factures</p>
              <p className="text-sm text-gray-500 mt-1">
                Répartition par statut
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <div className="p-2 bg-phi-highlight/20 rounded-lg">
              <Building2 className="h-5 w-5 text-phi-highlight" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Catégories</p>
              <p className="text-sm text-gray-500 mt-1">
                Transactions par type
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Top clients</p>
              <p className="text-sm text-gray-500 mt-1">
                Classement par chiffre d&apos;affaires
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
