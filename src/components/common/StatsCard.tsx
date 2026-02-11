import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

type StatsCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  href?: string
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  trendUp,
  className,
}: StatsCardProps) {
  const content = (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all',
        href && 'hover:shadow-md hover:border-phi-primary/30 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trendUp !== undefined && (
                trendUp ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-gray-400" />
                )
              )}
              <span
                className={cn(
                  'text-xs',
                  trendUp ? 'text-green-600' : 'text-gray-500'
                )}
              >
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-phi-primary/10 rounded-xl">
          <Icon className="h-6 w-6 text-phi-primary" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
