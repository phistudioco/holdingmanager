import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { DeleteContratButton } from '@/components/finance/DeleteContratButton'
import { DownloadContratPDF } from '@/components/finance/DownloadContratPDF'
import {
  ScrollText,
  Building2,
  Users,
  Calendar,
  Euro,
  Edit,
  RefreshCw,
  FileText,
  ArrowRight,
} from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

type ContratData = {
  id: number
  numero: string
  titre: string
  type: string
  statut: string
  date_debut: string
  date_fin: string | null
  montant: number
  periodicite: string
  reconduction_auto: boolean
  description: string | null
  conditions: string | null
  client_id: number
  filiale_id: number
  created_at: string
  updated_at: string
  client: {
    id: number
    nom: string
    code: string
    email: string | null
    telephone: string | null
    adresse: string | null
    ville: string | null
    code_postal: string | null
    siret: string | null
    tva_intracommunautaire: string | null
  } | null
  filiale: {
    id: number
    nom: string
    code: string
    adresse: string | null
    ville: string | null
    code_postal: string | null
    telephone: string | null
    email: string | null
  } | null
}

type FactureData = {
  id: number
  numero: string
  date_emission: string
  total_ttc: number
  statut: string
}

export default async function ContratDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const contratId = parseInt(resolvedParams.id)

  const supabase = await createClient()

  const { data: contratRaw, error } = await supabase
    .from('contrats')
    .select(`
      *,
      client:client_id(id, nom, code, email, telephone, adresse, ville, code_postal, siret, tva_intracommunautaire),
      filiale:filiale_id(id, nom, code, adresse, ville, code_postal, telephone, email)
    `)
    .eq('id', contratId)
    .single()

  if (error || !contratRaw) {
    notFound()
  }

  const contrat = contratRaw as unknown as ContratData

  // Récupérer les factures liées à ce contrat
  const { data: facturesRaw } = await supabase
    .from('factures')
    .select('id, numero, date_emission, total_ttc, statut')
    .eq('contrat_id', contratId)
    .order('date_emission', { ascending: false })
    .limit(5)

  const factures = facturesRaw as unknown as FactureData[] | null

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

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700',
      actif: 'bg-green-100 text-green-700',
      suspendu: 'bg-yellow-100 text-yellow-700',
      termine: 'bg-blue-100 text-blue-700',
      resilie: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      actif: 'Actif',
      suspendu: 'Suspendu',
      termine: 'Terminé',
      resilie: 'Résilié',
    }
    return labels[statut] || statut
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service: 'Service',
      maintenance: 'Maintenance',
      licence: 'Licence',
      location: 'Location',
      autre: 'Autre',
    }
    return labels[type] || type
  }

  const getPeriodiciteLabel = (periodicite: string) => {
    const labels: Record<string, string> = {
      mensuel: 'Mensuel',
      trimestriel: 'Trimestriel',
      semestriel: 'Semestriel',
      annuel: 'Annuel',
      ponctuel: 'Ponctuel',
    }
    return labels[periodicite] || periodicite
  }

  const isExpiringSoon = () => {
    if (contrat.statut !== 'actif' || !contrat.date_fin) return false
    const diff = new Date(contrat.date_fin).getTime() - Date.now()
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000
  }

  const client = contrat.client
  const filiale = contrat.filiale

  return (
    <div className="space-y-6">
      <PageHeader
        title={contrat.numero}
        description={contrat.titre}
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Contrats', href: '/finance/contrats' },
          { label: contrat.numero },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {client && filiale && (
              <DownloadContratPDF
                contrat={{
                  numero: contrat.numero,
                  titre: contrat.titre,
                  type: contrat.type,
                  date_debut: contrat.date_debut,
                  date_fin: contrat.date_fin || contrat.date_debut,
                  montant: contrat.montant,
                  periodicite: contrat.periodicite,
                  reconduction_auto: contrat.reconduction_auto,
                  conditions: contrat.conditions,
                  statut: contrat.statut,
                }}
                client={client}
                filiale={filiale}
              />
            )}
            <Link href={`/finance/contrats/${contrat.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
            <DeleteContratButton contratId={contrat.id} contratNumero={contrat.numero} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du contrat */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-phi-primary to-blue-600 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-white flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Détails du contrat
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(contrat.statut)}`}>
                {getStatutLabel(contrat.statut)}
                {contrat.reconduction_auto && <RefreshCw className="h-3 w-3" />}
              </span>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Type</dt>
                  <dd className="font-medium">{getTypeLabel(contrat.type)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Périodicité</dt>
                  <dd className="font-medium">{getPeriodiciteLabel(contrat.periodicite)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Date de début</dt>
                  <dd className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(contrat.date_debut)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Date de fin</dt>
                  <dd className={`font-medium flex items-center gap-2 ${isExpiringSoon() ? 'text-amber-600' : ''}`}>
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {contrat.date_fin ? formatDate(contrat.date_fin) : 'Durée indéterminée'}
                    {isExpiringSoon() && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Expire bientôt</span>}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-500 mb-1">Reconduction automatique</dt>
                  <dd className="font-medium flex items-center gap-2">
                    {contrat.reconduction_auto ? (
                      <>
                        <span className="text-green-600">Oui</span>
                        <RefreshCw className="h-4 w-4 text-green-600" />
                      </>
                    ) : (
                      <span className="text-gray-500">Non</span>
                    )}
                  </dd>
                </div>
              </dl>

              {contrat.description && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <dt className="text-sm text-gray-500 mb-2">Description</dt>
                  <dd className="text-gray-700 whitespace-pre-wrap">{contrat.description}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Factures liées */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-phi-accent" />
                Factures liées
              </h3>
              <Link href={`/finance/factures/nouveau?contrat=${contrat.id}&client=${contrat.client_id}`}>
                <Button size="sm" className="bg-phi-accent hover:bg-phi-accent/90">
                  Créer une facture
                </Button>
              </Link>
            </div>
            <div className="p-6">
              {factures && factures.length > 0 ? (
                <div className="space-y-3">
                  {factures.map((facture) => (
                    <Link
                      key={facture.id}
                      href={`/finance/factures/${facture.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{facture.numero}</p>
                        <p className="text-sm text-gray-500">{formatDate(facture.date_emission)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(facture.total_ttc)}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune facture liée à ce contrat</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Montant */}
          <div className="bg-gradient-to-br from-phi-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Euro className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Montant</p>
                <p className="text-sm opacity-60">{getPeriodiciteLabel(contrat.periodicite)}</p>
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(contrat.montant)}</p>
          </div>

          {/* Client */}
          {client && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-phi-accent" />
                  Client
                </h3>
              </div>
              <div className="p-6">
                <Link href={`/finance/clients/${client.id}`} className="block group">
                  <p className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors">
                    {client.nom}
                  </p>
                  <p className="text-sm text-gray-500">{client.code}</p>
                  {client.email && (
                    <p className="text-sm text-gray-500 mt-2">{client.email}</p>
                  )}
                  {client.telephone && (
                    <p className="text-sm text-gray-500">{client.telephone}</p>
                  )}
                </Link>
              </div>
            </div>
          )}

          {/* Filiale */}
          {filiale && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-phi-highlight" />
                  Filiale
                </h3>
              </div>
              <div className="p-6">
                <Link href={`/filiales/${filiale.id}`} className="block group">
                  <p className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors">
                    {filiale.nom}
                  </p>
                  <p className="text-sm text-gray-500">{filiale.code}</p>
                </Link>
              </div>
            </div>
          )}

          {/* Dates clés */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Dates
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Créé le</p>
                <p className="text-sm font-medium">{formatDate(contrat.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modifié le</p>
                <p className="text-sm font-medium">{formatDate(contrat.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
