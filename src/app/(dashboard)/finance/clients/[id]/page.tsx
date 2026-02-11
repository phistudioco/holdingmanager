import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  FileText,
  CreditCard,
  Euro,
  Hash,
  Globe,
  Briefcase,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

type ClientWithRelations = Tables<'clients'> & {
  filiale: { nom: string; code: string } | null
  pays: { nom: string; code: string } | null
}

type FactureSummary = {
  id: number
  numero: string
  total_ttc: number
  statut: string
  date_emission: string
}

type ContratSummary = {
  id: number
  numero: string
  titre: string
  montant: number
  statut: string
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      filiale:filiale_id (nom, code),
      pays:pays_id (nom, code)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const client = data as ClientWithRelations

  // Récupérer les factures du client
  const { data: facturesData } = await supabase
    .from('factures')
    .select('id, numero, total_ttc, statut, date_emission')
    .eq('client_id', id)
    .order('date_emission', { ascending: false })
    .limit(5)
  const factures = (facturesData || []) as FactureSummary[]

  // Récupérer les contrats du client
  const { data: contratsData } = await supabase
    .from('contrats')
    .select('id, numero, titre, montant, statut')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(5)
  const contrats = (contratsData || []) as ContratSummary[]

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
      envoyee: 'bg-blue-100 text-blue-700',
      partiellement_payee: 'bg-yellow-100 text-yellow-700',
      payee: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
      actif: 'bg-green-100 text-green-700',
      suspendu: 'bg-yellow-100 text-yellow-700',
      termine: 'bg-gray-100 text-gray-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <Link
            href="/finance/clients"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-phi-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux clients
          </Link>
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                client.type === 'entreprise'
                  ? 'bg-gradient-to-br from-phi-primary to-blue-600'
                  : 'bg-gradient-to-br from-phi-accent to-pink-600'
              }`}
            >
              {client.nom[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-heading font-bold text-gray-900">
                  {client.nom}
                </h1>
                <StatusBadge status={client.statut} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                  {client.code}
                </code>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    client.type === 'entreprise'
                      ? 'bg-phi-primary/10 text-phi-primary'
                      : 'bg-phi-accent/10 text-phi-accent'
                  }`}
                >
                  {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/finance/clients/${id}/edit`}>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Button variant="outline" className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-phi-primary/10 rounded-xl">
              <Building2 className="h-5 w-5 text-phi-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Filiale</p>
              <p className="font-semibold text-gray-900">{client.filiale?.nom || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-phi-accent/10 rounded-xl">
              <FileText className="h-5 w-5 text-phi-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Factures</p>
              <p className="font-semibold text-gray-900">{factures?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Briefcase className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contrats</p>
              <p className="font-semibold text-gray-900">{contrats?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Euro className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Limite crédit</p>
              <p className="font-semibold text-gray-900">{formatCurrency(client.limite_credit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-phi-primary" />
                Contact
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {client.email}
                    </p>
                  </div>
                </a>
              )}

              {client.telephone && (
                <a
                  href={`tel:${client.telephone}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {client.telephone}
                    </p>
                  </div>
                </a>
              )}

              {client.adresse && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium text-gray-900">
                      {client.adresse}
                      {client.code_postal && client.ville && (
                        <>, {client.code_postal} {client.ville}</>
                      )}
                      {client.pays && <>, {client.pays.nom}</>}
                    </p>
                  </div>
                </div>
              )}

              {!client.email && !client.telephone && !client.adresse && (
                <p className="text-gray-400 italic text-center py-4">Aucune information de contact</p>
              )}
            </div>
          </div>

          {/* Factures récentes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-phi-accent" />
                Factures récentes
              </h3>
              <Link href={`/finance/factures/nouveau?client=${id}`} className="text-sm text-phi-accent hover:underline">
                Nouvelle facture
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {factures && factures.length > 0 ? (
                factures.map((facture) => (
                  <Link
                    key={facture.id}
                    href={`/finance/factures/${facture.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{facture.numero}</p>
                      <p className="text-sm text-gray-500">{formatDate(facture.date_emission)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(facture.total_ttc)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatutColor(facture.statut)}`}>
                        {facture.statut}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-gray-400">Aucune facture</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations entreprise */}
          {client.type === 'entreprise' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-phi-highlight" />
                  Informations entreprise
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {client.siret && (
                  <div>
                    <p className="text-sm text-gray-500">SIRET</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      {client.siret}
                    </p>
                  </div>
                )}
                {client.tva_intracommunautaire && (
                  <div>
                    <p className="text-sm text-gray-500">TVA Intracommunautaire</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {client.tva_intracommunautaire}
                    </p>
                  </div>
                )}
                {client.forme_juridique && (
                  <div>
                    <p className="text-sm text-gray-500">Forme juridique</p>
                    <p className="font-medium text-gray-900">{client.forme_juridique}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditions commerciales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Conditions commerciales
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Délai de paiement</p>
                <p className="font-medium text-gray-900">{client.delai_paiement} jours</p>
              </div>
              {client.mode_reglement_prefere && (
                <div>
                  <p className="text-sm text-gray-500">Mode de règlement</p>
                  <p className="font-medium text-gray-900">{client.mode_reglement_prefere}</p>
                </div>
              )}
              {client.limite_credit && (
                <div>
                  <p className="text-sm text-gray-500">Limite de crédit</p>
                  <p className="font-medium text-gray-900">{formatCurrency(client.limite_credit)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                Informations système
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium text-gray-900">{formatDate(client.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modifié le</p>
                <p className="font-medium text-gray-900">{formatDate(client.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
