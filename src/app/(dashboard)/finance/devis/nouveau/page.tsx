import { PageHeader } from '@/components/common/PageHeader'
import { DevisForm } from '@/components/finance/DevisForm'

export default function NouveauDevisPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Nouveau devis"
        description="Créez une nouvelle proposition commerciale"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Devis', href: '/finance/devis' },
          { label: 'Nouveau' },
        ]}
      />

      <DevisForm mode="create" />
    </div>
  )
}
