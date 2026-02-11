'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  ArrowUpRight,
} from 'lucide-react'
import type { Tables } from '@/types/database'

type FilialeCardProps = {
  filiale: Tables<'filiales'>
}

const statusColors = {
  actif: 'from-green-500',
  inactif: 'from-gray-400',
  en_creation: 'from-phi-highlight',
}

export function FilialeCard({ filiale }: FilialeCardProps) {
  return (
    <Link href={`/filiales/${filiale.id}`} className="group block">
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-phi-primary/20">
        {/* Gradient accent top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusColors[filiale.statut]} to-transparent`} />

        {/* Background pattern on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-phi-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-phi-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-phi-primary to-phi-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-phi-primary/20 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-gray-900 group-hover:text-phi-primary transition-colors">
                  {filiale.nom}
                </h3>
                <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {filiale.code}
                </code>
              </div>
            </div>
            <StatusBadge status={filiale.statut} />
          </div>

          {/* Info Grid */}
          <div className="space-y-3 mb-4">
            {filiale.ville && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <span>{filiale.ville}{filiale.code_postal && `, ${filiale.code_postal}`}</span>
              </div>
            )}

            {filiale.telephone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <span>{filiale.telephone}</span>
              </div>
            )}

            {filiale.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <span className="truncate">{filiale.email}</span>
              </div>
            )}
          </div>

          {/* Director Section */}
          {filiale.directeur_nom && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-phi-accent/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-phi-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{filiale.directeur_nom}</p>
                  <p className="text-xs text-gray-500">Directeur</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {filiale.site_web && (
                <a
                  href={filiale.site_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-phi-primary hover:bg-phi-primary/5 rounded-lg transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-phi-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Voir détails</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
