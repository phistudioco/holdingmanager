import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUntypedClient } from '@/lib/supabase/client'

/**
 * DELETE /api/factures/[id]
 *
 * Supprime une facture et ses lignes associées
 * Vérifie les permissions avant la suppression
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const factureId = parseInt(id)

    if (isNaN(factureId)) {
      return NextResponse.json(
        { error: 'ID de facture invalide' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les informations de l'utilisateur avec son rôle
    const db = createUntypedClient()
    const { data: userProfile, error: profileError } = await db
      .from('users')
      .select(`
        *,
        role:role_id (
          nom,
          niveau
        )
      `)
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profil utilisateur non trouvé' },
        { status: 403 }
      )
    }

    // Vérifier les permissions de suppression
    // Seuls super_admin et admin peuvent supprimer des factures
    const roleNiveau = userProfile.role?.niveau || 0
    const canDelete = roleNiveau >= 80 // admin (80) ou super_admin (100)

    if (!canDelete) {
      return NextResponse.json(
        {
          error: 'Permission refusée',
          message: 'Vous n\'avez pas les droits pour supprimer des factures. Contact un administrateur.',
        },
        { status: 403 }
      )
    }

    // Récupérer la facture pour vérifier qu'elle existe
    const { data: facture, error: fetchError } = await db
      .from('factures')
      .select('id, numero, statut')
      .eq('id', factureId)
      .single()

    if (fetchError || !facture) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier le statut de la facture
    if (facture.statut === 'payee' || facture.statut === 'partiellement_payee') {
      return NextResponse.json(
        {
          error: 'Suppression impossible',
          message: `La facture ${facture.numero} ne peut pas être supprimée car elle est déjà payée (totalement ou partiellement).`,
        },
        { status: 400 }
      )
    }

    // Supprimer les lignes de facture en premier (contrainte FK)
    const { error: deleteLignesError } = await db
      .from('facture_lignes')
      .delete()
      .eq('facture_id', factureId)

    if (deleteLignesError) {
      console.error('Erreur suppression lignes facture:', deleteLignesError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des lignes de facture' },
        { status: 500 }
      )
    }

    // Supprimer la facture
    const { error: deleteError } = await db
      .from('factures')
      .delete()
      .eq('id', factureId)

    if (deleteError) {
      console.error('Erreur suppression facture:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la facture' },
        { status: 500 }
      )
    }

    // Log de l'action (optionnel, pour audit)
    await db
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'delete',
        entity_type: 'facture',
        entity_id: factureId,
        details: `Suppression de la facture ${facture.numero}`,
      })
      .catch((err: unknown) => {
        // Ne pas bloquer la suppression si le log échoue
        console.error('Erreur log activité:', err)
      })

    return NextResponse.json({
      success: true,
      message: `Facture ${facture.numero} supprimée avec succès`,
    })

  } catch (error) {
    console.error('Erreur suppression facture:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}
