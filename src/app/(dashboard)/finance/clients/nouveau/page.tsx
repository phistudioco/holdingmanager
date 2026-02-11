import { PageHeader } from '@/components/common/PageHeader'
import { ClientForm } from '@/components/finance/ClientForm'

export default function NouveauClientPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau client"
        description="Ajoutez un nouveau client ou prospect"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Clients', href: '/finance/clients' },
          { label: 'Nouveau' },
        ]}
      />

      <ClientForm mode="create" />
    </div>
  )
}
