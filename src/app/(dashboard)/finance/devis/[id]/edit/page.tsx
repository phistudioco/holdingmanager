import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { DevisForm } from '@/components/finance/DevisForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditDevisPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const devis: Tables<'devis'> = data

  // Récupérer les lignes du devis
  const { data: lignesData } = await supabase
    .from('devis_lignes')
    .select('*')
    .eq('devis_id', id)
    .order('ordre')

  const lignesTyped = (lignesData || []) as Tables<'devis_lignes'>[]
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
        title={`Modifier ${devis.numero}`}
        description="Mettez à jour les informations du devis"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Devis', href: '/finance/devis' },
          { label: devis.numero, href: `/finance/devis/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <DevisForm devis={devis} lignes={lignes} mode="edit" />
    </div>
  )
}
