import { PageHeader } from '@/components/common/PageHeader'
import { ProjetDigitalForm } from '@/components/services/ProjetDigitalForm'

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
