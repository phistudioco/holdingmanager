import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const CommandeOutsourcingForm = dynamic(
  () => import('@/components/services/CommandeOutsourcingForm').then(mod => ({ default: mod.CommandeOutsourcingForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouvelleCommandePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouvelle commande"
        description="Créez une nouvelle commande fournisseur"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: 'Nouvelle commande' },
        ]}
      />

      <CommandeOutsourcingForm mode="create" />
    </div>
  )
}
