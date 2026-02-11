/**
 * Export Excel - Utilitaires d'export de données vers Excel
 *
 * Utilise la librairie xlsx pour générer des fichiers Excel
 * avec formatage et styles PHI Studios
 */

import * as XLSX from 'xlsx'

// Types génériques pour l'export
type ExportColumn<T> = {
  header: string
  key: keyof T | ((item: T) => string | number | null | undefined)
  width?: number
}

type ExportOptions = {
  filename: string
  sheetName?: string
  title?: string
  subtitle?: string
}

/**
 * Génère et télécharge un fichier Excel
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // Créer les données pour la feuille
  const headers = columns.map(col => col.header)

  const rows = data.map(item =>
    columns.map(col => {
      if (typeof col.key === 'function') {
        return col.key(item) ?? ''
      }
      const value = item[col.key]
      return value ?? ''
    })
  )

  // Créer le workbook
  const wb = XLSX.utils.book_new()

  // Données avec en-tête
  const wsData: (string | number)[][] = []

  // Ajouter titre si présent
  if (options.title) {
    wsData.push([options.title])
    if (options.subtitle) {
      wsData.push([options.subtitle])
    }
    wsData.push([]) // Ligne vide
  }

  // Ajouter en-têtes et données
  wsData.push(headers)
  rows.forEach(row => wsData.push(row as (string | number)[]))

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Définir les largeurs de colonnes
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Données')

  // Télécharger le fichier
  const filename = `${options.filename}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ============================================================
// EXPORTS SPÉCIFIQUES PAR MODULE
// ============================================================

/**
 * Export des transactions
 */
type TransactionExport = {
  id: number
  type: string
  categorie: string
  montant: number
  date_transaction: string
  description: string | null
  reference: string | null
  statut: string
  client?: { nom: string } | null
  filiale?: { nom: string } | null
}

export function exportTransactions(transactions: TransactionExport[]): void {
  const columns: ExportColumn<TransactionExport>[] = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Date', key: (t) => formatDate(t.date_transaction), width: 12 },
    { header: 'Type', key: (t) => t.type === 'revenu' ? 'Revenu' : 'Dépense', width: 10 },
    { header: 'Catégorie', key: 'categorie', width: 15 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Référence', key: 'reference', width: 15 },
    { header: 'Montant (€)', key: 'montant', width: 12 },
    { header: 'Client', key: (t) => t.client?.nom, width: 20 },
    { header: 'Filiale', key: (t) => t.filiale?.nom, width: 15 },
    { header: 'Statut', key: (t) => getStatutLabel(t.statut), width: 12 },
  ]

  exportToExcel(transactions, columns, {
    filename: 'transactions',
    sheetName: 'Transactions',
    title: 'PHI Studios - Transactions',
    subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
  })
}

/**
 * Export des clients
 */
type ClientExport = {
  id: number
  code: string
  nom: string
  type: string
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  siret: string | null
  tva_intracommunautaire: string | null
  statut: string
  filiale?: { nom: string } | null
}

export function exportClients(clients: ClientExport[]): void {
  const columns: ExportColumn<ClientExport>[] = [
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Nom', key: 'nom', width: 25 },
    { header: 'Type', key: (c) => c.type === 'entreprise' ? 'Entreprise' : 'Particulier', width: 12 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Adresse', key: 'adresse', width: 30 },
    { header: 'Ville', key: 'ville', width: 15 },
    { header: 'Code Postal', key: 'code_postal', width: 12 },
    { header: 'SIRET', key: 'siret', width: 18 },
    { header: 'TVA Intracom.', key: 'tva_intracommunautaire', width: 18 },
    { header: 'Filiale', key: (c) => c.filiale?.nom, width: 15 },
    { header: 'Statut', key: (c) => getClientStatutLabel(c.statut), width: 12 },
  ]

  exportToExcel(clients, columns, {
    filename: 'clients',
    sheetName: 'Clients',
    title: 'PHI Studios - Liste des Clients',
    subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
  })
}

/**
 * Export des factures
 */
type FactureExport = {
  id: number
  numero: string
  type: string
  date_emission: string
  date_echeance: string
  objet: string | null
  total_ht: number
  total_tva: number
  total_ttc: number
  montant_paye: number
  statut: string
  client?: { nom: string; code: string } | null
  filiale?: { nom: string } | null
}

export function exportFactures(factures: FactureExport[]): void {
  const columns: ExportColumn<FactureExport>[] = [
    { header: 'Numéro', key: 'numero', width: 15 },
    { header: 'Type', key: (f) => getFactureTypeLabel(f.type), width: 12 },
    { header: 'Client', key: (f) => f.client?.nom, width: 25 },
    { header: 'Code Client', key: (f) => f.client?.code, width: 12 },
    { header: 'Objet', key: 'objet', width: 30 },
    { header: 'Date Émission', key: (f) => formatDate(f.date_emission), width: 12 },
    { header: 'Date Échéance', key: (f) => formatDate(f.date_echeance), width: 12 },
    { header: 'Total HT (€)', key: 'total_ht', width: 12 },
    { header: 'TVA (€)', key: 'total_tva', width: 10 },
    { header: 'Total TTC (€)', key: 'total_ttc', width: 12 },
    { header: 'Payé (€)', key: 'montant_paye', width: 12 },
    { header: 'Reste dû (€)', key: (f) => f.total_ttc - f.montant_paye, width: 12 },
    { header: 'Filiale', key: (f) => f.filiale?.nom, width: 15 },
    { header: 'Statut', key: (f) => getFactureStatutLabel(f.statut), width: 15 },
  ]

  exportToExcel(factures, columns, {
    filename: 'factures',
    sheetName: 'Factures',
    title: 'PHI Studios - Liste des Factures',
    subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
  })
}

/**
 * Export des contrats
 */
type ContratExport = {
  id: number
  numero: string
  titre: string
  type: string
  date_debut: string
  date_fin: string
  montant: number
  periodicite: string | null
  reconduction_auto: boolean
  statut: string
  client?: { nom: string } | null
  filiale?: { nom: string } | null
}

export function exportContrats(contrats: ContratExport[]): void {
  const columns: ExportColumn<ContratExport>[] = [
    { header: 'Numéro', key: 'numero', width: 15 },
    { header: 'Titre', key: 'titre', width: 30 },
    { header: 'Type', key: (c) => getContratTypeLabel(c.type), width: 12 },
    { header: 'Client', key: (c) => c.client?.nom, width: 25 },
    { header: 'Date Début', key: (c) => formatDate(c.date_debut), width: 12 },
    { header: 'Date Fin', key: (c) => formatDate(c.date_fin), width: 12 },
    { header: 'Montant (€)', key: 'montant', width: 12 },
    { header: 'Périodicité', key: (c) => getPeriodiciteLabel(c.periodicite), width: 12 },
    { header: 'Reconduction', key: (c) => c.reconduction_auto ? 'Oui' : 'Non', width: 12 },
    { header: 'Filiale', key: (c) => c.filiale?.nom, width: 15 },
    { header: 'Statut', key: (c) => getContratStatutLabel(c.statut), width: 12 },
  ]

  exportToExcel(contrats, columns, {
    filename: 'contrats',
    sheetName: 'Contrats',
    title: 'PHI Studios - Liste des Contrats',
    subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
  })
}

/**
 * Export des employés
 */
type EmployeExport = {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  poste: string | null
  departement: string | null
  date_embauche: string | null
  type_contrat: string | null
  statut: string
  filiale?: { nom: string } | null
}

export function exportEmployes(employes: EmployeExport[]): void {
  const columns: ExportColumn<EmployeExport>[] = [
    { header: 'Matricule', key: 'matricule', width: 12 },
    { header: 'Nom', key: 'nom', width: 15 },
    { header: 'Prénom', key: 'prenom', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Poste', key: 'poste', width: 20 },
    { header: 'Département', key: 'departement', width: 15 },
    { header: 'Date Embauche', key: (e) => e.date_embauche ? formatDate(e.date_embauche) : '', width: 12 },
    { header: 'Type Contrat', key: (e) => getContratTypeLabel(e.type_contrat || ''), width: 12 },
    { header: 'Filiale', key: (e) => e.filiale?.nom, width: 15 },
    { header: 'Statut', key: (e) => getEmployeStatutLabel(e.statut), width: 12 },
  ]

  exportToExcel(employes, columns, {
    filename: 'employes',
    sheetName: 'Employés',
    title: 'PHI Studios - Liste des Employés',
    subtitle: `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
  })
}

// ============================================================
// UTILITAIRES
// ============================================================

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR')
}

function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    annulee: 'Annulée',
  }
  return labels[statut] || statut
}

function getClientStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    prospect: 'Prospect',
    actif: 'Actif',
    inactif: 'Inactif',
    suspendu: 'Suspendu',
  }
  return labels[statut] || statut
}

function getFactureTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    facture: 'Facture',
    avoir: 'Avoir',
    acompte: 'Acompte',
    proforma: 'Proforma',
  }
  return labels[type] || type
}

function getFactureStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    payee: 'Payée',
    partiellement_payee: 'Partiellement payée',
    annulee: 'Annulée',
    en_retard: 'En retard',
  }
  return labels[statut] || statut
}

function getContratTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    service: 'Service',
    maintenance: 'Maintenance',
    licence: 'Licence',
    location: 'Location',
    autre: 'Autre',
    cdi: 'CDI',
    cdd: 'CDD',
    stage: 'Stage',
    alternance: 'Alternance',
    freelance: 'Freelance',
  }
  return labels[type] || type
}

function getContratStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    actif: 'Actif',
    suspendu: 'Suspendu',
    termine: 'Terminé',
    resilie: 'Résilié',
  }
  return labels[statut] || statut
}

function getPeriodiciteLabel(periodicite: string | null): string {
  if (!periodicite) return ''
  const labels: Record<string, string> = {
    mensuel: 'Mensuel',
    trimestriel: 'Trimestriel',
    semestriel: 'Semestriel',
    annuel: 'Annuel',
    ponctuel: 'Ponctuel',
  }
  return labels[periodicite] || periodicite
}

function getEmployeStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    actif: 'Actif',
    conge: 'En congé',
    suspendu: 'Suspendu',
    demission: 'Démissionné',
    licencie: 'Licencié',
  }
  return labels[statut] || statut
}
