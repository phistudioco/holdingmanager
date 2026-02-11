'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

type ExportButtonProps = {
  onExport: () => void | Promise<void>
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export function ExportButton({
  onExport,
  label = 'Exporter Excel',
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport()
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading || disabled}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {size !== 'icon' && (loading ? 'Export...' : label)}
    </Button>
  )
}
