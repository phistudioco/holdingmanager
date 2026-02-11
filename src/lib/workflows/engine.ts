/**
 * Workflow Engine - Gestion des workflows d'approbation
 *
 * Ce module gère la logique des workflows multi-étapes :
 * - Création et soumission de demandes
 * - Gestion des étapes d'approbation
 * - Transitions de statut
 */

import { createClient } from '@/lib/supabase/client'

// Types
export type WorkflowType = 'achat' | 'conge' | 'formation' | 'autre'

export type WorkflowStatus = 'brouillon' | 'en_cours' | 'approuve' | 'rejete' | 'annule'

export type ApprovalStatus = 'en_attente' | 'approuve' | 'rejete'

export interface WorkflowConfig {
  type: WorkflowType
  nom: string
  description: string
  etapes: WorkflowEtape[]
  requiertMontant: boolean
  champsSupplementaires: string[]
}

export interface WorkflowEtape {
  ordre: number
  nom: string
  role: string
  description?: string
}

// Configuration des types de workflows
export const WORKFLOW_CONFIGS: Record<WorkflowType, WorkflowConfig> = {
  achat: {
    type: 'achat',
    nom: "Demande d'achat",
    description: "Demande d'approbation pour un achat",
    requiertMontant: true,
    champsSupplementaires: ['fournisseur', 'justification'],
    etapes: [
      { ordre: 1, nom: 'Validation Chef Service', role: 'chef_service' },
      { ordre: 2, nom: 'Validation Direction', role: 'directeur' },
    ],
  },
  conge: {
    type: 'conge',
    nom: 'Demande de congé',
    description: 'Demande de congé ou absence',
    requiertMontant: false,
    champsSupplementaires: ['date_debut', 'date_fin', 'motif'],
    etapes: [
      { ordre: 1, nom: 'Validation Responsable', role: 'responsable' },
    ],
  },
  formation: {
    type: 'formation',
    nom: 'Demande de formation',
    description: 'Demande de formation professionnelle',
    requiertMontant: true,
    champsSupplementaires: ['formation_titre', 'formation_organisme', 'date_debut', 'date_fin'],
    etapes: [
      { ordre: 1, nom: 'Validation RH', role: 'rh' },
      { ordre: 2, nom: 'Validation Direction', role: 'directeur' },
    ],
  },
  autre: {
    type: 'autre',
    nom: 'Autre demande',
    description: 'Demande générale',
    requiertMontant: false,
    champsSupplementaires: ['justification'],
    etapes: [
      { ordre: 1, nom: 'Validation', role: 'responsable' },
    ],
  },
}

/**
 * Génère un numéro de demande unique
 */
export function generateNumero(type: WorkflowType): string {
  const prefix: Record<WorkflowType, string> = {
    achat: 'ACH',
    conge: 'CON',
    formation: 'FOR',
    autre: 'AUT',
  }
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix[type]}-${year}-${random}`
}

/**
 * Soumet une demande pour approbation
 */
export async function submitWorkflow(demandeId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Mettre à jour le statut de la demande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('workflow_demandes')
      .update({
        statut: 'en_cours',
        date_soumission: new Date().toISOString(),
        etape_actuelle: 1,
      })
      .eq('id', demandeId)

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur lors de la soumission',
    }
  }
}

/**
 * Approuve une étape du workflow
 */
export async function approveWorkflowStep(
  demandeId: number,
  etape: number,
  approbateurId: number,
  commentaire?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Enregistrer l'approbation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: approvalError } = await (supabase as any)
      .from('workflow_approbations')
      .insert({
        demande_id: demandeId,
        etape,
        approbateur_id: approbateurId,
        statut: 'approuve',
        commentaire,
        date_decision: new Date().toISOString(),
      })

    if (approvalError) throw approvalError

    // Récupérer la demande pour connaître le type et l'étape suivante
    const demandeRes = await supabase
      .from('workflow_demandes')
      .select('type, etape_actuelle')
      .eq('id', demandeId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((demandeRes as any).error) throw (demandeRes as any).error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const demande = (demandeRes as any).data as { type: string; etape_actuelle: number }

    const config = WORKFLOW_CONFIGS[demande.type as WorkflowType]
    const etapesRestantes = config.etapes.filter(e => e.ordre > etape)

    if (etapesRestantes.length === 0) {
      // Toutes les étapes sont approuvées - finaliser la demande
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('workflow_demandes')
        .update({
          statut: 'approuve',
          date_finalisation: new Date().toISOString(),
        })
        .eq('id', demandeId)

      if (updateError) throw updateError
    } else {
      // Passer à l'étape suivante
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('workflow_demandes')
        .update({
          etape_actuelle: etape + 1,
        })
        .eq('id', demandeId)

      if (updateError) throw updateError
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de l'approbation",
    }
  }
}

/**
 * Rejette une demande
 */
export async function rejectWorkflow(
  demandeId: number,
  etape: number,
  approbateurId: number,
  commentaire: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Enregistrer le rejet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: approvalError } = await (supabase as any)
      .from('workflow_approbations')
      .insert({
        demande_id: demandeId,
        etape,
        approbateur_id: approbateurId,
        statut: 'rejete',
        commentaire,
        date_decision: new Date().toISOString(),
      })

    if (approvalError) throw approvalError

    // Mettre à jour le statut de la demande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('workflow_demandes')
      .update({
        statut: 'rejete',
        date_finalisation: new Date().toISOString(),
      })
      .eq('id', demandeId)

    if (updateError) throw updateError

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur lors du rejet',
    }
  }
}

/**
 * Annule une demande
 */
export async function cancelWorkflow(demandeId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('workflow_demandes')
      .update({
        statut: 'annule',
        date_finalisation: new Date().toISOString(),
      })
      .eq('id', demandeId)

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation",
    }
  }
}

/**
 * Récupère les demandes en attente d'approbation pour un utilisateur
 */
export async function getPendingApprovals(_userId: number): Promise<{
  data: Array<{
    id: number
    numero: string
    type: WorkflowType
    titre: string
    demandeur: string
    date_soumission: string
    etape: number
  }>
  error?: string
}> {
  const supabase = createClient()

  try {
    // TODO: Implémenter la logique de récupération des demandes
    // basée sur le rôle de l'utilisateur et l'étape actuelle
    const { data, error } = await supabase
      .from('workflow_demandes')
      .select('id, numero, type, titre, date_soumission, etape_actuelle, demandeur:demandeur_id(nom, prenom)')
      .eq('statut', 'en_cours')
      .order('date_soumission', { ascending: false })

    if (error) throw error

    return {
      data: (data || []).map((d: Record<string, unknown>) => ({
        id: d.id as number,
        numero: d.numero as string,
        type: d.type as WorkflowType,
        titre: d.titre as string,
        demandeur: d.demandeur
          ? `${(d.demandeur as { prenom: string; nom: string }).prenom} ${(d.demandeur as { prenom: string; nom: string }).nom}`
          : 'Inconnu',
        date_soumission: d.date_soumission as string,
        etape: d.etape_actuelle as number,
      })),
    }
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Erreur lors de la récupération',
    }
  }
}
