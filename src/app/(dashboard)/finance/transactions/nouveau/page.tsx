import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/common/PageHeader'
import { Loader2 } from 'lucide-react'

const TransactionForm = dynamic(
  () => import('@/components/finance/TransactionForm').then(mod => ({ default: mod.TransactionForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
      </div>
    )
  }
)

export default function NouvelleTransactionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle transaction"
        description="Enregistrez un revenu ou une dépense"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Transactions', href: '/finance/transactions' },
          { label: 'Nouvelle' },
        ]}
      />

      <TransactionForm mode="create" />
    </div>
  )
}
