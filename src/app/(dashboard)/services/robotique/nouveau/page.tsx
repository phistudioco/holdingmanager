import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const ProjetRobotiqueForm = dynamic(
  () => import('@/components/services/ProjetRobotiqueForm').then(mod => ({ default: mod.ProjetRobotiqueForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouveauProjetRobotiquePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau projet robotique"
        description="Créez un nouveau projet d'automatisation"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Robotique', href: '/services/robotique' },
          { label: 'Nouveau' },
        ]}
      />

      <ProjetRobotiqueForm mode="create" />
    </div>
  )
}
