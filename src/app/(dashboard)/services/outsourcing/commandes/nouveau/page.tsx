import { PageHeader } from '@/components/common/PageHeader'
import { CommandeOutsourcingForm } from '@/components/services/CommandeOutsourcingForm'

export default function NouvelleCommandePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouvelle commande"
        description="Créez une nouvelle commande fournisseur"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Out Sourcing', href: '/services/outsourcing' },
          { label: 'Nouvelle commande' },
        ]}
      />

      <CommandeOutsourcingForm mode="create" />
    </div>
  )
}
