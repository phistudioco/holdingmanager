'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { downloadFacturePDF } from '@/lib/pdf/facture-pdf'

type FactureData = {
  numero: string
  type: string
  date_emission: string
  date_echeance: string
  objet: string | null
  total_ht: number
  taux_tva: number
  total_tva: number
  total_ttc: number
  montant_paye: number
  statut: string
  notes: string | null
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

type LigneData = {
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_ttc: number
}

type DownloadFacturePDFProps = {
  facture: FactureData
  client: ClientData
  filiale: FilialeData
  lignes: LigneData[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showText?: boolean
}

export function DownloadFacturePDF({
  facture,
  client,
  filiale,
  lignes,
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true,
}: DownloadFacturePDFProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      await downloadFacturePDF({
        facture,
        client,
        filiale,
        lignes,
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
