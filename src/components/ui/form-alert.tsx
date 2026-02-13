import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormAlertProps {
  type?: 'error' | 'success' | 'info' | 'warning'
  message?: string
  messages?: string[]
  className?: string
  'aria-label'?: string
}

const alertConfig = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
    defaultLabel: 'Erreur de formulaire',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconColor: 'text-green-500',
    defaultLabel: 'Succès',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-500',
    defaultLabel: 'Avertissement',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
    defaultLabel: 'Information',
  },
}

/**
 * Composant d'alerte accessible pour les formulaires
 * Conforme WCAG AA avec role="alert" et aria-live
 */
export function FormAlert({
  type = 'error',
  message,
  messages = [],
  className,
  'aria-label': ariaLabel,
}: FormAlertProps) {
  if (!message && messages.length === 0) return null

  const config = alertConfig[type]
  const Icon = config.icon
  const displayMessages = message ? [message] : messages

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-label={ariaLabel || config.defaultLabel}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} aria-hidden="true" />
      <div className="flex-1">
        {displayMessages.length === 1 ? (
          <p className={cn('text-sm font-medium', config.textColor)}>{displayMessages[0]}</p>
        ) : (
          <ul className={cn('text-sm space-y-1', config.textColor)} role="list">
            {displayMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
