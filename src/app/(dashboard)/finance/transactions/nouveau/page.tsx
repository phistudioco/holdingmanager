import { PageHeader } from '@/components/common/PageHeader'
import { TransactionForm } from '@/components/finance/TransactionForm'

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
