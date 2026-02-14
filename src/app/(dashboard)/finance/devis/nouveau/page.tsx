import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const DevisForm = dynamic(
  () => import('@/components/finance/DevisForm').then(mod => ({ default: mod.DevisForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouveauDevisPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau devis"
        description="Créez une nouvelle proposition commerciale"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Devis', href: '/finance/devis' },
          { label: 'Nouveau' },
        ]}
      />

      <DevisForm mode="create" />
    </div>
  )
}
