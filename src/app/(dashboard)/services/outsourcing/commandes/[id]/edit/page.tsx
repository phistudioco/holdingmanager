'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { CommandeOutsourcingForm } from '@/components/services/CommandeOutsourcingForm'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Loader2, ArrowLeft } from 'lucide-react'

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
}

const themeColor = '#0f2080'

export default function EditCommandePage() {
  const params = useParams()
  const commandeId = Number(params.id)

  const [commande, setCommande] = useState<CommandeOutsourcing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCommande = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('commandes_outsourcing')
        .select('*')
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${commande.numero}`}
        description="Mettez à jour les informations de la commande"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: commande.numero, href: `/services/outsourcing/commandes/${commande.id}` },
          { label: 'Modifier' },
        ]}
      />

      <CommandeOutsourcingForm commande={commande} mode="edit" />
    </div>
  )
}
