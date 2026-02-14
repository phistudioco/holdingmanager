import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const WorkflowForm = dynamic(
  () => import('@/components/workflows/WorkflowForm').then(mod => ({ default: mod.WorkflowForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouvelleDemandeWorkflowPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle demande"
        description="Créer une nouvelle demande de workflow"
      />

      <WorkflowForm mode="create" />
    </div>
  )
}
