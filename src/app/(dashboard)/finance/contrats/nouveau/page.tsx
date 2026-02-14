import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const ContratForm = dynamic(
  () => import('@/components/finance/ContratForm').then(mod => ({ default: mod.ContratForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouveauContratPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau contrat"
        description="Créez un nouveau contrat client"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Contrats', href: '/finance/contrats' },
          { label: 'Nouveau' },
        ]}
      />

      <ContratForm mode="create" />
    </div>
  )
}
