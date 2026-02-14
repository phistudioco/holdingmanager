import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const ClientForm = dynamic(
  () => import('@/components/finance/ClientForm').then(mod => ({ default: mod.ClientForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

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
