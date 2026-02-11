import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreadcrumbItem = {
  label: string
  href?: string
}

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  action?: {
    label: string
    href?: string
    onClick?: () => void
    icon?: LucideIcon
  }
  // Alias pour compatibilité
  actionLabel?: string
  actionHref?: string
  // Actions personnalisées (JSX)
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  actionLabel,
  actionHref,
  actions,
  className,
}: PageHeaderProps) {
  // Support des deux formats de props
  const finalAction = action || (actionLabel ? { label: actionLabel, href: actionHref } : undefined)
  const ActionIcon = finalAction?.icon || Plus

  return (
    <div className={cn('space-y-2', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-phi-primary">
            Accueil
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              {item.href ? (
                <Link href={item.href} className="hover:text-phi-primary">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {title}
          </h1>
          {description && (
            <p className="text-gray-500 mt-1">{description}</p>
          )}
        </div>

        {actions ? (
          actions
        ) : finalAction && (
          finalAction.href ? (
            <Link href={finalAction.href}>
              <Button className="bg-phi-primary hover:bg-phi-primary/90">
                <ActionIcon className="h-4 w-4 mr-2" />
                {finalAction.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={finalAction.onClick}
              className="bg-phi-primary hover:bg-phi-primary/90"
            >
              <ActionIcon className="h-4 w-4 mr-2" />
              {finalAction.label}
            </Button>
          )
        )}
      </div>
    </div>
  )
}
