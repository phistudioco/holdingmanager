/**
 * Devis PDF Generator
 *
 * Génère des PDF pour les devis avec le template PHI Studios
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadLogo, loadLogoIcon, LOGO_DIMENSIONS, LOGO_Y_POSITION } from './logo'

type DevisData = {
  numero: string
  date_emission: string
  date_validite: string
  objet: string | null
  total_ht: number
  taux_tva: number
  total_tva: number
  total_ttc: number
  statut: string
  notes: string | null
  conditions: string | null
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
  siret?: string | null
  tva_intracommunautaire?: string | null
}

type LigneData = {
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_ht: number
  montant_ttc: number
}

type GenerateDevisPDFParams = {
  devis: DevisData
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

export async function generateDevisPDF({
  devis,
  client,
  filiale,
  lignes,
}: GenerateDevisPDFParams): Promise<jsPDF> {
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
    // Ajouter le filigrane au centre de la page avec opacité réduite
    const watermarkSize = 220 // Grande taille pour bonne visibilité
    const centerX = (pageWidth - watermarkSize) / 2
    const centerY = (doc.internal.pageSize.getHeight() - watermarkSize) / 2

    // jsPDF ne supporte pas directement l'opacité, on utilise GState
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gState = new (doc as any).GState({ opacity: 0.06 })
    doc.setGState(gState)
    doc.addImage(iconBase64, 'PNG', centerX, centerY, watermarkSize, watermarkSize)

    // Remettre l'opacité normale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalState = new (doc as any).GState({ opacity: 1 })
    doc.setGState(normalState)
  }

  // Helpers
  const formatCurrency = (amount: number) => {
    // Utiliser Intl.NumberFormat puis remplacer les espaces insécables par des espaces normaux
    // car jsPDF ne gère pas bien les caractères Unicode spéciaux (U+00A0, U+202F)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
      .replace(/\u00A0/g, ' ')  // Espace insécable standard
      .replace(/\u202F/g, ' ')  // Espace insécable étroit (séparateur milliers)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // ============================================================
  // EN-TÊTE
  // ============================================================

  // Bande de couleur en haut (utiliser highlight pour différencier des factures)
  doc.setFillColor(...COLORS.highlight)
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
  doc.text('DEVIS', pageWidth - margin, headerY, { align: 'right' })

  // Numéro de devis
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${devis.numero}`, pageWidth - margin, headerY + 8, { align: 'right' })

  // Ligne de séparation (couleur highlight)
  doc.setDrawColor(...COLORS.highlight)
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
    emetteurY += 4
  }
  if (filiale.siret) {
    doc.text(`SIRET: ${filiale.siret}`, margin, emetteurY)
    emetteurY += 4
  }
  if (filiale.tva_intracommunautaire) {
    doc.text(`TVA: ${filiale.tva_intracommunautaire}`, margin, emetteurY)
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
  // DATES ET VALIDITÉ
  // ============================================================

  const dateY = 90

  // Box pour les dates (jaune pour devis)
  doc.setFillColor(254, 252, 232) // yellow-50
  doc.roundedRect(margin, dateY, pageWidth - 2 * margin, 20, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Date d\'émission:', margin + 5, dateY + 8)
  doc.text('Valable jusqu\'au:', pageWidth / 2, dateY + 8)

  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(devis.date_emission), margin + 5, dateY + 14)

  // Mettre en évidence la date de validité
  doc.setTextColor(...COLORS.accent)
  doc.text(formatDate(devis.date_validite), pageWidth / 2, dateY + 14)

  // Objet
  if (devis.objet) {
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.text('Objet:', margin, dateY + 28)
    doc.setTextColor(...COLORS.text)
    doc.text(devis.objet, margin + 15, dateY + 28)
  }

  // ============================================================
  // TABLEAU DES LIGNES
  // ============================================================

  const tableY = devis.objet ? dateY + 38 : dateY + 30

  // Préparer les données du tableau avec valeurs par défaut
  const tableBody = lignes.map((ligne) => {
    const description = ligne.description || 'N/A'
    const quantite = ligne.quantite ?? 0
    const prixUnitaire = ligne.prix_unitaire ?? 0
    const tauxTva = ligne.taux_tva ?? 0
    const montantHt = ligne.montant_ht ?? 0
    const montantTtc = ligne.montant_ttc ?? 0

    return [
      description,
      quantite.toString(),
      formatCurrency(prixUnitaire),
      formatCurrency(montantHt),
      `${tauxTva}%`,
      formatCurrency(montantTtc),
    ]
  })

  autoTable(doc, {
    startY: tableY,
    head: [['Description', 'Qté', 'P.U. HT', 'Montant HT', 'TVA', 'Total TTC']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.highlight,
      textColor: COLORS.text,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.text,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [254, 252, 232], // yellow-50
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
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
  doc.setFillColor(254, 252, 232) // yellow-50
  doc.roundedRect(pageWidth - margin - boxWidth, finalY - 5, boxWidth, 40, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'normal')

  doc.text('Total HT:', totauxX, finalY + 5)
  doc.text(`TVA (${devis.taux_tva}%):`, totauxX, finalY + 13)

  doc.setTextColor(...COLORS.text)
  doc.text(formatCurrency(devis.total_ht), totauxRightX, finalY + 5, { align: 'right' })
  doc.text(formatCurrency(devis.total_tva), totauxRightX, finalY + 13, { align: 'right' })

  // Ligne de séparation
  doc.setDrawColor(...COLORS.highlight)
  doc.setLineWidth(0.3)
  doc.line(totauxX - 3, finalY + 18, totauxRightX, finalY + 18)

  // Total TTC
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('Total TTC:', totauxX, finalY + 28)
  doc.text(formatCurrency(devis.total_ttc), totauxRightX, finalY + 28, { align: 'right' })

  // ============================================================
  // NOTES / CONDITIONS
  // ============================================================

  // Espace réduit entre les totaux et les notes/conditions
  let currentY = finalY + 18

  if (devis.notes) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.setFont('helvetica', 'italic')
    doc.text('Notes:', margin, currentY)
    doc.setFont('helvetica', 'normal')

    const splitNotes = doc.splitTextToSize(devis.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, currentY + 4)
    currentY += 4 + (splitNotes.length * 4) + 8
  }

  // Conditions
  const conditionsText = devis.conditions || getDefaultConditions()

  doc.setFontSize(7)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('CONDITIONS:', margin, currentY)

  doc.setTextColor(...COLORS.textLight)
  doc.setFont('helvetica', 'normal')
  const splitConditions = doc.splitTextToSize(conditionsText, pageWidth - 2 * margin)
  doc.text(splitConditions, margin, currentY + 4)

  // Calculer la hauteur des conditions
  const conditionsHeight = splitConditions.length * 3.5

  // ============================================================
  // SIGNATURE / ACCEPTATION
  // ============================================================

  const signBoxHeight = 45
  const footerHeight = 18
  const pageHeight = doc.internal.pageSize.getHeight()

  // Position de la signature: juste après les conditions (espace minimal)
  let signY = currentY + conditionsHeight + 2

  // Espace nécessaire pour la signature + footer
  const spaceNeeded = signY + signBoxHeight + footerHeight

  // Si ça ne tient pas, on met la signature juste avant le footer
  if (spaceNeeded > pageHeight) {
    // Vérifier si on peut tout faire tenir en réduisant l'espace
    const availableSpace = pageHeight - footerHeight - signBoxHeight - 5

    if (currentY + conditionsHeight + 5 < availableSpace) {
      // On peut tout mettre sur une page, ajuster signY
      signY = availableSpace - signBoxHeight + 10
    } else {
      // Vraiment pas assez de place, nouvelle page
      doc.addPage()

      // Ajouter le filigrane sur la nouvelle page aussi (mêmes paramètres que page 1)
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

      signY = 25
    }
  }

  // Box signature
  doc.setDrawColor(...COLORS.highlight)
  doc.setLineWidth(1)
  doc.roundedRect(margin, signY, pageWidth - 2 * margin, signBoxHeight, 3, 3, 'S')

  // Contenu de la box
  renderSignatureBox(doc, margin, signY, pageWidth, COLORS)

  // ============================================================
  // PIED DE PAGE
  // ============================================================

  const pageHeightFooter = doc.internal.pageSize.getHeight()

  // Bande de couleur en bas (jaune pour devis)
  doc.setFillColor(...COLORS.highlight)
  doc.rect(0, pageHeightFooter - 10, pageWidth, 10, 'F')

  // Texte pied de page (au-dessus de la bande)
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    `${filiale.nom} - Devis n°${devis.numero} - Valable jusqu'au ${formatDate(devis.date_validite)}`,
    pageWidth / 2,
    pageHeightFooter - 13,
    { align: 'center' }
  )

  return doc
}

function getDefaultConditions(): string {
  return `1. Ce devis est valable pour la durée indiquée ci-dessus.
2. Tout devis signé vaut commande ferme et définitive.
3. Un acompte de 30% sera demandé à la signature, le solde à la livraison.
4. Les délais de réalisation seront communiqués après acceptation du devis.
5. Tout report de projet demandé par le client fera l'objet d'une nouvelle planification.`
}

function renderSignatureBox(
  doc: jsPDF,
  margin: number,
  signY: number,
  pageWidth: number,
  colors: typeof COLORS
): void {
  // Titre
  doc.setFontSize(9)
  doc.setTextColor(...colors.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('BON POUR ACCORD', margin + 5, signY + 8)

  // Instructions
  doc.setFontSize(8)
  doc.setTextColor(...colors.textLight)
  doc.setFont('helvetica', 'normal')

  // Colonne gauche - Date et mention
  doc.text('Date:', margin + 5, signY + 18)
  doc.setDrawColor(...colors.textLight)
  doc.setLineWidth(0.2)
  doc.line(margin + 18, signY + 18, margin + 60, signY + 18)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('Mention "Bon pour accord"', margin + 5, signY + 28)
  doc.line(margin + 5, signY + 38, margin + 70, signY + 38)

  // Colonne droite - Signature
  const signatureX = pageWidth / 2 + 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Signature et cachet:', signatureX, signY + 18)

  // Zone de signature (rectangle pointillé)
  doc.setDrawColor(...colors.textLight)
  doc.setLineDashPattern([2, 2], 0)
  doc.rect(signatureX, signY + 22, 75, 18)
  doc.setLineDashPattern([], 0) // Reset
}

export async function downloadDevisPDF(params: GenerateDevisPDFParams): Promise<void> {
  const doc = await generateDevisPDF(params)
  doc.save(`${params.devis.numero}.pdf`)
}

export async function getDevisPDFBlob(params: GenerateDevisPDFParams): Promise<Blob> {
  const doc = await generateDevisPDF(params)
  return doc.output('blob')
}
