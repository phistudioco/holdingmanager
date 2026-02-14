import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import {
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  ArrowRight,
  Loader2,
} from 'lucide-react'

// Dynamic import pour le composant des graphiques financiers (économie de ~100-150KB)
const FinanceDashboardCharts = dynamic(
  () => import('@/components/finance/FinanceDashboardCharts').then(mod => ({ default: mod.FinanceDashboardCharts })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default async function FinancePage() {
  const supabase = await createClient()

  // Récupérer les statistiques
  const [
    { count: clientsCount },
    { count: facturesCount },
    { count: contratsCount },
    { data: facturesImpayees },
    { data: recentFactures },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('factures').select('*', { count: 'exact', head: true }),
    supabase.from('contrats').select('*', { count: 'exact', head: true }),
    supabase
      .from('factures')
      .select('total_ttc')
      .in('statut', ['envoyee', 'partiellement_payee']),
    supabase
      .from('factures')
      .select('id, numero, client_id, total_ttc, statut, date_echeance')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('id, nom, code, type, statut')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalImpaye = (facturesImpayees as { total_ttc: number }[] | null)?.reduce((sum, f) => sum + (f.total_ttc || 0), 0) || 0

  // Type assertions for data (using unknown to bypass never type)
  type FactureRow = { id: number; numero: string; client_id: number; total_ttc: number; statut: string; date_echeance: string }
  type ClientRow = { id: number; nom: string; code: string; type: string; statut: string }
  const typedRecentFactures = recentFactures as unknown as FactureRow[] | null
  const typedRecentClients = recentClients as unknown as ClientRow[] | null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      envoyee: 'bg-blue-100 text-blue-700',
      partiellement_payee: 'bg-yellow-100 text-yellow-700',
      payee: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoyee: 'Envoyée',
      partiellement_payee: 'Partiel',
      payee: 'Payée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance"
        description="Gestion financière de votre holding"
        actionLabel="Nouvelle facture"
        actionHref="/finance/factures/nouveau"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Clients"
          value={clientsCount || 0}
          icon={Users}
          href="/finance/clients"
          trend="Voir tous"
          trendUp={true}
        />
        <StatsCard
          title="Factures"
          value={facturesCount || 0}
          icon={FileText}
          href="/finance/factures"
          trend="Voir toutes"
          trendUp={true}
        />
        <StatsCard
          title="Contrats"
          value={contratsCount || 0}
          icon={Briefcase}
          href="/finance/contrats"
          trend="Voir tous"
          trendUp={true}
        />
        <div className="bg-gradient-to-br from-phi-accent to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">En attente de paiement</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalImpaye)}</p>
              <div className="flex items-center gap-1 mt-2">
                {totalImpaye > 0 ? (
                  <TrendingDown className="h-4 w-4 text-white/80" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-white/80" />
                )}
                <span className="text-xs text-white/80">À recouvrer</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Euro className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Factures récentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-phi-primary" />
              Factures récentes
            </h2>
            <Link
              href="/finance/factures"
              className="text-sm text-phi-accent hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {typedRecentFactures && typedRecentFactures.length > 0 ? (
              typedRecentFactures.map((facture) => (
                <Link
                  key={facture.id}
                  href={`/finance/factures/${facture.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{facture.numero}</p>
                    <p className="text-sm text-gray-500">
                      Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(facture.total_ttc)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(facture.statut)}`}
                    >
                      {getStatutLabel(facture.statut)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune facture</p>
                <Link
                  href="/finance/factures/nouveau"
                  className="text-phi-accent hover:underline text-sm"
                >
                  Créer une facture
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Clients récents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-phi-accent" />
              Clients récents
            </h2>
            <Link
              href="/finance/clients"
              className="text-sm text-phi-accent hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {typedRecentClients && typedRecentClients.length > 0 ? (
              typedRecentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/finance/clients/${client.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        client.type === 'entreprise' ? 'bg-phi-primary' : 'bg-phi-accent'
                      }`}
                    >
                      {client.nom[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.nom}</p>
                      <p className="text-sm text-gray-500">{client.code}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      client.statut === 'actif'
                        ? 'bg-green-100 text-green-700'
                        : client.statut === 'prospect'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {client.statut === 'actif' ? 'Actif' : client.statut === 'prospect' ? 'Prospect' : client.statut}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun client</p>
                <Link
                  href="/finance/clients/nouveau"
                  className="text-phi-accent hover:underline text-sm"
                >
                  Ajouter un client
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertes financières */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-phi-highlight" />
            Alertes financières
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-100">
            <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-yellow-800">Factures en attente</p>
              <p className="text-xs text-yellow-600 mt-1">
                {facturesImpayees?.length || 0} facture(s) non réglée(s)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-green-800">Paiements à jour</p>
              <p className="text-xs text-green-600 mt-1">Tous les contrats sont actifs</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-blue-800">Tendance positive</p>
              <p className="text-xs text-blue-600 mt-1">+12% vs mois précédent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques financiers */}
      <FinanceDashboardCharts />
    </div>
  )
}
