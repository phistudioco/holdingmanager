import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const db = await createClient()
    // Table users pas complètement typée dans database.ts - type assertion temporaire
    const { data: userProfile, error: profileError } = await (db as any)
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

    // Récupérer la facture pour vérifier qu'elle existe ET que l'utilisateur y a accès
    // Note: Si RLS bloque l'accès, la facture ne sera pas retournée (comme si elle n'existait pas)
    // Table factures pas complètement typée dans database.ts - type assertion temporaire
    const { data: facture, error: fetchError } = await (db as any)
      .from('factures')
      .select(`
        id,
        numero,
        statut,
        filiale_id,
        filiale:filiale_id (
          id,
          nom
        )
      `)
      .eq('id', factureId)
      .single()

    if (fetchError || !facture) {
      // Gérer spécifiquement les erreurs RLS
      // Code PGRST116 = no rows returned (peut être dû à RLS)
      if (fetchError?.code === 'PGRST116' || !facture) {
        return NextResponse.json(
          {
            error: 'Facture non trouvée ou accès refusé',
            message: roleNiveau < 100
              ? 'Cette facture n\'existe pas ou vous n\'avez pas accès à la filiale concernée.'
              : 'Facture introuvable.',
          },
          { status: 404 }
        )
      }

      // Autres erreurs techniques
      console.error('Erreur récupération facture:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la facture', details: fetchError?.message },
        { status: 500 }
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

      // Vérifier si c'est une erreur RLS spécifique
      if (deleteLignesError.code === '42501' || deleteLignesError.message?.includes('policy')) {
        return NextResponse.json(
          {
            error: 'Accès refusé par la sécurité',
            message: 'Les politiques de sécurité de la base de données empêchent cette suppression. Contactez un administrateur.',
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la suppression des lignes de facture', details: deleteLignesError.message },
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

      // Vérifier si c'est une erreur RLS spécifique
      if (deleteError.code === '42501' || deleteError.message?.includes('policy')) {
        return NextResponse.json(
          {
            error: 'Accès refusé par la sécurité',
            message: 'Les politiques de sécurité de la base de données empêchent cette suppression. Contactez un administrateur.',
          },
          { status: 403 }
        )
      }

      // Vérifier si c'est une contrainte FK
      if (deleteError.code === '23503') {
        return NextResponse.json(
          {
            error: 'Suppression impossible',
            message: 'Cette facture ne peut pas être supprimée car elle est liée à d\'autres données (paiements, etc.).',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la facture', details: deleteError.message },
        { status: 500 }
      )
    }

    // Log de l'action (optionnel, pour audit)
    // Table activity_logs pas complètement typée dans database.ts - type assertion temporaire
    await (db as any)
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

/**
 * PUT /api/factures/[id]
 *
 * Met à jour une facture et ses lignes de manière atomique
 * Utilise une fonction PostgreSQL pour garantir la transaction
 */
export async function PUT(
  request: NextRequest,
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

    // Récupérer les données de la requête
    const body = await request.json()
    const { facture, lignes } = body as {
      facture: Record<string, unknown>
      lignes: Array<Record<string, unknown>>
    }

    if (!facture || !lignes || !Array.isArray(lignes)) {
      return NextResponse.json(
        { error: 'Données invalides. Attendu: { facture: {...}, lignes: [...] }' },
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

    // Vérifier les permissions (edit permission)
    const db = await createClient()
    // Table users pas complètement typée dans database.ts - type assertion temporaire
    const { data: userProfile, error: profileError } = await (db as any)
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

    // Vérifier permission d'édition (manager+ peut éditer)
    const roleNiveau = userProfile.role?.niveau || 0
    const canEdit = roleNiveau >= 40 // manager (40) et au-dessus

    if (!canEdit) {
      return NextResponse.json(
        {
          error: 'Permission refusée',
          message: 'Vous n\'avez pas les droits pour modifier des factures.',
        },
        { status: 403 }
      )
    }

    // Vérifier que l'utilisateur a accès à la facture avant la mise à jour (protection RLS)
    // Table factures pas complètement typée dans database.ts - type assertion temporaire
    const { data: factureCheck, error: checkError } = await (db as any)
      .from('factures')
      .select('id, numero, filiale_id')
      .eq('id', factureId)
      .single()

    if (checkError || !factureCheck) {
      // Erreur RLS ou facture inexistante
      if (checkError?.code === 'PGRST116' || !factureCheck) {
        return NextResponse.json(
          {
            error: 'Facture non trouvée ou accès refusé',
            message: roleNiveau < 100
              ? 'Cette facture n\'existe pas ou vous n\'avez pas accès à la filiale concernée.'
              : 'Facture introuvable.',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la vérification de la facture', details: checkError?.message },
        { status: 500 }
      )
    }

    // Appeler la fonction PostgreSQL pour mise à jour atomique
    // Fonction RPC pas complètement typée dans database.ts - type assertion temporaire
    const { data: result, error: rpcError } = await (db as any).rpc('update_facture_with_lignes', {
      p_facture_id: factureId,
      p_facture_data: facture,
      p_lignes: lignes,
    })

    if (rpcError) {
      console.error('Erreur RPC update_facture_with_lignes:', rpcError)

      // Vérifier si la fonction existe
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Fonction de mise à jour non disponible',
            message: 'La migration PostgreSQL n\'a pas été appliquée. Consultez supabase/APPLY_MIGRATIONS.md',
            details: rpcError.message,
          },
          { status: 500 }
        )
      }

      // Vérifier si c'est une erreur RLS
      if (rpcError.code === '42501' || rpcError.message?.includes('policy') || rpcError.message?.includes('row-level security')) {
        return NextResponse.json(
          {
            error: 'Accès refusé par la sécurité',
            message: 'Les politiques de sécurité de la base de données empêchent cette modification. Vous n\'avez peut-être pas accès à cette filiale.',
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        {
          error: 'Erreur lors de la mise à jour',
          message: rpcError.message || 'Erreur inconnue',
          details: rpcError.code,
        },
        { status: 500 }
      )
    }

    // Log de l'action
    // Table activity_logs pas complètement typée dans database.ts - type assertion temporaire
    await (db as any)
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'update',
        entity_type: 'facture',
        entity_id: factureId,
        details: `Mise à jour de la facture ${factureId} avec ${lignes.length} lignes`,
      })
      .catch((err: unknown) => {
        console.error('Erreur log activité:', err)
      })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Facture mise à jour avec succès',
    })

  } catch (error) {
    console.error('Erreur mise à jour facture:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la mise à jour',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
