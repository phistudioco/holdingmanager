import { PageHeader } from '@/components/common/PageHeader'
import { FactureForm } from '@/components/finance/FactureForm'

export default function NouvelleFacturePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Nouvelle facture"
        description="Créez une nouvelle facture ou un avoir"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Factures', href: '/finance/factures' },
          { label: 'Nouveau' },
        ]}
      />

      <FactureForm mode="create" />
    </div>
  )
}
