'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { FournisseurForm } from '@/components/services/FournisseurForm'
import { Button } from '@/components/ui/button'
import { Building, Loader2, ArrowLeft } from 'lucide-react'

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
}

const themeColor = '#0f2080'

export default function EditFournisseurPage() {
  const params = useParams()
  const fournisseurId = Number(params.id)

  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${fournisseur.nom}`}
        description="Mettez à jour les informations du fournisseur"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: fournisseur.nom, href: `/services/outsourcing/fournisseurs/${fournisseur.id}` },
          { label: 'Modifier' },
        ]}
      />

      <FournisseurForm fournisseur={fournisseur} mode="edit" />
    </div>
  )
}
