'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, createUntypedClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { downloadDevisPDF } from '@/lib/pdf/devis-pdf'
import {
  FileText,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Building2,
  Users,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type Devis = Tables<'devis'>
type Client = Tables<'clients'>
type Filiale = Tables<'filiales'>
type LigneDevis = Tables<'devis_lignes'>

export default function DevisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const devisId = Number(params.id)

  const [devis, setDevis] = useState<Devis | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [filiale, setFiliale] = useState<Filiale | null>(null)
  const [lignes, setLignes] = useState<LigneDevis[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: devisData, error: devisError } = await supabase
        .from('devis')
        .select(`
          *,
          client:client_id(*),
          filiale:filiale_id(*)
        `)
        .eq('id', devisId)
        .single()

      if (devisError || !devisData) {
        console.error('Erreur:', devisError)
        setLoading(false)
        return
      }

      setDevis(devisData as Devis)
      setClient((devisData as { client: Client }).client)
      setFiliale((devisData as { filiale: Filiale }).filiale)

      const { data: lignesData } = await supabase
        .from('devis_lignes')
        .select('*')
        .eq('devis_id', devisId)
        .order('ordre')

      if (lignesData) {
        setLignes(lignesData as LigneDevis[])
      }

      setLoading(false)
    }

    fetchData()
  }, [devisId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      envoye: 'bg-blue-100 text-blue-700',
      accepte: 'bg-green-100 text-green-700',
      refuse: 'bg-red-100 text-red-700',
      expire: 'bg-orange-100 text-orange-700',
      converti: 'bg-purple-100 text-purple-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoye: 'Envoyé',
      accepte: 'Accepté',
      refuse: 'Refusé',
      expire: 'Expiré',
      converti: 'Converti en facture',
    }
    return labels[statut] || statut
  }

  const isExpired = devis && new Date(devis.date_validite) < new Date() && !['accepte', 'refuse', 'expire', 'converti'].includes(devis.statut)

  const handleDownloadPDF = async () => {
    if (!devis || !client || !filiale) return

    setDownloading(true)
    try {
      await downloadDevisPDF({
        devis: {
          numero: devis.numero,
          date_emission: devis.date_emission,
          date_validite: devis.date_validite,
          objet: devis.objet,
          total_ht: devis.total_ht,
          taux_tva: devis.taux_tva,
          total_tva: devis.total_tva,
          total_ttc: devis.total_ttc,
          statut: devis.statut,
          notes: devis.notes,
          conditions: devis.conditions,
        },
        client: {
          nom: client.nom,
          code: client.code,
          email: client.email,
          telephone: client.telephone,
          adresse: client.adresse,
          ville: client.ville,
          code_postal: client.code_postal,
          siret: client.siret,
          tva_intracommunautaire: client.tva_intracommunautaire,
        },
        filiale: {
          nom: filiale.nom,
          code: filiale.code,
          adresse: filiale.adresse,
          ville: filiale.ville,
          code_postal: filiale.code_postal,
          telephone: filiale.telephone,
          email: filiale.email,
          siret: (filiale as Record<string, unknown>).siret as string | null,
          tva_intracommunautaire: (filiale as Record<string, unknown>).tva_intracommunautaire as string | null,
        },
        lignes: lignes.map(l => ({
          description: l.description,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          taux_tva: l.taux_tva,
          montant_ht: l.montant_ht,
          montant_ttc: l.montant_ttc,
        })),
      })
    } catch (error) {
      console.error('Erreur PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setDownloading(false)
    }
  }

  const updateStatut = async (newStatut: string) => {
    if (!devis) return

    setUpdating(true)
    try {
      const supabase = createUntypedClient()
      const { error } = await supabase
        .from('devis')
        .update({ statut: newStatut })
        .eq('id', devis.id)

      if (error) throw error

      setDevis({ ...devis, statut: newStatut as Devis['statut'] })
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary"></div>
      </div>
    )
  }

  if (!devis) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Devis non trouvé</h2>
        <p className="text-gray-500 mt-2">Ce devis n&apos;existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/finance/devis')} className="mt-4">
          Retour aux devis
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Devis ${devis.numero}`}
        description={devis.objet || 'Proposition commerciale'}
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Devis', href: '/finance/devis' },
          { label: devis.numero },
        ]}
      />

      {/* Alerte si expiré */}
      {isExpired && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">Devis expiré</p>
            <p className="text-sm text-orange-600">
              Ce devis a expiré le {formatDate(devis.date_validite)}. Vous pouvez le renouveler ou le marquer comme expiré.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-phi-highlight text-gray-900 hover:bg-phi-highlight/90"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Télécharger PDF
        </Button>

        {devis.statut === 'brouillon' && (
          <>
            <Link href={`/finance/devis/${devis.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => updateStatut('envoye')}
              disabled={updating}
            >
              <Send className="h-4 w-4 mr-2" />
              Marquer comme envoyé
            </Button>
          </>
        )}

        {devis.statut === 'envoye' && (
          <>
            <Button
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => updateStatut('accepte')}
              disabled={updating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepté
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => updateStatut('refuse')}
              disabled={updating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refusé
            </Button>
          </>
        )}

        {devis.statut === 'accepte' && !devis.facture_id && (
          <Button
            className="bg-phi-primary hover:bg-phi-primary/90"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Convertir en facture
          </Button>
        )}
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statut et dates */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-phi-primary" />
            Informations
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatutColor(devis.statut)}`}>
                {getStatutLabel(devis.statut)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date d&apos;émission</p>
              <p className="font-medium text-gray-900">{formatDate(devis.date_emission)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valide jusqu&apos;au</p>
              <p className={`font-medium flex items-center gap-2 ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(devis.date_validite)}
                {isExpired && <Clock className="h-4 w-4" />}
              </p>
            </div>
          </div>
        </div>

        {/* Filiale */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-phi-primary" />
            Émetteur
          </h3>
          {filiale && (
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{filiale.nom}</p>
              {filiale.adresse && <p className="text-sm text-gray-600">{filiale.adresse}</p>}
              {filiale.code_postal && filiale.ville && (
                <p className="text-sm text-gray-600">{filiale.code_postal} {filiale.ville}</p>
              )}
              {filiale.email && <p className="text-sm text-gray-600">{filiale.email}</p>}
            </div>
          )}
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-phi-accent" />
            Client
          </h3>
          {client && (
            <div className="space-y-2">
              <Link
                href={`/finance/clients/${client.id}`}
                className="font-medium text-phi-primary hover:underline"
              >
                {client.nom}
              </Link>
              <p className="text-sm text-gray-500">{client.code}</p>
              {client.adresse && <p className="text-sm text-gray-600">{client.adresse}</p>}
              {client.code_postal && client.ville && (
                <p className="text-sm text-gray-600">{client.code_postal} {client.ville}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lignes du devis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-phi-highlight" />
            Détail du devis
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Description</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Qté</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Prix unit. HT</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">TVA</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lignes.map((ligne) => (
                <tr key={ligne.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{ligne.description}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-center">{ligne.quantite}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right">{formatCurrency(ligne.prix_unitaire)}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-center">{ligne.taux_tva}%</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(ligne.montant_ttc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">{formatCurrency(devis.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA ({devis.taux_tva}%)</span>
                <span className="font-medium">{formatCurrency(devis.total_tva)}</span>
              </div>
              <div className="border-t border-yellow-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total TTC</span>
                <span className="font-bold text-lg text-phi-primary">{formatCurrency(devis.total_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {devis.notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{devis.notes}</p>
        </div>
      )}
    </div>
  )
}
