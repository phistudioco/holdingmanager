'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient, createUntypedClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  ArrowRight,
  Zap,
  Monitor,
  Users,
  FileText,
  Filter,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Demande {
  id: number
  numero: string
  titre: string
  description: string
  service_type: 'robotique' | 'digital' | 'outsourcing'
  statut: string
  urgence: string
  created_at: string
  date_souhaitee: string | null
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

export default function DemandesListePage() {
  const searchParams = useSearchParams()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterService, setFilterService] = useState<string>(searchParams.get('service') || 'all')

  useEffect(() => {
    const fetchDemandes = async () => {
      const supabase = createClient()
      const db = createUntypedClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await db
        .from('clients')
        .select('id')
        .eq('portail_user_id', user.id)
        .single()

      if (!client) return

      let query = db
        .from('demandes_clients')
        .select('id, numero, titre, description, service_type, statut, urgence, created_at, date_souhaitee')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut)
      }

      if (filterService !== 'all') {
        query = query.eq('service_type', filterService)
      }

      if (search) {
        query = query.or(`titre.ilike.%${search}%,numero.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data } = await query

      if (data) {
        setDemandes(data as Demande[])
      }

      setLoading(false)
    }

    fetchDemandes()
  }, [filterStatut, filterService, search])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Mes demandes
          </h1>
          <p className="text-muted-foreground">
            Retrouvez toutes vos demandes et suivez leur avancement
          </p>
        </div>
        <Button asChild className="bg-phi-primary hover:bg-phi-primary/90">
          <Link href="/portail/demandes/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, numéro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous services</SelectItem>
                  <SelectItem value="robotique">Robotique</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="outsourcing">Outsourcing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="nouvelle">Nouvelle</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : demandes.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune demande trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {search || filterStatut !== 'all' || filterService !== 'all'
                  ? 'Aucune demande ne correspond à vos critères de recherche'
                  : 'Vous n\'avez pas encore soumis de demande'}
              </p>
              {!search && filterStatut === 'all' && filterService === 'all' && (
                <Button asChild>
                  <Link href="/portail/demandes/nouveau">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre première demande
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {demandes.map((demande) => {
            const service = serviceConfig[demande.service_type]
            const statut = statutConfig[demande.statut] || { label: demande.statut, variant: 'outline' as const }
            const urgence = urgenceConfig[demande.urgence] || { label: demande.urgence, color: 'text-gray-500' }
            const ServiceIcon = service.icon

            return (
              <Card
                key={demande.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/portail/demandes/${demande.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
                        <ServiceIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            {demande.numero}
                          </span>
                          <Badge variant={statut.variant} className="text-xs">
                            {statut.label}
                          </Badge>
                          <span className={`text-xs ${urgence.color}`}>
                            • {urgence.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-lg mb-1">{demande.titre}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {demande.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Créée {formatDistanceToNow(new Date(demande.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          {demande.date_souhaitee && (
                            <span>
                              • Souhaitée le {format(new Date(demande.date_souhaitee), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
