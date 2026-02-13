/**
 * Alertes Generator - Génération automatique des alertes
 *
 * Ce module génère des alertes automatiques basées sur :
 * - Factures impayées ou arrivant à échéance
 * - Contrats expirant bientôt
 * - Dépassements de budget
 * - Événements de workflow
 */

import { createClient, createUntypedClient } from '@/lib/supabase/client'

// Types
export type AlerteType =
  | 'facture_impayee'
  | 'facture_echeance'
  | 'contrat_expiration'
  | 'budget_depasse'
  | 'workflow'
  | 'autre'

export type AlerteSeverite = 'basse' | 'moyenne' | 'haute' | 'critique'

export interface CreateAlerteParams {
  type: AlerteType
  severite: AlerteSeverite
  titre: string
  message: string
  entite_type?: string
  entite_id?: number
  date_echeance?: string
}

// Types pour les queries Supabase
type FactureAlerte = {
  id: number
  numero: string
  client_id: number | null
  date_echeance: string
  total_ttc: number
}

type ContratAlerte = {
  id: number
  numero: string
  titre: string
  client_id: number | null
  date_fin: string
  montant: number
  reconduction_auto: boolean
}

/**
 * Crée une nouvelle alerte
 */
export async function createAlerte(params: CreateAlerteParams): Promise<{ success: boolean; error?: string }> {
  const supabase = createUntypedClient()

  try {
    const { error } = await supabase
      .from('alertes')
      .insert({
        type: params.type,
        severite: params.severite,
        titre: params.titre,
        message: params.message,
        entite_type: params.entite_type || null,
        entite_id: params.entite_id || null,
        date_echeance: params.date_echeance || null,
        lue: false,
        traitee: false,
      })

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'alerte",
    }
  }
}

/**
 * Génère les alertes pour les factures impayées
 * À exécuter périodiquement (cron job ou fonction Supabase Edge)
 */
export async function generateFactureAlertes(): Promise<{ count: number; error?: string }> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  let count = 0

  try {
    // Factures en retard (échéance dépassée)
    const { data: facturesEnRetardData, error: retardError } = await supabase
      .from('factures')
      .select('id, numero, client_id, date_echeance, total_ttc')
      .in('statut', ['envoyee', 'partiellement_payee'])
      .lt('date_echeance', today)

    if (retardError) throw retardError
    const facturesEnRetard = (facturesEnRetardData || []) as FactureAlerte[]

    for (const facture of facturesEnRetard) {
      const joursRetard = Math.floor(
        (new Date().getTime() - new Date(facture.date_echeance).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Déterminer la sévérité selon le retard
      let severite: AlerteSeverite = 'moyenne'
      if (joursRetard > 30) severite = 'critique'
      else if (joursRetard > 14) severite = 'haute'

      // Vérifier si une alerte existe déjà pour cette facture
      const { data: existingAlerte } = await supabase
        .from('alertes')
        .select('id')
        .eq('entite_type', 'facture')
        .eq('entite_id', facture.id)
        .eq('type', 'facture_impayee')
        .eq('traitee', false)
        .single()

      if (!existingAlerte) {
        await createAlerte({
          type: 'facture_impayee',
          severite,
          titre: `Facture ${facture.numero} en retard`,
          message: `La facture ${facture.numero} est en retard de ${joursRetard} jour(s). Montant: ${formatCurrency(facture.total_ttc)}`,
          entite_type: 'facture',
          entite_id: facture.id,
          date_echeance: facture.date_echeance,
        })
        count++
      }
    }

    // Factures arrivant à échéance (7 jours)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    const futureDate = sevenDaysLater.toISOString().split('T')[0]

    const { data: facturesEcheanceData, error: echeanceError } = await supabase
      .from('factures')
      .select('id, numero, client_id, date_echeance, total_ttc')
      .in('statut', ['envoyee', 'partiellement_payee'])
      .gte('date_echeance', today)
      .lte('date_echeance', futureDate)

    if (echeanceError) throw echeanceError
    const facturesEcheance = (facturesEcheanceData || []) as FactureAlerte[]

    for (const facture of facturesEcheance) {
      const joursRestants = Math.floor(
        (new Date(facture.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Vérifier si une alerte existe déjà
      const { data: existingAlerte } = await supabase
        .from('alertes')
        .select('id')
        .eq('entite_type', 'facture')
        .eq('entite_id', facture.id)
        .eq('type', 'facture_echeance')
        .eq('traitee', false)
        .single()

      if (!existingAlerte) {
        await createAlerte({
          type: 'facture_echeance',
          severite: joursRestants <= 3 ? 'haute' : 'moyenne',
          titre: `Échéance facture ${facture.numero}`,
          message: `La facture ${facture.numero} arrive à échéance dans ${joursRestants} jour(s). Montant: ${formatCurrency(facture.total_ttc)}`,
          entite_type: 'facture',
          entite_id: facture.id,
          date_echeance: facture.date_echeance,
        })
        count++
      }
    }

    return { count }
  } catch (err: unknown) {
    return {
      count,
      error: err instanceof Error ? err.message : 'Erreur lors de la génération des alertes',
    }
  }
}

/**
 * Génère les alertes pour les contrats expirant bientôt
 */
export async function generateContratAlertes(): Promise<{ count: number; error?: string }> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  let count = 0

  try {
    // Contrats expirant dans les 30 prochains jours
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const futureDate = thirtyDaysLater.toISOString().split('T')[0]

    const { data: contratsExpirationData, error: contratsError } = await supabase
      .from('contrats')
      .select('id, numero, titre, client_id, date_fin, montant, reconduction_auto')
      .eq('statut', 'actif')
      .gte('date_fin', today)
      .lte('date_fin', futureDate)

    if (contratsError) throw contratsError
    const contratsExpiration = (contratsExpirationData || []) as ContratAlerte[]

    for (const contrat of contratsExpiration) {
      const joursRestants = Math.floor(
        (new Date(contrat.date_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Vérifier si une alerte existe déjà
      const { data: existingAlerte } = await supabase
        .from('alertes')
        .select('id')
        .eq('entite_type', 'contrat')
        .eq('entite_id', contrat.id)
        .eq('type', 'contrat_expiration')
        .eq('traitee', false)
        .single()

      if (!existingAlerte) {
        const reconduction = contrat.reconduction_auto ? ' (reconduction auto)' : ''
        await createAlerte({
          type: 'contrat_expiration',
          severite: joursRestants <= 7 ? 'haute' : 'moyenne',
          titre: `Contrat ${contrat.numero} expire bientôt`,
          message: `Le contrat "${contrat.titre}" expire dans ${joursRestants} jour(s)${reconduction}. Valeur: ${formatCurrency(contrat.montant)}`,
          entite_type: 'contrat',
          entite_id: contrat.id,
          date_echeance: contrat.date_fin,
        })
        count++
      }
    }

    return { count }
  } catch (err: unknown) {
    return {
      count,
      error: err instanceof Error ? err.message : 'Erreur lors de la génération des alertes',
    }
  }
}

/**
 * Génère une alerte pour un événement de workflow
 */
export async function generateWorkflowAlerte(
  demandeId: number,
  action: 'soumise' | 'approuvee' | 'rejetee',
  demandeur: string,
  titre: string
): Promise<{ success: boolean; error?: string }> {
  const messages: Record<string, string> = {
    soumise: `La demande "${titre}" a été soumise par ${demandeur} et attend votre approbation.`,
    approuvee: `La demande "${titre}" a été approuvée.`,
    rejetee: `La demande "${titre}" a été rejetée.`,
  }

  const severites: Record<string, AlerteSeverite> = {
    soumise: 'moyenne',
    approuvee: 'basse',
    rejetee: 'haute',
  }

  return await createAlerte({
    type: 'workflow',
    severite: severites[action],
    titre: `Workflow ${action}`,
    message: messages[action],
    entite_type: 'workflow_demande',
    entite_id: demandeId,
  })
}

/**
 * Exécute toutes les générations d'alertes
 */
export async function runAllAlerteGenerators(): Promise<{
  factures: number
  contrats: number
  errors: string[]
}> {
  const errors: string[] = []

  const factureResult = await generateFactureAlertes()
  if (factureResult.error) errors.push(`Factures: ${factureResult.error}`)

  const contratResult = await generateContratAlertes()
  if (contratResult.error) errors.push(`Contrats: ${contratResult.error}`)

  return {
    factures: factureResult.count,
    contrats: contratResult.count,
    errors,
  }
}

// Utilitaires
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
