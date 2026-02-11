'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Euro,
  Check,
} from 'lucide-react'

type Alerte = {
  id: number
  type: 'facture_impayee' | 'facture_echeance' | 'contrat_expiration' | 'budget_depasse' | 'workflow' | 'autre'
  severite: 'basse' | 'moyenne' | 'haute' | 'critique'
  titre: string
  message: string
  lue: boolean
  traitee: boolean
  created_at: string
  date_echeance: string | null
  entite_type: string | null
  entite_id: number | null
}

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'toutes' | 'non_lues' | 'critiques'>('toutes')
  const [stats, setStats] = useState({
    total: 0,
    nonLues: 0,
    critiques: 0,
    traitees: 0,
  })

  const fetchAlertes = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('alertes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'non_lues') {
      query = query.eq('lue', false)
    } else if (filter === 'critiques') {
      query = query.in('severite', ['haute', 'critique'])
    }

    const { data, error } = await query

    if (!error && data) {
      setAlertes(data as Alerte[])
    }

    // Fetch stats
    const [{ count: total }, { count: nonLues }, { count: critiques }, { count: traitees }] = await Promise.all([
      supabase.from('alertes').select('*', { count: 'exact', head: true }),
      supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('lue', false),
      supabase.from('alertes').select('*', { count: 'exact', head: true }).in('severite', ['haute', 'critique']),
      supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('traitee', true),
    ])

    setStats({
      total: total || 0,
      nonLues: nonLues || 0,
      critiques: critiques || 0,
      traitees: traitees || 0,
    })

    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchAlertes()
  }, [fetchAlertes])

  const markAsRead = async (id: number) => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('alertes').update({ lue: true }).eq('id', id)
    fetchAlertes()
  }

  const markAsHandled = async (id: number) => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('alertes').update({ traitee: true, lue: true }).eq('id', id)
    fetchAlertes()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSeveriteColor = (severite: string) => {
    const colors: Record<string, string> = {
      basse: 'bg-blue-100 text-blue-700 border-blue-200',
      moyenne: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      haute: 'bg-orange-100 text-orange-700 border-orange-200',
      critique: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[severite] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getSeveriteIcon = (severite: string) => {
    const icons: Record<string, React.ReactNode> = {
      basse: <Info className="h-5 w-5 text-blue-500" />,
      moyenne: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      haute: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      critique: <AlertTriangle className="h-5 w-5 text-red-500" />,
    }
    return icons[severite] || <Bell className="h-5 w-5 text-gray-500" />
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      facture_impayee: <Euro className="h-4 w-4" />,
      facture_echeance: <Clock className="h-4 w-4" />,
      contrat_expiration: <Calendar className="h-4 w-4" />,
      budget_depasse: <AlertTriangle className="h-4 w-4" />,
      autre: <FileText className="h-4 w-4" />,
    }
    return icons[type] || <Bell className="h-4 w-4" />
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facture_impayee: 'Facture impayée',
      facture_echeance: 'Échéance facture',
      contrat_expiration: 'Expiration contrat',
      budget_depasse: 'Budget dépassé',
      autre: 'Autre',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes"
        description="Centre de notifications et alertes système"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total alertes"
          value={stats.total}
          icon={Bell}
          trend="Toutes les alertes"
          trendUp={true}
        />
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-80 mb-1">Non lues</p>
          <p className="text-3xl font-bold">{stats.nonLues}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-80 mb-1">Critiques</p>
          <p className="text-3xl font-bold">{stats.critiques}</p>
        </div>
        <StatsCard
          title="Traitées"
          value={stats.traitees}
          icon={CheckCircle}
          trend={`${stats.total > 0 ? Math.round((stats.traitees / stats.total) * 100) : 0}% résolues`}
          trendUp={true}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'toutes', label: 'Toutes' },
            { key: 'non_lues', label: 'Non lues' },
            { key: 'critiques', label: 'Critiques' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-phi-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary" />
        </div>
      ) : alertes.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune alerte"
          description={filter !== 'toutes' ? "Aucune alerte ne correspond aux filtres" : "Vous n'avez aucune alerte"}
        />
      ) : (
        <div className="space-y-4">
          {alertes.map((alerte) => (
            <div
              key={alerte.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                !alerte.lue ? 'border-l-4 border-l-phi-accent' : 'border-gray-100'
              } ${alerte.traitee ? 'opacity-60' : ''}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getSeveriteColor(alerte.severite)}`}>
                      {getSeveriteIcon(alerte.severite)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${!alerte.lue ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alerte.titre}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeveriteColor(alerte.severite)}`}>
                          {alerte.severite}
                        </span>
                        {!alerte.lue && (
                          <span className="px-2 py-0.5 rounded bg-phi-accent/10 text-phi-accent text-xs font-medium">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{alerte.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {getTypeIcon(alerte.type)}
                          {getTypeLabel(alerte.type)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(alerte.created_at)}</span>
                        {alerte.date_echeance && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600">
                              Échéance: {formatDate(alerte.date_echeance)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alerte.lue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alerte.id)}
                        title="Marquer comme lu"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {!alerte.traitee && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsHandled(alerte.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Traiter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
