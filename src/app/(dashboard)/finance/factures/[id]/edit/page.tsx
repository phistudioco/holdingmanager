import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { FactureForm } from '@/components/finance/FactureForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditFacturePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const facture: Tables<'factures'> = data

  // Récupérer les lignes de la facture
  const { data: lignesData } = await supabase
    .from('facture_lignes')
    .select('*')
    .eq('facture_id', id)
    .order('ordre')

  const lignesTyped = (lignesData || []) as Tables<'facture_lignes'>[]
  const lignes = lignesTyped.map(ligne => ({
    id: ligne.id,
    description: ligne.description,
    quantite: ligne.quantite,
    prix_unitaire: ligne.prix_unitaire,
    taux_tva: ligne.taux_tva,
    montant_ht: ligne.montant_ht,
    montant_tva: ligne.montant_tva,
    montant_ttc: ligne.montant_ttc,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${facture.numero}`}
        description="Mettez à jour les informations de la facture"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Factures', href: '/finance/factures' },
          { label: facture.numero, href: `/finance/factures/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <FactureForm facture={facture} lignes={lignes} mode="edit" />
    </div>
  )
}
