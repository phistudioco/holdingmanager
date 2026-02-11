/**
 * Contrat PDF Generator
 *
 * Génère des PDF pour les contrats avec le template PHI Studios
 */

import { jsPDF } from 'jspdf'
import { loadLogo, loadLogoIcon, LOGO_DIMENSIONS, LOGO_Y_POSITION } from './logo'

type ContratData = {
  numero: string
  titre: string
  type: string
  date_debut: string
  date_fin: string
  montant: number
  periodicite: string | null
  reconduction_auto: boolean
  conditions: string | null
  statut: string
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

type GenerateContratPDFParams = {
  contrat: ContratData
  client: ClientData
  filiale: FilialeData
}

// Couleurs PHI Studios
const COLORS = {
  primary: [15, 32, 128] as [number, number, number], // #0F2080
  accent: [231, 37, 114] as [number, number, number], // #E72572
  highlight: [252, 208, 23] as [number, number, number], // #FCD017
  text: [31, 41, 55] as [number, number, number], // gray-800
  textLight: [107, 114, 128] as [number, number, number], // gray-500
}

export async function generateContratPDF({
  contrat,
  client,
  filiale,
}: GenerateContratPDFParams): Promise<jsPDF> {
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
      service: 'Contrat de Service',
      maintenance: 'Contrat de Maintenance',
      licence: 'Contrat de Licence',
      location: 'Contrat de Location',
      autre: 'Contrat',
    }
    return labels[type] || 'Contrat'
  }

  const getPeriodiciteLabel = (periodicite: string | null) => {
    if (!periodicite) return 'Ponctuel'
    const labels: Record<string, string> = {
      mensuel: 'Mensuel',
      trimestriel: 'Trimestriel',
      semestriel: 'Semestriel',
      annuel: 'Annuel',
      ponctuel: 'Ponctuel',
    }
    return labels[periodicite] || periodicite
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
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(getTypeLabel(contrat.type).toUpperCase(), pageWidth - margin, headerY, { align: 'right' })

  // Numéro de contrat
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${contrat.numero}`, pageWidth - margin, headerY + 8, { align: 'right' })

  // Ligne de séparation
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, headerY + 15, pageWidth - margin, headerY + 15)

  // ============================================================
  // TITRE DU CONTRAT
  // ============================================================

  doc.setFontSize(14)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(contrat.titre, pageWidth / 2, headerY + 27, { align: 'center' })

  // ============================================================
  // PARTIES CONTRACTANTES
  // ============================================================

  const partiesY = headerY + 40

  // Prestataire (Filiale)
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('LE PRESTATAIRE', margin, partiesY)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(filiale.nom, margin, partiesY + 7)
  doc.setFont('helvetica', 'normal')

  let prestataireY = partiesY + 12
  if (filiale.adresse) {
    doc.text(filiale.adresse, margin, prestataireY)
    prestataireY += 4
  }
  if (filiale.code_postal && filiale.ville) {
    doc.text(`${filiale.code_postal} ${filiale.ville}`, margin, prestataireY)
    prestataireY += 4
  }
  if (filiale.telephone) {
    doc.text(`Tél: ${filiale.telephone}`, margin, prestataireY)
    prestataireY += 4
  }
  if (filiale.email) {
    doc.text(`Email: ${filiale.email}`, margin, prestataireY)
  }

  // Client
  const clientX = pageWidth / 2 + 10
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.accent)
  doc.setFont('helvetica', 'bold')
  doc.text('LE CLIENT', clientX, partiesY)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(client.nom, clientX, partiesY + 7)
  doc.setFont('helvetica', 'normal')

  let clientY = partiesY + 12
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
  // DÉTAILS DU CONTRAT
  // ============================================================

  const detailsY = 115

  // Box pour les détails
  doc.setFillColor(248, 250, 252) // gray-50
  doc.roundedRect(margin, detailsY, pageWidth - 2 * margin, 45, 3, 3, 'F')

  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉTAILS DU CONTRAT', margin + 5, detailsY + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Colonne gauche
  doc.setTextColor(...COLORS.textLight)
  doc.text('Date de début:', margin + 5, detailsY + 18)
  doc.text('Date de fin:', margin + 5, detailsY + 26)
  doc.text('Durée:', margin + 5, detailsY + 34)

  doc.setTextColor(...COLORS.text)
  doc.text(formatDate(contrat.date_debut), margin + 45, detailsY + 18)
  doc.text(formatDate(contrat.date_fin), margin + 45, detailsY + 26)

  // Calculer la durée
  const dateDebut = new Date(contrat.date_debut)
  const dateFin = new Date(contrat.date_fin)
  const diffMonths = Math.round((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const dureeText = diffMonths >= 12 ? `${Math.round(diffMonths / 12)} an(s)` : `${diffMonths} mois`
  doc.text(dureeText, margin + 45, detailsY + 34)

  // Colonne droite
  const colDroiteX = pageWidth / 2 + 10
  doc.setTextColor(...COLORS.textLight)
  doc.text('Montant:', colDroiteX, detailsY + 18)
  doc.text('Périodicité:', colDroiteX, detailsY + 26)
  doc.text('Reconduction:', colDroiteX, detailsY + 34)

  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(contrat.montant), colDroiteX + 35, detailsY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(getPeriodiciteLabel(contrat.periodicite), colDroiteX + 35, detailsY + 26)
  doc.text(contrat.reconduction_auto ? 'Automatique' : 'Non', colDroiteX + 35, detailsY + 34)

  // ============================================================
  // CONDITIONS
  // ============================================================

  const conditionsY = detailsY + 55

  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('CONDITIONS GÉNÉRALES', margin, conditionsY)

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')

  let conditionsText = contrat.conditions || getDefaultConditions(contrat.type)
  const splitConditions = doc.splitTextToSize(conditionsText, pageWidth - 2 * margin)
  doc.text(splitConditions, margin, conditionsY + 8)

  // ============================================================
  // SIGNATURES
  // ============================================================

  const signY = 220

  // Box signatures
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.3)

  // Signature prestataire
  doc.rect(margin, signY, (pageWidth - 3 * margin) / 2, 40)
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Le Prestataire', margin + 5, signY + 8)
  doc.text(`${filiale.nom}`, margin + 5, signY + 15)
  doc.setFontSize(8)
  doc.text('Signature précédée de la mention', margin + 5, signY + 32)
  doc.text('"Lu et approuvé"', margin + 5, signY + 37)

  // Signature client
  const signClientX = pageWidth / 2 + margin / 2
  doc.rect(signClientX, signY, (pageWidth - 3 * margin) / 2, 40)
  doc.setFontSize(9)
  doc.text('Le Client', signClientX + 5, signY + 8)
  doc.text(`${client.nom}`, signClientX + 5, signY + 15)
  doc.setFontSize(8)
  doc.text('Signature précédée de la mention', signClientX + 5, signY + 32)
  doc.text('"Lu et approuvé"', signClientX + 5, signY + 37)

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
    `${filiale.nom} - ${contrat.numero} - Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc
}

function getDefaultConditions(type: string): string {
  const conditions: Record<string, string> = {
    service: `1. Le présent contrat définit les conditions de prestation de services entre les parties.
2. Le prestataire s'engage à fournir les services décrits avec diligence et professionnalisme.
3. Le client s'engage à régler les sommes dues selon les modalités convenues.
4. Toute modification du contrat doit faire l'objet d'un avenant signé par les deux parties.
5. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.`,
    maintenance: `1. Le présent contrat de maintenance couvre les interventions préventives et correctives.
2. Les interventions sont assurées dans un délai de 48h ouvrées après signalement.
3. Les pièces détachées sont facturées en supplément sauf accord contraire.
4. Le client s'engage à permettre l'accès aux équipements pour les interventions.
5. La résiliation anticipée est possible avec un préavis de 3 mois.`,
    licence: `1. Le présent contrat accorde une licence d'utilisation non-exclusive.
2. La licence est valable pour le nombre d'utilisateurs spécifié.
3. Toute reproduction ou distribution non autorisée est interdite.
4. Les mises à jour sont incluses pendant la durée du contrat.
5. Le support technique est assuré selon les conditions du niveau de service choisi.`,
    location: `1. Le matériel reste la propriété du prestataire pendant toute la durée de location.
2. Le client est responsable de l'entretien courant et de la bonne utilisation.
3. Une assurance couvrant les dommages et le vol est obligatoire.
4. La restitution doit se faire dans l'état initial, usure normale acceptée.
5. Tout dommage constaté sera facturé selon le barème en vigueur.`,
  }
  return conditions[type] || conditions.service
}

export async function downloadContratPDF(params: GenerateContratPDFParams): Promise<void> {
  const doc = await generateContratPDF(params)
  doc.save(`${params.contrat.numero}.pdf`)
}

export async function getContratPDFBlob(params: GenerateContratPDFParams): Promise<Blob> {
  const doc = await generateContratPDF(params)
  return doc.output('blob')
}
