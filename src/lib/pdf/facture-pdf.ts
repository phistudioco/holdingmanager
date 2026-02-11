import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadLogo, loadLogoIcon, LOGO_DIMENSIONS, LOGO_Y_POSITION } from './logo'

type FactureData = {
  numero: string
  type: string
  date_emission: string
  date_echeance: string
  objet: string | null
  total_ht: number
  taux_tva: number
  total_tva: number
  total_ttc: number
  montant_paye: number
  statut: string
  notes: string | null
}

type ClientData = {
  nom: string
  code: string
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  siret: string | null
  tva_intracommunautaire: string | null
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

type LigneData = {
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_ttc: number
}

type GenerateFacturePDFParams = {
  facture: FactureData
  client: ClientData
  filiale: FilialeData
  lignes: LigneData[]
}

// Couleurs PHI Studios
const COLORS = {
  primary: [15, 32, 128] as [number, number, number], // #0F2080
  accent: [231, 37, 114] as [number, number, number], // #E72572
  highlight: [252, 208, 23] as [number, number, number], // #FCD017
  text: [31, 41, 55] as [number, number, number], // gray-800
  textLight: [107, 114, 128] as [number, number, number], // gray-500
}

export async function generateFacturePDF({
  facture,
  client,
  filiale,
  lignes,
}: GenerateFacturePDFParams): Promise<jsPDF> {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Charger le logo et le pictogramme pour le filigrane
  const logoBase64 = await loadLogo()
  const iconBase64 = await loadLogoIcon()

  // ============================================================
  // FILIGRANE (arrière-plan)
  // ============================================================
  if (iconBase64) {
    const watermarkSize = 220
    const centerX = (pageWidth - watermarkSize) / 2
    const centerY = (doc.internal.pageSize.getHeight() - watermarkSize) / 2

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gState = new (doc as any).GState({ opacity: 0.06 })
    doc.setGState(gState)
    doc.addImage(iconBase64, 'PNG', centerX, centerY, watermarkSize, watermarkSize)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalState = new (doc as any).GState({ opacity: 1 })
    doc.setGState(normalState)
  }

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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facture: 'FACTURE',
      avoir: 'AVOIR',
      acompte: 'ACOMPTE',
      proforma: 'PROFORMA',
    }
    return labels[type] || 'FACTURE'
  }

  // ============================================================
  // EN-TÊTE
  // ============================================================

  // Bande de couleur en haut
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 8, 'F')

  // Position Y pour l'alignement du header
  const headerY = LOGO_Y_POSITION + LOGO_DIMENSIONS.height / 2 + 5

  // Logo PHI Studios (image ou fallback texte)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, LOGO_Y_POSITION, LOGO_DIMENSIONS.width, LOGO_DIMENSIONS.height)
  } else {
    // Fallback: texte si le logo ne peut pas être chargé
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

  // Type de document (aligné avec le logo)
  doc.setFontSize(28)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(getTypeLabel(facture.type), pageWidth - margin, headerY, { align: 'right' })

  // Numéro de facture
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${facture.numero}`, pageWidth - margin, headerY + 8, { align: 'right' })

  // Ligne de séparation
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, headerY + 15, pageWidth - margin, headerY + 15)

  // ============================================================
  // INFORMATIONS ÉMETTEUR / DESTINATAIRE
  // ============================================================

  const infoY = 50

  // Émetteur (Filiale)
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('ÉMETTEUR', margin, infoY)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(filiale.nom, margin, infoY + 7)
  doc.setFont('helvetica', 'normal')

  let emetteurY = infoY + 12
  if (filiale.adresse) {
    doc.text(filiale.adresse, margin, emetteurY)
    emetteurY += 4
  }
  if (filiale.code_postal && filiale.ville) {
    doc.text(`${filiale.code_postal} ${filiale.ville}`, margin, emetteurY)
    emetteurY += 4
  }
  if (filiale.telephone) {
    doc.text(`Tél: ${filiale.telephone}`, margin, emetteurY)
    emetteurY += 4
  }
  if (filiale.email) {
    doc.text(`Email: ${filiale.email}`, margin, emetteurY)
  }

  // Destinataire (Client)
  const clientX = pageWidth / 2 + 10
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.accent)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', clientX, infoY)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(client.nom, clientX, infoY + 7)
  doc.setFont('helvetica', 'normal')

  let clientY = infoY + 12
  if (client.adresse) {
    doc.text(client.adresse, clientX, clientY)
    clientY += 4
  }
  if (client.code_postal && client.ville) {
    doc.text(`${client.code_postal} ${client.ville}`, clientX, clientY)
    clientY += 4
  }
  if (client.siret) {
    doc.text(`SIRET: ${client.siret}`, clientX, clientY)
    clientY += 4
  }
  if (client.tva_intracommunautaire) {
    doc.text(`TVA: ${client.tva_intracommunautaire}`, clientX, clientY)
  }

  // ============================================================
  // DATES
  // ============================================================

  const dateY = 90

  // Box pour les dates
  doc.setFillColor(248, 250, 252) // gray-50
  doc.roundedRect(margin, dateY, pageWidth - 2 * margin, 20, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Date d\'émission:', margin + 5, dateY + 8)
  doc.text('Date d\'échéance:', pageWidth / 2, dateY + 8)

  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(facture.date_emission), margin + 5, dateY + 14)
  doc.text(formatDate(facture.date_echeance), pageWidth / 2, dateY + 14)

  // Objet
  if (facture.objet) {
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.text('Objet:', margin, dateY + 28)
    doc.setTextColor(...COLORS.text)
    doc.text(facture.objet, margin + 15, dateY + 28)
  }

  // ============================================================
  // TABLEAU DES LIGNES
  // ============================================================

  const tableY = facture.objet ? dateY + 38 : dateY + 30

  // Préparer les données du tableau avec valeurs par défaut pour éviter les erreurs
  const tableBody = lignes.map((ligne) => {
    const description = ligne.description || 'N/A'
    const quantite = ligne.quantite ?? 0
    const prixUnitaire = ligne.prix_unitaire ?? 0
    const tauxTva = ligne.taux_tva ?? 0
    const montantTtc = ligne.montant_ttc ?? 0

    return [
      description,
      quantite.toString(),
      formatCurrency(prixUnitaire),
      `${tauxTva}%`,
      formatCurrency(montantTtc),
    ]
  })

  autoTable(doc, {
    startY: tableY,
    head: [['Description', 'Qté', 'Prix unit. HT', 'TVA', 'Total TTC']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  // ============================================================
  // TOTAUX
  // ============================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const boxWidth = 100
  const boxPadding = 8
  const totauxX = pageWidth - margin - boxWidth + boxPadding
  const totauxRightX = pageWidth - margin - boxPadding

  // Box pour les totaux
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(pageWidth - margin - boxWidth, finalY - 5, boxWidth, 50, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'normal')

  doc.text('Total HT:', totauxX, finalY + 5)
  doc.text(`TVA (${facture.taux_tva}%):`, totauxX, finalY + 13)

  doc.setTextColor(...COLORS.text)
  doc.text(formatCurrency(facture.total_ht), totauxRightX, finalY + 5, { align: 'right' })
  doc.text(formatCurrency(facture.total_tva), totauxRightX, finalY + 13, { align: 'right' })

  // Ligne de séparation
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.3)
  doc.line(totauxX - 3, finalY + 18, totauxRightX, finalY + 18)

  // Total TTC
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('Total TTC:', totauxX, finalY + 28)
  doc.text(formatCurrency(facture.total_ttc), totauxRightX, finalY + 28, { align: 'right' })

  // Montant payé et reste à payer (si applicable)
  if (facture.montant_paye > 0) {
    doc.setFontSize(9)
    doc.setTextColor(34, 197, 94) // green-500
    doc.setFont('helvetica', 'normal')
    doc.text('Payé:', totauxX, finalY + 38)
    doc.text(`- ${formatCurrency(facture.montant_paye)}`, totauxRightX, finalY + 38, { align: 'right' })

    if (facture.montant_paye < facture.total_ttc) {
      doc.setTextColor(...COLORS.accent)
      doc.setFont('helvetica', 'bold')
      doc.text('Reste à payer:', totauxX, finalY + 46)
      doc.text(formatCurrency(facture.total_ttc - facture.montant_paye), totauxRightX, finalY + 46, { align: 'right' })
    }
  }

  // ============================================================
  // NOTES / CONDITIONS
  // ============================================================

  const notesY = finalY + 65

  if (facture.notes) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'italic')
    doc.text('Notes:', margin, notesY)
    doc.setFont('helvetica', 'normal')

    const splitNotes = doc.splitTextToSize(facture.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, notesY + 5)
  }

  // Conditions de paiement
  const conditionsY = notesY + (facture.notes ? 20 : 0)
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Conditions de paiement: Paiement à réception de facture.', margin, conditionsY)
  doc.text('En cas de retard de paiement, des pénalités de 3x le taux d\'intérêt légal seront appliquées.', margin, conditionsY + 4)

  // ============================================================
  // PIED DE PAGE
  // ============================================================

  const footerY = doc.internal.pageSize.getHeight() - 15

  // Bande de couleur en bas
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, footerY + 7, pageWidth, 8, 'F')

  // Texte pied de page
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    `${filiale.nom} - Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc
}

export async function downloadFacturePDF(params: GenerateFacturePDFParams): Promise<void> {
  const doc = await generateFacturePDF(params)
  doc.save(`${params.facture.numero}.pdf`)
}

export async function getFacturePDFBlob(params: GenerateFacturePDFParams): Promise<Blob> {
  const doc = await generateFacturePDF(params)
  return doc.output('blob')
}
