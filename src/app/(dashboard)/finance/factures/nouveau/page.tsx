import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const FactureForm = dynamic(
  () => import('@/components/finance/FactureForm').then(mod => ({ default: mod.FactureForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouvelleFacturePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Nouvelle facture"
        description="Créez une nouvelle facture ou un avoir"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Factures', href: '/finance/factures' },
          { label: 'Nouveau' },
        ]}
      />

      <FactureForm mode="create" />
    </div>
  )
}
