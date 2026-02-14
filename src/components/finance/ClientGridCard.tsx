'use client'

import { memo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Building2, Mail, Phone } from 'lucide-react'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'> & {
  filiale?: { nom: string; code: string } | null
}

type ClientGridCardProps = {
  client: Client
}

const ClientGridCardComponent = ({ client }: ClientGridCardProps) => {
  return (
    <Link
      href={`/finance/clients/${client.id}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-phi-primary/30 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 ${
            client.type === 'entreprise'
              ? 'bg-gradient-to-br from-phi-primary to-blue-600'
              : 'bg-gradient-to-br from-phi-accent to-pink-600'
          }`}
        >
          {client.nom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-phi-primary transition-colors">
              {client.nom}
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-2">{client.code}</p>
          <StatusBadge status={client.statut} />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.telephone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{client.telephone}</span>
          </div>
        )}
        {client.filiale && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span>{client.filiale.nom}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            client.type === 'entreprise'
              ? 'bg-phi-primary/10 text-phi-primary'
              : 'bg-phi-accent/10 text-phi-accent'
          }`}
        >
          {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
        </span>
        {client.ville && (
          <span className="text-xs text-gray-400">{client.ville}</span>
        )}
      </div>
    </Link>
  )
}

ClientGridCardComponent.displayName = 'ClientGridCard'

export const ClientGridCard = memo(ClientGridCardComponent)
