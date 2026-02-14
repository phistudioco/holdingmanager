'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database'

type Employe = Tables<'employes'> & {
  filiale?: { nom: string; code: string } | null
  service?: { nom: string; couleur: string } | null
}

type EmployeeTableRowProps = {
  employe: Employe
  index: number
}

const EmployeeTableRowComponent = ({ employe, index }: EmployeeTableRowProps) => {
  return (
    <tr
      className="hover:bg-gray-50/50 transition-colors animate-in fade-in duration-300"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden relative"
            style={{ backgroundColor: employe.service?.couleur || '#6b7280' }}
          >
            {employe.photo ? (
              <Image
                src={employe.photo}
                alt={`${employe.prenom} ${employe.nom}`}
                fill
                className="object-cover"
              />
            ) : (
              <>{employe.prenom[0]}{employe.nom[0]}</>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{employe.prenom} {employe.nom}</p>
            <p className="text-sm text-gray-500">{employe.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 hidden sm:table-cell">
        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
          {employe.matricule}
        </code>
      </td>
      <td className="py-4 px-6 text-gray-600 hidden md:table-cell">
        {employe.filiale?.nom || '—'}
      </td>
      <td className="py-4 px-6 text-gray-600 hidden lg:table-cell">
        {employe.poste || '—'}
      </td>
      <td className="py-4 px-6">
        <StatusBadge status={employe.statut} />
      </td>
      <td className="py-4 px-6 text-right">
        <Link href={`/employes/${employe.id}`}>
          <Button variant="ghost" size="sm" className="text-phi-primary hover:text-phi-primary/80 hover:bg-phi-primary/5">
            Voir détails
          </Button>
        </Link>
      </td>
    </tr>
  )
}

EmployeeTableRowComponent.displayName = 'EmployeeTableRow'

export const EmployeeTableRow = memo(EmployeeTableRowComponent)
