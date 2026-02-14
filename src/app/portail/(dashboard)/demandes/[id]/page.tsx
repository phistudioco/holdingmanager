'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Zap,
  Monitor,
  Users,
  Calendar,
  Clock,
  Send,
  Paperclip,
  Download,
  User,
  Building2,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  date_souhaitee: string | null
  estimation_heures: number | null
  estimation_cout: number | null
  date_debut_prevue: string | null
  date_fin_prevue: string | null
  note_satisfaction: number | null
  commentaire_satisfaction: string | null
  created_at: string
  updated_at: string
  assignee: {
    id: number
    nom: string
    prenom: string
  } | null
}

interface Message {
  id: number
  auteur_type: 'client' | 'employe'
  message: string
  created_at: string
  auteur_nom?: string
}

interface Fichier {
  id: number
  nom_fichier: string
  type_fichier: string
  taille: number
  url_stockage: string
  created_at: string
}

interface Historique {
  id: number
  action: string
  ancien_valeur: string | null
  nouvelle_valeur: string | null
  description: string | null
  auteur_type: string
  created_at: string
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

const statutConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  nouvelle: { label: 'Nouvelle', variant: 'default', color: 'bg-blue-500' },
  en_cours: { label: 'En cours', variant: 'secondary', color: 'bg-amber-500' },
  en_attente: { label: 'En attente', variant: 'outline', color: 'bg-gray-400' },
  terminee: { label: 'Terminée', variant: 'default', color: 'bg-green-500' },
  annulee: { label: 'Annulée', variant: 'destructive', color: 'bg-red-500' },
}

const urgenceConfig: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'text-gray-500 bg-gray-100' },
  normale: { label: 'Normale', color: 'text-blue-600 bg-blue-100' },
  haute: { label: 'Haute', color: 'text-orange-600 bg-orange-100' },
  urgente: { label: 'Urgente', color: 'text-red-600 bg-red-100' },
}

export default function DemandeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const demandeId = params.id as string

  const [demande, setDemande] = useState<Demande | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [fichiers, setFichiers] = useState<Fichier[]>([])
  const [historique, setHistorique] = useState<Historique[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [clientId, setClientId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'messages' | 'fichiers' | 'historique'>('messages')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portail/login')
        return
      }

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('portail_user_id', user.id)
        .single()

      if (!client) {
        router.push('/portail/login')
        return
      }

      setClientId(client.id)

      // Récupérer la demande
      const { data: demandeData, error } = await supabase
        .from('demandes_clients')
        .select(`
          *,
          assignee:employes(id, nom, prenom)
        `)
        .eq('id', demandeId)
        .eq('client_id', client.id)
        .single()

      if (error || !demandeData) {
        router.push('/portail/demandes')
        return
      }

      setDemande(demandeData as unknown as Demande)

      // Récupérer les messages (non internes uniquement)
      const { data: messagesData } = await supabase
        .from('demandes_messages')
        .select('*')
        .eq('demande_id', demandeId)
        .eq('est_interne', false)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData as Message[])
      }

      // Récupérer les fichiers
      const { data: fichiersData } = await supabase
        .from('demandes_fichiers')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: false })

      if (fichiersData) {
        setFichiers(fichiersData as Fichier[])
      }

      // Récupérer l'historique
      const { data: historiqueData } = await supabase
        .from('demandes_historique')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: false })

      if (historiqueData) {
        setHistorique(historiqueData as Historique[])
      }

      setLoading(false)
    }

    fetchData()
  }, [demandeId, router])

  const sendMessage = async () => {
    if (!newMessage.trim() || !clientId) return

    setSendingMessage(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('demandes_messages')
        .insert({
          demande_id: parseInt(demandeId),
          auteur_type: 'client',
          auteur_id: clientId,
          message: newMessage,
          est_interne: false,
        })
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data as Message])
      setNewMessage('')

      // Ajouter à l'historique
      await supabase.from('demandes_historique').insert({
        demande_id: parseInt(demandeId),
        action: 'message',
        description: 'Nouveau message du client',
        auteur_type: 'client',
        auteur_id: clientId,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSendingMessage(false)
    }
  }

  const downloadFile = async (fichier: Fichier) => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('demandes-fichiers')
      .createSignedUrl(fichier.url_stockage, 3600)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }

  if (!demande) {
    return null
  }

  const service = serviceConfig[demande.service_type]
  const statut = statutConfig[demande.statut] || { label: demande.statut, variant: 'outline' as const, color: 'bg-gray-400' }
  const urgence = urgenceConfig[demande.urgence] || { label: demande.urgence, color: 'text-gray-500 bg-gray-100' }
  const ServiceIcon = service.icon

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/portail/demandes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux demandes
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
              <ServiceIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-sm text-muted-foreground">
                {demande.numero}
              </span>
              <h1 className="text-xl font-heading font-bold text-gray-900">
                {demande.titre}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statut.variant}>{statut.label}</Badge>
          <Badge variant="outline" className={urgence.color}>
            {urgence.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{demande.description}</p>
            </CardContent>
          </Card>

          {/* Onglets */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex gap-4 border-b -mx-6 px-6">
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'messages'
                      ? 'border-phi-primary text-phi-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Messages ({messages.length})
                </button>
                <button
                  onClick={() => setActiveTab('fichiers')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'fichiers'
                      ? 'border-phi-primary text-phi-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Paperclip className="h-4 w-4 inline mr-2" />
                  Fichiers ({fichiers.length})
                </button>
                <button
                  onClick={() => setActiveTab('historique')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'historique'
                      ? 'border-phi-primary text-phi-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Clock className="h-4 w-4 inline mr-2" />
                  Historique
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Messages */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun message pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.auteur_type === 'client' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              msg.auteur_type === 'client'
                                ? 'bg-phi-primary/10'
                                : 'bg-gray-100'
                            }`}
                          >
                            {msg.auteur_type === 'client' ? (
                              <User className="h-4 w-4 text-phi-primary" />
                            ) : (
                              <Building2 className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.auteur_type === 'client'
                                ? 'bg-phi-primary text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.auteur_type === 'client'
                                  ? 'text-white/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Nouveau message */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-phi-primary hover:bg-phi-primary/90"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fichiers */}
              {activeTab === 'fichiers' && (
                <div className="space-y-2">
                  {fichiers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun fichier attaché</p>
                    </div>
                  ) : (
                    fichiers.map((fichier) => (
                      <div
                        key={fichier.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {fichier.nom_fichier}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fichier.taille / 1024 / 1024).toFixed(2)} Mo
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(fichier)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Historique */}
              {activeTab === 'historique' && (
                <div className="space-y-4">
                  {historique.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun historique</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                      {historique.map((event) => (
                        <div key={event.id} className="relative flex gap-4 pb-6">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              event.action === 'creation'
                                ? 'bg-green-100'
                                : event.action === 'changement_statut'
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            {event.action === 'creation' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : event.action === 'changement_statut' ? (
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {event.description ||
                                (event.action === 'creation'
                                  ? 'Demande créée'
                                  : event.action === 'changement_statut'
                                  ? `Statut: ${event.ancien_valeur} → ${event.nouvelle_valeur}`
                                  : event.action)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'dd MMMM yyyy à HH:mm', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Créée le</p>
                  <p className="text-sm font-medium">
                    {format(new Date(demande.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>

              {demande.date_souhaitee && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date souhaitée</p>
                    <p className="text-sm font-medium">
                      {format(new Date(demande.date_souhaitee), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {demande.assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigné à</p>
                    <p className="text-sm font-medium">
                      {demande.assignee.prenom} {demande.assignee.nom}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estimation (si disponible) */}
          {(demande.estimation_heures || demande.estimation_cout) && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Estimation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demande.estimation_heures && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Heures estimées</span>
                    <span className="font-medium">{demande.estimation_heures}h</span>
                  </div>
                )}
                {demande.estimation_cout && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coût estimé</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(demande.estimation_cout)}
                    </span>
                  </div>
                )}
                {demande.date_debut_prevue && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Début prévu</span>
                    <span className="font-medium">
                      {format(new Date(demande.date_debut_prevue), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
                {demande.date_fin_prevue && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fin prévue</span>
                    <span className="font-medium">
                      {format(new Date(demande.date_fin_prevue), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          <Card className="border-0 shadow-sm bg-phi-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-phi-primary" />
                <p className="text-sm font-medium mb-1">Besoin d'aide ?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Notre équipe est là pour vous
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@phistudios.com">Nous contacter</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
