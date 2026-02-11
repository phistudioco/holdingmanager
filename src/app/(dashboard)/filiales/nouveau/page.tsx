import { PageHeader } from '@/components/common/PageHeader'
import { FilialeForm } from '@/components/filiales/FilialeForm'

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
