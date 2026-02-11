'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

type DeleteContratButtonProps = {
  contratId: number
  contratNumero: string
}

export function DeleteContratButton({ contratId, contratNumero }: DeleteContratButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Appel à l'API route sécurisée
      const response = await fetch(`/api/contrats/${contratId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // Afficher le message d'erreur spécifique de l'API
        throw new Error(data.message || data.error || 'Erreur lors de la suppression')
      }

      // Succès - rediriger vers la liste des contrats
      router.push('/finance/contrats')
      router.refresh()
    } catch (err) {
      console.error('Erreur suppression:', err)
      const errorMessage = err instanceof Error ? err.message : 'Impossible de supprimer ce contrat.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer le contrat</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer le contrat <strong>{contratNumero}</strong> ?
            </p>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
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
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowConfirm(true)}
      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </Button>
  )
}
