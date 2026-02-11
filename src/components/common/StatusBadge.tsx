import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

type StatusConfig = {
  label: string
  variant: StatusVariant
}

const statusMap: Record<string, StatusConfig> = {
  // Statuts généraux
  actif: { label: 'Actif', variant: 'success' },
  inactif: { label: 'Inactif', variant: 'default' },
  suspendu: { label: 'Suspendu', variant: 'error' },
  en_creation: { label: 'En création', variant: 'info' },

  // Statuts employés
  en_conge: { label: 'En congé', variant: 'warning' },
  sorti: { label: 'Sorti', variant: 'default' },

  // Statuts clients
  prospect: { label: 'Prospect', variant: 'info' },

  // Statuts factures
  brouillon: { label: 'Brouillon', variant: 'default' },
  envoyee: { label: 'Envoyée', variant: 'info' },
  partiellement_payee: { label: 'Partiellement payée', variant: 'warning' },
  payee: { label: 'Payée', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'error' },

  // Statuts workflows
  en_cours: { label: 'En cours', variant: 'info' },
  approuve: { label: 'Approuvé', variant: 'success' },
  rejete: { label: 'Rejeté', variant: 'error' },
  annule: { label: 'Annulé', variant: 'default' },
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
}

type StatusBadgeProps = {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'default' as StatusVariant }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[config.variant],
        className
      )}
    >
      {config.label}
    </span>
  )
}
