import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { ContratForm } from '@/components/finance/ContratForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditContratPage({ params }: PageProps) {
  const resolvedParams = await params
  const contratId = parseInt(resolvedParams.id)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contrats')
    .select('*')
    .eq('id', contratId)
    .single()

  if (error || !data) {
    notFound()
  }

  const contrat = data as Tables<'contrats'>

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifier ${contrat.numero}`}
        description={contrat.titre}
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Contrats', href: '/finance/contrats' },
          { label: contrat.numero, href: `/finance/contrats/${contrat.id}` },
          { label: 'Modifier' },
        ]}
      />

      <ContratForm contrat={contrat} mode="edit" />
    </div>
  )
}
