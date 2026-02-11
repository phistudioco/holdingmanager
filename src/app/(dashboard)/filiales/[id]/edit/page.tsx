import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { FilialeForm } from '@/components/filiales/FilialeForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditFilialePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('filiales')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const filiale: Tables<'filiales'> = data

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${filiale.nom}`}
        description="Mettez à jour les informations de la filiale"
        breadcrumbs={[
          { label: 'Filiales', href: '/filiales' },
          { label: filiale.nom, href: `/filiales/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <FilialeForm filiale={filiale} mode="edit" />
    </div>
  )
}
