'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Edit,
  Trash2,
  Building2,
  Calendar,
  Clock,
  Loader2,
  ArrowLeft,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Send,
  Package,
} from 'lucide-react'

type CommandeOutsourcing = {
  id: number
  numero: string
  fournisseur_id: number
  filiale_id: number
  montant_total: number
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
  date_commande: string
  date_livraison_prevue: string | null
  notes: string | null
  created_at: string
  updated_at: string
  fournisseur?: { id: number; nom: string } | null
  filiale?: { id: number; nom: string; code: string } | null
}

const themeColor = '#0f2080'

export default function CommandeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const commandeId = Number(params.id)

  const [commande, setCommande] = useState<CommandeOutsourcing | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCommande = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('commandes_outsourcing')
        .select(`
          *,
          fournisseur:fournisseur_id(id, nom),
          filiale:filiale_id(id, nom, code)
        `)
        .eq('id', commandeId)
        .single()

      if (error) {
        console.error('Erreur:', error)
        setLoading(false)
        return
      }

      setCommande(data as CommandeOutsourcing)
      setLoading(false)
    }

    fetchCommande()
  }, [commandeId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      brouillon: {
        label: 'Brouillon',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <Clock className="h-4 w-4" />,
      },
      envoyee: {
        label: 'Envoyée',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: <Send className="h-4 w-4" />,
      },
      confirmee: {
        label: 'Confirmée',
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      livree: {
        label: 'Livrée',
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: <Package className="h-4 w-4" />,
      },
      annulee: {
        label: 'Annulée',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <XCircle className="h-4 w-4" />,
      },
    }
    return configs[statut] || configs.brouillon
  }

  const handleDelete = async () => {
    if (!commande) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande "${commande.numero}" ?`)) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('commandes_outsourcing')
        .delete()
        .eq('id', commande.id)

      if (error) throw error

      router.push('/services/outsourcing')
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeColor }} />
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Commande non trouvée</h2>
        <p className="text-gray-500 mb-6">Cette commande n&apos;existe pas ou a été supprimée.</p>
        <Link href="/services/outsourcing">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    )
  }

  const statutConfig = getStatutConfig(commande.statut)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Commande ${commande.numero}`}
        description="Détails de la commande"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: commande.numero },
        ]}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/services/outsourcing">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <Link href={`/services/outsourcing/commandes/${commande.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </Link>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Supprimer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-2" style={{ backgroundColor: themeColor }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${themeColor}15` }}
                  >
                    <ShoppingCart className="h-8 w-8" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{commande.numero}</h2>
                    <p className="text-sm text-gray-500">
                      Commandé le {formatDate(commande.date_commande)}
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statutConfig.bg} ${statutConfig.color}`}>
                  {statutConfig.icon}
                  {statutConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de commande
                  </h3>
                  <p className="text-gray-900 font-medium">{formatDate(commande.date_commande)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Livraison prévue
                  </h3>
                  <p className="text-gray-900 font-medium">{formatDate(commande.date_livraison_prevue)}</p>
                </div>
              </div>

              {/* Notes */}
              {commande.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{commande.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Montant */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant total
            </h3>
            <p className="text-3xl font-bold" style={{ color: themeColor }}>
              {formatCurrency(commande.montant_total)}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fournisseur */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Fournisseur
            </h3>
            {commande.fournisseur ? (
              <div>
                <p className="font-semibold text-gray-900">{commande.fournisseur.nom}</p>
                <Link
                  href={`/services/outsourcing/fournisseurs/${commande.fournisseur.id}`}
                  className="text-sm mt-2 inline-block hover:underline"
                  style={{ color: themeColor }}
                >
                  Voir la fiche →
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Non assigné</p>
            )}
          </div>

          {/* Filiale */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filiale
            </h3>
            {commande.filiale ? (
              <div>
                <p className="font-semibold text-gray-900">{commande.filiale.nom}</p>
                <p className="text-sm text-gray-500">{commande.filiale.code}</p>
              </div>
            ) : (
              <p className="text-gray-500">Non assigné</p>
            )}
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Créée le</span>
                <span className="text-gray-900">{formatDate(commande.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifiée le</span>
                <span className="text-gray-900">{formatDate(commande.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
