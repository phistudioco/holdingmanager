import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  Hash,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

type EmployeWithRelations = Tables<'employes'> & {
  filiale: { nom: string; code: string } | null
  service: { nom: string; couleur: string } | null
}

export default async function EmployeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employes')
    .select(`
      *,
      filiale:filiale_id (nom, code),
      service:service_id (nom, couleur)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const employe = data as EmployeWithRelations

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatSalary = (salary: number | null) => {
    if (!salary) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(salary)
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const calculateSeniority = (hireDate: string) => {
    const today = new Date()
    const hire = new Date(hireDate)
    const years = today.getFullYear() - hire.getFullYear()
    const months = today.getMonth() - hire.getMonth()
    if (years === 0) {
      return `${months} mois`
    }
    return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` et ${months} mois` : ''}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <Link
            href="/employes"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-phi-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux employés
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden relative"
              style={{ backgroundColor: employe.service?.couleur || '#0F2080' }}
            >
              {employe.photo ? (
                <Image
                  src={employe.photo}
                  alt={`${employe.prenom} ${employe.nom}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <>{employe.prenom[0]}{employe.nom[0]}</>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-heading font-bold text-gray-900">
                  {employe.prenom} {employe.nom}
                </h1>
                <StatusBadge status={employe.statut} />
              </div>
              <p className="text-lg text-gray-600">{employe.poste || 'Poste non défini'}</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                  {employe.matricule}
                </code>
                {employe.service && (
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: employe.service.couleur }}
                  >
                    {employe.service.nom}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/employes/${id}/edit`}>
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
              <p className="font-semibold text-gray-900">{employe.filiale?.nom || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-phi-accent/10 rounded-xl">
              <Calendar className="h-5 w-5 text-phi-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ancienneté</p>
              <p className="font-semibold text-gray-900">{calculateSeniority(employe.date_embauche)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Salaire</p>
              <p className="font-semibold text-gray-900">{formatSalary(employe.salaire)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Âge</p>
              <p className="font-semibold text-gray-900">
                {calculateAge(employe.date_naissance) ? `${calculateAge(employe.date_naissance)} ans` : '—'}
              </p>
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
              {employe.email && (
                <a
                  href={`mailto:${employe.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {employe.email}
                    </p>
                  </div>
                </a>
              )}

              {employe.telephone && (
                <a
                  href={`tel:${employe.telephone}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900 group-hover:text-phi-primary transition-colors">
                      {employe.telephone}
                    </p>
                  </div>
                </a>
              )}

              {employe.adresse && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium text-gray-900">{employe.adresse}</p>
                  </div>
                </div>
              )}

              {!employe.email && !employe.telephone && !employe.adresse && (
                <p className="text-gray-400 italic text-center py-4">Aucune information de contact</p>
              )}
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-phi-accent" />
                Informations professionnelles
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Matricule</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                    <Hash className="h-4 w-4 text-gray-400" />
                    {employe.matricule}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Poste</p>
                  <p className="font-medium text-gray-900 mt-1">{employe.poste || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date d'embauche</p>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(employe.date_embauche)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salaire mensuel</p>
                  <p className="font-medium text-gray-900 mt-1">{formatSalary(employe.salaire)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-phi-highlight" />
                Informations personnelles
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Date de naissance</p>
                <p className="font-medium text-gray-900">{formatDate(employe.date_naissance)}</p>
              </div>
              {employe.date_naissance && (
                <div>
                  <p className="text-sm text-gray-500">Âge</p>
                  <p className="font-medium text-gray-900">{calculateAge(employe.date_naissance)} ans</p>
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
                <p className="font-medium text-gray-900">{formatDate(employe.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modifié le</p>
                <p className="font-medium text-gray-900">{formatDate(employe.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
