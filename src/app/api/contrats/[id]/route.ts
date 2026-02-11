import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUntypedClient } from '@/lib/supabase/client'

/**
 * DELETE /api/contrats/[id]
 *
 * Supprime un contrat
 * Vérifie les permissions avant la suppression
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contratId = parseInt(id)

    if (isNaN(contratId)) {
      return NextResponse.json(
        { error: 'ID de contrat invalide' },
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
    // Seuls super_admin et admin peuvent supprimer des contrats
    const roleNiveau = userProfile.role?.niveau || 0
    const canDelete = roleNiveau >= 80 // admin (80) ou super_admin (100)

    if (!canDelete) {
      return NextResponse.json(
        {
          error: 'Permission refusée',
          message: 'Vous n\'avez pas les droits pour supprimer des contrats. Contactez un administrateur.',
        },
        { status: 403 }
      )
    }

    // Récupérer le contrat pour vérifier qu'il existe
    const { data: contrat, error: fetchError } = await db
      .from('contrats')
      .select('id, numero, statut')
      .eq('id', contratId)
      .single()

    if (fetchError || !contrat) {
      return NextResponse.json(
        { error: 'Contrat non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le statut du contrat
    if (contrat.statut === 'actif') {
      return NextResponse.json(
        {
          error: 'Suppression impossible',
          message: `Le contrat ${contrat.numero} ne peut pas être supprimé car il est actuellement actif. Résiliez-le d'abord.`,
        },
        { status: 400 }
      )
    }

    // Vérifier s'il y a des factures liées au contrat
    const { data: facturesLiees, error: checkFacturesError } = await db
      .from('factures')
      .select('id')
      .eq('contrat_id', contratId)
      .limit(1)

    if (checkFacturesError) {
      console.error('Erreur vérification factures liées:', checkFacturesError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des factures liées' },
        { status: 500 }
      )
    }

    if (facturesLiees && facturesLiees.length > 0) {
      return NextResponse.json(
        {
          error: 'Suppression impossible',
          message: `Le contrat ${contrat.numero} ne peut pas être supprimé car des factures y sont liées. Supprimez d'abord les factures.`,
        },
        { status: 400 }
      )
    }

    // Supprimer le contrat
    const { error: deleteError } = await db
      .from('contrats')
      .delete()
      .eq('id', contratId)

    if (deleteError) {
      console.error('Erreur suppression contrat:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du contrat' },
        { status: 500 }
      )
    }

    // Log de l'action (optionnel, pour audit)
    await db
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'delete',
        entity_type: 'contrat',
        entity_id: contratId,
        details: `Suppression du contrat ${contrat.numero}`,
      })
      .catch((err: unknown) => {
        // Ne pas bloquer la suppression si le log échoue
        console.error('Erreur log activité:', err)
      })

    return NextResponse.json({
      success: true,
      message: `Contrat ${contrat.numero} supprimé avec succès`,
    })

  } catch (error) {
    console.error('Erreur suppression contrat:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}
