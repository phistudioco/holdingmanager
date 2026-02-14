'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Edit,
  UserPlus,
  Calculator,
  Lock,
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
  client_id: number
  assignee_id: number | null
  client: {
    id: number
    nom: string
    email: string
  }
  assignee: {
    id: number
    nom: string
    prenom: string
  } | null
}

interface Message {
  id: number
  auteur_type: 'client' | 'employe'
  auteur_id: number
  message: string
  est_interne: boolean
  created_at: string
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

interface Employe {
  id: number
  nom: string
  prenom: string
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

const statuts = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
]

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

export default function DemandeGestionPage() {
  const params = useParams()
  const router = useRouter()
  const demandeId = params.id as string

  const [demande, setDemande] = useState<Demande | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [fichiers, setFichiers] = useState<Fichier[]>([])
  const [historique, setHistorique] = useState<Historique[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Message state
  const [newMessage, setNewMessage] = useState('')
  const [isInternalMessage, setIsInternalMessage] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Estimation dialog state
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false)
  const [estimationHeures, setEstimationHeures] = useState('')
  const [estimationCout, setEstimationCout] = useState('')
  const [dateDebutPrevue, setDateDebutPrevue] = useState('')
  const [dateFinPrevue, setDateFinPrevue] = useState('')

  const [activeTab, setActiveTab] = useState<'messages' | 'fichiers' | 'historique'>('messages')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const db = createClient() // For new portal tables

      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Récupérer l'ID de l'employé actuel
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (currentUser && user.email) {
        // Récupérer l'employé lié
        const { data: employe } = await supabase
          .from('employes')
          .select('id')
          .eq('email', user.email)
          .single()

        if (employe) {
          setCurrentUserId((employe as { id: number }).id)
        }
      }

      // Récupérer la demande
      const { data: demandeData, error } = await db
        .from('demandes_clients')
        .select(`
          *,
          client:clients(id, nom, email),
          assignee:employes(id, nom, prenom)
        `)
        .eq('id', demandeId)
        .single()

      if (error || !demandeData) {
        router.push('/demandes')
        return
      }

      const typedDemandeData = demandeData as unknown as Demande
      setDemande(typedDemandeData)

      // Pré-remplir les champs d'estimation
      if (typedDemandeData.estimation_heures) setEstimationHeures(typedDemandeData.estimation_heures.toString())
      if (typedDemandeData.estimation_cout) setEstimationCout(typedDemandeData.estimation_cout.toString())
      if (typedDemandeData.date_debut_prevue) setDateDebutPrevue(typedDemandeData.date_debut_prevue)
      if (typedDemandeData.date_fin_prevue) setDateFinPrevue(typedDemandeData.date_fin_prevue)

      // Récupérer tous les messages (y compris internes)
      const { data: messagesData } = await db
        .from('demandes_messages')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData as Message[])
      }

      // Récupérer les fichiers
      const { data: fichiersData } = await db
        .from('demandes_fichiers')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: false })

      if (fichiersData) {
        setFichiers(fichiersData as Fichier[])
      }

      // Récupérer l'historique
      const { data: historiqueData } = await db
        .from('demandes_historique')
        .select('*')
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: false })

      if (historiqueData) {
        setHistorique(historiqueData as Historique[])
      }

      // Récupérer la liste des employés pour l'assignation
      const { data: employesData } = await supabase
        .from('employes')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom')

      if (employesData) {
        setEmployes(employesData as Employe[])
      }

      setLoading(false)
    }

    fetchData()
  }, [demandeId, router])

  const updateDemande = async (updates: Partial<Demande>) => {
    if (!demande) return

    setSaving(true)
    try {
      const db = createClient()

      const { error } = await db
        .from('demandes_clients')
        .update(updates)
        .eq('id', demande.id)

      if (error) throw error

      setDemande({ ...demande, ...updates })

      // Rafraîchir l'historique
      const { data: newHistorique } = await db
        .from('demandes_historique')
        .select('*')
        .eq('demande_id', demande.id)
        .order('created_at', { ascending: false })

      if (newHistorique) {
        setHistorique(newHistorique as Historique[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const saveEstimation = async () => {
    await updateDemande({
      estimation_heures: estimationHeures ? parseFloat(estimationHeures) : null,
      estimation_cout: estimationCout ? parseFloat(estimationCout) : null,
      date_debut_prevue: dateDebutPrevue || null,
      date_fin_prevue: dateFinPrevue || null,
    })
    setEstimationDialogOpen(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !demande) return

    setSendingMessage(true)

    try {
      const db = createClient()

      const { data, error } = await db
        .from('demandes_messages')
        .insert({
          demande_id: demande.id,
          auteur_type: 'employe',
          auteur_id: currentUserId,
          message: newMessage,
          est_interne: isInternalMessage,
        })
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data as Message])
      setNewMessage('')
      setIsInternalMessage(false)

      // Ajouter à l'historique
      await db.from('demandes_historique').insert({
        demande_id: demande.id,
        action: 'message',
        description: isInternalMessage ? 'Note interne ajoutée' : 'Réponse envoyée au client',
        auteur_type: 'employe',
        auteur_id: currentUserId,
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link
            href="/demandes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux demandes
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-12 w-12 rounded-lg ${service.color} flex items-center justify-center shrink-0`}>
              <ServiceIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {demande.numero}
                </span>
                <Badge variant={statut.variant}>{statut.label}</Badge>
                <Badge variant="outline" className={urgence.color}>
                  {urgence.label}
                </Badge>
              </div>
              <h1 className="text-xl font-heading font-bold text-gray-900">
                {demande.titre}
              </h1>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Dialog open={estimationDialogOpen} onOpenChange={setEstimationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Estimation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Estimation du projet</DialogTitle>
                <DialogDescription>
                  Définissez l'estimation de temps et de coût pour cette demande
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heures">Heures estimées</Label>
                    <Input
                      id="heures"
                      type="number"
                      step="0.5"
                      value={estimationHeures}
                      onChange={(e) => setEstimationHeures(e.target.value)}
                      placeholder="Ex: 40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cout">Coût estimé (€)</Label>
                    <Input
                      id="cout"
                      type="number"
                      step="0.01"
                      value={estimationCout}
                      onChange={(e) => setEstimationCout(e.target.value)}
                      placeholder="Ex: 5000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">Date de début prévue</Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={dateDebutPrevue}
                      onChange={(e) => setDateDebutPrevue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFin">Date de fin prévue</Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={dateFinPrevue}
                      onChange={(e) => setDateFinPrevue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEstimationDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={saveEstimation} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{demande.description}</p>
            </CardContent>
          </Card>

          {/* Onglets */}
          <Card>
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
                            msg.auteur_type === 'employe' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              msg.auteur_type === 'employe'
                                ? msg.est_interne ? 'bg-amber-100' : 'bg-phi-primary/10'
                                : 'bg-gray-100'
                            }`}
                          >
                            {msg.auteur_type === 'employe' ? (
                              msg.est_interne ? (
                                <Lock className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Building2 className="h-4 w-4 text-phi-primary" />
                              )
                            ) : (
                              <User className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.auteur_type === 'employe'
                                ? msg.est_interne
                                  ? 'bg-amber-50 border border-amber-200'
                                  : 'bg-phi-primary text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            {msg.est_interne && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
                                <Lock className="h-3 w-3" />
                                Note interne
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.auteur_type === 'employe' && !msg.est_interne
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="interne"
                        checked={isInternalMessage}
                        onCheckedChange={(checked) => setIsInternalMessage(checked as boolean)}
                      />
                      <Label htmlFor="interne" className="text-sm flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Note interne (invisible pour le client)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isInternalMessage ? 'Ajoutez une note interne...' : 'Répondez au client...'}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className={isInternalMessage ? 'bg-amber-500 hover:bg-amber-600' : 'bg-phi-primary hover:bg-phi-primary/90'}
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                                : event.action === 'assignation'
                                ? 'bg-purple-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            {event.action === 'creation' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : event.action === 'changement_statut' ? (
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                            ) : event.action === 'assignation' ? (
                              <UserPlus className="h-4 w-4 text-purple-600" />
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
                                  : event.action === 'assignation'
                                  ? `Assignation modifiée`
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
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statut */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={demande.statut}
                  onValueChange={(value) => updateDemande({ statut: value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuts.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignation */}
              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Select
                  value={demande.assignee_id?.toString() || 'none'}
                  onValueChange={(value) => updateDemande({ assignee_id: value === 'none' ? null : parseInt(value) })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {employes.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.prenom} {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{demande.client?.nom}</p>
                  <p className="text-sm text-muted-foreground">{demande.client?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/finance/clients/${demande.client?.id}`}>
                  Voir la fiche client
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Créée le</span>
                <span className="font-medium">
                  {format(new Date(demande.created_at), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              {demande.date_souhaitee && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Souhaitée</span>
                  <span className="font-medium">
                    {format(new Date(demande.date_souhaitee), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {demande.date_debut_prevue && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Début prévu</span>
                  <span className="font-medium">
                    {format(new Date(demande.date_debut_prevue), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {demande.date_fin_prevue && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fin prévue</span>
                  <span className="font-medium">
                    {format(new Date(demande.date_fin_prevue), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estimation */}
          {(demande.estimation_heures || demande.estimation_cout) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estimation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {demande.estimation_heures && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Heures</span>
                    <span className="font-medium">{demande.estimation_heures}h</span>
                  </div>
                )}
                {demande.estimation_cout && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coût</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(demande.estimation_cout)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
