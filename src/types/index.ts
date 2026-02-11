/**
 * Types centralisés pour l'application HoldingManager
 */

import type { Tables, Enums } from './database'

// ============================================================
// TYPES UTILISATEURS
// ============================================================

export type User = Tables<'users'>
export type Role = Tables<'roles'>
export type StatutUser = Enums<'statut_user'>

export interface UserWithRole extends User {
  role?: Role
}

// ============================================================
// TYPES ORGANISATION
// ============================================================

export type Filiale = Tables<'filiales'>
export type Employe = Tables<'employes'>
export type Service = Tables<'services'>
export type Pays = Tables<'pays'>

export type StatutFiliale = Enums<'statut_filiale'>
export type StatutEmploye = Enums<'statut_employe'>

export interface EmployeWithRelations extends Employe {
  filiale?: Pick<Filiale, 'id' | 'nom' | 'code'>
  service?: Pick<Service, 'id' | 'nom' | 'couleur'>
}

export interface FilialeWithPays extends Filiale {
  pays?: Pick<Pays, 'id' | 'nom' | 'code'>
}

// ============================================================
// TYPES FINANCE
// ============================================================

export type Client = Tables<'clients'>
export type Facture = Tables<'factures'>

export type TypeClient = Enums<'type_client'>
export type StatutClient = Enums<'statut_client'>
export type TypeFacture = Enums<'type_facture'>
export type StatutFacture = Enums<'statut_facture'>

export interface ClientWithRelations extends Client {
  filiale?: Pick<Filiale, 'id' | 'nom' | 'code'>
  pays?: Pick<Pays, 'id' | 'nom' | 'code'>
}

export interface FactureWithRelations extends Facture {
  client?: Pick<Client, 'id' | 'nom' | 'code' | 'email'>
  filiale?: Pick<Filiale, 'id' | 'nom' | 'code'>
}

// ============================================================
// TYPES WORKFLOWS
// ============================================================

export type WorkflowType = Tables<'workflow_types'>
export type WorkflowDemande = Tables<'workflow_demandes'>
export type WorkflowApprobation = Tables<'workflow_approbations'>
export type StatutDemande = Enums<'statut_demande'>
export type PrioriteDemande = Enums<'priorite_demande'>

export type TypeWorkflow = 'achat' | 'conge' | 'formation' | 'autre'

export interface WorkflowDemandeWithRelations extends WorkflowDemande {
  demandeur?: Pick<Employe, 'id' | 'nom' | 'prenom' | 'email'>
  filiale?: Pick<Filiale, 'id' | 'nom' | 'code'>
  approbations?: WorkflowApprobation[]
}

export interface WorkflowEtape {
  ordre: number
  nom: string
  role: string
  approbateur_id?: number
}

// ============================================================
// TYPES ALERTES
// ============================================================

export type Alerte = Tables<'alertes'>
export type TypeAlerte = 'facture_impayee' | 'facture_echeance' | 'contrat_expiration' | 'budget_depasse' | 'workflow' | 'autre'
export type SeveriteAlerte = 'basse' | 'moyenne' | 'haute' | 'critique'

// ============================================================
// TYPES NOTIFICATIONS
// ============================================================

export type Notification = Tables<'notifications'>

// ============================================================
// TYPES UTILITAIRES
// ============================================================

/**
 * Type pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Type pour les options de pagination
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Type pour les filtres de recherche
 */
export interface SearchFilters {
  search?: string
  statut?: string
  filialeId?: number
  serviceId?: number
  dateFrom?: string
  dateTo?: string
}

/**
 * Type pour les statistiques du dashboard
 */
export interface DashboardStats {
  employesCount: number
  clientsCount: number
  facturesTotal: number
  filialesCount: number
  demandesEnAttente: number
  alertesActives: number
}

/**
 * Type pour les données de graphiques
 */
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

/**
 * Type pour les activités récentes
 */
export interface ActivityItem {
  id: string
  action: string
  description: string
  user: {
    nom: string
    prenom: string
    avatar?: string
  }
  timestamp: string
}
