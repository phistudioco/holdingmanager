import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { ClientForm } from '@/components/finance/ClientForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const client: Tables<'clients'> = data

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${client.nom}`}
        description="Mettez à jour les informations du client"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Clients', href: '/finance/clients' },
          { label: client.nom, href: `/finance/clients/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <ClientForm client={client} mode="edit" />
    </div>
  )
}
