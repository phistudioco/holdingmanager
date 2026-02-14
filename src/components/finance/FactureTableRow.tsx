'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Loader2 } from 'lucide-react'
import type { Tables } from '@/types/database'

type Facture = Tables<'factures'> & {
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
}

type FactureTableRowProps = {
  facture: Facture
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
  isOverdue: (date: string, statut: string) => boolean
  getStatutColor: (statut: string) => string
  getStatutLabel: (statut: string) => string
  onDownloadPDF: (id: number) => void
  downloadingId: number | null
}

const FactureTableRowComponent = ({
  facture,
  formatDate,
  formatCurrency,
  isOverdue,
  getStatutColor,
  getStatutLabel,
  onDownloadPDF,
  downloadingId,
}: FactureTableRowProps) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <Link href={`/finance/factures/${facture.id}`} className="block">
          <p className="font-semibold text-gray-900 hover:text-phi-primary">{facture.numero}</p>
          <p className="text-sm text-gray-500">{facture.objet || 'Sans objet'}</p>
        </Link>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        {facture.client ? (
          <Link href={`/finance/clients/${facture.client_id}`} className="hover:text-phi-primary">
            <p className="font-medium text-gray-900">{facture.client.nom}</p>
            <p className="text-sm text-gray-500">{facture.client.code}</p>
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-gray-900">{formatDate(facture.date_emission)}</p>
            <p className={`text-xs ${isOverdue(facture.date_echeance, facture.statut) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              Éch. {formatDate(facture.date_echeance)}
              {isOverdue(facture.date_echeance, facture.statut) && ' (En retard)'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <p className="font-semibold text-gray-900">{formatCurrency(facture.total_ttc)}</p>
        {facture.montant_paye > 0 && facture.montant_paye < facture.total_ttc && (
          <p className="text-xs text-green-600">
            Payé: {formatCurrency(facture.montant_paye)}
          </p>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(facture.statut)}`}>
          {getStatutLabel(facture.statut)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/finance/factures/${facture.id}`}>
            <Button variant="ghost" size="sm">
              Voir
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-phi-accent"
            onClick={() => onDownloadPDF(facture.id)}
            disabled={downloadingId === facture.id}
          >
            {downloadingId === facture.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  )
}

FactureTableRowComponent.displayName = 'FactureTableRow'

export const FactureTableRow = memo(FactureTableRowComponent)
