import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  // Alias pour compatibilité
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  // Support des deux formats de props
  const finalAction = action || (actionLabel ? { label: actionLabel, href: actionHref } : undefined)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-500 mt-1 max-w-md">{description}</p>
      )}
      {finalAction && (
        <div className="mt-6">
          {finalAction.href ? (
            <Link href={finalAction.href}>
              <Button className="bg-phi-primary hover:bg-phi-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {finalAction.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={finalAction.onClick}
              className="bg-phi-primary hover:bg-phi-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {finalAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
