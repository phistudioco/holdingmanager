'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { downloadContratPDF } from '@/lib/pdf/contrat-pdf'

type ContratData = {
  numero: string
  titre: string
  type: string
  date_debut: string
  date_fin: string
  montant: number
  periodicite: string | null
  reconduction_auto: boolean
  conditions: string | null
  statut: string
}

type ClientData = {
  nom: string
  code: string
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  siret: string | null
  tva_intracommunautaire: string | null
}

type FilialeData = {
  nom: string
  code: string
  adresse: string | null
  ville: string | null
  code_postal: string | null
  telephone: string | null
  email: string | null
}

type DownloadContratPDFProps = {
  contrat: ContratData
  client: ClientData
  filiale: FilialeData
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showText?: boolean
}

export function DownloadContratPDF({
  contrat,
  client,
  filiale,
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true,
}: DownloadContratPDFProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      await downloadContratPDF({
        contrat,
        client,
        filiale,
      })
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showText && (loading ? 'Génération...' : 'Télécharger PDF')}
    </Button>
  )
}
