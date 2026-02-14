import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const ProjetDigitalForm = dynamic(
  () => import('@/components/services/ProjetDigitalForm').then(mod => ({ default: mod.ProjetDigitalForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouveauProjetDigitalPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau projet digital"
        description="Créez un nouveau projet web ou application"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Digital', href: '/services/digital' },
          { label: 'Nouveau' },
        ]}
      />

      <ProjetDigitalForm mode="create" />
    </div>
  )
}
