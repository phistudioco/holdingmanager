import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Monitor,
  Users,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

interface Demande {
  id: number
  numero: string
  titre: string
  service_type: 'robotique' | 'digital' | 'outsourcing'
  statut: string
  urgence: string
  created_at: string
  client: {
    id: number
    nom: string
  }
  assignee: {
    id: number
    nom: string
    prenom: string
  } | null
}

const serviceConfig = {
  robotique: {
    label: 'Robotique',
    color: 'bg-robotique text-white',
    icon: Zap,
  },
  digital: {
    label: 'Digital',
    color: 'bg-digital text-black',
    icon: Monitor,
  },
  outsourcing: {
    label: 'Outsourcing',
    color: 'bg-phi-primary text-white',
    icon: Users,
  },
}

const statutConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  nouvelle: { label: 'Nouvelle', variant: 'default' },
  en_cours: { label: 'En cours', variant: 'secondary' },
  en_attente: { label: 'En attente', variant: 'outline' },
  terminee: { label: 'Terminée', variant: 'default' },
  annulee: { label: 'Annulée', variant: 'destructive' },
}

const urgenceConfig: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'text-gray-500' },
  normale: { label: 'Normale', color: 'text-blue-500' },
  haute: { label: 'Haute', color: 'text-orange-500' },
  urgente: { label: 'Urgente', color: 'text-red-500' },
}

async function DemandesContent() {
  const supabase = await createClient()

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Récupérer les demandes
  const { data: demandes } = await supabase
    .from('demandes_clients')
    .select(`
      id,
      numero,
      titre,
      service_type,
      statut,
      urgence,
      created_at,
      client:clients(id, nom),
      assignee:employes(id, nom, prenom)
    `)
    .order('created_at', { ascending: false })

  const allDemandes = (demandes || []) as unknown as Demande[]

  // Calculer les stats
  const stats = {
    total: allDemandes.length,
    nouvelles: allDemandes.filter(d => d.statut === 'nouvelle').length,
    en_cours: allDemandes.filter(d => d.statut === 'en_cours').length,
    terminees: allDemandes.filter(d => d.statut === 'terminee').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes Clients"
        description="Gérez les demandes soumises via le portail client"
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total demandes"
          value={stats.total}
          icon={FileText}
        />
        <StatsCard
          title="Nouvelles"
          value={stats.nouvelles}
          icon={AlertCircle}
          trend={stats.nouvelles > 0 ? `${stats.nouvelles} à traiter` : undefined}
          trendUp={false}
        />
        <StatsCard
          title="En cours"
          value={stats.en_cours}
          icon={Clock}
        />
        <StatsCard
          title="Terminées"
          value={stats.terminees}
          icon={CheckCircle2}
        />
      </div>

      {/* Liste des demandes par urgence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes urgentes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Demandes urgentes
                </CardTitle>
                <CardDescription>Nécessitent une attention immédiate</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allDemandes
                .filter(d => d.urgence === 'urgente' || d.urgence === 'haute')
                .filter(d => d.statut !== 'terminee' && d.statut !== 'annulee')
                .slice(0, 5)
                .map((demande) => {
                  const service = serviceConfig[demande.service_type]
                  const ServiceIcon = service.icon

                  return (
                    <Link
                      key={demande.id}
                      href={`/demandes/${demande.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
                        <ServiceIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {demande.numero}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {urgenceConfig[demande.urgence]?.label || demande.urgence}
                          </Badge>
                        </div>
                        <p className="font-medium truncate">{demande.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {demande.client?.nom} • {formatDistanceToNow(new Date(demande.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )
                })}

              {allDemandes.filter(d => (d.urgence === 'urgente' || d.urgence === 'haute') && d.statut !== 'terminee' && d.statut !== 'annulee').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune demande urgente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nouvelles demandes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Nouvelles demandes
                </CardTitle>
                <CardDescription>En attente de prise en charge</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allDemandes
                .filter(d => d.statut === 'nouvelle')
                .slice(0, 5)
                .map((demande) => {
                  const service = serviceConfig[demande.service_type]
                  const ServiceIcon = service.icon
                  const urgence = urgenceConfig[demande.urgence]

                  return (
                    <Link
                      key={demande.id}
                      href={`/demandes/${demande.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
                        <ServiceIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {demande.numero}
                          </span>
                          <span className={`text-xs ${urgence?.color || ''}`}>
                            • {urgence?.label || demande.urgence}
                          </span>
                        </div>
                        <p className="font-medium truncate">{demande.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {demande.client?.nom} • {formatDistanceToNow(new Date(demande.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )
                })}

              {allDemandes.filter(d => d.statut === 'nouvelle').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune nouvelle demande
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toutes les demandes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Toutes les demandes</CardTitle>
              <CardDescription>Liste complète des demandes clients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Numéro</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Titre</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Assigné</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {allDemandes.map((demande) => {
                  const service = serviceConfig[demande.service_type]
                  const statut = statutConfig[demande.statut] || { label: demande.statut, variant: 'outline' as const }
                  const ServiceIcon = service.icon

                  return (
                    <tr key={demande.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/demandes/${demande.id}`} className="font-mono text-sm text-phi-primary hover:underline">
                          {demande.numero}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/demandes/${demande.id}`} className="font-medium hover:underline">
                          {demande.titre}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {demande.client?.nom || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded ${service.color} flex items-center justify-center`}>
                            <ServiceIcon className="h-3 w-3" />
                          </div>
                          <span className="text-sm">{service.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statut.variant}>{statut.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {demande.assignee
                          ? `${demande.assignee.prenom} ${demande.assignee.nom}`
                          : <span className="text-muted-foreground">Non assigné</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(demande.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {allDemandes.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune demande client pour le moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DemandesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-6 h-24" />
          ))}
        </div>
      </div>
    }>
      <DemandesContent />
    </Suspense>
  )
}
