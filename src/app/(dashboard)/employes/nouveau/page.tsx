import { PageHeader } from '@/components/common/PageHeader'
import { EmployeForm } from '@/components/employes/EmployeForm'

export default function NouvelEmployePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Nouvel employé"
        description="Ajoutez un nouvel employé à votre holding"
        breadcrumbs={[
          { label: 'Employés', href: '/employes' },
          { label: 'Nouvel employé' },
        ]}
      />

      <EmployeForm mode="create" />
    </div>
  )
}
