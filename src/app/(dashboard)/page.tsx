import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/common/StatsCard'
import { PageHeader } from '@/components/common/PageHeader'
import {
  Building2,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

// Forcer le rendu dynamique pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()

  // Récupérer les statistiques avec gestion des erreurs
  const [filialesResult, employesResult, facturesResult, facturesEnAttenteResult] = await Promise.all([
    supabase.from('filiales').select('*', { count: 'exact', head: true }),
    supabase.from('employes').select('*', { count: 'exact', head: true }),
    supabase.from('factures').select('*', { count: 'exact', head: true }),
    supabase
      .from('factures')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['brouillon', 'envoyee']),
  ])

  // Extraire les counts avec valeur par défaut en cas d'erreur
  const filialesCount = filialesResult.error ? 0 : (filialesResult.count ?? 0)
  const employesCount = employesResult.error ? 0 : (employesResult.count ?? 0)
  const facturesCount = facturesResult.error ? 0 : (facturesResult.count ?? 0)
  const facturesEnAttenteCount = facturesEnAttenteResult.error ? 0 : (facturesEnAttenteResult.count ?? 0)

  const stats = [
    {
      title: 'Filiales',
      value: filialesCount,
      icon: Building2,
      href: '/filiales',
      trend: filialesCount === 0 ? 'Aucune filiale' : `${filialesCount} enregistrée${filialesCount > 1 ? 's' : ''}`,
      trendUp: filialesCount > 0,
    },
    {
      title: 'Employés',
      value: employesCount,
      icon: Users,
      href: '/employes',
      trend: employesCount === 0 ? 'Aucun employé' : `${employesCount} actif${employesCount > 1 ? 's' : ''}`,
      trendUp: employesCount > 0,
    },
    {
      title: 'Factures',
      value: facturesCount,
      icon: Receipt,
      href: '/finance/factures',
      trend: facturesEnAttenteCount > 0 ? `${facturesEnAttenteCount} en attente` : 'Aucune en attente',
      trendUp: false,
    },
    {
      title: 'Chiffre d\'affaires',
      value: '—',
      icon: TrendingUp,
      href: '/finance',
      trend: 'Voir le détail',
      trendUp: false,
    },
  ]

  const quickActions = [
    { label: 'Nouvelle facture', href: '/finance/factures/nouveau', icon: Receipt },
    { label: 'Nouvel employé', href: '/employes/nouveau', icon: Users },
    { label: 'Nouvelle demande', href: '/workflows/nouveau', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre holding PHI Studios"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="p-2 bg-phi-primary/10 rounded-lg">
                  <action.icon className="h-5 w-5 text-phi-primary" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Alertes récentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Alertes récentes</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-yellow-800">Facture en retard</p>
                <p className="text-xs text-yellow-600 mt-1">FAC-2024-001 - Échéance dépassée de 5 jours</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-green-800">Contrat renouvelé</p>
                <p className="text-xs text-green-600 mt-1">TechCorp - Maintenance annuelle</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-800">Workflow en attente</p>
                <p className="text-xs text-blue-600 mt-1">3 demandes d'approbation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services PHI Studios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Services PHI Studios</h2>
          <div className="space-y-4">
            <a
              href="/services/robotique"
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-robotique/30 hover:border-robotique transition-colors"
            >
              <div className="w-12 h-12 bg-robotique/10 rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-robotique rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-robotique">Robotique</p>
                <p className="text-xs text-gray-500">Automatisation intelligente</p>
              </div>
            </a>
            <a
              href="/services/digital"
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-digital/30 hover:border-digital transition-colors"
            >
              <div className="w-12 h-12 bg-digital/10 rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-digital rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-digital">Digital</p>
                <p className="text-xs text-gray-500">Solutions logicielles</p>
              </div>
            </a>
            <a
              href="/services/outsourcing"
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-phi-primary/30 hover:border-phi-primary transition-colors"
            >
              <div className="w-12 h-12 bg-phi-primary/10 rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-phi-primary rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-phi-primary">Out Sourcing</p>
                <p className="text-xs text-gray-500">Services externalisés</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
