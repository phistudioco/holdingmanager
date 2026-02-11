import { PageHeader } from '@/components/common/PageHeader'
import { ContratForm } from '@/components/finance/ContratForm'

export default function NouveauContratPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau contrat"
        description="Créez un nouveau contrat client"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Contrats', href: '/finance/contrats' },
          { label: 'Nouveau' },
        ]}
      />

      <ContratForm mode="create" />
    </div>
  )
}
