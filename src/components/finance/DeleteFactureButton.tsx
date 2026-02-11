'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      // Appel à l'API route sécurisée
      const response = await fetch(`/api/factures/${factureId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // Afficher le message d'erreur spécifique de l'API
        throw new Error(data.message || data.error || 'Erreur lors de la suppression')
      }

      // Succès - rediriger vers la liste des factures
      router.push('/finance/factures')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de la facture'
      alert(errorMessage)
      setShowConfirm(false) // Fermer le dialogue en cas d'erreur
    } finally {
      setLoading(false)
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
