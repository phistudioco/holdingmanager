'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'

type ApprovalDialogProps = {
  demandeId: number
  etape: number
  approbateurId: number
  onSuccess: () => void
  onCancel: () => void
}

export function ApprovalDialog({
  demandeId,
  etape,
  approbateurId,
  onSuccess,
  onCancel,
}: ApprovalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'approuve' | 'rejete' | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDecision = async (decision: 'approuve' | 'rejete') => {
    setLoading(true)
    setAction(decision)
    setError(null)

    if (decision === 'rejete' && !commentaire.trim()) {
      setError('Un commentaire est requis pour rejeter une demande')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Enregistrer l'approbation
      // Table workflow_approbations pas complètement typée dans database.ts - type assertion temporaire
      const { error: approvalError } = await (supabase as any)
        .from('workflow_approbations')
        .insert({
          demande_id: demandeId,
          etape: etape,
          approbateur_id: approbateurId,
          statut: decision,
          commentaire: commentaire || null,
          date_decision: new Date().toISOString(),
        })

      if (approvalError) throw approvalError

      // Mettre à jour le statut de la demande
      const newStatut = decision === 'approuve' ? 'approuve' : 'rejete'
      // Table workflow_demandes pas complètement typée dans database.ts - type assertion temporaire
      const { error: updateError } = await (supabase as any)
        .from('workflow_demandes')
        .update({
          statut: newStatut,
          etape_actuelle: decision === 'approuve' ? etape + 1 : etape,
          date_finalisation: new Date().toISOString(),
        })
        .eq('id', demandeId)

      if (updateError) throw updateError

      onSuccess()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-heading font-bold text-gray-900">
            Décision d'approbation
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Approuver ou rejeter cette demande
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="commentaire" className="text-sm font-medium text-gray-700">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              Commentaire {action === 'rejete' && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire (obligatoire en cas de rejet)..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-phi-primary focus:ring-2 focus:ring-phi-primary/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={() => handleDecision('rejete')}
              disabled={loading}
              variant="outline"
              className="flex-1 h-12 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl"
            >
              {loading && action === 'rejete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Rejeter
            </Button>
            <Button
              type="button"
              onClick={() => handleDecision('approuve')}
              disabled={loading}
              className="flex-1 h-12 gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
            >
              {loading && action === 'approuve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approuver
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}
