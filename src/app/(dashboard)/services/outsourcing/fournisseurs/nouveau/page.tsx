import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const FournisseurForm = dynamic(
  () => import('@/components/services/FournisseurForm').then(mod => ({ default: mod.FournisseurForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouveauFournisseurPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau fournisseur"
        description="Ajoutez un nouveau partenaire fournisseur"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: 'Nouveau fournisseur' },
        ]}
      />

      <FournisseurForm mode="create" />
    </div>
  )
}
