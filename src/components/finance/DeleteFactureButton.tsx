'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

type DeleteFactureButtonProps = {
  factureId: number
  factureNumero: string
  className?: string
}

export function DeleteFactureButton({
  factureId,
  factureNumero,
  className = '',
}: DeleteFactureButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Supprimer d'abord les lignes (même si ON DELETE CASCADE devrait le faire)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('facture_lignes')
        .delete()
        .eq('facture_id', factureId)

      // Supprimer la facture
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('factures')
        .delete()
        .eq('id', factureId)

      if (error) throw error

      router.push('/finance/factures')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de la facture')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Supprimer la facture</h3>
              <p className="text-sm text-gray-500">{factureNumero}</p>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowConfirm(true)}
      className={`gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${className}`}
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </Button>
  )
}
