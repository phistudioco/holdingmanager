'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { TransactionForm } from '@/components/finance/TransactionForm'

type Transaction = {
  id: number
  filiale_id: number
  type: 'revenu' | 'depense'
  categorie: string
  montant: number
  date_transaction: string
  description: string | null
  reference: string | null
  client_id: number | null
  facture_id: number | null
  statut: 'en_attente' | 'validee' | 'annulee'
  created_at: string
  updated_at: string
}

export default function EditTransactionPage() {
  const params = useParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransaction = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        return
      }

      setTransaction(data as Transaction)
      setLoading(false)
    }

    fetchTransaction()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-phi-primary" />
      </div>
    )
  }

  if (!transaction) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier la transaction"
        description={`Transaction #${transaction.id}`}
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Transactions', href: '/finance/transactions' },
          { label: `#${transaction.id}`, href: `/finance/transactions/${transaction.id}` },
          { label: 'Modifier' },
        ]}
      />

      <TransactionForm transaction={transaction} mode="edit" />
    </div>
  )
}
