import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const FilialeForm = dynamic(
  () => import('@/components/filiales/FilialeForm').then(mod => ({ default: mod.FilialeForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouvelleFilialesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouvelle filiale"
        description="Créez une nouvelle filiale pour votre holding"
        breadcrumbs={[
          { label: 'Filiales', href: '/filiales' },
          { label: 'Nouvelle filiale' },
        ]}
      />

      <FilialeForm mode="create" />
    </div>
  )
}
