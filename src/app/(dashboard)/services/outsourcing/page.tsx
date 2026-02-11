'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { StatsCard } from '@/components/common/StatsCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Search,
  Plus,
  Building,
  Users,
  TrendingUp,
  ArrowRight,
  Truck,
  ShoppingCart,
  Euro,
  Star,
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
  pays: string | null
  statut: 'actif' | 'inactif' | 'en_evaluation'
  note_qualite: number | null
  created_at: string
}

type Commande = {
  id: number
  numero: string
  fournisseur_id: number
  filiale_id: number
  montant_total: number
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'livree' | 'annulee'
  date_commande: string
  date_livraison_prevue: string | null
  created_at: string
  fournisseur?: { nom: string } | null
}

export default function OutsourcingPage() {
  const [activeTab, setActiveTab] = useState<'fournisseurs' | 'commandes'>('fournisseurs')
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    fournisseurs: 0,
    fournisseursActifs: 0,
    commandesEnCours: 0,
    montantTotal: 0,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [fournisseursRes, commandesRes] = await Promise.all([
      supabase
        .from('fournisseurs')
        .select('*')
        .order('nom'),
      supabase
        .from('commandes_outsourcing')
        .select('*, fournisseur:fournisseur_id(nom)')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (fournisseursRes.data) {
      let filtered = fournisseursRes.data as Fournisseur[]
      if (search) {
        filtered = filtered.filter(f =>
          f.nom.toLowerCase().includes(search.toLowerCase())
        )
      }
      setFournisseurs(filtered)

      const actifs = (fournisseursRes.data as Fournisseur[]).filter(f => f.statut === 'actif').length
      setStats(prev => ({
        ...prev,
        fournisseurs: fournisseursRes.data!.length,
        fournisseursActifs: actifs,
      }))
    }

    if (commandesRes.data) {
      let filtered = commandesRes.data as Commande[]
      if (search && activeTab === 'commandes') {
        filtered = filtered.filter(c =>
          c.numero.toLowerCase().includes(search.toLowerCase())
        )
      }
      setCommandes(filtered)

      const enCours = (commandesRes.data as Commande[]).filter(c =>
        ['envoyee', 'confirmee'].includes(c.statut)
      ).length
      const montantTotal = (commandesRes.data as Commande[])
        .filter(c => c.statut !== 'annulee')
        .reduce((sum, c) => sum + c.montant_total, 0)

      setStats(prev => ({
        ...prev,
        commandesEnCours: enCours,
        montantTotal,
      }))
    }

    setLoading(false)
  }, [search, activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      actif: 'bg-green-100 text-green-700',
      inactif: 'bg-gray-100 text-gray-700',
      en_evaluation: 'bg-amber-100 text-amber-700',
      brouillon: 'bg-gray-100 text-gray-700',
      envoyee: 'bg-blue-100 text-blue-700',
      confirmee: 'bg-purple-100 text-purple-700',
      livree: 'bg-green-100 text-green-700',
      annulee: 'bg-red-100 text-red-700',
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      actif: 'Actif',
      inactif: 'Inactif',
      en_evaluation: 'En évaluation',
      brouillon: 'Brouillon',
      envoyee: 'Envoyée',
      confirmee: 'Confirmée',
      livree: 'Livrée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
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
    if (note === null) return <span className="text-gray-400 text-sm">Non noté</span>
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  // Theme color for OutSourcing service (Blue)
  const themeColor = '#0f2080'
  const themeLight = '#1a2d9c'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Out Sourcing"
        description="Gestion des fournisseurs et commandes externes"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing' },
        ]}
      />

      {/* Stats Cards with OutSourcing theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeLight} 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <Building className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Fournisseurs</p>
          <p className="text-3xl font-bold">{stats.fournisseurs}</p>
        </div>

        <StatsCard
          title="Fournisseurs actifs"
          value={stats.fournisseursActifs}
          icon={Users}
          trend="Partenaires"
          trendUp={true}
        />

        <StatsCard
          title="Commandes en cours"
          value={stats.commandesEnCours}
          icon={Truck}
          trend="En traitement"
          trendUp={stats.commandesEnCours > 0}
        />

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Euro className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Volume d&apos;achats</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.montantTotal)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('fournisseurs')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'fournisseurs'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={activeTab === 'fournisseurs' ? { backgroundColor: themeColor } : {}}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="h-4 w-4" />
              Fournisseurs
            </div>
          </button>
          <button
            onClick={() => setActiveTab('commandes')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'commandes'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={activeTab === 'commandes' ? { backgroundColor: themeColor } : {}}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
            </div>
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={activeTab === 'fournisseurs' ? "Rechercher un fournisseur..." : "Rechercher une commande..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link href={activeTab === 'fournisseurs' ? '/services/outsourcing/fournisseurs/nouveau' : '/services/outsourcing/commandes/nouveau'}>
              <Button
                style={{ backgroundColor: themeColor }}
                className="hover:opacity-90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === 'fournisseurs' ? 'Nouveau fournisseur' : 'Nouvelle commande'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: themeColor }}
              />
            </div>
          ) : activeTab === 'fournisseurs' ? (
            fournisseurs.length === 0 ? (
              <EmptyState
                icon={Building}
                title="Aucun fournisseur"
                description={search ? "Aucun fournisseur ne correspond" : "Ajoutez votre premier fournisseur"}
                action={{
                  label: "Ajouter un fournisseur",
                  href: "/services/outsourcing/fournisseurs/nouveau"
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fournisseurs.map((fournisseur) => (
                  <div
                    key={fournisseur.id}
                    className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: themeColor }}
                        >
                          {fournisseur.nom[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{fournisseur.nom}</h3>
                          <p className="text-xs text-gray-500">{getTypeLabel(fournisseur.type)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(fournisseur.statut)}`}>
                        {getStatutLabel(fournisseur.statut)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {fournisseur.contact_nom && (
                        <p className="text-sm text-gray-600">
                          Contact: {fournisseur.contact_nom}
                        </p>
                      )}
                      {fournisseur.ville && (
                        <p className="text-sm text-gray-500">
                          {fournisseur.ville}{fournisseur.pays && `, ${fournisseur.pays}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Qualité:</span>
                        {renderStars(fournisseur.note_qualite)}
                      </div>
                    </div>

                    <Link
                      href={`/services/outsourcing/fournisseurs/${fournisseur.id}`}
                      className="flex items-center justify-between text-sm font-medium transition-colors"
                      style={{ color: themeColor }}
                    >
                      <span>Voir la fiche</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : (
            commandes.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Aucune commande"
                description={search ? "Aucune commande ne correspond" : "Créez votre première commande"}
                action={{
                  label: "Nouvelle commande",
                  href: "/services/outsourcing/commandes/nouveau"
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">N° Commande</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fournisseur</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Montant</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commandes.map((commande) => (
                      <tr key={commande.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{commande.numero}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {commande.fournisseur?.nom || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(commande.date_commande)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(commande.montant_total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(commande.statut)}`}>
                            {getStatutLabel(commande.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/services/outsourcing/commandes/${commande.id}`}
                            className="text-sm font-medium hover:underline"
                            style={{ color: themeColor }}
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
