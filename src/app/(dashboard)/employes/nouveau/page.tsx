import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const EmployeForm = dynamic(
  () => import('@/components/employes/EmployeForm').then(mod => ({ default: mod.EmployeForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

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
