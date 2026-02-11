import { PageHeader } from '@/components/common/PageHeader'
import { ProjetRobotiqueForm } from '@/components/services/ProjetRobotiqueForm'

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
