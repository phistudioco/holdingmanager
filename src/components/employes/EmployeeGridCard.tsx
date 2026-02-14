'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Building2, Mail } from 'lucide-react'
import { getAvatarBlurDataURL } from '@/lib/utils/image-shimmer'
import type { Tables } from '@/types/database'

type Employe = Tables<'employes'> & {
  filiale?: { nom: string; code: string } | null
  service?: { nom: string; couleur: string } | null
}

type EmployeeGridCardProps = {
  employe: Employe
  index: number
}

const EmployeeGridCardComponent = ({ employe, index }: EmployeeGridCardProps) => {
  return (
    <Link
      href={`/employes/${employe.id}`}
      className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-phi-primary/20">
        {/* Service color bar */}
        <div
          className="h-1.5"
          style={{ backgroundColor: employe.service?.couleur || '#6b7280' }}
        />

        <div className="p-5">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-phi-primary to-phi-accent rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-phi-primary/20 group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
              {employe.photo ? (
                <Image
                  src={employe.photo}
                  alt={`${employe.prenom} ${employe.nom}`}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={getAvatarBlurDataURL(56)}
                />
              ) : (
                <>{employe.prenom[0]}{employe.nom[0]}</>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-phi-primary transition-colors truncate">
                {employe.prenom} {employe.nom}
              </h3>
              <p className="text-sm text-gray-500 truncate">{employe.poste || 'Poste non défini'}</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{employe.filiale?.nom || '—'}</span>
            </div>
            {employe.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{employe.email}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {employe.matricule}
            </code>
            <StatusBadge status={employe.statut} />
          </div>
        </div>
      </div>
    </Link>
  )
}

EmployeeGridCardComponent.displayName = 'EmployeeGridCard'

export const EmployeeGridCard = memo(EmployeeGridCardComponent)
