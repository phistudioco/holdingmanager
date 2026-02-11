'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Building,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ArrowLeft,
  Star,
  Clock,
  Package,
} from 'lucide-react'

type Fournisseur = {
  id: number
  nom: string
  type: 'materiel' | 'service' | 'logistique' | 'autre'
  contact_nom: string | null
  contact_email: string | null
  contact_telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  pays: string | null
  statut: 'actif' | 'inactif' | 'en_evaluation'
  note_qualite: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

const themeColor = '#0f2080'

export default function FournisseurDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fournisseurId = Number(params.id)

  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchFournisseur = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('id', fournisseurId)
        .single()

      if (error) {
        console.error('Erreur:', error)
        setLoading(false)
        return
      }

      setFournisseur(data as Fournisseur)
      setLoading(false)
    }

    fetchFournisseur()
  }, [fournisseurId])

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      actif: { label: 'Actif', color: 'text-green-700', bg: 'bg-green-100' },
      inactif: { label: 'Inactif', color: 'text-gray-700', bg: 'bg-gray-100' },
      en_evaluation: { label: 'En évaluation', color: 'text-amber-700', bg: 'bg-amber-100' },
    }
    return configs[statut] || configs.en_evaluation
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      materiel: 'Matériel',
      service: 'Service',
      logistique: 'Logistique',
      autre: 'Autre',
    }
    return labels[type] || type
  }

  const renderStars = (note: number | null) => {
    if (note === null) return <span className="text-gray-400">Non noté</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-gray-600">({note}/5)</span>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!fournisseur) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${fournisseur.nom}" ?`)) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', fournisseur.id)

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

  if (!fournisseur) {
    return (
      <div className="text-center py-12">
        <Building className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Fournisseur non trouvé</h2>
        <p className="text-gray-500 mb-6">Ce fournisseur n&apos;existe pas ou a été supprimé.</p>
        <Link href="/services/outsourcing">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    )
  }

  const statutConfig = getStatutConfig(fournisseur.statut)

  return (
    <div className="space-y-6">
      <PageHeader
        title={fournisseur.nom}
        description="Fiche fournisseur"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: fournisseur.nom },
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
        <Link href={`/services/outsourcing/fournisseurs/${fournisseur.id}/edit`}>
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
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: themeColor }}
                  >
                    {fournisseur.nom[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{fournisseur.nom}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {getTypeLabel(fournisseur.type)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statutConfig.bg} ${statutConfig.color}`}>
                  {statutConfig.label}
                </span>
              </div>

              {/* Note qualité */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Note qualité</h3>
                {renderStars(fournisseur.note_qualite)}
              </div>

              {/* Adresse */}
              {(fournisseur.adresse || fournisseur.ville) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </h3>
                  <p className="text-gray-700">
                    {fournisseur.adresse && <>{fournisseur.adresse}<br /></>}
                    {fournisseur.code_postal} {fournisseur.ville}
                    {fournisseur.pays && <><br />{fournisseur.pays}</>}
                  </p>
                </div>
              )}

              {/* Notes */}
              {fournisseur.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{fournisseur.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact
            </h3>
            <div className="space-y-3">
              {fournisseur.contact_nom && (
                <p className="font-semibold text-gray-900">{fournisseur.contact_nom}</p>
              )}
              {fournisseur.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${fournisseur.contact_email}`} className="text-blue-600 hover:underline">
                    {fournisseur.contact_email}
                  </a>
                </div>
              )}
              {fournisseur.contact_telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${fournisseur.contact_telephone}`} className="text-gray-700">
                    {fournisseur.contact_telephone}
                  </a>
                </div>
              )}
              {!fournisseur.contact_nom && !fournisseur.contact_email && !fournisseur.contact_telephone && (
                <p className="text-gray-500 italic">Aucun contact renseigné</p>
              )}
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span className="text-gray-900">{formatDate(fournisseur.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modifié le</span>
                <span className="text-gray-900">{formatDate(fournisseur.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
