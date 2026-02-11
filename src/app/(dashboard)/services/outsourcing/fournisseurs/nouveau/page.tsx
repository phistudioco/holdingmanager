import { PageHeader } from '@/components/common/PageHeader'
import { FournisseurForm } from '@/components/services/FournisseurForm'

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
