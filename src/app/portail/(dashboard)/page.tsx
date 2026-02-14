'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Monitor,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DemandeRecente {
  id: number
  numero: string
  titre: string
  service_type: 'robotique' | 'digital' | 'outsourcing'
  statut: string
  created_at: string
}

interface Stats {
  total: number
  en_cours: number
  terminees: number
  nouvelles: number
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

export default function PortailDashboardPage() {
  const [demandes, setDemandes] = useState<DemandeRecente[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, en_cours: 0, terminees: 0, nouvelles: 0 })
  const [loading, setLoading] = useState(true)
  const [clientNom, setClientNom] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const db = createClient()

      // Récupérer l'utilisateur et le client associé
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Table clients pas complètement typée dans database.ts - type assertion temporaire
      const { data: client } = await (db as any)
        .from('clients')
        .select('id, nom')
        .eq('portail_user_id', user.id)
        .single()

      if (!client) return

      setClientNom(client.nom)

      // Récupérer les statistiques
      const { data: allDemandes } = await db
        .from('demandes_clients')
        .select('statut')
        .eq('client_id', client.id)

      if (allDemandes) {
        setStats({
          total: allDemandes.length,
          en_cours: allDemandes.filter((d: { statut: string }) => d.statut === 'en_cours').length,
          terminees: allDemandes.filter((d: { statut: string }) => d.statut === 'terminee').length,
          nouvelles: allDemandes.filter((d: { statut: string }) => d.statut === 'nouvelle').length,
        })
      }

      // Récupérer les demandes récentes
      const { data: recentDemandes } = await db
        .from('demandes_clients')
        .select('id, numero, titre, service_type, statut, created_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentDemandes) {
        setDemandes(recentDemandes as DemandeRecente[])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-6">
              <div className="h-10 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Bienvenue, {clientNom}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos demandes et suivez leur avancement
          </p>
        </div>
        <Button asChild className="bg-phi-primary hover:bg-phi-primary/90">
          <Link href="/portail/demandes/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-phi-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-phi-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total demandes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.en_cours}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.terminees}</p>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.nouvelles}</p>
                <p className="text-sm text-muted-foreground">Nouvelles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(serviceConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Card
              key={key}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <Link href={`/portail/demandes/nouveau?service=${key}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Demande {config.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Créer une nouvelle demande
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-phi-primary transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Demandes récentes */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Demandes récentes</CardTitle>
            <CardDescription>Vos dernières demandes soumises</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/portail/demandes">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {demandes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de demandes
              </p>
              <Button asChild>
                <Link href="/portail/demandes/nouveau">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre première demande
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {demandes.map((demande) => {
                const service = serviceConfig[demande.service_type]
                const statut = statutConfig[demande.statut] || { label: demande.statut, variant: 'outline' as const }
                const ServiceIcon = service.icon

                return (
                  <Link
                    key={demande.id}
                    href={`/portail/demandes/${demande.id}`}
                    className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
                        <ServiceIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {demande.numero}
                          </span>
                          <Badge variant={statut.variant} className="text-xs">
                            {statut.label}
                          </Badge>
                        </div>
                        <p className="font-medium truncate">{demande.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(demande.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
