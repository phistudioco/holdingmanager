'use client'

import { memo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'> & {
  filiale?: { nom: string; code: string } | null
}

type ClientTableRowProps = {
  client: Client
}

const ClientTableRowComponent = ({ client }: ClientTableRowProps) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <Link href={`/finance/clients/${client.id}`} className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
              client.type === 'entreprise' ? 'bg-phi-primary' : 'bg-phi-accent'
            }`}
          >
            {client.nom[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 hover:text-phi-primary">{client.nom}</p>
            <p className="text-sm text-gray-500">{client.code}</p>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            client.type === 'entreprise'
              ? 'bg-phi-primary/10 text-phi-primary'
              : 'bg-phi-accent/10 text-phi-accent'
          }`}
        >
          {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
        </span>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="text-sm">
          {client.email && <p className="text-gray-600">{client.email}</p>}
          {client.telephone && <p className="text-gray-400">{client.telephone}</p>}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
        {client.filiale?.nom || '—'}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={client.statut} />
      </td>
    </tr>
  )
}

ClientTableRowComponent.displayName = 'ClientTableRow'

export const ClientTableRow = memo(ClientTableRowComponent)
