import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-phi-primary',
        sizeStyles[size],
        className
      )}
    />
  )
}

type LoadingPageProps = {
  message?: string
}

export function LoadingPage({ message = 'Chargement...' }: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
