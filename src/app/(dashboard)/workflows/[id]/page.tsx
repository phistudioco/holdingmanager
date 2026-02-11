'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ApprovalDialog } from '@/components/workflows/ApprovalDialog'
import {
  ArrowLeft,
  GitBranch,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  ShoppingCart,
  GraduationCap,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react'

type WorkflowDemande = {
  id: number
  numero: string
  type: 'achat' | 'conge' | 'formation' | 'autre'
  titre: string
  description: string | null
  statut: 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'
  demandeur_id: number
  filiale_id: number
  montant: number | null
  priorite: 'basse' | 'normale' | 'haute' | 'urgente'
  date_demande: string
  date_soumission: string | null
  date_finalisation: string | null
  donnees: Record<string, unknown>
  created_at: string
  demandeur?: { nom: string; prenom: string; email: string } | null
  filiale?: { nom: string; code: string } | null
}

type WorkflowApprobation = {
  id: number
  demande_id: number
  etape: number
  approbateur_id: number
  statut: 'en_attente' | 'approuve' | 'rejete'
  commentaire: string | null
  date_decision: string | null
  approbateur?: { nom: string; prenom: string } | null
}

export default function WorkflowDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [demande, setDemande] = useState<WorkflowDemande | null>(null)
  const [approbations, setApprobations] = useState<WorkflowApprobation[]>([])
  const [loading, setLoading] = useState(true)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDemande = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [demandeRes, approbationsRes] = await Promise.all([
      supabase
        .from('workflow_demandes')
        .select('*, demandeur:demandeur_id(nom, prenom, email), filiale:filiale_id(nom, code)')
        .eq('id', id)
        .single(),
      supabase
        .from('workflow_approbations')
        .select('*, approbateur:approbateur_id(nom, prenom)')
        .eq('demande_id', id)
        .order('etape', { ascending: true }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const demandeData = (demandeRes as any).data
    if (demandeData) {
      setDemande(demandeData as WorkflowDemande)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approbationsData = (approbationsRes as any).data
    if (approbationsData) {
      setApprobations(approbationsData as WorkflowApprobation[])
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchDemande()
  }, [fetchDemande])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return

    setDeleting(true)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('workflow_demandes')
      .delete()
      .eq('id', id)

    if (!error) {
      router.push('/workflows')
      router.refresh()
    }
    setDeleting(false)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      en_cours: 'bg-amber-100 text-amber-700',
      approuve: 'bg-green-100 text-green-700',
      rejete: 'bg-red-100 text-red-700',
      annule: 'bg-gray-100 text-gray-500',
      en_attente: 'bg-blue-100 text-blue-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      en_cours: 'En cours',
      approuve: 'Approuvé',
      rejete: 'Rejeté',
      annule: 'Annulé',
      en_attente: 'En attente',
    }
    return labels[statut] || statut
  }

  const getPrioriteColor = (priorite: string) => {
    const colors: Record<string, string> = {
      basse: 'bg-blue-100 text-blue-700',
      normale: 'bg-gray-100 text-gray-700',
      haute: 'bg-orange-100 text-orange-700',
      urgente: 'bg-red-100 text-red-700',
    }
    return colors[priorite] || 'bg-gray-100 text-gray-700'
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      achat: <ShoppingCart className="h-5 w-5" />,
      conge: <Calendar className="h-5 w-5" />,
      formation: <GraduationCap className="h-5 w-5" />,
      autre: <GitBranch className="h-5 w-5" />,
    }
    return icons[type] || <GitBranch className="h-5 w-5" />
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      achat: "Demande d'achat",
      conge: 'Demande de congé',
      formation: 'Demande de formation',
      autre: 'Autre demande',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      achat: 'bg-blue-500',
      conge: 'bg-green-500',
      formation: 'bg-purple-500',
      autre: 'bg-gray-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-phi-primary" />
      </div>
    )
  }

  if (!demande) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Demande non trouvée</h2>
        <Link href="/workflows">
          <Button className="mt-4">Retour aux workflows</Button>
        </Link>
      </div>
    )
  }

  const donnees = demande.donnees || {}
  const canApprove = demande.statut === 'en_cours'
  const canEdit = demande.statut === 'brouillon'
  const canDelete = demande.statut === 'brouillon'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux workflows
          </Link>
          <PageHeader
            title={demande.numero}
            description={demande.titre}
          />
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <Link href={`/workflows/${id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setShowApprovalDialog(true)}
              className="gap-2 bg-phi-primary hover:bg-phi-primary/90"
            >
              <CheckCircle className="h-4 w-4" />
              Prendre une décision
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-6 py-4 ${getTypeColor(demande.type)} text-white`}>
              <div className="flex items-center gap-3">
                {getTypeIcon(demande.type)}
                <h3 className="font-heading font-semibold">{getTypeLabel(demande.type)}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(demande.statut)}`}>
                  {getStatutLabel(demande.statut)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioriteColor(demande.priorite)}`}>
                  Priorité {demande.priorite}
                </span>
              </div>

              {demande.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-700">{demande.description}</p>
                </div>
              )}

              {Boolean(donnees.justification) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Justification</h4>
                  <p className="text-gray-700">{String(donnees.justification)}</p>
                </div>
              )}

              {/* Champs spécifiques au type */}
              {demande.type === 'achat' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {Boolean(donnees.fournisseur) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Fournisseur</h4>
                      <p className="text-gray-700">{String(donnees.fournisseur)}</p>
                    </div>
                  )}
                  {demande.montant && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Montant</h4>
                      <p className="text-xl font-bold text-phi-primary">{formatCurrency(demande.montant)}</p>
                    </div>
                  )}
                </div>
              )}

              {demande.type === 'conge' && Boolean(donnees.date_debut) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Date de début</h4>
                    <p className="text-gray-700">{new Date(String(donnees.date_debut)).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {Boolean(donnees.date_fin) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Date de fin</h4>
                      <p className="text-gray-700">{new Date(String(donnees.date_fin)).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              )}

              {demande.type === 'formation' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {Boolean(donnees.formation_titre) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Formation</h4>
                      <p className="text-gray-700">{String(donnees.formation_titre)}</p>
                    </div>
                  )}
                  {Boolean(donnees.formation_organisme) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Organisme</h4>
                      <p className="text-gray-700">{String(donnees.formation_organisme)}</p>
                    </div>
                  )}
                  {Boolean(donnees.date_debut) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Période</h4>
                      <p className="text-gray-700">
                        {new Date(String(donnees.date_debut)).toLocaleDateString('fr-FR')}
                        {Boolean(donnees.date_fin) && ` - ${new Date(String(donnees.date_fin)).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  )}
                  {demande.montant && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Coût</h4>
                      <p className="text-xl font-bold text-phi-primary">{formatCurrency(demande.montant)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Historique des approbations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-phi-primary" />
                Historique des décisions
              </h3>
            </div>
            <div className="p-6">
              {approbations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune décision enregistrée</p>
              ) : (
                <div className="space-y-4">
                  {approbations.map((approbation) => (
                    <div
                      key={approbation.id}
                      className={`p-4 rounded-xl border ${
                        approbation.statut === 'approuve'
                          ? 'bg-green-50 border-green-100'
                          : approbation.statut === 'rejete'
                            ? 'bg-red-50 border-red-100'
                            : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          approbation.statut === 'approuve'
                            ? 'bg-green-100 text-green-600'
                            : approbation.statut === 'rejete'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {approbation.statut === 'approuve' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : approbation.statut === 'rejete' ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              {approbation.approbateur
                                ? `${approbation.approbateur.prenom} ${approbation.approbateur.nom}`
                                : 'Approbateur'}
                            </p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(approbation.statut)}`}>
                              {getStatutLabel(approbation.statut)}
                            </span>
                          </div>
                          {approbation.commentaire && (
                            <p className="text-sm text-gray-600 mt-1">{approbation.commentaire}</p>
                          )}
                          {approbation.date_decision && (
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(approbation.date_decision)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-semibold text-gray-900">Informations</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-phi-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-phi-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Demandeur</p>
                  <p className="font-medium text-gray-900">
                    {demande.demandeur
                      ? `${demande.demandeur.prenom} ${demande.demandeur.nom}`
                      : 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-phi-accent/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-phi-accent" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Filiale</p>
                  <p className="font-medium text-gray-900">
                    {demande.filiale?.nom || 'Non spécifiée'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-phi-highlight/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-phi-highlight" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date de demande</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(demande.date_demande)}
                  </p>
                </div>
              </div>

              {demande.date_soumission && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Soumise le</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(demande.date_soumission)}
                    </p>
                  </div>
                </div>
              )}

              {demande.date_finalisation && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    demande.statut === 'approuve' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {demande.statut === 'approuve' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Finalisée le</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(demande.date_finalisation)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline des étapes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-semibold text-gray-900">Étapes du workflow</h3>
            </div>
            <div className="p-6">
              <div className="relative">
                {/* Ligne verticale */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {/* Étape 1: Création */}
                  <div className="flex items-start gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      demande.statut !== 'brouillon' ? 'bg-green-500 text-white' : 'bg-phi-primary text-white'
                    }`}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Création</p>
                      <p className="text-sm text-gray-500">Demande créée</p>
                    </div>
                  </div>

                  {/* Étape 2: Soumission */}
                  <div className="flex items-start gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      demande.date_soumission
                        ? 'bg-green-500 text-white'
                        : demande.statut === 'brouillon'
                          ? 'bg-gray-300 text-white'
                          : 'bg-amber-500 text-white'
                    }`}>
                      {demande.date_soumission ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Soumission</p>
                      <p className="text-sm text-gray-500">
                        {demande.date_soumission ? 'Demande soumise' : 'En attente de soumission'}
                      </p>
                    </div>
                  </div>

                  {/* Étape 3: Approbation */}
                  <div className="flex items-start gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      demande.statut === 'approuve'
                        ? 'bg-green-500 text-white'
                        : demande.statut === 'rejete'
                          ? 'bg-red-500 text-white'
                          : demande.statut === 'en_cours'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-300 text-white'
                    }`}>
                      {demande.statut === 'approuve' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : demande.statut === 'rejete' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Décision</p>
                      <p className="text-sm text-gray-500">
                        {demande.statut === 'approuve'
                          ? 'Demande approuvée'
                          : demande.statut === 'rejete'
                            ? 'Demande rejetée'
                            : 'En attente de décision'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog d'approbation */}
      {showApprovalDialog && (
        <ApprovalDialog
          demandeId={demande.id}
          etape={1}
          approbateurId={1} // TODO: Utiliser l'utilisateur connecté
          onSuccess={() => {
            setShowApprovalDialog(false)
            fetchDemande()
          }}
          onCancel={() => setShowApprovalDialog(false)}
        />
      )}
    </div>
  )
}
