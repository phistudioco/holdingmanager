'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { ProjetRobotiqueForm } from '@/components/services/ProjetRobotiqueForm'
import { Button } from '@/components/ui/button'
import { Bot, Loader2, ArrowLeft } from 'lucide-react'

type ProjetRobotique = {
  id: number
  nom: string
  description: string | null
  client_id: number | null
  filiale_id: number
  statut: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
  date_debut: string | null
  date_fin_prevue: string | null
  budget: number | null
}

const themeColor = '#e72572'

export default function EditProjetRobotiquePage() {
  const params = useParams()
  const projetId = Number(params.id)

  const [projet, setProjet] = useState<ProjetRobotique | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjet = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('projets_robotique')
        .select('*')
        .eq('id', projetId)
        .single()

      if (error) {
        console.error('Erreur:', error)
        setLoading(false)
        return
      }

      setProjet(data as ProjetRobotique)
      setLoading(false)
    }

    fetchProjet()
  }, [projetId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeColor }} />
      </div>
    )
  }

  if (!projet) {
    return (
      <div className="text-center py-12">
        <Bot className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Projet non trouvé</h2>
        <p className="text-gray-500 mb-6">Ce projet n&apos;existe pas ou a été supprimé.</p>
        <Link href="/services/robotique">
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
        title={`Modifier ${projet.nom}`}
        description="Mettez à jour les informations du projet"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Robotique', href: '/services/robotique' },
          { label: projet.nom, href: `/services/robotique/${projet.id}` },
          { label: 'Modifier' },
        ]}
      />

      <ProjetRobotiqueForm projet={projet} mode="edit" />
    </div>
  )
}
