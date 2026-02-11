import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DownloadFacturePDF } from '@/components/finance/DownloadFacturePDF'
import { DeleteFactureButton } from '@/components/finance/DeleteFactureButton'
import {
  FileText,
  Building2,
  Calendar,
  Edit,
  ArrowLeft,
  Euro,
  Mail,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

type FactureWithRelations = Tables<'factures'> & {
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
    nom: string
    code: string
    adresse: string | null
    ville: string | null
    code_postal: string | null
    telephone: string | null
    email: string | null
  } | null
}

type LigneFacture = Tables<'facture_lignes'>

export default async function FactureDetailPage({ params }: PageProps) {
  const { id } = await params
  const factureId = parseInt(id, 10)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('factures')
    .select(`
      *,
      client:client_id (id, nom, code, email, telephone, adresse, ville, code_postal, siret, tva_intracommunautaire),
      filiale:filiale_id (nom, code, adresse, ville, code_postal, telephone, email)
    `)
    .eq('id', factureId)
    .single()

  if (error || !data) {
    notFound()
  }

  const facture = data as FactureWithRelations

  // Récupérer les lignes de la facture
  const { data: lignes } = await supabase
    .from('facture_lignes')
    .select('*')
    .eq('facture_id', factureId)
    .order('ordre')

  const factureLines = (lignes || []) as LigneFacture[]

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      brouillon: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
      envoyee: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Mail },
      partiellement_payee: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      payee: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    }
    return colors[statut] || colors.brouillon
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoyee: 'Envoyée',
      partiellement_payee: 'Partiellement payée',
      payee: 'Payée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facture: 'Facture',
      avoir: 'Avoir',
      acompte: 'Acompte',
      proforma: 'Proforma',
    }
    return labels[type] || type
  }

  const isOverdue = () => {
    if (['payee', 'annulee'].includes(facture.statut)) return false
    return new Date(facture.date_echeance) < new Date()
  }

  const statutConfig = getStatutColor(facture.statut)
  const StatutIcon = statutConfig.icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <Link
          href="/finance/factures"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-phi-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux factures
        </Link>

        {/* Title Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-phi-primary to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
                  {facture.numero}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statutConfig.bg} ${statutConfig.text}`}>
                  <StatutIcon className="h-4 w-4" />
                  {getStatutLabel(facture.statut)}
                </span>
                {isOverdue() && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    En retard
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{facture.objet || 'Sans objet'}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-lg text-sm font-medium bg-phi-primary/10 text-phi-primary">
                {getTypeLabel(facture.type)}
              </span>
            </div>
          </div>

          {/* Action Buttons - Aligned horizontally */}
          <div className="flex items-center gap-2 shrink-0">
            {facture.client && facture.filiale && (
              <DownloadFacturePDF
                facture={{
                  numero: facture.numero,
                  type: facture.type,
                  date_emission: facture.date_emission,
                  date_echeance: facture.date_echeance,
                  objet: facture.objet,
                  total_ht: facture.total_ht,
                  taux_tva: facture.taux_tva,
                  total_tva: facture.total_tva,
                  total_ttc: facture.total_ttc,
                  montant_paye: facture.montant_paye,
                  statut: facture.statut,
                  notes: facture.notes,
                }}
                client={{
                  nom: facture.client.nom,
                  code: facture.client.code,
                  email: facture.client.email,
                  telephone: facture.client.telephone,
                  adresse: facture.client.adresse,
                  ville: facture.client.ville,
                  code_postal: facture.client.code_postal,
                  siret: facture.client.siret,
                  tva_intracommunautaire: facture.client.tva_intracommunautaire,
                }}
                filiale={{
                  nom: facture.filiale.nom,
                  code: facture.filiale.code,
                  adresse: facture.filiale.adresse,
                  ville: facture.filiale.ville,
                  code_postal: facture.filiale.code_postal,
                  telephone: facture.filiale.telephone,
                  email: facture.filiale.email,
                }}
                lignes={factureLines.map(l => ({
                  description: l.description,
                  quantite: l.quantite,
                  prix_unitaire: l.prix_unitaire,
                  taux_tva: l.taux_tva,
                  montant_ht: l.montant_ht,
                  montant_ttc: l.montant_ttc,
                }))}
              />
            )}
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </Button>
            <Link href={`/finance/factures/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
            </Link>
            <DeleteFactureButton
              factureId={facture.id}
              factureNumero={facture.numero}
            />
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-phi-primary/10 rounded-xl">
              <Euro className="h-5 w-5 text-phi-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total TTC</p>
              <p className="font-bold text-xl text-gray-900">{formatCurrency(facture.total_ttc)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant payé</p>
              <p className="font-bold text-xl text-gray-900">{formatCurrency(facture.montant_paye)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isOverdue() ? 'bg-red-100' : 'bg-phi-accent/10'}`}>
              <Calendar className={`h-5 w-5 ${isOverdue() ? 'text-red-600' : 'text-phi-accent'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Échéance</p>
              <p className={`font-semibold ${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(facture.date_echeance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Filiale</p>
              <p className="font-semibold text-gray-900">{facture.filiale?.nom || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Facture */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900">Client</h3>
            </div>
            <div className="p-6">
              {facture.client ? (
                <Link
                  href={`/finance/clients/${facture.client.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-phi-primary flex items-center justify-center text-white font-bold text-lg">
                    {facture.client.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors">
                      {facture.client.nom}
                    </p>
                    <p className="text-sm text-gray-500">{facture.client.code}</p>
                    {facture.client.adresse && (
                      <p className="text-sm text-gray-400 mt-1">{facture.client.adresse}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <p className="text-gray-400 italic">Client non défini</p>
              )}
            </div>
          </div>

          {/* Lignes de facture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900">Détail de la facture</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Description</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Qté</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Prix unit. HT</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">TVA</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {factureLines.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-6 py-4 text-gray-900">{ligne.description}</td>
                      <td className="px-4 py-4 text-right text-gray-600">{ligne.quantite}</td>
                      <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(ligne.prix_unitaire)}</td>
                      <td className="px-4 py-4 text-right text-gray-600">{ligne.taux_tva}%</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(ligne.montant_ttc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-medium">{formatCurrency(facture.total_ht)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({facture.taux_tva}%)</span>
                  <span className="font-medium">{formatCurrency(facture.total_tva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total TTC</span>
                  <span className="text-phi-primary">{formatCurrency(facture.total_ttc)}</span>
                </div>
                {facture.montant_paye > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Payé</span>
                      <span>- {formatCurrency(facture.montant_paye)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-phi-accent">
                      <span>Reste à payer</span>
                      <span>{formatCurrency(facture.total_ttc - facture.montant_paye)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-phi-highlight" />
                Dates
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Date d&apos;émission</p>
                <p className="font-medium text-gray-900">{formatDate(facture.date_emission)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d&apos;échéance</p>
                <p className={`font-medium ${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(facture.date_echeance)}
                  {isOverdue() && ' (En retard)'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900">Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              {facture.statut === 'brouillon' && (
                <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4" />
                  Marquer comme envoyée
                </Button>
              )}
              {['envoyee', 'partiellement_payee'].includes(facture.statut) && (
                <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Enregistrer un paiement
                </Button>
              )}
              {facture.client && facture.filiale && (
                <DownloadFacturePDF
                  facture={{
                    numero: facture.numero,
                    type: facture.type,
                    date_emission: facture.date_emission,
                    date_echeance: facture.date_echeance,
                    objet: facture.objet,
                    total_ht: facture.total_ht,
                    taux_tva: facture.taux_tva,
                    total_tva: facture.total_tva,
                    total_ttc: facture.total_ttc,
                    montant_paye: facture.montant_paye,
                    statut: facture.statut,
                    notes: facture.notes,
                  }}
                  client={{
                    nom: facture.client.nom,
                    code: facture.client.code,
                    email: facture.client.email,
                    telephone: facture.client.telephone,
                    adresse: facture.client.adresse,
                    ville: facture.client.ville,
                    code_postal: facture.client.code_postal,
                    siret: facture.client.siret,
                    tva_intracommunautaire: facture.client.tva_intracommunautaire,
                  }}
                  filiale={{
                    nom: facture.filiale.nom,
                    code: facture.filiale.code,
                    adresse: facture.filiale.adresse,
                    ville: facture.filiale.ville,
                    code_postal: facture.filiale.code_postal,
                    telephone: facture.filiale.telephone,
                    email: facture.filiale.email,
                  }}
                  lignes={factureLines.map(l => ({
                    description: l.description,
                    quantite: l.quantite,
                    prix_unitaire: l.prix_unitaire,
                    taux_tva: l.taux_tva,
                    montant_ht: l.montant_ht,
                    montant_ttc: l.montant_ttc,
                  }))}
                  className="w-full justify-start"
                />
              )}
              {facture.client?.email && (
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Envoyer par email
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          {facture.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-heading font-semibold text-gray-900">Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 whitespace-pre-wrap">{facture.notes}</p>
              </div>
            </div>
          )}

          {/* Métadonnées */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900">Informations système</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Créée le</p>
                <p className="font-medium text-gray-900">{formatDate(facture.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modifiée le</p>
                <p className="font-medium text-gray-900">{formatDate(facture.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
