/**
 * Rapport Financier PDF Generator
 *
 * Génère des PDF pour les rapports financiers avec le template PHI Studios
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadLogo, loadLogoIcon, LOGO_DIMENSIONS, LOGO_Y_POSITION } from './logo'

type TransactionSummary = {
  categorie: string
  type: 'revenu' | 'depense'
  total: number
  count: number
}

type FactureSummary = {
  statut: string
  count: number
  total: number
}

type ClientSummary = {
  nom: string
  code: string
  totalFactures: number
  totalMontant: number
}

type FilialeData = {
  nom: string
  code: string
  adresse: string | null
  ville: string | null
  code_postal: string | null
  telephone: string | null
  email: string | null
}

type RapportData = {
  periode: {
    debut: string
    fin: string
    type: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise'
  }
  totaux: {
    revenus: number
    depenses: number
    solde: number
    facturesEmises: number
    facturesPayees: number
    facturesEnAttente: number
    montantImpaye: number
  }
  transactionsParCategorie: TransactionSummary[]
  facturesParStatut: FactureSummary[]
  topClients: ClientSummary[]
  evolutionMensuelle?: {
    mois: string
    revenus: number
    depenses: number
  }[]
}

type GenerateRapportPDFParams = {
  rapport: RapportData
  filiale: FilialeData
}

// Couleurs PHI Studios
const COLORS = {
  primary: [15, 32, 128] as [number, number, number], // #0F2080
  accent: [231, 37, 114] as [number, number, number], // #E72572
  highlight: [252, 208, 23] as [number, number, number], // #FCD017
  text: [31, 41, 55] as [number, number, number], // gray-800
  textLight: [107, 114, 128] as [number, number, number], // gray-500
  success: [34, 197, 94] as [number, number, number], // green-500
  danger: [239, 68, 68] as [number, number, number], // red-500
}

export async function generateRapportPDF({
  rapport,
  filiale,
}: GenerateRapportPDFParams): Promise<jsPDF> {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Charger le logo et le pictogramme pour le filigrane
  const logoBase64 = await loadLogo()
  const iconBase64 = await loadLogoIcon()

  // Fonction pour ajouter le filigrane sur une page
  const addWatermark = () => {
    if (iconBase64) {
      const watermarkSize = 220
      const centerX = (pageWidth - watermarkSize) / 2
      const centerY = (pageHeight - watermarkSize) / 2

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gState = new (doc as any).GState({ opacity: 0.06 })
      doc.setGState(gState)
      doc.addImage(iconBase64, 'PNG', centerX, centerY, watermarkSize, watermarkSize)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalState = new (doc as any).GState({ opacity: 1 })
      doc.setGState(normalState)
    }
  }

  // Ajouter le filigrane sur la première page
  addWatermark()

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
      .replace(/\u00A0/g, ' ')
      .replace(/\u202F/g, ' ')
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getPeriodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mensuel: 'Rapport Mensuel',
      trimestriel: 'Rapport Trimestriel',
      annuel: 'Rapport Annuel',
      personnalise: 'Rapport Personnalisé',
    }
    return labels[type] || 'Rapport Financier'
  }

  const getCategorieLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      facturation: 'Facturation',
      prestation: 'Prestation',
      vente: 'Vente',
      subvention: 'Subvention',
      autre_revenu: 'Autre revenu',
      salaires: 'Salaires',
      loyer: 'Loyer',
      fournitures: 'Fournitures',
      equipements: 'Équipements',
      services: 'Services',
      marketing: 'Marketing',
      deplacements: 'Déplacements',
      autre_depense: 'Autre dépense',
    }
    return labels[categorie] || categorie
  }

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoyee: 'Envoyée',
      partiellement_payee: 'Partiellement payée',
      payee: 'Payée',
      annulee: 'Annulée',
    }
    return labels[statut] || statut
  }

  // ============================================================
  // PAGE 1 : EN-TÊTE ET RÉSUMÉ
  // ============================================================

  // Bande de couleur en haut
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 8, 'F')

  // Position Y pour l'alignement du header
  const headerY = LOGO_Y_POSITION + LOGO_DIMENSIONS.height / 2 + 5

  // Logo PHI Studios
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, LOGO_Y_POSITION, LOGO_DIMENSIONS.width, LOGO_DIMENSIONS.height)
  } else {
    doc.setFontSize(24)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('PHI', margin, headerY)
    doc.setTextColor(...COLORS.accent)
    doc.text('Studios', margin + 22, headerY)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'italic')
    doc.text('Promote Human Intelligence', margin, headerY + 5)
  }

  // Type de rapport
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(getPeriodeLabel(rapport.periode.type).toUpperCase(), pageWidth - margin, headerY, { align: 'right' })

  // Période
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${formatDate(rapport.periode.debut)} - ${formatDate(rapport.periode.fin)}`,
    pageWidth - margin,
    headerY + 8,
    { align: 'right' }
  )

  // Ligne de séparation
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, headerY + 15, pageWidth - margin, headerY + 15)

  // ============================================================
  // FILIALE
  // ============================================================

  const filialeY = headerY + 25

  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('ÉTABLISSEMENT', margin, filialeY)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(filiale.nom, margin, filialeY + 7)
  doc.setFont('helvetica', 'normal')

  let filialeInfoY = filialeY + 12
  if (filiale.adresse) {
    doc.text(filiale.adresse, margin, filialeInfoY)
    filialeInfoY += 4
  }
  if (filiale.code_postal && filiale.ville) {
    doc.text(`${filiale.code_postal} ${filiale.ville}`, margin, filialeInfoY)
  }

  // ============================================================
  // RÉSUMÉ FINANCIER (Cards)
  // ============================================================

  const summaryY = filialeY + 30
  const cardWidth = (pageWidth - 2 * margin - 15) / 3
  const cardHeight = 35

  // Card Revenus
  doc.setFillColor(236, 253, 245) // green-50
  doc.roundedRect(margin, summaryY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Total Revenus', margin + 5, summaryY + 10)
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.success)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(rapport.totaux.revenus), margin + 5, summaryY + 22)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text('Transactions validées', margin + 5, summaryY + 30)

  // Card Dépenses
  const card2X = margin + cardWidth + 7.5
  doc.setFillColor(254, 242, 242) // red-50
  doc.roundedRect(card2X, summaryY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Total Dépenses', card2X + 5, summaryY + 10)
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.danger)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(rapport.totaux.depenses), card2X + 5, summaryY + 22)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text('Transactions validées', card2X + 5, summaryY + 30)

  // Card Solde
  const card3X = card2X + cardWidth + 7.5
  const isSoldePositif = rapport.totaux.solde >= 0
  doc.setFillColor(isSoldePositif ? 236 : 254, isSoldePositif ? 253 : 242, isSoldePositif ? 245 : 242)
  doc.roundedRect(card3X, summaryY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Solde Net', card3X + 5, summaryY + 10)
  doc.setFontSize(14)
  doc.setTextColor(...(isSoldePositif ? COLORS.success : COLORS.danger))
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(rapport.totaux.solde), card3X + 5, summaryY + 22)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text(isSoldePositif ? 'Bénéfice' : 'Déficit', card3X + 5, summaryY + 30)

  // ============================================================
  // FACTURES
  // ============================================================

  const facturesY = summaryY + cardHeight + 15

  doc.setFontSize(11)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('SYNTHÈSE DES FACTURES', margin, facturesY)

  // Box factures
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, facturesY + 5, pageWidth - 2 * margin, 35, 3, 3, 'F')

  // Ligne 1
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'normal')
  doc.text('Factures émises:', margin + 5, facturesY + 15)
  doc.text('Factures payées:', margin + 70, facturesY + 15)
  doc.text('En attente:', margin + 135, facturesY + 15)

  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(rapport.totaux.facturesEmises.toString(), margin + 45, facturesY + 15)
  doc.text(rapport.totaux.facturesPayees.toString(), margin + 115, facturesY + 15)
  doc.text(rapport.totaux.facturesEnAttente.toString(), margin + 165, facturesY + 15)

  // Ligne 2 - Montant impayé
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'normal')
  doc.text('Montant total impayé:', margin + 5, facturesY + 30)
  doc.setTextColor(...COLORS.accent)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(rapport.totaux.montantImpaye), margin + 55, facturesY + 30)

  // ============================================================
  // TABLEAU TRANSACTIONS PAR CATÉGORIE
  // ============================================================

  const tableY = facturesY + 50

  doc.setFontSize(11)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTIONS PAR CATÉGORIE', margin, tableY)

  // Séparer revenus et dépenses
  const revenus = rapport.transactionsParCategorie.filter(t => t.type === 'revenu')
  const depenses = rapport.transactionsParCategorie.filter(t => t.type === 'depense')

  // Tableau revenus
  if (revenus.length > 0) {
    autoTable(doc, {
      startY: tableY + 5,
      head: [['Catégorie (Revenus)', 'Nombre', 'Total']],
      body: revenus.map(t => [
        getCategorieLabel(t.categorie),
        t.count.toString(),
        formatCurrency(t.total),
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: [236, 253, 245],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: margin, right: pageWidth / 2 + 5 },
      tableWidth: pageWidth / 2 - margin - 5,
    })
  }

  // Tableau dépenses (à côté)
  if (depenses.length > 0) {
    autoTable(doc, {
      startY: tableY + 5,
      head: [['Catégorie (Dépenses)', 'Nombre', 'Total']],
      body: depenses.map(t => [
        getCategorieLabel(t.categorie),
        t.count.toString(),
        formatCurrency(t.total),
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: pageWidth / 2 + 5, right: margin },
      tableWidth: pageWidth / 2 - margin - 5,
    })
  }

  // ============================================================
  // TOP CLIENTS (si disponible)
  // ============================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentY = Math.max((doc as any).lastAutoTable?.finalY || tableY + 40, tableY + 40) + 15

  if (rapport.topClients.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (currentY + 60 > pageHeight - 30) {
      doc.addPage()
      addWatermark()
      currentY = 20

      // Bande en haut de la nouvelle page
      doc.setFillColor(...COLORS.primary)
      doc.rect(0, 0, pageWidth, 5, 'F')
    }

    doc.setFontSize(11)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('TOP CLIENTS', margin, currentY)

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Client', 'Code', 'Nombre de factures', 'Montant total']],
      body: rapport.topClients.map(c => [
        c.nom,
        c.code,
        c.totalFactures.toString(),
        formatCurrency(c.totalMontant),
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35 },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 60
  }

  // ============================================================
  // RÉPARTITION DES FACTURES PAR STATUT
  // ============================================================

  if (rapport.facturesParStatut.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (currentY + 60 > pageHeight - 30) {
      doc.addPage()
      addWatermark()
      currentY = 20

      doc.setFillColor(...COLORS.primary)
      doc.rect(0, 0, pageWidth, 5, 'F')
    }

    doc.setFontSize(11)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('RÉPARTITION DES FACTURES', margin, currentY)

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Statut', 'Nombre', 'Montant total']],
      body: rapport.facturesParStatut.map(f => [
        getStatutLabel(f.statut),
        f.count.toString(),
        formatCurrency(f.total),
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.accent,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: [253, 242, 248],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })
  }

  // ============================================================
  // PIED DE PAGE
  // ============================================================

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15

    // Bande de couleur en bas
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, footerY + 7, pageWidth, 8, 'F')

    // Texte pied de page
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textLight)
    doc.text(
      `${filiale.nom} - Rapport généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${pageNum}/${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )
  }

  // Ajouter les pieds de page sur toutes les pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  return doc
}

export async function downloadRapportPDF(params: GenerateRapportPDFParams): Promise<void> {
  const doc = await generateRapportPDF(params)
  const dateStr = new Date().toISOString().split('T')[0]
  doc.save(`rapport-financier-${params.filiale.code}-${dateStr}.pdf`)
}

export async function getRapportPDFBlob(params: GenerateRapportPDFParams): Promise<Blob> {
  const doc = await generateRapportPDF(params)
  return doc.output('blob')
}
