import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/common/PageHeader'
import { EmployeForm } from '@/components/employes/EmployeForm'
import type { Tables } from '@/types/database'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditEmployePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const employe: Tables<'employes'> = data

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Modifier ${employe.prenom} ${employe.nom}`}
        description="Mettez à jour les informations de l'employé"
        breadcrumbs={[
          { label: 'Employés', href: '/employes' },
          { label: `${employe.prenom} ${employe.nom}`, href: `/employes/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <EmployeForm employe={employe} mode="edit" />
    </div>
  )
}
