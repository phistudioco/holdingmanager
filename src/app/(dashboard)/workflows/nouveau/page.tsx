import { PageHeader } from '@/components/common/PageHeader'
import { WorkflowForm } from '@/components/workflows/WorkflowForm'

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
