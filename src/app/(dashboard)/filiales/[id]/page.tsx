import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Calendar,
  Edit,
  Trash2,
  Users,
  Receipt,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

type FilialeWithPays = Tables<'filiales'> & {
  pays: { nom: string; code: string } | null
}

export default async function FilialeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('filiales')
    .select(`
      *,
      pays:pays_id (nom, code)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const filiale = data as FilialeWithPays

  // Stats de la filiale
  const [
    { count: employesCount },
    { count: clientsCount },
  ] = await Promise.all([
    supabase.from('employes').select('*', { count: 'exact', head: true }).eq('filiale_id', id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('filiale_id', id),
  ])

  return (
    <div className="space-y-8">
      {/* Header avec actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <Link
            href="/filiales"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-phi-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux filiales
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-phi-primary to-phi-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-phi-primary/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-heading font-bold text-gray-900">{filiale.nom}</h1>
                <StatusBadge status={filiale.statut} />
              </div>
              <code className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                {filiale.code}
              </code>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/filiales/${id}/edit`}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href={`/employes?filiale=${id}`} className="group">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Employés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-heading">{employesCount || 0}</p>
              </div>
              <div className="p-3 bg-phi-primary/10 rounded-xl group-hover:bg-phi-primary/20 transition-colors">
                <Users className="h-6 w-6 text-phi-primary" />
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/finance/clients?filiale=${id}`} className="group">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-heading">{clientsCount || 0}</p>
              </div>
              <div className="p-3 bg-phi-accent/10 rounded-xl group-hover:bg-phi-accent/20 transition-colors">
                <Users className="h-6 w-6 text-phi-accent" />
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/finance/factures?filiale=${id}`} className="group">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Factures</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-heading">—</p>
              </div>
              <div className="p-3 bg-phi-highlight/20 rounded-xl group-hover:bg-phi-highlight/30 transition-colors">
                <Receipt className="h-6 w-6 text-phi-highlight" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Adresse */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-phi-primary" />
                Adresse
              </h3>
            </div>
            <div className="p-6">
              {filiale.adresse || filiale.ville ? (
                <div className="space-y-2">
                  {filiale.adresse && (
                    <p className="text-gray-900">{filiale.adresse}</p>
                  )}
                  <p className="text-gray-600">
                    {[filiale.code_postal, filiale.ville].filter(Boolean).join(' ')}
                  </p>
                  {filiale.pays && (
                    <p className="text-gray-500 flex items-center gap-2">
                      <span className="text-lg">{filiale.pays.code === 'FR' ? '🇫🇷' : filiale.pays.code === 'TN' ? '🇹🇳' : '🌍'}</span>
                      {filiale.pays.nom}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Aucune adresse renseignée</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-phi-accent" />
                Contact
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {filiale.telephone && (
                <a
                  href={`tel:${filiale.telephone}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {filiale.telephone}
                    </p>
                  </div>
                </a>
              )}

              {filiale.email && (
                <a
                  href={`mailto:${filiale.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {filiale.email}
                    </p>
                  </div>
                </a>
              )}

              {filiale.site_web && (
                <a
                  href={filiale.site_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Site web</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors flex items-center gap-2">
                      {filiale.site_web}
                      <ExternalLink className="h-4 w-4" />
                    </p>
                  </div>
                </a>
              )}

              {!filiale.telephone && !filiale.email && !filiale.site_web && (
                <p className="text-gray-400 italic text-center py-4">Aucune information de contact</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Direction */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-phi-highlight" />
                Direction
              </h3>
            </div>
            <div className="p-6">
              {filiale.directeur_nom ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-phi-accent to-phi-accent/80 rounded-xl flex items-center justify-center text-white font-bold">
                    {filiale.directeur_nom.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{filiale.directeur_nom}</p>
                    <p className="text-sm text-gray-500">Directeur</p>
                    {filiale.directeur_email && (
                      <a
                        href={`mailto:${filiale.directeur_email}`}
                        className="text-sm text-phi-primary hover:underline mt-2 inline-block"
                      >
                        {filiale.directeur_email}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 italic text-center py-4">Aucun directeur assigné</p>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                Informations
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium text-gray-900">
                  {new Date(filiale.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dernière mise à jour</p>
                <p className="font-medium text-gray-900">
                  {new Date(filiale.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
