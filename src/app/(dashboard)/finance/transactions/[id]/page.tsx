import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  Users,
  Calendar,
  Euro,
  Edit,
  Trash2,
  FileText,
  Tag,
} from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

type TransactionData = {
  id: number
  filiale_id: number
  type: 'revenu' | 'depense'
  categorie: string
  montant: number
  date_transaction: string
  description: string | null
  reference: string | null
  client_id: number | null
  facture_id: number | null
  statut: 'en_attente' | 'validee' | 'annulee'
  created_at: string
  updated_at: string
  filiale: { id: number; nom: string } | null
  client: { id: number; nom: string; code: string } | null
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const transactionId = parseInt(resolvedParams.id)

  const supabase = await createClient()

  const { data: transactionRaw, error } = await supabase
    .from('transactions')
    .select(`
      *,
      filiale:filiale_id(id, nom),
      client:client_id(id, nom, code)
    `)
    .eq('id', transactionId)
    .single()

  if (error || !transactionRaw) {
    notFound()
  }

  const transaction = transactionRaw as unknown as TransactionData

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
      en_attente: 'bg-yellow-100 text-yellow-700',
      validee: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      validee: 'Validée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
  }

  const getCategorieLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      facturation: 'Facturation',
      prestation: 'Prestation',
      vente: 'Vente',
      subvention: 'Subvention',
      autre_revenu: 'Autre revenu',
      salaires: 'Salaires',
      loyer: 'Loyer',
      fournitures: 'Fournitures',
      equipements: 'Équipements',
      services: 'Services',
      marketing: 'Marketing',
      deplacements: 'Déplacements',
      autre_depense: 'Autre dépense',
    }
    return labels[categorie] || categorie
  }

  const isRevenu = transaction.type === 'revenu'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Transaction #${transaction.id}`}
        description={transaction.description || getCategorieLabel(transaction.categorie)}
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Transactions', href: '/finance/transactions' },
          { label: `#${transaction.id}` },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link href={`/finance/transactions/${transaction.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r ${
              isRevenu ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'
            } flex items-center justify-between`}>
              <h3 className="font-heading font-semibold text-white flex items-center gap-2">
                {isRevenu ? (
                  <ArrowUpCircle className="h-5 w-5" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5" />
                )}
                {isRevenu ? 'Revenu' : 'Dépense'}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(transaction.statut)}`}>
                {getStatutLabel(transaction.statut)}
              </span>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Catégorie</dt>
                  <dd className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    {getCategorieLabel(transaction.categorie)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Date</dt>
                  <dd className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(transaction.date_transaction)}
                  </dd>
                </div>
                {transaction.reference && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">Référence</dt>
                    <dd className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      {transaction.reference}
                    </dd>
                  </div>
                )}
                {transaction.facture_id && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">Facture liée</dt>
                    <dd>
                      <Link
                        href={`/finance/factures/${transaction.facture_id}`}
                        className="text-phi-primary hover:underline"
                      >
                        Voir la facture
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              {transaction.description && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <dt className="text-sm text-gray-500 mb-2">Description</dt>
                  <dd className="text-gray-700">{transaction.description}</dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount */}
          <div className={`rounded-2xl p-6 text-white shadow-lg ${
            isRevenu
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-red-500 to-rose-600'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Euro className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Montant</p>
                <p className="text-xs opacity-60">{isRevenu ? 'Entrée' : 'Sortie'}</p>
              </div>
            </div>
            <p className="text-3xl font-bold">
              {isRevenu ? '+' : '-'}{formatCurrency(transaction.montant)}
            </p>
          </div>

          {/* Filiale */}
          {transaction.filiale && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-phi-highlight" />
                  Filiale
                </h3>
              </div>
              <div className="p-6">
                <Link href={`/filiales/${transaction.filiale.id}`} className="block group">
                  <p className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors">
                    {transaction.filiale.nom}
                  </p>
                </Link>
              </div>
            </div>
          )}

          {/* Client */}
          {transaction.client && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-phi-accent" />
                  Client
                </h3>
              </div>
              <div className="p-6">
                <Link href={`/finance/clients/${transaction.client.id}`} className="block group">
                  <p className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors">
                    {transaction.client.nom}
                  </p>
                  <p className="text-sm text-gray-500">{transaction.client.code}</p>
                </Link>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Informations
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Créé le</p>
                <p className="text-sm font-medium">{formatDate(transaction.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modifié le</p>
                <p className="text-sm font-medium">{formatDate(transaction.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
